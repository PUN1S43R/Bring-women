import express from 'express';
import nodemailer from 'nodemailer';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import https from 'https';
import db, { initDb } from './db';
import PaytmChecksum from 'paytmchecksum';
import Razorpay from 'razorpay';
import crypto from 'crypto';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize DB
initDb();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

async function startServer() {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Ensure uploads directory exists
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
  }

  // Serve static files from uploads directory
  app.use('/uploads', express.static(uploadsDir));

  // Razorpay Instance
  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || '',
    key_secret: process.env.RAZORPAY_KEY_SECRET || '',
  });

  // Razorpay Payment Routes (Payment-First Architecture)
  app.post('/api/payment/create-order', authenticateToken, async (req: any, res) => {
    const { amount, items, shipping_address, phone, payment_method, full_name, email } = req.body;
    const userId = req.user.id;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Cart items are required to create a payment order' });
    }

    try {
      // Calculate total amount from database to prevent price tampering
      let databaseSubtotal = 0;
      for (const item of items) {
        const product: any = db.prepare('SELECT discount_price, original_price FROM products WHERE id = ?').get(item.product_id);
        if (!product) {
          return res.status(400).json({ error: `Product not found: ${item.product_id}` });
        }
        const itemPrice = product.discount_price !== null && product.discount_price !== undefined ? product.discount_price : product.original_price;
        databaseSubtotal += itemPrice * item.quantity;
      }

      const shippingCharge = databaseSubtotal > 2000 ? 0 : 99;
      const tax = Math.round(databaseSubtotal * 0.05);
      const databaseTotal = databaseSubtotal + shippingCharge + tax;

      let expectedAmount = databaseTotal;
      if (payment_method === 'COD') {
        expectedAmount = 150; // COD advance represents a 150 INR deposit
      }

      // Check if amount matches expected amount to prevent frontend tampering
      if (Math.round(amount) !== Math.round(expectedAmount)) {
        return res.status(400).json({ error: 'Payment amount mismatch: potential price tampering detected.' });
      }

      // Create Razorpay Order
      const options = {
        amount: Math.round(expectedAmount * 100), // amount in paise
        currency: "INR",
        receipt: `rcpt_${Date.now()}_${userId}`,
        notes: {
          userId: userId.toString(),
          payment_method: payment_method
        }
      };

      const razorpayOrder = await razorpay.orders.create(options);

      // Store payload in pending_payments for validation during webhook or callback verification
      const orderPayload = {
        user_id: userId,
        total_amount: databaseTotal, // full order value
        shipping_address,
        phone,
        payment_method,
        full_name,
        email,
        items,
        paid_amount: expectedAmount // amount actually paid
      };

      db.prepare(`
        INSERT OR REPLACE INTO pending_payments (razorpay_order_id, user_id, payload)
        VALUES (?, ?, ?)
      `).run(razorpayOrder.id, userId, JSON.stringify(orderPayload));

      res.json(razorpayOrder);
    } catch (error: any) {
      console.error('Razorpay Order Creation Error:', error);
      res.status(500).json({ error: error.message || 'Failed to create Razorpay order' });
    }
  });

  app.post('/api/payment/verify', authenticateToken, async (req: any, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const userId = req.user.id;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: 'Missing payment verification details' });
    }

    try {
      // 1. Verify Razorpay signature using HMAC SHA256
      const body = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
        .update(body.toString())
        .digest('hex');

      if (expectedSignature !== razorpay_signature) {
        return res.status(400).json({ error: 'Signature verification failed' });
      }

      // Check if order was already verified and created
      const existingOrder: any = db.prepare('SELECT id FROM orders WHERE razorpay_order_id = ?').get(razorpay_order_id);
      if (existingOrder) {
        return res.json({ success: true, orderId: existingOrder.id, alreadyCreated: true });
      }

      // 2. Fetch pending order details from pending_payments
      const pending: any = db.prepare('SELECT payload FROM pending_payments WHERE razorpay_order_id = ?').get(razorpay_order_id);
      if (!pending) {
        return res.status(404).json({ error: 'Payment record not found or already verified.' });
      }

      const payload = JSON.parse(pending.payload);

      // Perform transaction to securely create order, order items, and deduct stock
      const executeOrderCreation = db.transaction(() => {
        // Create order in DB with status = 'PAID' or 'PROCESSING'
        const orderStatus = payload.payment_method === 'COD' ? 'PROCESSING' : 'PAID';
        const paymentStatus = 'PAID';

        const orderResult = db.prepare(`
          INSERT INTO orders (user_id, total_amount, status, shipping_address, phone, payment_method, transaction_id, payment_status, payment_id, razorpay_order_id, payment_verified_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `).run(
          payload.user_id,
          payload.total_amount,
          orderStatus,
          payload.shipping_address,
          payload.phone,
          payload.payment_method,
          razorpay_payment_id,
          paymentStatus,
          razorpay_payment_id,
          razorpay_order_id
        );

        const orderId = orderResult.lastInsertRowid;

        // Create individual items & decrease stock quantity
        for (const item of payload.items) {
          db.prepare(`
            INSERT INTO order_items (order_id, product_id, quantity, price, size, color)
            VALUES (?, ?, ?, ?, ?, ?)
          `).run(orderId, item.product_id, item.quantity, item.price, item.size, item.color);

          db.prepare(`
            UPDATE products 
            SET stock_quantity = MAX(0, stock_quantity - ?) 
            WHERE id = ?
          `).run(item.quantity, item.product_id);

          // Centralized stock tracking notifications
          const product: any = db.prepare('SELECT name, stock_quantity FROM products WHERE id = ?').get(item.product_id);
          if (product) {
            if (product.stock_quantity === 0) {
              db.prepare(`
                INSERT INTO admin_notifications (type, title, message)
                VALUES (?, ?, ?)
              `).run('STOCK_ALERT', 'Out of Stock Alert', `Product "${product.name}" is now completely out of stock.`);
            } else if (product.stock_quantity <= 5) {
              db.prepare(`
                INSERT INTO admin_notifications (type, title, message)
                VALUES (?, ?, ?)
              `).run('STOCK_ALERT', 'Low Stock Alert', `Product "${product.name}" is running low. Only ${product.stock_quantity} left in stock.`);
            }
          }
        }

        // Create order notification
        db.prepare(`
          INSERT INTO admin_notifications (type, title, message)
          VALUES (?, ?, ?)
        `).run('ORDER', 'New Order Received', `Order #${orderId} was successfully placed by ${payload.full_name || payload.email}. Total amount: ₹${payload.total_amount}.`);

        // Clean up pending payments to prevent duplicate order verification/replay attacks
        db.prepare('DELETE FROM pending_payments WHERE razorpay_order_id = ?').run(razorpay_order_id);

        return orderId;
      });

      const orderId = executeOrderCreation();

      // Send Order Confirmation Email
      try {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        });

        await transporter.sendMail({
          from: `"Being Women" <${process.env.SMTP_USER}>`,
          to: payload.email,
          subject: 'Order Confirmed - Being Women',
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 14px; background: #FFF8FA;">
              <h1 style="text-align: center; font-family: 'Playfair Display', serif; font-weight: bold; letter-spacing: -0.5px; margin: 0; color: #7B6358;">BEING <span style="color: #D94F7A;">WOMEN</span></h1>
              <div style="text-align: center; margin: 20px 0;">
                <span style="background: #FFF0F5; color: #D94F7A; padding: 8px 16px; border-radius: 9999px; font-size: 14px; font-weight: bold; text-transform: uppercase;">Order Confirmed</span>
              </div>
              <p>Hi ${payload.full_name || 'Customer'},</p>
              <p>We have successfully verified your payment of <strong>₹${payload.paid_amount}</strong> (Order Total: ₹${payload.total_amount}). Your order ID is <strong>#${String(orderId).padStart(8, '0')}</strong>.</p>
              <p>Payment Method: <strong>${payload.payment_method}</strong></p>
              <p>Transaction ID: <strong>${razorpay_payment_id}</strong></p>
              <div style="background: #fff; padding: 15px; border-radius: 10px; border: 1px solid #fceef2; margin-top: 20px;">
                <p style="margin: 0; font-weight: bold; color: #7B6358;">Shipping Address:</p>
                <p style="margin: 5px 0 0 0; color: #555;">${payload.shipping_address}</p>
              </div>
              <p style="margin-top: 30px; text-align: center; font-size: 11px; color: #999;">
                Developed by <a href="https://techszdeveloper.vercel.app/" style="color: #D94F7A; text-decoration: none; font-weight: bold;">TECHSZDEVELOPER</a>
              </p>
            </div>
          `
        });
      } catch (emailError) {
        console.error('Error sending confirmation email in verify:', emailError);
      }

      res.json({ success: true, orderId });
    } catch (error: any) {
      console.error('Razorpay Payment Verification Error:', error);
      res.status(500).json({ error: error.message || 'Signature verification failed' });
    }
  });

  // Razorpay Webhook Endpoint for Payment Reconciliation
  app.post('/api/payment/webhook', async (req, res) => {
    const razorpaySignature = req.headers['x-razorpay-signature'] as string;
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (webhookSecret && razorpaySignature) {
      const shasum = crypto.createHmac('sha256', webhookSecret);
      shasum.update(JSON.stringify(req.body));
      const digest = shasum.digest('hex');

      if (digest !== razorpaySignature) {
        return res.status(400).json({ error: 'Invalid webhook signature' });
      }
    }

    const event = req.body.event;
    console.log('Received Razorpay Webhook:', event);

    if (event === 'payment.captured' || event === 'order.paid') {
      const paymentEntity = req.body.payload.payment.entity;
      const razorpay_order_id = paymentEntity.order_id;
      const razorpay_payment_id = paymentEntity.id;

      try {
        const existingOrder: any = db.prepare('SELECT id FROM orders WHERE razorpay_order_id = ?').get(razorpay_order_id);
        if (!existingOrder) {
          const pending: any = db.prepare('SELECT payload FROM pending_payments WHERE razorpay_order_id = ?').get(razorpay_order_id);
          if (pending) {
            const payload = JSON.parse(pending.payload);
            const executeOrderCreation = db.transaction(() => {
              const orderStatus = payload.payment_method === 'COD' ? 'PROCESSING' : 'PAID';
              const paymentStatus = 'PAID';

              const orderResult = db.prepare(`
                INSERT INTO orders (user_id, total_amount, status, shipping_address, phone, payment_method, transaction_id, payment_status, payment_id, razorpay_order_id, payment_verified_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
              `).run(
                payload.user_id,
                payload.total_amount,
                orderStatus,
                payload.shipping_address,
                payload.phone,
                payload.payment_method,
                razorpay_payment_id,
                paymentStatus,
                razorpay_payment_id,
                razorpay_order_id
              );

              const orderId = orderResult.lastInsertRowid;

              for (const item of payload.items) {
                db.prepare(`
                  INSERT INTO order_items (order_id, product_id, quantity, price, size, color)
                  VALUES (?, ?, ?, ?, ?, ?)
                `).run(orderId, item.product_id, item.quantity, item.price, item.size, item.color);

                db.prepare(`
                  UPDATE products 
                  SET stock_quantity = MAX(0, stock_quantity - ?) 
                  WHERE id = ?
                `).run(item.quantity, item.product_id);
              }

              db.prepare('DELETE FROM pending_payments WHERE razorpay_order_id = ?').run(razorpay_order_id);
              return orderId;
            });

            const orderId = executeOrderCreation();
            console.log(`Reconciled and created order ${orderId} via Webhook`);

            try {
              const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                  user: process.env.SMTP_USER,
                  pass: process.env.SMTP_PASS
                }
              });

              await transporter.sendMail({
                from: `"Being Women" <${process.env.SMTP_USER}>`,
                to: payload.email,
                subject: 'Order Confirmed - Being Women',
                html: `
                  <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 14px; background: #FFF8FA;">
                    <h1 style="text-align: center; font-family: 'Playfair Display', serif; font-weight: bold; letter-spacing: -0.5px; margin: 0; color: #7B6358;">BEING <span style="color: #D94F7A;">WOMEN</span></h1>
                    <div style="text-align: center; margin: 20px 0;">
                      <span style="background: #FFF0F5; color: #D94F7A; padding: 8px 16px; border-radius: 9999px; font-size: 14px; font-weight: bold; text-transform: uppercase;">Order Confirmed (Reconciled)</span>
                    </div>
                    <p>Hi ${payload.full_name || 'Customer'},</p>
                    <p>Thank you for your order. We verified your payment of <strong>₹${payload.paid_amount}</strong>. Your order ID is <strong>#${String(orderId).padStart(8, '0')}</strong>.</p>
                    <p>Payment Method: <strong>${payload.payment_method}</strong></p>
                    <p>Transaction ID: <strong>${razorpay_payment_id}</strong></p>
                    <div style="background: #fff; padding: 15px; border-radius: 10px; border: 1px solid #fceef2; margin-top: 20px;">
                      <p style="margin: 0; font-weight: bold; color: #7B6358;">Shipping Address:</p>
                      <p style="margin: 5px 0 0 0; color: #555;">${payload.shipping_address}</p>
                    </div>
                    <p style="margin-top: 30px; text-align: center; font-size: 11px; color: #999;">
                      Developed by <a href="https://techszdeveloper.vercel.app/" style="color: #D94F7A; text-decoration: none; font-weight: bold;">TECHSZDEVELOPER</a>
                    </p>
                  </div>
                `
              });
            } catch (err) {
              console.error('Email error in webhook:', err);
            }
          }
        }
      } catch (err) {
        console.error('Webhook processing failed:', err);
        return res.status(500).json({ error: 'Internal server error processing payment' });
      }
    }

    res.json({ received: true });
  });

  // Paytm Payment Routes
  app.post('/api/paytm/initiate', async (req, res) => {
    const { orderId, amount, customerId, email, phone } = req.body;

    const paytmParams: any = {};

    paytmParams.body = {
      "requestType": "Payment",
      "mid": process.env.PAYTM_MID,
      "websiteName": process.env.PAYTM_WEBSITE || "DEFAULT",
      "orderId": orderId.toString(),
      "callbackUrl": `${process.env.APP_URL}/api/paytm/callback`,
      "txnAmount": {
        "value": amount.toString(),
        "currency": "INR",
      },
      "userInfo": {
        "custId": customerId.toString(),
        "mobile": phone,
        "email": email,
      },
    };

    try {
      const checksum = await PaytmChecksum.generateSignature(JSON.stringify(paytmParams.body), process.env.PAYTM_MERCHANT_KEY || "");
      paytmParams.head = {
        "signature": checksum
      };

      const post_data = JSON.stringify(paytmParams);
      const options = {
        hostname: process.env.PAYTM_ENVIRONMENT === 'PRODUCTION' ? 'securegw.paytm.in' : 'securegw-stage.paytm.in',
        port: 443,
        path: `/theia/api/v1/initiateTransaction?mid=${process.env.PAYTM_MID}&orderId=${orderId}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': post_data.length
        }
      };

      let response = "";
      const post_req = https.request(options, (post_res) => {
        post_res.on('data', (chunk) => {
          response += chunk;
        });

        post_res.on('end', () => {
          try {
            const result = JSON.parse(response);
            res.json({
              txnToken: result.body.txnToken,
              orderId: orderId,
              mid: process.env.PAYTM_MID
            });
          } catch (e) {
            console.error('Paytm Parse Error:', e, response);
            res.status(500).json({ error: 'Failed to parse Paytm response' });
          }
        });
      });

      post_req.on('error', (e) => {
        console.error('Paytm Request Error:', e);
        res.status(500).json({ error: 'Failed to connect to Paytm' });
      });

      post_req.write(post_data);
      post_req.end();
    } catch (error) {
      console.error('Paytm Initiation Error:', error);
      res.status(500).json({ error: 'Failed to initiate payment' });
    }
  });

  app.post('/api/paytm/callback', async (req, res) => {
    const paytmParams = req.body;
    const paytmChecksum = paytmParams.CHECKSUMHASH;
    delete paytmParams.CHECKSUMHASH;

    const isVerifySignature = PaytmChecksum.verifySignature(paytmParams, process.env.PAYTM_MERCHANT_KEY || "", paytmChecksum);
    
    const orderId = paytmParams.ORDERID;
    const status = paytmParams.STATUS;
    const txnId = paytmParams.TXNID;

    if (isVerifySignature) {
      if (status === 'TXN_SUCCESS') {
        db.prepare('UPDATE orders SET payment_status = ?, transaction_id = ?, status = ? WHERE id = ?')
          .run('success', txnId, 'processing', orderId);
        
        // Fetch order details for email
        const order: any = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
        const user: any = db.prepare('SELECT * FROM users WHERE id = ?').get(order.user_id);

        // Send Email Notification
        try {
          const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS
            }
          });

          await transporter.sendMail({
            from: `"Being Women" <${process.env.SMTP_USER}>`,
            to: user.email,
            subject: 'Order Confirmed - Being Women',
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 14px; background: #FFF8FA;">
                <h1 style="text-align: center; font-family: 'Playfair Display', serif; font-weight: bold; letter-spacing: -0.5px; margin: 0; color: #7B6358;">BEING <span style="color: #D94F7A;">WOMEN</span></h1>
                <h2 style="text-align: center; text-transform: uppercase; color: #7B6358; font-family: 'Playfair Display', serif; margin-top: 15px;">Order Confirmed!</h2>
                <p>Hi ${user.full_name || 'Customer'},</p>
                <p>Thank you for your order. Your order ID is <strong>#${String(orderId).padStart(8, '0')}</strong>.</p>
                <p>Total Amount Paid: <strong>₹${order.total_amount}</strong></p>
                <p>Transaction ID: <strong>${txnId}</strong></p>
                <div style="background: #fff; padding: 15px; border-radius: 10px; border: 1px solid #fceef2; margin-top: 20px;">
                  <p style="margin: 0; font-weight: bold; color: #7B6358;">Shipping Address:</p>
                  <p style="margin: 5px 0 0 0; color: #555;">${order.shipping_address}</p>
                </div>
                <p style="margin-top: 30px; text-align: center; font-size: 11px; color: #999;">
                  Developed by <a href="https://techszdeveloper.vercel.app/" style="color: #D94F7A; text-decoration: none; font-weight: bold;">TECHSZDEVELOPER</a>
                </p>
              </div>
            `
          });
        } catch (emailError) {
          console.error('Error sending confirmation email:', emailError);
        }

        res.redirect(`/order-success/${orderId}`);
      } else {
        db.prepare('UPDATE orders SET payment_status = ?, transaction_id = ? WHERE id = ?')
          .run('failed', txnId, orderId);
        res.redirect(`/order-failed/${orderId}`);
      }
    } else {
      res.redirect(`/order-failed/${orderId}?error=checksum_mismatch`);
    }
  });

  // Multer configuration for image uploads
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    }
  });

  const upload = multer({ storage: storage });

  // Auth Middleware
  function authenticateToken(req: any, res: any, next: any) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.sendStatus(401);
      req.user = user;
      next();
    });
  }

  const isAdmin = (req: any, res: any, next: any) => {
    if (req.user && (req.user.role === 'admin' || req.user.role === 'superadmin')) {
      next();
    } else {
      res.status(403).json({ error: 'Admin access required' });
    }
  };

  const isSuperAdmin = (req: any, res: any, next: any) => {
    if (req.user && req.user.role === 'superadmin') {
      next();
    } else {
      res.status(403).json({ error: 'Superadmin access required' });
    }
  };

  const getOptionalUser = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token) {
      jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
        if (!err) req.user = user;
        next();
      });
    } else {
      next();
    }
  };

  // --- Auth Routes ---

  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    const user: any = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Failsafe: Ensure specific emails are always superadmin
    const superAdmins = ['aquibbhombal708@gmail.com', 'moinneelam143@gmail.com'];
    let userRole = user.role;
    if (superAdmins.includes(user.email.toLowerCase().trim()) && user.role !== 'superadmin') {
      userRole = 'superadmin';
      db.prepare('UPDATE users SET role = ? WHERE id = ?').run('superadmin', user.id);
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: userRole }, JWT_SECRET);
    res.json({ token, user: { id: user.id, email: user.email, role: userRole } });
  });

  app.post('/api/auth/register', (req, res) => {
    const { email, password } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 10);

    try {
      const result = db.prepare('INSERT INTO users (email, password) VALUES (?, ?)').run(email, hashedPassword);
      const user: any = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
      
      // Create registration notification
      db.prepare(`
        INSERT INTO admin_notifications (type, title, message)
        VALUES (?, ?, ?)
      `).run('REGISTRATION', 'New User Registered', `A new customer with email ${email} has registered.`);

      // Failsafe: Ensure specific emails are always superadmin
      const superAdmins = ['aquibbhombal708@gmail.com', 'moinneelam143@gmail.com'];
      let userRole = user.role;
      if (superAdmins.includes(user.email.toLowerCase().trim()) && user.role !== 'superadmin') {
        userRole = 'superadmin';
        db.prepare('UPDATE users SET role = ? WHERE id = ?').run('superadmin', user.id);
      }

      const token = jwt.sign({ id: user.id, email: user.email, role: userRole }, JWT_SECRET);
      res.json({ token, user: { id: user.id, email: user.email, role: userRole } });
    } catch (error: any) {
      res.status(400).json({ error: 'Email already exists' });
    }
  });

  app.get('/api/auth/me', authenticateToken, (req: any, res) => {
    const user = db.prepare('SELECT id, email, role, full_name, phone, address, state, pincode FROM users WHERE id = ?').get(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Failsafe: Ensure specific emails are always superadmin
    const superAdmins = ['aquibbhombal708@gmail.com', 'moinneelam143@gmail.com'];
    let userRole = user.role;
    if (superAdmins.includes(user.email.toLowerCase().trim()) && user.role !== 'superadmin') {
      userRole = 'superadmin';
      db.prepare('UPDATE users SET role = ? WHERE id = ?').run('superadmin', user.id);
      user.role = 'superadmin';
    }

    res.json({ user });
  });

  app.put('/api/auth/profile', authenticateToken, (req: any, res) => {
    const { full_name, phone, address, state, pincode, password } = req.body;
    
    if (password) {
      const hashedPassword = bcrypt.hashSync(password, 10);
      db.prepare(`
        UPDATE users SET full_name = ?, phone = ?, address = ?, state = ?, pincode = ?, password = ?
        WHERE id = ?
      `).run(full_name, phone, address, state, pincode, hashedPassword, req.user.id);
    } else {
      db.prepare(`
        UPDATE users SET full_name = ?, phone = ?, address = ?, state = ?, pincode = ?
        WHERE id = ?
      `).run(full_name, phone, address, state, pincode, req.user.id);
    }
    
    const user = db.prepare('SELECT id, email, role, full_name, phone, address, state, pincode FROM users WHERE id = ?').get(req.user.id);
    res.json({ user });
  });

  app.put('/api/auth/update-password', authenticateToken, (req: any, res) => {
    const { password } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 10);
    db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashedPassword, req.user.id);
    res.json({ success: true });
  });

  app.post('/api/auth/reset-password', (req, res) => {
    const { email, password } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 10);
    const result = db.prepare('UPDATE users SET password = ? WHERE email = ?').run(hashedPassword, email);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ success: true });
  });

  // --- Image Upload Route ---

  app.post('/api/upload', upload.single('image'), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const url = `/uploads/${req.file.filename}`;
    res.json({ url });
  });

  app.post('/api/upload-multiple', upload.array('images', 10), (req, res) => {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }
    const urls = files.map(file => `/uploads/${file.filename}`);
    res.json({ urls });
  });

  // --- Categories Routes ---

  app.get('/api/categories', (req, res) => {
    const categories = db.prepare('SELECT * FROM categories ORDER BY created_at DESC').all();
    res.json(categories);
  });

  app.post('/api/categories', authenticateToken, isAdmin, (req, res) => {
    const { name, image_url, description } = req.body;
    const result = db.prepare('INSERT INTO categories (name, image_url, description) VALUES (?, ?, ?)').run(name, image_url, description);
    const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(result.lastInsertRowid);
    res.json(category);
  });

  app.put('/api/categories/:id', authenticateToken, isAdmin, (req, res) => {
    const { name, image_url, description } = req.body;
    db.prepare('UPDATE categories SET name = ?, image_url = ?, description = ? WHERE id = ?').run(name, image_url, description, req.params.id);
    const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id);
    res.json(category);
  });

  app.delete('/api/categories/:id', authenticateToken, isAdmin, (req, res) => {
    db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  });

  // --- Products Routes ---

  app.get('/api/products', getOptionalUser, (req: any, res) => {
    const { category, tag, q, limit, page, sort, is_new_arrival, is_under_599 } = req.query;
    const userId = req.user?.id || -1;

    let query = `
      SELECT p.*, c.name as category_name,
             (SELECT COUNT(*) FROM reviews WHERE product_id = p.id) as review_count,
             (SELECT AVG(rating) FROM reviews WHERE product_id = p.id) as avg_rating,
             EXISTS(SELECT 1 FROM wishlist WHERE user_id = ? AND product_id = p.id) as is_wishlisted
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      WHERE 1=1
    `;
    const params: any[] = [userId];

    if (category) {
      query += ' AND p.category_id = ?';
      params.push(category);
    }
    if (tag) {
      query += ' AND p.tag = ?';
      params.push(tag);
    }
    if (q) {
      query += ' AND p.name LIKE ?';
      params.push(`%${q}%`);
    }
    if (is_new_arrival === 'true') {
      query += " AND datetime(p.created_at, '+' || p.new_arrival_days || ' days') >= datetime('now')";
    }
    if (is_under_599 === 'true') {
      query += ' AND p.discount_price <= 599';
    }

    if (sort === 'price-low') {
      query += ' ORDER BY p.discount_price ASC';
    } else if (sort === 'price-high') {
      query += ' ORDER BY p.discount_price DESC';
    } else {
      query += ' ORDER BY p.created_at DESC';
    }

    if (limit) {
      const p = Number(page) || 1;
      const l = Number(limit);
      const offset = (p - 1) * l;
      query += ' LIMIT ? OFFSET ?';
      params.push(l, offset);
    }

    const products = db.prepare(query).all(...params);
    const formattedProducts = products.map((p: any) => ({
      ...p,
      additional_images: JSON.parse(p.additional_images || '[]'),
      sizes: JSON.parse(p.sizes || '[]'),
      colors: JSON.parse(p.colors || '[]'),
      is_cod_available: !!p.is_cod_available,
      is_wishlisted: !!p.is_wishlisted
    }));
    res.json(formattedProducts);
  });

  app.get('/api/products/:id', getOptionalUser, (req: any, res) => {
    const userId = req.user?.id || -1;
    const product = db.prepare(`
      SELECT p.*, 
             (SELECT COUNT(*) FROM reviews WHERE product_id = p.id) as review_count,
             (SELECT AVG(rating) FROM reviews WHERE product_id = p.id) as avg_rating,
             EXISTS(SELECT 1 FROM wishlist WHERE user_id = ? AND product_id = p.id) as is_wishlisted
      FROM products p 
      WHERE p.id = ?
    `).get(userId, req.params.id);

    if (!product) return res.status(404).json({ error: 'Product not found' });
    
    const formattedProduct = {
      ...product,
      additional_images: JSON.parse(product.additional_images || '[]'),
      sizes: JSON.parse(product.sizes || '[]'),
      colors: JSON.parse(product.colors || '[]'),
      is_cod_available: !!product.is_cod_available,
      is_wishlisted: !!product.is_wishlisted
    };
    res.json(formattedProduct);
  });

  app.post('/api/products', authenticateToken, isAdmin, (req, res) => {
    const { name, category_id, main_image, additional_images, original_price, discount_price, stock_quantity, description, tag, is_cod_available, sizes, colors, new_arrival_days } = req.body;
    const result = db.prepare(`
      INSERT INTO products (name, category_id, main_image, additional_images, original_price, discount_price, stock_quantity, description, tag, is_cod_available, sizes, colors, new_arrival_days)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      name, category_id, main_image, JSON.stringify(additional_images || []), 
      original_price, discount_price, stock_quantity, description, tag, 
      is_cod_available ? 1 : 0, JSON.stringify(sizes || []), JSON.stringify(colors || []),
      new_arrival_days || 7
    );
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid);
    res.json(product);
  });

  app.put('/api/products/:id', authenticateToken, isAdmin, (req, res) => {
    const { name, category_id, main_image, additional_images, original_price, discount_price, stock_quantity, description, tag, is_cod_available, sizes, colors, new_arrival_days } = req.body;
    db.prepare(`
      UPDATE products SET 
        name = ?, category_id = ?, main_image = ?, additional_images = ?, 
        original_price = ?, discount_price = ?, stock_quantity = ?, 
        description = ?, tag = ?, is_cod_available = ?, sizes = ?, colors = ?,
        new_arrival_days = ?
      WHERE id = ?
    `).run(
      name, category_id, main_image, JSON.stringify(additional_images || []), 
      original_price, discount_price, stock_quantity, description, tag, 
      is_cod_available ? 1 : 0, JSON.stringify(sizes || []), JSON.stringify(colors || []),
      new_arrival_days || 7,
      req.params.id
    );
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    res.json(product);
  });

  app.delete('/api/products/:id', authenticateToken, isAdmin, (req, res) => {
    db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  });

  // --- Sliders Routes ---

  app.get('/api/sliders', (req, res) => {
    const sliders = db.prepare('SELECT * FROM sliders ORDER BY created_at DESC').all();
    res.json(sliders);
  });

  app.post('/api/sliders', authenticateToken, isAdmin, (req, res) => {
    const { desktop_banner, mobile_banner, category_id } = req.body;
    const result = db.prepare('INSERT INTO sliders (desktop_banner, mobile_banner, category_id) VALUES (?, ?, ?)').run(desktop_banner, mobile_banner, category_id);
    const slider = db.prepare('SELECT * FROM sliders WHERE id = ?').get(result.lastInsertRowid);
    res.json(slider);
  });

  app.delete('/api/sliders/:id', authenticateToken, isAdmin, (req, res) => {
    db.prepare('DELETE FROM sliders WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  });

  // --- Orders Routes ---
  app.post('/api/orders', authenticateToken, (req: any, res) => {
    const { total_amount, shipping_address, phone, payment_method, items, full_name, email } = req.body;
    const userId = req.user.id;

    const transaction = db.transaction(() => {
      const orderResult = db.prepare(`
        INSERT INTO orders (user_id, total_amount, shipping_address, phone, payment_method)
        VALUES (?, ?, ?, ?, ?)
      `).run(userId, total_amount, shipping_address, phone, payment_method);

      const orderId = orderResult.lastInsertRowid;

      for (const item of items) {
        db.prepare(`
          INSERT INTO order_items (order_id, product_id, quantity, price, size, color)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(orderId, item.product_id, item.quantity, item.price, item.size, item.color);
      }

      return orderId;
    });

    try {
      const orderId = transaction();
      res.json({ success: true, orderId });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // --- Wishlist Routes ---
  app.get('/api/wishlist', authenticateToken, (req: any, res) => {
    const items = db.prepare(`
      SELECT p.*, 
             (SELECT COUNT(*) FROM reviews WHERE product_id = p.id) as review_count,
             (SELECT AVG(rating) FROM reviews WHERE product_id = p.id) as avg_rating,
             1 as is_wishlisted
      FROM wishlist w
      JOIN products p ON w.product_id = p.id
      WHERE w.user_id = ?
    `).all(req.user.id);
    
    const formattedItems = items.map((p: any) => ({
      ...p,
      additional_images: JSON.parse(p.additional_images || '[]'),
      sizes: JSON.parse(p.sizes || '[]'),
      colors: JSON.parse(p.colors || '[]'),
      is_cod_available: !!p.is_cod_available,
      is_wishlisted: true
    }));
    res.json(formattedItems);
  });

  app.post('/api/wishlist', authenticateToken, (req: any, res) => {
    const { product_id } = req.body;
    try {
      db.prepare('INSERT INTO wishlist (user_id, product_id) VALUES (?, ?)').run(req.user.id, product_id);
      res.json({ success: true });
    } catch (error: any) {
      if (error.message.includes('UNIQUE constraint failed')) {
        return res.json({ success: true, message: 'Already in wishlist' });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.delete('/api/wishlist/:productId', authenticateToken, (req: any, res) => {
    db.prepare('DELETE FROM wishlist WHERE user_id = ? AND product_id = ?').run(req.user.id, req.params.productId);
    res.json({ success: true });
  });

  app.get('/api/orders/my', authenticateToken, (req: any, res) => {
    const orders = db.prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
    res.json(orders);
  });

  app.get('/api/orders', authenticateToken, isAdmin, (req, res) => {
    const orders = db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all();
    res.json(orders);
  });

  app.get('/api/orders/:id/items', authenticateToken, (req, res) => {
    const items = db.prepare(`
      SELECT oi.*, p.name as product_name, p.main_image 
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `).all(req.params.id);
    res.json(items);
  });

  app.get('/api/admin/stats', authenticateToken, isAdmin, (req, res) => {
    try {
      const totalRevenue = db.prepare('SELECT SUM(total_amount) as total FROM orders').get() as any;
      const activeOrders = db.prepare("SELECT COUNT(*) as count FROM orders WHERE status NOT IN ('Delivered', 'Cancelled')").get() as any;
      const totalCustomers = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'user'").get() as any;
      const totalProducts = db.prepare('SELECT COUNT(*) as count FROM products').get() as any;
      
      const recentOrders = db.prepare(`
        SELECT o.*, u.full_name as user_name 
        FROM orders o 
        LEFT JOIN users u ON o.user_id = u.id 
        ORDER BY o.created_at DESC 
        LIMIT 5
      `).all();

      // Last 7 days chart data
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const chartData = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const sales = db.prepare('SELECT SUM(total_amount) as total FROM orders WHERE DATE(created_at) = ?').get(dateStr) as any;
        return {
          name: days[d.getDay()],
          date: dateStr,
          sales: sales?.total || 0
        };
      }).reverse();

      res.json({
        stats: {
          revenue: totalRevenue?.total || 0,
          orders: activeOrders?.count || 0,
          customers: totalCustomers?.count || 0,
          products: totalProducts?.count || 0
        },
        recentActivity: recentOrders,
        chartData
      });
    } catch (err) {
      console.error('Error fetching admin stats:', err);
      res.status(500).json({ error: 'Failed to fetch stats' });
    }
  });

  // --- User Management Routes ---
  app.get('/api/users', authenticateToken, isAdmin, (req, res) => {
    const users = db.prepare('SELECT id, email, role, full_name, created_at FROM users ORDER BY created_at DESC').all();
    res.json(users);
  });

  app.put('/api/users/:id/role', authenticateToken, isAdmin, (req: any, res) => {
    const { role: newRole } = req.body;
    const targetUserId = req.params.id;
    const requesterRole = req.user.role;

    // Get target user's current role
    const targetUser = db.prepare('SELECT role FROM users WHERE id = ?').get(targetUserId) as any;
    if (!targetUser) return res.status(404).json({ error: 'User not found' });

    // Logic:
    // 1. Only superadmin can promote to superadmin
    // 2. Only superadmin can demote a superadmin
    // 3. Admin can only promote/demote between 'user' and 'admin'

    if (newRole === 'superadmin' && requesterRole !== 'superadmin') {
      return res.status(403).json({ error: 'Only superadmin can promote to superadmin' });
    }

    if (targetUser.role === 'superadmin' && requesterRole !== 'superadmin') {
      return res.status(403).json({ error: 'Only superadmin can demote a superadmin' });
    }

    db.prepare('UPDATE users SET role = ? WHERE id = ?').run(newRole, targetUserId);
    res.json({ success: true });
  });

  // --- Settings Routes ---
  app.get('/api/settings', (req, res) => {
    const settings = db.prepare('SELECT * FROM settings').all();
    res.json(settings);
  });

  app.post('/api/settings', authenticateToken, isAdmin, (req, res) => {
    const { key, value } = req.body;
    db.prepare(`
      INSERT INTO settings (key, value, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
    `).run(key, value);
    res.json({ success: true });
  });

  // --- Admin Notifications Routes ---
  app.get('/api/admin/notifications', authenticateToken, isAdmin, (req, res) => {
    try {
      const notifications = db.prepare('SELECT * FROM admin_notifications ORDER BY created_at DESC').all();
      res.json(notifications);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put('/api/admin/notifications/mark-read', authenticateToken, isAdmin, (req, res) => {
    try {
      db.prepare('UPDATE admin_notifications SET read = 1').run();
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put('/api/admin/notifications/:id/read', authenticateToken, isAdmin, (req, res) => {
    try {
      db.prepare('UPDATE admin_notifications SET read = 1 WHERE id = ?').run(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete('/api/admin/notifications/:id', authenticateToken, isAdmin, (req, res) => {
    try {
      db.prepare('DELETE FROM admin_notifications WHERE id = ?').run(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete('/api/admin/notifications', authenticateToken, isAdmin, (req, res) => {
    try {
      db.prepare('DELETE FROM admin_notifications').run();
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // --- Order Status Route ---
  app.put('/api/orders/:id/status', authenticateToken, isAdmin, (req, res) => {
    const { status } = req.body;
    const orderId = req.params.id;
    
    db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, orderId);

    // Add order cancellation/update notification
    if (status.toUpperCase() === 'CANCELLED' || status.toUpperCase() === 'CANCEL') {
      db.prepare(`
        INSERT INTO admin_notifications (type, title, message)
        VALUES (?, ?, ?)
      `).run('CANCELLATION', 'Order Cancelled', `Order #${orderId} has been cancelled by an administrator.`);
    } else {
      db.prepare(`
        INSERT INTO admin_notifications (type, title, message)
        VALUES (?, ?, ?)
      `).run('ORDER', 'Order Status Updated', `Order #${orderId} status has been updated to "${status}".`);
    }

    res.json({ success: true });
  });

  // --- Reviews Routes ---
  app.get('/api/products/:id/reviews', (req, res) => {
    const reviews = db.prepare(`
      SELECT r.*, u.full_name as user_name 
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.product_id = ?
      ORDER BY r.created_at DESC
    `).all(req.params.id);
    res.json(reviews);
  });

  app.post('/api/products/:id/reviews', authenticateToken, (req: any, res) => {
    const { rating, comment } = req.body;
    const productId = req.params.id;
    const userId = req.user.id;

    // Check if user is admin/superadmin
    const user = db.prepare('SELECT role FROM users WHERE id = ?').get(userId) as any;
    const isAdminUser = user.role === 'admin' || user.role === 'superadmin';

    if (!isAdminUser) {
      // Check if user has purchased the product
      const purchase = db.prepare(`
        SELECT o.id FROM orders o
        JOIN order_items oi ON o.id = oi.order_id
        WHERE o.user_id = ? AND oi.product_id = ? AND o.status = 'delivered'
      `).get(userId, productId);

      if (!purchase) {
        return res.status(403).json({ error: 'You must purchase and receive the product to leave a review.' });
      }
    }

    db.prepare('INSERT INTO reviews (product_id, user_id, rating, comment) VALUES (?, ?, ?, ?)').run(productId, userId, rating, comment);
    res.json({ success: true });
  });

  // SMTP Transporter
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  app.post('/api/auth/send-otp', async (req, res) => {
    const { email, otp } = req.body;
    const mailOptions = {
      from: `"Being Women" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Your Verification Code - Being Women',
      html: `
        <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 20px; background: #FFF8FA;">
          <h2 style="text-transform: uppercase; letter-spacing: 2px; text-align: center; font-family: 'Playfair Display', serif; color: #7B6358;">Being <span style="color: #D94F7A;">Women</span></h2>
          <p style="color: #666; text-align: center;">Use the code below to verify your account:</p>
          <div style="background: #fff; padding: 20px; border-radius: 15px; text-align: center; font-size: 32px; font-weight: bold; color: #D94F7A; border: 1px solid #fceef2; letter-spacing: 10px; margin: 20px 0;">
            ${otp}
          </div>
          <p style="font-size: 12px; color: #999; text-align: center;">This code will expire in 10 minutes.</p>
        </div>
      `
    };
    try {
      await transporter.sendMail(mailOptions);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  const PORT = Number(process.env.PORT) || 3000;

  // --- Settings Routes ---
  app.get('/api/settings', (req, res) => {
    const settings = db.prepare('SELECT * FROM settings').all();
    const settingsMap = settings.reduce((acc: any, curr: any) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});
    res.json(settingsMap);
  });

  app.post('/api/settings', authenticateToken, isAdmin, (req, res) => {
    const { key, value } = req.body;
    db.prepare(`
      INSERT INTO settings (key, value) 
      VALUES (?, ?) 
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `).run(key, value);
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

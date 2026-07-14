import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), 'database.sqlite');
const db = new Database(dbPath);

// Initialize database
export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      full_name TEXT,
      phone TEXT,
      address TEXT,
      state TEXT,
      pincode TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      image_url TEXT,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category_id INTEGER,
      main_image TEXT,
      additional_images TEXT, -- JSON string
      original_price REAL,
      discount_price REAL,
      stock_quantity INTEGER DEFAULT 0,
      description TEXT,
      tag TEXT,
      is_cod_available BOOLEAN DEFAULT 1,
      sizes TEXT, -- JSON string
      colors TEXT, -- JSON string
      new_arrival_days INTEGER DEFAULT 7,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories (id)
    );

    CREATE TABLE IF NOT EXISTS sliders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      desktop_banner TEXT,
      mobile_banner TEXT,
      category_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories (id)
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      total_amount REAL,
      status TEXT DEFAULT 'PENDING_PAYMENT',
      shipping_address TEXT,
      phone TEXT,
      payment_method TEXT,
      transaction_id TEXT,
      payment_status TEXT DEFAULT 'PENDING',
      payment_id TEXT,
      razorpay_order_id TEXT,
      payment_verified_at TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER,
      product_id INTEGER,
      quantity INTEGER,
      price REAL,
      size TEXT,
      color TEXT,
      FOREIGN KEY (order_id) REFERENCES orders (id),
      FOREIGN KEY (product_id) REFERENCES products (id)
    );

    CREATE TABLE IF NOT EXISTS wishlist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      product_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id),
      FOREIGN KEY (product_id) REFERENCES products (id),
      UNIQUE(user_id, product_id)
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS pending_payments (
      razorpay_order_id TEXT PRIMARY KEY,
      user_id INTEGER,
      payload TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER,
      user_id INTEGER,
      rating INTEGER,
      comment TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products (id),
      FOREIGN KEY (user_id) REFERENCES users (id)
    );

    CREATE TABLE IF NOT EXISTS admin_notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      read BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Migration: Add new_arrival_days to products if it doesn't exist
  try {
    db.prepare("ALTER TABLE products ADD COLUMN new_arrival_days INTEGER DEFAULT 7").run();
  } catch (e) {
    // Column already exists or other error
  }

  // Migration: Add new payment columns to orders if they don't exist
  try {
    db.prepare("ALTER TABLE orders ADD COLUMN payment_id TEXT").run();
  } catch (e) {}
  try {
    db.prepare("ALTER TABLE orders ADD COLUMN razorpay_order_id TEXT").run();
  } catch (e) {}
  try {
    db.prepare("ALTER TABLE orders ADD COLUMN payment_verified_at TEXT").run();
  } catch (e) {}

  // Create admin users if not exists
  const admins = [
    { email: 'aquibbhombal708@gmail.com', password: '@Aquib57', role: 'superadmin' },
    { email: 'moinneelam143@gmail.com', password: 'Admin@Password123', role: 'superadmin' }
  ];
  
  for (const admin of admins) {
    const user: any = db.prepare('SELECT * FROM users WHERE email = ?').get(admin.email);
    if (!user) {
      const hashedPassword = bcrypt.hashSync(admin.password, 10);
      db.prepare('INSERT INTO users (email, password, role) VALUES (?, ?, ?)').run(admin.email, hashedPassword, admin.role);
      console.log(`Admin user created: ${admin.email} with role ${admin.role}`);
    } else if (user.role !== admin.role) {
      // Only update role if it's different, don't reset password
      db.prepare('UPDATE users SET role = ? WHERE email = ?').run(admin.role, admin.email);
      console.log(`Admin user role updated: ${admin.email} to role ${admin.role}`);
    }
  }
}

export default db;

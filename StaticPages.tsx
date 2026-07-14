import React from 'react';

const StaticPage = ({ title, children }: { title: string, children: React.ReactNode }) => (
  <div className="max-w-4xl mx-auto px-4 py-16 lg:py-24">
    <h1 className="text-4xl font-black uppercase tracking-tighter mb-12 text-center">{title}</h1>
    <div className="prose prose-lg max-w-none text-gray-600 leading-relaxed space-y-6">
      {children}
    </div>
  </div>
);

export const About = () => (
  <StaticPage title="About Being Women">
    <p>
      Founded with a passion for premium fashion, <strong>Being Women</strong> has been a cornerstone of style, grace, and confidence for over a decade. Our mission is simple: to provide high-quality, fashionable apparel that honors the modern woman.
    </p>
    <p>
      Every design at Being Women is crafted with precision, using the finest fabrics sourced from around the globe. Whether you're looking for the perfect saree for a festive occasion, or elegant everyday wear, we have something to celebrate every aspect of womanhood.
    </p>
    <h2 className="text-2xl font-black text-black uppercase tracking-tight mt-12">Our Vision</h2>
    <p>
      To become India's leading women's fashion and ethnic wear brand known for premium quality, traditional craftsmanship, and timeless designs. We believe that elegant clothing can empower you, and we want to be part of your beautiful journey.
    </p>
  </StaticPage>
);

export const Privacy = () => (
  <StaticPage title="Privacy Policy">
    <p>At Being Women, we value your privacy. This policy outlines how we collect, use, and protect your personal information.</p>
    <h3 className="font-bold text-black uppercase">1. Information Collection</h3>
    <p>We collect information you provide when creating an account, placing an order, or contacting our support team. This includes your name, email, phone number, and shipping address.</p>
    <h3 className="font-bold text-black uppercase">2. Use of Information</h3>
    <p>Your data is used to process orders, improve our services, and send you relevant updates about your purchases. We do not sell your personal information to third parties.</p>
    <h3 className="font-bold text-black uppercase">3. Data Security</h3>
    <p>We implement industry-standard security measures to protect your data from unauthorized access or disclosure.</p>
  </StaticPage>
);

export const Shipping = () => (
  <StaticPage title="Shipping Policy">
    <p>We strive to deliver your Being Women orders as quickly and safely as possible.</p>
    <h3 className="font-bold text-black uppercase">Delivery Timeline</h3>
    <p>Orders are typically processed within 24-48 hours. Delivery usually takes 3-7 business days depending on your location in India.</p>
    <h3 className="font-bold text-black uppercase">Shipping Charges</h3>
    <ul className="list-disc pl-6 space-y-2">
      <li>Orders above ₹2000: <strong>FREE SHIPPING</strong></li>
      <li>Orders below ₹2000: Flat ₹99 shipping fee</li>
    </ul>
    <h3 className="font-bold text-black uppercase">Tracking</h3>
    <p>Once your order is shipped, you will receive a tracking link via email and SMS to monitor your delivery status in real-time.</p>
  </StaticPage>
);

export const Returns = () => (
  <StaticPage title="Return & Refund Policy">
    <p>Not happy with your purchase? No worries! We offer a hassle-free return policy.</p>
    <h3 className="font-bold text-black uppercase">15-Day Returns</h3>
    <p>You can return any unworn garments/items in their original packaging within 15 days of delivery for a full refund or exchange.</p>
    <h3 className="font-bold text-black uppercase">Return Process</h3>
    <p>To initiate a return, please visit the "My Orders" section in your account or contact our support team. We will arrange a reverse pickup for your convenience.</p>
    <h3 className="font-bold text-black uppercase">Refunds</h3>
    <p>Refunds are processed within 5-7 business days after we receive and inspect the returned item. For COD orders, refunds will be issued as store credit or bank transfer.</p>
  </StaticPage>
);

export const Terms = () => (
  <StaticPage title="Terms & Conditions">
    <p>By using the Being Women website, you agree to the following terms and conditions.</p>
    <h3 className="font-bold text-black uppercase">1. Intellectual Property</h3>
    <p>All content on this site, including images, logos, and text, is the property of Being Women and protected by copyright laws.</p>
    <h3 className="font-bold text-black uppercase">2. User Accounts</h3>
    <p>You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.</p>
    <h3 className="font-bold text-black uppercase">3. Limitation of Liability</h3>
    <p>Being Women shall not be liable for any indirect, incidental, or consequential damages arising from the use of our products or website.</p>
  </StaticPage>
);

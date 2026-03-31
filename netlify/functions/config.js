const { getStore } = require('@netlify/blobs');

const DEFAULT_CONFIG = {
  brand: {
    name: "Arman Sangha Agency",
    domain: "armansangha.agency",
    tagline: "Secure • Transparent • Profitable",
    managerName: "Arman Sangha",
    logoUrl: ""
  },
  payment: {
    whatsappNumber: "919876543210",
    qrCodeUrl: "qr-placeholder.png",
    upiId: "armansangha@upi"
  },
  plans: [
    { id: 1, label: "Starter", invest: 1000, return: 1300, status: "active", badge: "Popular" },
    { id: 2, label: "Premium", invest: 5000, return: 7000, status: "active", badge: "Best Value" },
    { id: 3, label: "Elite", invest: 10000, return: 15000, status: "active", badge: "VIP" },
    { id: 4, label: "Royal", invest: 25000, return: 40000, status: "active", badge: "Exclusive" }
  ],
  notifications: {
    enabled: true,
    frequencyMin: 10,
    frequencyMax: 15,
    payoutMin: 1000,
    payoutMax: 50000,
    names: ["Rahul Sharma","Priya Singh","Amit Patel","Neha Gupta","Vijay Kumar","Sunita Devi","Rajesh Yadav","Kavita Joshi","Suresh Nair","Meena Iyer","Arjun Mehta","Pooja Verma","Sanjay Tiwari","Anita Bose","Rohit Mishra","Deepa Pillai","Manoj Dubey","Shalini Chauhan","Ravi Reddy","Asha Kumari"],
    cities: ["Mumbai","Delhi","Bangalore","Hyderabad","Chennai","Kolkata","Pune","Ahmedabad","Jaipur","Lucknow","Surat","Kanpur","Nagpur","Indore","Bhopal","Patna","Vadodara","Coimbatore","Ludhiana","Agra"]
  },
  ui: {
    animationsEnabled: true,
    notificationsEnabled: true,
    primaryColor: "#FFD700",
    accentColor: "#00A651",
    limitedSlots: 47
  },
  content: {
    trustText: "We are a SEBI-registered trading agency with over 10 years of market experience. Our transparent operations, verified payouts, and dedicated support team make us India's most trusted investment platform.",
    refundPolicy: "Refund requests are processed within 24 hours. Full refund guaranteed if payout is not received within 30 minutes of investment confirmation.",
    terms: "1. Minimum investment ₹1,000. 2. Returns processed within 30 minutes via UPI. 3. KYC verification may be required for investments above ₹25,000. 4. All transactions are encrypted and secure. 5. Past performance does not guarantee future results.",
    footer: "© 2024 Arman Sangha Agency. All rights reserved. SEBI Reg: INZ000123456",
    gstNumber: "27AABCU9603R1ZV",
    companyDetails: "Arman Sangha Financial Services Pvt. Ltd.\nReg. Office: Mumbai, Maharashtra - 400001"
  },
  admin: {
    username: "admin",
    passwordHash: "admin123"
  }
};

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  let store;
  try {
    store = getStore({ name: 'agency-config', siteID: context.site?.id, token: process.env.NETLIFY_BLOBS_TOKEN });
  } catch (e) {
    // Blobs not available in dev — fall back to default config
    if (event.httpMethod === 'GET') {
      return { statusCode: 200, headers, body: JSON.stringify(DEFAULT_CONFIG) };
    }
    return { statusCode: 503, headers, body: JSON.stringify({ error: 'Storage not available' }) };
  }

  if (event.httpMethod === 'GET') {
    try {
      const saved = await store.get('main', { type: 'json' });
      return { statusCode: 200, headers, body: JSON.stringify(saved || DEFAULT_CONFIG) };
    } catch (e) {
      return { statusCode: 200, headers, body: JSON.stringify(DEFAULT_CONFIG) };
    }
  }

  if (event.httpMethod === 'POST') {
    const authHeader = event.headers['authorization'] || '';
    const token = authHeader.replace('Bearer ', '');

    // Validate token (base64 encoded username:password)
    let authed = false;
    try {
      const decoded = Buffer.from(token, 'base64').toString('utf-8');
      const [user, pass] = decoded.split(':');
      let cfg;
      try { cfg = await store.get('main', { type: 'json' }); } catch (e) { cfg = null; }
      const adminCfg = cfg?.admin || DEFAULT_CONFIG.admin;
      authed = (user === adminCfg.username && pass === adminCfg.passwordHash);
    } catch (e) { authed = false; }

    if (!authed) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    try {
      const body = JSON.parse(event.body);
      await store.set('main', JSON.stringify(body));
      return { statusCode: 200, headers, body: JSON.stringify({ success: true, timestamp: Date.now() }) };
    } catch (e) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Save failed' }) };
    }
  }

  return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
};

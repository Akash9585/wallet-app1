const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// OTP Storage
const otpStore = new Map(); // phone -> {otp, expiry}

function generateOTP() {
  return Math.floor(1000 + Math.random() * 9000).toString(); // 4 digit
}

app.post('/api/send-otp', (req, res) => {
  const { phone } = req.body;
  const otp = generateOTP();
  
  // Store OTP (5 min expiry)
  otpStore.set(phone, {
    otp,
    expiry: Date.now() + 5 * 60 * 1000
  });
  
  console.log(` ${phone} → OTP: ${otp} (expires: 5min)`);
  

  res.json({ 
    success: true, 
    message: `Demo OTP: ${otp}`,
    otp 
  });
});

app.post('/api/verify-otp', (req, res) => {
  const { phone, otp } = req.body;
  
  const stored = otpStore.get(phone);
  if (!stored) {
    return res.status(400).json({ error: 'OTP expired or not found' });
  }
  
  if (Date.now() > stored.expiry) {
    otpStore.delete(phone);
    return res.status(400).json({ error: 'OTP expired' });
  }
  
  if (stored.otp === otp) {
    otpStore.delete(phone); // Use pannita delete
    console.log(` ${phone} verified!`);
    res.json({ success: true, userId: 'user-' + Date.now() });
  } else {
    res.status(400).json({ error: 'Invalid OTP' });
  }
});

app.post('/api/transactions', (req, res) => {
  console.log(' Transaction:', req.body);
  res.json({ success: true });
});

app.listen(5000, () => {
  console.log('🚀 Backend: http://localhost:5000 ');
});
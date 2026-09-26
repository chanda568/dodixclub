import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

dotenv.config();

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors());

// 1. Create standard HTTP server from Express app
const server = createServer(app);

// 2. Attach WebSocket Server to the HTTP server
const wss = new WebSocketServer({ server });

// --- GMAIL NODEMAILER TRANSPORTER SETUP ---
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // true for port 465
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Verify SMTP connection on startup
transporter.verify((error, success) => {
  if (error) {
    console.error('[Email Setup Error]:', error);
  } else {
    console.log('[Email Setup]: Gmail SMTP server is ready to take messages');
  }
});

// --- MONGODB CONNECTION ---
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/dodixclub';

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('[Database] Connected to MongoDB Atlas successfully.');
    
    // Drop legacy index causing E11000 null duplicate key errors
    try {
      await mongoose.connection.collection('users').dropIndex('email_1');
      console.log('[Database] Successfully dropped legacy email_1 index.');
    } catch (e) {
      // Index might already be gone, safe to ignore
    }

    await seedDefaultAdmin();
  })
  .catch(err => console.error('[Database] Connection error:', err));

// --- MONGOOSE SCHEMAS & MODELS ---
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  email: { type: String, default: '', lowercase: true, trim: true },
  gender: { type: String, required: true },
  location: { type: String, required: true },
  phone: { type: String, default: '' }, // WhatsApp number for females
  plan: { type: String, default: '7 Days' }, // Subscription plan for males ('7 Days' or '30 Days')
  role: { type: String, default: 'client' },
  activated: { type: Boolean, default: false },
  emailOtp: { type: String, default: null },
  emailOtpExpires: { type: Date, default: null },
  isEmailVerified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now } // Registration timestamp
});

const messageSchema = new mongoose.Schema({
  id: { type: String, required: true },
  sender: { type: String, required: true, lowercase: true, trim: true },
  recipient: { type: String, default: 'public', lowercase: true, trim: true },
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const reportSchema = new mongoose.Schema({
  reporter: { type: String, required: true, lowercase: true, trim: true },
  targetUser: { type: String, required: true, lowercase: true, trim: true },
  reason: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const companionSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, lowercase: true, trim: true },
  name: { type: String, required: true },
  category: { type: String, default: 'VIP' },
  price: { type: String, required: true },
  location: { type: String, required: true },
  specificLocation: { type: String, default: '' },
  phone: { type: String, required: true },
  photo: { type: String, default: '' },
  age: { type: String, default: '23' },
  hosting: { type: String, default: 'Yes' },
  extraServices: { type: String, default: '' },
  verificationVideoUrl: { type: String, default: '' },
  verificationVideoName: { type: String, default: '' },
  approved: { type: Boolean, default: true },
  updatedAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Message = mongoose.model('Message', messageSchema);
const Report = mongoose.model('Report', reportSchema);
const Companion = mongoose.model('Companion', companionSchema);

// Seed default admin if database is empty
async function seedDefaultAdmin() {
  const count = await User.countDocuments();
  if (count === 0) {
    const hashedPassword = await bcrypt.hash('password123', 10);
    const defaultUsers = [
      { username: 'admin', password: hashedPassword, gender: 'Male', location: 'Lusaka', role: 'admin', activated: true }
    ];
    await User.insertMany(defaultUsers);
    console.log('[Database] Seeded default admin into MongoDB.');
  }
}

// Track active WebSocket connections mapped by username: Map<username, WebSocket>
const activeClients = new Map();


// ================= EXPRESS REST API ROUTES = =================

// Login route
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const cleanUsername = username?.toLowerCase().trim();
    
    const user = await User.findOne({ username: cleanUsername });
    if (!user) {
      return res.json({ success: false, error: "Invalid username or password." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.json({ success: false, error: "Invalid username or password." });
    }
    
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- EMAIL OTP ROUTES ---

// 1. Send Email OTP Route
app.post('/api/send-email-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.json({ success: false, error: "Email address is required." });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
    const expires = new Date(Date.now() + 10 * 60 * 1000); // Valid for 10 mins

    // Upsert temporary record to store OTP against the email
    await User.findOneAndUpdate(
      { email: email.toLowerCase().trim() },
      { emailOtp: otp, emailOtpExpires: expires },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Send email via Gmail SMTP
    await transporter.sendMail({
      from: '"DodixClub Support" <' + process.env.EMAIL_USER + '>',
      to: email,
      subject: 'Your DodixClub Verification Code',
      text: `Hello,\n\nYour verification code for DodixClub is: ${otp}\n\nThis code will expire in 10 minutes.\n\nBest regards,\nDodixClub Team`
    });

    res.json({ success: true, message: 'OTP sent successfully to your email.' });
  } catch (err) {
    console.error('Error sending email OTP:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Verify Email OTP Route
app.post('/api/verify-email-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase().trim() });

    if (!user || user.emailOtp !== otp || new Date() > user.emailOtpExpires) {
      return res.json({ success: false, error: 'Invalid or expired verification code.' });
    }

    user.isEmailVerified = true;
    user.emailOtp = null;
    user.emailOtpExpires = null;
    await user.save();

    res.json({ success: true, message: 'Email verified successfully!' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Register route
app.post('/api/register', async (req, res) => {
  try {
    const { username, password, email, gender, location, role, phone, plan } = req.body;
    
    if (!username || !password || !gender || !location) {
      return res.json({ success: false, error: "All fields are required." });
    }

    const cleanUsername = username.toLowerCase().trim();
    const existingUser = await User.findOne({ username: cleanUsername });
    if (existingUser) {
      return res.json({ success: false, error: "Username already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Find if user record already exists via email verification flow or create new
    let newUser = await User.findOne({ email: email?.toLowerCase().trim() });

    if (newUser) {
      newUser.username = cleanUsername;
      newUser.password = hashedPassword;
      newUser.gender = gender;
      newUser.location = location;
      newUser.phone = phone || '';
      newUser.plan = gender === 'Male' ? (plan || '7 Days') : 'N/A';
      newUser.role = role || 'client';
      newUser.activated = false;
      newUser.createdAt = new Date();
      await newUser.save();
    } else {
      newUser = new User({
        username: cleanUsername,
        password: hashedPassword,
        email: email ? email.toLowerCase().trim() : '',
        gender,
        location,
        phone: phone || '',
        plan: gender === 'Male' ? (plan || '7 Days') : 'N/A',
        role: role || 'client',
        activated: false,
        createdAt: new Date()
      });
      await newUser.save();
    }

    res.json({ success: true, user: newUser });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get all users route (for admin panel)
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find({});
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Route to toggle user activation status
app.post('/api/users/toggle', async (req, res) => {
  try {
    const { username } = req.body;
    const user = await User.findOne({ username: username?.toLowerCase().trim() });
    
    if (user) {
      user.activated = !user.activated;
      await user.save();
      res.json({ success: true, user });
    } else {
      res.json({ success: false, error: "User not found." });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Route to reset password (admin feature)
app.post('/api/users/reset-password', async (req, res) => {
  try {
    const { username, newPassword } = req.body;
    if (!username || !newPassword) {
      return res.json({ success: false, error: "Username and new password are required." });
    }

    const cleanUsername = username.toLowerCase().trim();
    const user = await User.findOne({ username: cleanUsername });
    
    if (!user) {
      return res.json({ success: false, error: "User not found." });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.json({ success: true, message: "Password updated successfully." });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Route to delete a user
app.delete('/api/users/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const cleanUsername = username?.toLowerCase().trim();
    const result = await User.findOneAndDelete({ username: cleanUsername });
    await Companion.findOneAndDelete({ username: cleanUsername });
    
    if (result) {
      res.json({ success: true });
    } else {
      res.json({ success: false, error: "User not found." });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Route to fetch saved message history via HTTP
app.get('/api/messages', async (req, res) => {
  try {
    const messages = await Message.find({}).sort({ timestamp: 1 });
    res.json({ success: true, messages });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- REPORT ROUTES ---
app.post('/api/reports', async (req, res) => {
  try {
    const { reporter, targetUser, reason } = req.body;
    if (!reporter || !targetUser || !reason) {
      return res.json({ success: false, error: "All fields are required." });
    }

    const newReport = new Report({
      reporter: reporter.toLowerCase().trim(),
      targetUser: targetUser.toLowerCase().trim(),
      reason,
      timestamp: new Date()
    });

    await newReport.save();
    res.json({ success: true, report: newReport });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/reports', async (req, res) => {
  try {
    const reports = await Report.find({}).sort({ timestamp: -1 });
    res.json({ success: true, reports });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/reports/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await Report.findByIdAndDelete(id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- COMPANION LISTING ROUTES ---
app.get('/api/ladies', async (req, res) => {
  try {
    const ladies = await Companion.find({});
    res.json({ success: true, ladies });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/ladies', async (req, res) => {
  try {
    const profileData = req.body;
    if (!profileData.username || !profileData.phone || !profileData.price) {
      return res.json({ success: false, error: "Required fields missing." });
    }

    const cleanUsername = profileData.username.toLowerCase().trim();
    
    let companion = await Companion.findOne({ username: cleanUsername });
    if (companion) {
      companion.name = profileData.name;
      companion.category = profileData.category;
      companion.price = profileData.price;
      companion.location = profileData.location;
      companion.specificLocation = profileData.specificLocation;
      companion.phone = profileData.phone;
      companion.photo = profileData.photo;
      companion.age = profileData.age;
      companion.hosting = profileData.hosting;
      companion.extraServices = profileData.extraServices;
      companion.verificationVideoUrl = profileData.verificationVideoUrl;
      companion.verificationVideoName = profileData.verificationVideoName;
      companion.updatedAt = new Date();
      await companion.save();
    } else {
      companion = new Companion({
        ...profileData,
        username: cleanUsername,
        approved: true
      });
      await companion.save();
    }

    res.json({ success: true, companion });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/ladies/approve', async (req, res) => {
  try {
    const { username } = req.body;
    const cleanId = username?.toLowerCase().trim();
    const companion = await Companion.findOne({
      $or: [
        { username: { $regex: new RegExp(`^${cleanId}$`, 'i') } },
        { name: { $regex: new RegExp(`^${cleanId}$`, 'i') } }
      ]
    });
    
    if (companion) {
      companion.approved = true;
      companion.updatedAt = new Date();
      await companion.save();
      res.json({ success: true, companion });
    } else {
      res.status(404).json({ success: false, error: 'Companion profile not found.' });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/ladies/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;
    const cleanId = identifier.toLowerCase().trim();
    const result = await Companion.findOneAndDelete({
      $or: [
        { username: { $regex: new RegExp(`^${cleanId}$`, 'i') } },
        { name: { $regex: new RegExp(`^${cleanId}$`, 'i') } }
      ]
    });

    if (result) {
      res.json({ success: true, message: 'Companion profile successfully removed.' });
    } else {
      res.status(404).json({ success: false, error: 'Companion profile not found.' });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});


// ================= WEBSOCKET REAL-TIME HANDLING = =================

wss.on('connection', (ws) => {
  let currentUsername = null;

  ws.on('message', async (data) => {
    try {
      const parsed = JSON.parse(data.toString());

      if (parsed.type === 'auth' && parsed.username) {
        currentUsername = parsed.username.toLowerCase().trim();
        activeClients.set(currentUsername, ws);
        return;
      }

      if (parsed.type === 'chat_message') {
        const { sender, recipient, text } = parsed;
        if (!sender || !text) return;

        const newMessage = new Message({
          id: Date.now().toString(),
          sender: sender.toLowerCase().trim(),
          recipient: recipient ? recipient.toLowerCase().trim() : 'public',
          text: text.trim(),
          timestamp: new Date()
        });

        await newMessage.save();
        const payload = JSON.stringify({ type: 'chat_message', message: newMessage });

        if (newMessage.recipient !== 'public' && activeClients.has(newMessage.recipient)) {
          activeClients.get(newMessage.recipient).send(payload);
        }
        if (activeClients.has(newMessage.sender)) {
          activeClients.get(newMessage.sender).send(payload);
        }
      }
    } catch (err) {
      console.error("[WS] Error processing message:", err);
    }
  });

  ws.on('close', () => {
    if (currentUsername) activeClients.delete(currentUsername);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
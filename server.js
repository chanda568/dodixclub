// server.js
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// Middleware setup for large payload support (images, videos, etc.)
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));
app.use(cors());

const server = createServer(app);
const wss = new WebSocketServer({ server });

// ==========================================
// 1. Mongoose Schemas & Models
// ==========================================
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  email: { type: String, default: '', lowercase: true, trim: true },
  gender: { type: String, required: true },
  location: { type: String, required: true },
  phone: { type: String, default: '' },
  plan: { type: String, default: '7 Days' },
  role: { type: String, default: 'client' },
  securityQuestion: { type: String, default: 'What was your first pet’s name?' },
  securityAnswerHash: { type: String, default: '' },
  activated: { type: Boolean, default: false },
  isEmailVerified: { type: Boolean, default: true },
  lastSeen: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
}, { bufferCommands: false });

const messageSchema = new mongoose.Schema({
  id: { type: String, required: true },
  sender: { type: String, required: true, lowercase: true, trim: true },
  recipient: { type: String, default: 'public', lowercase: true, trim: true },
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
}, { bufferCommands: false });

const reportSchema = new mongoose.Schema({
  reporter: { type: String, required: true, lowercase: true, trim: true },
  targetUser: { type: String, required: true, lowercase: true, trim: true },
  reason: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
}, { bufferCommands: false });

const companionSchema = new mongoose.Schema({
  username: { type: String, required: true, lowercase: true, trim: true },
  name: { type: String, required: true },
  category: { type: String, default: 'VIP' },
  price: { type: String, required: true },
  location: { type: String, required: true },
  specificLocation: { type: String, default: '' },
  phone: { type: String, required: true },
  photo: { type: String, default: '' },
  originalPhoto: { type: String, default: '' },
  unmaskedPhoto: { type: String, default: '' },
  age: { type: String, default: '23' },
  hosting: { type: String, default: 'Yes' },
  extraServices: { type: String, default: '' },
  verificationVideoUrl: { type: String, default: '' },
  verificationVideoName: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  approved: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { bufferCommands: false });

companionSchema.index({ createdAt: -1 });

const announcementSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  visibility: { type: String, default: 'all' },
  createdAt: { type: Date, default: Date.now }
}, { bufferCommands: false });

const User = mongoose.models.User || mongoose.model('User', userSchema);
const Message = mongoose.models.Message || mongoose.model('Message', messageSchema);
const Report = mongoose.models.Report || mongoose.model('Report', reportSchema);
const Companion = mongoose.models.Companion || mongoose.model('Companion', companionSchema);
const Announcement = mongoose.models.Announcement || mongoose.model('Announcement', announcementSchema);

async function seedDefaultAdmin() {
  try {
    const count = await User.countDocuments();
    if (count === 0) {
      const hashedPassword = await bcrypt.hash('password123', 10);
      const defaultAnswerHash = await bcrypt.hash('admin', 10);
      await User.insertMany([{
        username: 'admin',
        password: hashedPassword,
        gender: 'Male',
        location: 'Lusaka',
        role: 'admin',
        activated: true,
        isEmailVerified: true,
        securityQuestion: 'What was your first pet’s name?',
        securityAnswerHash: defaultAnswerHash
      }]);
      console.log('[Database] Seeded default admin into MongoDB.');
    }
  } catch (err) {
    console.error('[Database] Seeding error:', err);
  }
}

const activeClients = new Map();

// ==========================================
// 2. Express REST API Routes
// ==========================================
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'success', message: 'Server is up and running!' });
});

// Authentication & Users
app.get('/api/check-username/:username', async (req, res) => {
  try {
    const cleanUsername = req.params.username.toLowerCase().trim();
    const existingUser = await User.findOne({ username: cleanUsername });
    res.json({ success: true, available: !existingUser });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const cleanUsername = username?.toLowerCase().trim();
    const user = await User.findOne({ username: cleanUsername });
    if (!user) return res.json({ success: false, error: "Username does not exist." });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.json({ success: false, error: "Incorrect password." });
    
    user.lastSeen = new Date();
    await user.save();
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/register', async (req, res) => {
  try {
    const { username, password, email, gender, location, role, phone, plan, securityQuestion, securityAnswer } = req.body;
    if (!username || !password || !gender || !location) {
      return res.json({ success: false, error: "All fields are required." });
    }

    const cleanUsername = username.toLowerCase().trim();
    const existingUser = await User.findOne({ username: cleanUsername });
    if (existingUser) return res.json({ success: false, error: "Username already exists." });

    const hashedPassword = await bcrypt.hash(password, 10);
    const hashedAnswer = securityAnswer ? await bcrypt.hash(securityAnswer.toLowerCase().trim(), 10) : await bcrypt.hash('default', 10);

    const newUser = new User({
      username: cleanUsername,
      password: hashedPassword,
      email: email ? email.toLowerCase().trim() : '',
      gender,
      location,
      phone: phone || '',
      plan: gender === 'Male' ? (plan || '7 Days') : 'N/A',
      role: role || 'client',
      securityQuestion: securityQuestion || 'What was your first pet’s name?',
      securityAnswerHash: hashedAnswer,
      activated: false,
      isEmailVerified: true,
      lastSeen: new Date()
    });

    await newUser.save();
    res.json({ success: true, user: newUser });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find({});
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

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

app.post('/api/users/reset-password', async (req, res) => {
  try {
    const { username, newPassword } = req.body;
    if (!username || !newPassword) return res.json({ success: false, error: "Username and new password are required." });
    const user = await User.findOne({ username: username.toLowerCase().trim() });
    if (!user) return res.json({ success: false, error: "User not found." });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ success: true, message: "Password updated successfully." });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/users/update-location', async (req, res) => {
  try {
    const { username, location } = req.body;
    const user = await User.findOne({ username: username?.toLowerCase().trim() });
    if (!user) return res.json({ success: false, error: "User not found." });

    user.location = location.trim();
    await user.save();
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/users/update-phone', async (req, res) => {
  try {
    const { username, phone } = req.body;
    const user = await User.findOne({ username: username?.toLowerCase().trim() });
    if (!user) return res.json({ success: false, error: "User not found." });

    user.phone = phone.trim();
    await user.save();
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/users/:username', async (req, res) => {
  try {
    const cleanUsername = req.params.username?.toLowerCase().trim();
    await User.findOneAndDelete({ username: cleanUsername });
    await Companion.deleteMany({ username: cleanUsername });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Announcements
app.get('/api/announcements', async (req, res) => {
  try {
    const announcements = await Announcement.find({}).sort({ createdAt: -1 });
    res.json({ success: true, announcements });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/announcements', async (req, res) => {
  try {
    const { title, content, visibility } = req.body;
    if (!title || !content) return res.json({ success: false, error: "Title and content required." });

    const newAnnouncement = new Announcement({ title, content, visibility: visibility || 'all' });
    await newAnnouncement.save();
    res.json({ success: true, announcement: newAnnouncement });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/announcements/:id', async (req, res) => {
  try {
    await Announcement.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Messages & Reports
app.get('/api/messages', async (req, res) => {
  try {
    const messages = await Message.find({}).sort({ timestamp: 1 });
    res.json({ success: true, messages });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/reports', async (req, res) => {
  try {
    const { reporter, targetUser, reason } = req.body;
    const newReport = new Report({ reporter: reporter.toLowerCase().trim(), targetUser: targetUser.toLowerCase().trim(), reason });
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
    await Report.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Companions / Ads Routes
app.get('/api/ladies', async (req, res) => {
  try {
    const { location, category, status } = req.query;
    let query = {};

    if (location) query.location = { $regex: new RegExp(location.trim(), 'i') };
    if (category) query.category = { $regex: new RegExp(`^${category.trim()}$`, 'i') };
    
    // Updated: Only filter by status if explicitly requested (allows admin view to see pending + accepted)
    if (status && status !== 'all') {
      query.status = status;
    }

    const ladies = await Companion.find(query).sort({ createdAt: -1 }).allowDiskUse(true);
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

    const newCompanionAd = new Companion({
      ...profileData,
      username: profileData.username.toLowerCase().trim(),
      status: 'pending',
      approved: false,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await newCompanionAd.save();
    res.json({ success: true, companion: newCompanionAd });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/ladies/approve', async (req, res) => {
  try {
    const { id, username } = req.body;
    let query = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { username: username?.toLowerCase().trim() };
    
    const companion = await Companion.findOne(query);
    if (!companion) return res.status(404).json({ success: false, error: 'Advertisement not found.' });

    companion.status = 'accepted';
    companion.approved = true;
    companion.updatedAt = new Date();
    await companion.save();
    res.json({ success: true, companion });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/ladies/:identifier/price', async (req, res) => {
  try {
    const cleanId = req.params.identifier.toLowerCase().trim();
    const { price } = req.body;
    let companion = mongoose.Types.ObjectId.isValid(cleanId) ? await Companion.findById(cleanId) : null;
    if (!companion) {
      companion = await Companion.findOne({ $or: [{ username: cleanId }, { name: cleanId }] });
    }

    if (companion) {
      companion.price = price.trim();
      companion.updatedAt = new Date();
      await companion.save();
      res.json({ success: true, companion });
    } else {
      res.status(404).json({ success: false, error: 'Advertisement not found.' });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/ladies/:identifier', async (req, res) => {
  try {
    const cleanId = req.params.identifier.toLowerCase().trim();
    let result = mongoose.Types.ObjectId.isValid(cleanId) ? await Companion.findByIdAndDelete(cleanId) : null;
    if (!result) {
      result = await Companion.findOneAndDelete({ $or: [{ username: cleanId }, { name: cleanId }] });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 3. WebSocket Real-Time Chat
// ==========================================
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
    } catch (err) {
      console.error("[WS] Error:", err);
    }
  });

  ws.on('close', () => {
    if (currentUsername) activeClients.delete(currentUsername);
  });
});

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

async function startServer() {
  try {
    if (!MONGO_URI) {
      console.error('[Database Error] MONGO_URI missing.');
      process.exit(1);
    }
    await mongoose.connect(MONGO_URI, { family: 4 });
    console.log('[Database] Connected to MongoDB Atlas.');
    await seedDefaultAdmin();

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('[Startup Error]:', err.message);
    process.exit(1);
  }
}

startServer();
export default server;
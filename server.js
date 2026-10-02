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
// 1. Database Connection (MongoDB Atlas)
// ==========================================
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;
if (!MONGO_URI) {
  console.error('[Database Error] MONGO_URI or MONGODB_URI environment variable is missing.');
} else {
  mongoose.connect(MONGO_URI, { family: 4 })
    .then(async () => {
      console.log('[Database] Connected to MongoDB Atlas successfully.');
      
      // Drop conflicting indexes if they exist from older schemas
      try { await mongoose.connection.collection('users').dropIndex('email_1'); } catch (e) {}
      try { await mongoose.connection.collection('companions').dropIndex('username_1'); } catch (e) {}

      await seedDefaultAdmin();
    })
    .catch(err => console.error('[Database] Connection error:', err));
}

// ==========================================
// 2. Mongoose Schemas & Models
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
  createdAt: { type: Date, default: Date.now }
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
  approved: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Add index to companion schema for fast, memory-efficient sorting
companionSchema.index({ createdAt: -1 });

const announcementSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  visibility: { type: String, default: 'all' },
  createdAt: { type: Date, default: Date.now }
});

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
// 3. Express REST API Routes
// ==========================================
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'success', message: 'Server is up and running!' });
});

// Authentication
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
      isEmailVerified: true
    });

    await newUser.save();
    res.json({ success: true, user: newUser });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// User Management
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
    if (!title || !content) return res.json({ success: false, error: "Title and content are required." });

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

// --- Companions / Ads Routes ---
app.get('/api/ladies', async (req, res) => {
  try {
    const { location, category, approved } = req.query;
    let query = {};

    if (location) query.location = { $regex: new RegExp(location.trim(), 'i') };
    if (category) query.category = { $regex: new RegExp(`^${category.trim()}$`, 'i') };
    if (approved !== undefined) query.approved = approved === 'true';

    const ladies = await Companion.find(query).sort({ createdAt: -1 }).allowDiskUse(true);
    res.json({ success: true, ladies });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/ladies/my-ads/:username', async (req, res) => {
  try {
    const cleanUsername = req.params.username.toLowerCase().trim();
    const ads = await Companion.find({ username: cleanUsername }).sort({ createdAt: -1 }).allowDiskUse(true);
    res.json({ success: true, ads });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/ladies', async (req, res) => {
  try {
    const profileData = req.body;
    if (!profileData.username || !profileData.phone || !profileData.price) {
      return res.json({ success: false, error: "Required fields missing (username, phone, price)." });
    }

    const cleanUsername = profileData.username.toLowerCase().trim();

    const newCompanionAd = new Companion({
      ...profileData,
      username: cleanUsername,
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
    const { username, id } = req.body;
    let companion = null;

    if (id) {
      companion = await Companion.findById(id);
    } else if (username) {
      const cleanId = username.toLowerCase().trim();
      companion = await Companion.findOne({
        $or: [{ username: cleanId }, { name: cleanId }]
      });
    }
    
    if (companion) {
      companion.approved = true;
      companion.updatedAt = new Date();
      await companion.save();
      res.json({ success: true, companion });
    } else {
      res.status(404).json({ success: false, error: 'Companion advertisement not found.' });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/ladies/:identifier', async (req, res) => {
  try {
    const cleanId = req.params.identifier.toLowerCase().trim();
    let result = null;
    if (mongoose.Types.ObjectId.isValid(cleanId)) {
      result = await Companion.findByIdAndDelete(cleanId);
    }
    if (!result) {
      result = await Companion.findOneAndDelete({ $or: [{ username: cleanId }, { name: cleanId }] });
    }

    if (result) {
      res.json({ success: true, message: 'Companion advertisement successfully removed.' });
    } else {
      res.status(404).json({ success: false, error: 'Companion advertisement not found.' });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 4. WebSocket Real-Time Chat
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

      if (parsed.type === 'chat_message') {
        const { sender, recipient, text } = parsed;
        if (!sender || !text) return;

        const newMessage = new Message({
          id: Date.now().toString(),
          sender: sender.toLowerCase().trim(),
          recipient: recipient ? recipient.toLowerCase().trim() : 'public',
          text: text.trim()
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
      console.error("[WS] Error:", err);
    }
  });

  ws.on('close', () => {
    if (currentUsername) activeClients.delete(currentUsername);
  });
});

// ==========================================
// 5. Server Start / Export (Production Ready)
// ==========================================
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default server;
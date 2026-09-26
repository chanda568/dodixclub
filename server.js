import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors());

// 1. Create standard HTTP server from Express app
const server = createServer(app);

// 2. Attach WebSocket Server to the HTTP server
const wss = new WebSocketServer({ server });

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

// Updated Companion/Ad Schema allowing multiple ads per user
const companionSchema = new mongoose.Schema({
  username: { type: String, required: true, lowercase: true, trim: true },
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
  createdAt: { type: Date, default: Date.now },
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
      { username: 'admin', password: hashedPassword, gender: 'Male', location: 'Lusaka', role: 'admin', activated: true, isEmailVerified: true }
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

// Register route (Direct registration without email OTP)
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

    const newUser = new User({
      username: cleanUsername,
      password: hashedPassword,
      email: email ? email.toLowerCase().trim() : '',
      gender,
      location,
      phone: phone || '',
      plan: gender === 'Male' ? (plan || '7 Days') : 'N/A',
      role: role || 'client',
      activated: false,
      isEmailVerified: true,
      createdAt: new Date()
    });

    await newUser.save();
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
    await Companion.deleteMany({ username: cleanUsername });
    
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

// --- COMPANION ADVERTISEMENT LISTING ROUTES (Max 5 ads per day) ---
app.get('/api/ladies', async (req, res) => {
  try {
    const ladies = await Companion.find({}).sort({ createdAt: -1 });
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

    // Check how many ads this user has posted today (start of current day)
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const todayAdsCount = await Companion.countDocuments({
      username: cleanUsername,
      createdAt: { $gte: startOfDay }
    });

    if (todayAdsCount >= 5) {
      return res.json({ 
        success: false, 
        error: "Daily limit reached! You can post a maximum of 5 advertisements per day." 
      });
    }

    const newCompanionAd = new Companion({
      ...profileData,
      username: cleanUsername,
      approved: true,
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
        $or: [
          { username: { $regex: new RegExp(`^${cleanId}$`, 'i') } },
          { name: { $regex: new RegExp(`^${cleanId}$`, 'i') } }
        ]
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
    const { identifier } = req.params;
    const cleanId = identifier.toLowerCase().trim();
    
    // Try deleting by MongoDB _id first, or by username/name
    let result = null;
    if (mongoose.Types.ObjectId.isValid(cleanId)) {
      result = await Companion.findByIdAndDelete(cleanId);
    }
    
    if (!result) {
      result = await Companion.findOneAndDelete({
        $or: [
          { username: { $regex: new RegExp(`^${cleanId}$`, 'i') } },
          { name: { $regex: new RegExp(`^${cleanId}$`, 'i') } }
        ]
      });
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
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());
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
  gender: { type: String, required: true },
  location: { type: String, required: true },
  phone: { type: String, default: '' }, // WhatsApp number for females
  plan: { type: String, default: '7 Days' }, // Subscription plan for males ('7 Days' or '30 Days')
  role: { type: String, default: 'client' },
  activated: { type: Boolean, default: false },
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

const User = mongoose.model('User', userSchema);
const Message = mongoose.model('Message', messageSchema);
const Report = mongoose.model('Report', reportSchema);

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

// Register route
app.post('/api/register', async (req, res) => {
  try {
    const { username, password, gender, location, role, phone, plan } = req.body;
    
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
      gender,
      location,
      phone: phone || '',
      plan: gender === 'Male' ? (plan || '7 Days') : 'N/A', // Save selected plan for males
      role: role || 'client',
      activated: false,
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

// Route to delete a user
app.delete('/api/users/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const result = await User.findOneAndDelete({ username: username?.toLowerCase().trim() });
    
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
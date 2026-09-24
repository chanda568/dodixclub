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
    await seedDefaultAdmin();
  })
  .catch(err => console.error('[Database] Connection error:', err));

// --- MONGOOSE SCHEMAS & MODELS ---
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  gender: { type: String, required: true },
  location: { type: String, required: true },
  role: { type: String, default: 'client' },
  activated: { type: Boolean, default: false }
});

const messageSchema = new mongoose.Schema({
  id: { type: String, required: true },
  sender: { type: String, required: true, lowercase: true, trim: true },
  recipient: { type: String, default: 'public', lowercase: true, trim: true },
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Message = mongoose.model('Message', messageSchema);

// Seed default users if database is empty
async function seedDefaultAdmin() {
  const count = await User.countDocuments();
  if (count === 0) {
    const hashedPassword = await bcrypt.hash('password123', 10);
    const defaultUsers = [
      { username: 'admin', password: hashedPassword, gender: 'Male', location: 'Lusaka', role: 'admin', activated: true },
      { username: 'pal', password: hashedPassword, gender: 'Male', location: 'Lusaka', role: 'client', activated: false },
      { username: 'lap', password: hashedPassword, gender: 'Male', location: 'Lusaka', role: 'client', activated: false },
      { username: 'ver', password: hashedPassword, gender: 'Male', location: 'Lusaka', role: 'client', activated: false },
      { username: 'car', password: hashedPassword, gender: 'Male', location: 'Lusaka', role: 'client', activated: false },
      { username: 'tar', password: hashedPassword, gender: 'Male', location: 'Lusaka', role: 'client', activated: true },
      { username: 'des', password: hashedPassword, gender: 'Male', location: 'Lusaka', role: 'client', activated: true }
    ];
    await User.insertMany(defaultUsers);
    console.log('[Database] Seeded default users into MongoDB.');
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
    const { username, password, gender, location, role } = req.body;
    
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
      role: role || 'client',
      activated: false
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


// ================= WEBSOCKET REAL-TIME HANDLING = =================

wss.on('connection', (ws) => {
  let currentUsername = null;

  ws.on('message', async (data) => {
    try {
      const parsed = JSON.parse(data.toString());

      // 1. Handle user authentication / registration over socket connection
      if (parsed.type === 'auth' && parsed.username) {
        currentUsername = parsed.username.toLowerCase().trim();
        activeClients.set(currentUsername, ws);
        console.log(`[WS] User connected & authenticated: ${currentUsername}`);
        return;
      }

      // 2. Handle incoming chat messages
      if (parsed.type === 'chat_message') {
        const { sender, recipient, text } = parsed;

        if (!sender || !text) return;

        // Create message object
        const newMessage = new Message({
          id: Date.now().toString(),
          sender: sender.toLowerCase().trim(),
          recipient: recipient ? recipient.toLowerCase().trim() : 'public',
          text: text.trim(),
          timestamp: new Date()
        });

        // PERSISTENCE: Save message to MongoDB
        await newMessage.save();

        // BROADCASTING: Send message back to sender and recipient (if online)
        const payload = JSON.stringify({ type: 'chat_message', message: newMessage });

        // Send to recipient if active
        if (newMessage.recipient !== 'public' && activeClients.has(newMessage.recipient)) {
          activeClients.get(newMessage.recipient).send(payload);
        }

        // Send back to sender to confirm sync
        if (activeClients.has(newMessage.sender)) {
          activeClients.get(newMessage.sender).send(payload);
        }
      }
    } catch (err) {
      console.error("[WS] Error processing message:", err);
    }
  });

  ws.on('close', () => {
    if (currentUsername) {
      activeClients.delete(currentUsername);
      console.log(`[WS] User disconnected: ${currentUsername}`);
    }
  });
});


// ================= SERVER STARTUP = =================
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT} (HTTP + WebSockets + MongoDB Enabled)`);
});
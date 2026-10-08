import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

// ==========================================
// 1. AWS S3 Client Configuration
// ==========================================
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'eu-north-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
  }
});

const BUCKET_NAME = process.env.AWS_BUCKET_NAME || 'dodix-club-media';

async function uploadBase64ToS3(base64String, folder = 'uploads') {
  if (!base64String || !base64String.startsWith('data:')) {
    return base64String; 
  }

  try {
    const matches = base64String.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      throw new Error('Invalid base64 string format.');
    }

    const mimeType = matches[1];
    const buffer = Buffer.from(matches[2], 'base64');
    
    let extension = 'jpg';
    if (mimeType === 'image/png') extension = 'png';
    else if (mimeType === 'image/webp') extension = 'webp';
    else if (mimeType.includes('video')) extension = 'mp4';

    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${extension}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileName,
      Body: buffer,
      ContentType: mimeType,
    });

    await s3Client.send(command);
    
    const region = process.env.AWS_REGION || 'eu-north-1';
    return `https://${BUCKET_NAME}.s3.${region}.amazonaws.com/${fileName}`;
  } catch (err) {
    console.error('[S3 Upload Error]:', err);
    throw err;
  }
}

// ==========================================
// 2. Mongoose Models & Schemas
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
  activatedAt: { type: Date, default: null }, // Track exact activation time for timers
  wasActivatedBefore: { type: Boolean, default: false },
  isEmailVerified: { type: Boolean, default: true },
  lastSeen: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
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
  status: { type: String, enum: ['pending', 'accepted', 'rejected', 'active'], default: 'pending' },
  approved: { type: Boolean, default: false },
  rejectionReason: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { bufferCommands: false });

const reportSchema = new mongoose.Schema({
  reporter: { type: String, required: true, lowercase: true, trim: true },
  targetUser: { type: String, required: true, lowercase: true, trim: true },
  reason: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
}, { bufferCommands: false });

const messageSchema = new mongoose.Schema({
  sender: { type: String, required: true, lowercase: true, trim: true },
  recipient: { type: String, default: 'public', lowercase: true, trim: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
}, { bufferCommands: false });

const announcementSchema = new mongoose.Schema({
  title: { type: String, required: true },
  text: { type: String, required: true },
  date: { type: String, default: () => new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) },
  createdAt: { type: Date, default: Date.now }
}, { bufferCommands: false });

const User = mongoose.model('User', userSchema);
const Companion = mongoose.model('Companion', companionSchema);
const Report = mongoose.model('Report', reportSchema);
const Message = mongoose.model('Message', messageSchema);
const Announcement = mongoose.model('Announcement', announcementSchema);

// ==========================================
// 3. Helper Functions & Seeding
// ==========================================
async function seedDefaultData() {
  try {
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      const hashedPassword = await bcrypt.hash('password123', 10);
      const defaultAnswerHash = await bcrypt.hash('admin', 10);
      await User.create({
        username: 'admin',
        password: hashedPassword,
        gender: 'Male',
        location: 'Lusaka',
        role: 'admin',
        activated: true,
        activatedAt: new Date(),
        wasActivatedBefore: true,
        isEmailVerified: true,
        securityQuestion: 'What was your first pet’s name?',
        securityAnswerHash: defaultAnswerHash
      });
      console.log('[Database] Seeded default admin into MongoDB.');
    }
  } catch (err) {
    console.error('[Database] Seeding error:', err);
  }
}

// ==========================================
// 4. REST API Endpoints
// ==========================================

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'success', message: 'Server is up and running!' });
});

app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find({}).lean();
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
      if (user.activated) {
        user.wasActivatedBefore = true;
        if (!user.activatedAt) user.activatedAt = new Date(); // Start timer tracking on activation
      }
      await user.save();
      res.json({ success: true, user });
    } else {
      res.json({ success: false, error: "User not found." });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/users/:identifier', async (req, res) => {
  try {
    const cleanId = req.params.identifier.toLowerCase().trim();
    const { location, phone, role, plan, activated, newPassword } = req.body;

    const user = await User.findOne({ 
      $or: [{ username: cleanId }, ...(mongoose.Types.ObjectId.isValid(cleanId) ? [{ _id: cleanId }] : [])] 
    });

    if (!user) return res.status(404).json({ success: false, error: "User not found." });

    if (location !== undefined) user.location = location;
    if (phone !== undefined) user.phone = phone;
    if (role !== undefined) user.role = role;
    if (plan !== undefined) user.plan = plan;
    if (activated !== undefined) {
      user.activated = activated;
      if (activated) {
        user.wasActivatedBefore = true;
        if (!user.activatedAt) user.activatedAt = new Date();
      }
    }
    if (newPassword && newPassword.trim() !== '') {
      user.password = await bcrypt.hash(newPassword.trim(), 10);
    }

    await user.save();
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/users/:identifier', async (req, res) => {
  try {
    const cleanId = req.params.identifier.toLowerCase().trim();
    let result = mongoose.Types.ObjectId.isValid(cleanId) ? await User.findByIdAndDelete(cleanId) : null;
    if (!result) {
      result = await User.findOneAndDelete({ username: cleanId });
    }
    if (!result) return res.status(404).json({ success: false, error: "User not found." });
    res.json({ success: true, message: "User permanently deleted." });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Companions, reports, and announcements routes can remain as configured in your original server setup...

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/dodixclub';

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('[Database] Connected to MongoDB successfully.');
    await seedDefaultData();
    server.listen(PORT, () => {
      console.log(`[Server] Running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('[Database Connection Error]:', err);
  });
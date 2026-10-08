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
        wasActivatedBefore: true,
        isEmailVerified: true,
        securityQuestion: 'What was your first pet’s name?',
        securityAnswerHash: defaultAnswerHash
      });
      console.log('[Database] Seeded default admin into MongoDB.');
    }

    const annCount = await Announcement.countDocuments();
    if (annCount === 0) {
      await Announcement.create([
        { title: 'New Privacy Tool Update', text: 'Automatic watermarking is now active for all uploaded source photographs in Step 1.' },
        { title: 'Weekend Verification Bonus', text: 'Listings verified before Friday midnight receive priority placement on the main catalog.' }
      ]);
      console.log('[Database] Seeded default announcements into MongoDB.');
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
      return res.json({ success: false, error: "All required fields must be filled." });
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
      wasActivatedBefore: false,
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
    const users = await User.find({}).lean();
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get reports count and list for a specific user
app.get('/api/users/:username/reports', async (req, res) => {
  try {
    const cleanUsername = req.params.username.toLowerCase().trim();
    const reports = await Report.find({ targetUser: cleanUsername }).sort({ timestamp: -1 }).lean();
    res.json({ success: true, count: reports.length, reports });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update User Details, Status, or Password Reset Endpoint
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
      if (activated) user.wasActivatedBefore = true;
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

app.post('/api/users/toggle', async (req, res) => {
  try {
    const { username } = req.body;
    const user = await User.findOne({ username: username?.toLowerCase().trim() });
    if (user) {
      user.activated = !user.activated;
      if (user.activated) user.wasActivatedBefore = true;
      await user.save();
      res.json({ success: true, user });
    } else {
      res.json({ success: false, error: "User not found." });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Permanent User Deletion Endpoint
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

// Companions Endpoints
app.get('/api/ladies', async (req, res) => {
  try {
    const { location, category, status, username } = req.query;
    let query = {};

    if (username && typeof username === 'string' && username.trim() !== '') {
      query.username = username.trim().toLowerCase();
    }
    if (location && typeof location === 'string' && location.trim() !== '') {
      query.location = { $regex: new RegExp(location.trim(), 'i') };
    }
    if (category && typeof category === 'string' && category.trim() !== '' && category.toLowerCase() !== 'all') {
      query.category = { $regex: new RegExp(`^${category.trim()}$`, 'i') };
    }
    if (status && status !== 'all') {
      query.status = status;
    }

    const ladies = await Companion.find(query).sort({ createdAt: -1 }).limit(100).lean();
    res.json({ success: true, ladies });
  } catch (err) {
    console.error("[API Ladies Error]:", err);
    res.status(500).json({ success: false, ladies: [], error: err.message });
  }
});

app.post('/api/ladies', async (req, res) => {
  try {
    const profileData = req.body;
    if (!profileData.username || !profileData.phone || !profileData.price) {
      return res.status(400).json({ success: false, error: "Required fields missing." });
    }

    profileData.photo = await uploadBase64ToS3(profileData.photo, 'photos');
    profileData.originalPhoto = await uploadBase64ToS3(profileData.originalPhoto, 'originals');
    profileData.unmaskedPhoto = await uploadBase64ToS3(profileData.unmaskedPhoto, 'unmasked');
    profileData.verificationVideoUrl = await uploadBase64ToS3(profileData.verificationVideoUrl, 'videos');

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
    console.error('[API Ladies Create Error]:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/ladies/:identifier/approve', async (req, res) => {
  try {
    const cleanId = req.params.identifier.toLowerCase().trim();
    let companion = mongoose.Types.ObjectId.isValid(cleanId) ? await Companion.findById(cleanId) : null;
    if (!companion) {
      companion = await Companion.findOne({ $or: [{ username: cleanId }, { name: cleanId }] });
    }

    if (!companion) return res.status(404).json({ success: false, error: "Companion profile not found." });

    companion.status = 'active';
    companion.approved = true;
    companion.rejectionReason = '';
    companion.updatedAt = new Date();
    await companion.save();

    res.json({ success: true, companion });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/ladies/:identifier/reject', async (req, res) => {
  try {
    const cleanId = req.params.identifier.toLowerCase().trim();
    const { reason } = req.body;

    let companion = mongoose.Types.ObjectId.isValid(cleanId) ? await Companion.findById(cleanId) : null;
    if (!companion) {
      companion = await Companion.findOne({ $or: [{ username: cleanId }, { name: cleanId }] });
    }

    if (!companion) return res.status(404).json({ success: false, error: "Companion profile not found." });

    companion.status = 'rejected';
    companion.approved = false;
    companion.rejectionReason = reason || 'Listing guidelines not met.';
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

    if (!companion) return res.status(404).json({ success: false, error: "Companion not found." });

    companion.price = price;
    companion.updatedAt = new Date();
    await companion.save();

    res.json({ success: true, companion });
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

// Announcements Endpoints
app.get('/api/announcements', async (req, res) => {
  try {
    const announcements = await Announcement.find({}).sort({ createdAt: -1 }).limit(10).lean();
    res.json({ success: true, announcements });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/announcements', async (req, res) => {
  try {
    const { title, text } = req.body;
    if (!title || !text) {
      return res.status(400).json({ success: false, error: "Title and text are required." });
    }
    const newAnnouncement = new Announcement({ title, text });
    await newAnnouncement.save();
    res.json({ success: true, announcement: newAnnouncement });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Messages & Reports
app.get('/api/reports', async (req, res) => {
  try {
    const reports = await Report.find({}).sort({ timestamp: -1 }).limit(100).lean();
    res.json({ success: true, reports });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/reports', async (req, res) => {
  try {
    const { reporter, targetUser, reason } = req.body;
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

app.get('/api/messages', async (req, res) => {
  try {
    const messages = await Message.find({}).sort({ timestamp: 1 }).limit(200).lean();
    res.json({ success: true, messages });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 5. Socket.io
// ==========================================
io.on('connection', (socket) => {
  socket.on('send-message', async (data) => {
    try {
      const { sender, recipient, content } = data;
      if (!sender || !content) return;
      const newMessage = new Message({
        sender: sender.toLowerCase().trim(),
        recipient: recipient ? recipient.toLowerCase().trim() : 'public',
        content,
        timestamp: new Date()
      });
      await newMessage.save();
      io.emit('receive-message', newMessage);
    } catch (err) {
      console.error('[Socket Error]:', err);
    }
  });
});

// ==========================================
// 6. Server Initialization
// ==========================================
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
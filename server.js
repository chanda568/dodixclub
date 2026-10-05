// server.js
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

dotenv.config();

const app = express();

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));
app.use(cors());

const server = createServer(app);
const wss = new WebSocketServer({ server });

// ==========================================
// 0. AWS S3 Client Configuration
// ==========================================
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'eu-north-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
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
      throw new Error('Invalid base64 string format');
    }

    const mimeType = matches[1];
    const buffer = Buffer.from(matches[2], 'base64');
    
    let extension = 'jpg';
    if (mimeType === 'image/png') extension = 'png';
    else if (mimeType === 'image/webp') extension = 'webp';
    else if (mimeType === 'video/mp4' || mimeType.includes('video')) extension = 'mp4';

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

// ==========================================
// 2. Express REST API Routes
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
      await user.save();
      res.json({ success: true, user });
    } else {
      res.json({ success: false, error: "User not found." });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Companions / Ads Routes
app.get('/api/ladies', async (req, res) => {
  try {
    const { location, category, status } = req.query;
    let query = {};

    if (location && typeof location === 'string' && location.trim() !== '') {
      query.location = { $regex: new RegExp(location.trim(), 'i') };
    }
    if (category && typeof category === 'string' && category.trim() !== '' && category.toLowerCase() !== 'all') {
      query.category = { $regex: new RegExp(`^${category.trim()}$`, 'i') };
    }
    if (status && status !== 'all') {
      query.status = status;
    }

    const ladies = await Companion.find(query).limit(100).maxTimeMS(5000).lean();
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
      return res.json({ success: false, error: "Required fields missing." });
    }

    const uploadedPhoto = await uploadBase64ToS3(profileData.photo, 'photos');
    const uploadedOriginalPhoto = await uploadBase64ToS3(profileData.originalPhoto, 'originals');
    const uploadedUnmaskedPhoto = await uploadBase64ToS3(profileData.unmaskedPhoto, 'unmasked');
    const uploadedVerificationVideo = await uploadBase64ToS3(profileData.verificationVideoUrl, 'videos');

    const newCompanionAd = new Companion({
      ...profileData,
      photo: uploadedPhoto,
      originalPhoto: uploadedOriginalPhoto,
      unmaskedPhoto: uploadedUnmaskedPhoto,
      verificationVideoUrl: uploadedVerificationVideo,
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

// Private Verification Video Upload Endpoint
app.post('/api/ladies/:identifier/upload-video', async (req, res) => {
  try {
    const cleanId = req.params.identifier.toLowerCase().trim();
    const { videoBase64, videoName } = req.body;

    if (!videoBase64) {
      return res.status(400).json({ success: false, error: 'Video data is required.' });
    }

    let companion = mongoose.Types.ObjectId.isValid(cleanId) ? await Companion.findById(cleanId) : null;
    if (!companion) {
      companion = await Companion.findOne({ $or: [{ username: cleanId }, { name: cleanId }] });
    }

    if (!companion) {
      return res.status(404).json({ success: false, error: 'Companion profile not found.' });
    }

    const uploadedVideoUrl = await uploadBase64ToS3(videoBase64, 'verification-videos');

    companion.verificationVideoUrl = uploadedVideoUrl;
    if (videoName) companion.verificationVideoName = videoName;
    companion.updatedAt = new Date();
    await companion.save();

    res.json({ success: true, verificationVideoUrl: uploadedVideoUrl, companion });
  } catch (err) {
    console.error('[API Video Upload Error]:', err);
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
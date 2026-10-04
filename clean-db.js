import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function cleanDocs() {
  try {
    await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
    console.log('[Database] Connected. Cleaning heavy image fields...');
    
    // Clear out heavy base64 strings causing the Atlas timeout
    const result = await mongoose.connection.collection('companions').updateMany(
      {}, 
      { $set: { photo: '', originalPhoto: '', unmaskedPhoto: '', verificationVideoUrl: '' } }
    );
    
    console.log(`[Success] Cleared heavy fields in ${result.modifiedCount} documents.`);
    process.exit(0);
  } catch (err) {
    console.error('[Error]:', err);
    process.exit(1);
  }
}

cleanDocs();
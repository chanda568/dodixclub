// src/utils/storageEncryption.js
import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = 'dodix_secret_encryption_key_zambia';

export function encryptStorageData(data) {
  try {
    return CryptoJS.AES.encrypt(JSON.stringify(data), ENCRYPTION_KEY).toString();
  } catch (e) {
    console.error("Encryption error:", e);
    return JSON.stringify(data);
  }
}

export function decryptStorageData(ciphertext, fallbackData = []) {
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
    const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
    if (!decryptedString) return fallbackData;
    return JSON.parse(decryptedString);
  } catch (e) {
    try {
      return JSON.parse(ciphertext);
    } catch (err) {
      return fallbackData;
    }
  }
}
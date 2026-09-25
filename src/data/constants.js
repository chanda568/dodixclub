// src/data/constants.js
export const LOGO_URL = "/logo.jpg";

export const ZAMBIAN_LOCATIONS = [
  "Kabwe", 
  "Kitwe", 
  "Lusaka", 
  "Mongu", 
  "Solwezi", 
  "Chipata – Eastern Province", 
  "Kasama", 
  "Ndola", 
  "Kalulushi", 
  "Kafue", 
  "Chingola", 
  "Monze", 
  "Mpika", 
  "Chililabombwe"
];

export const DEFAULT_USERS_DB = [
  {
    username: 'admin',
    role: 'admin',
    gender: 'N/A',
    location: 'Lusaka',
    requestedPackage: 'None',
    activated: true,
    createdAt: new Date().toISOString(),
    expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    username: 'client1',
    role: 'client',
    gender: 'Male',
    location: 'Lusaka',
    requestedPackage: '7 Days Package',
    activated: true,
    createdAt: new Date().toISOString(),
    expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  }
];

export const DEFAULT_LADIES_DB = [
  {
    id: 1,
    name: 'Chipo',
    category: 'VIP',
    price: 1500,
    location: 'Lusaka',
    specificLocation: 'Roma',
    phone: '260970000000',
    photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=500',
    hosting: 'Yes',
    extraServices: 'VIP Companion, Dinner Date',
    age: '23',
    approved: true
  }
];

export const DEFAULT_MESSAGES_DB = [];
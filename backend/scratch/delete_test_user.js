'use strict';

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User.model');

async function deleteUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const email = 'munozalbelonicolas@gmail.com';
    const result = await User.deleteMany({ email: email.toLowerCase() });

    console.log(`Deleted ${result.deletedCount} users with email ${email}`);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

deleteUser();

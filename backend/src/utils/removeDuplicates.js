import User from '../models/User.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const removeDuplicateStaff = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/billing_system');
    console.log('✓ Connected to MongoDB\n');

    // Find all users
    const allUsers = await User.find({});
    console.log('=== ALL USERS IN DATABASE ===');
    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.role.toUpperCase()} - ${user.name} (${user.username}) - ID: ${user._id}`);
    });
    console.log('\n');

    // Find all staff users
    const staffUsers = await User.find({ role: 'staff' });
    console.log(`Found ${staffUsers.length} staff user(s)\n`);

    if (staffUsers.length > 1) {
      // Keep the first one, delete the rest
      const toKeep = staffUsers[0];
      const toDelete = staffUsers.slice(1);

      console.log(`✓ Keeping: ${toKeep.name} (${toKeep.username}) - ID: ${toKeep._id}`);
      console.log(`✗ Deleting ${toDelete.length} duplicate staff user(s)...\n`);

      for (const user of toDelete) {
        await User.findByIdAndDelete(user._id);
        console.log(`  ✗ Deleted: ${user.name} (${user.username}) - ID: ${user._id}`);
      }

      console.log('\n✓ Duplicate removal completed!');
    } else if (staffUsers.length === 1) {
      console.log('✓ No duplicates found - only one staff user exists');
    } else {
      console.log('⚠ No staff users found in database');
    }

    // Show remaining users
    const remainingUsers = await User.find({});
    console.log('\n=== REMAINING USERS ===');
    remainingUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.role.toUpperCase()} - ${user.name} (${user.username})`);
    });

    await mongoose.connection.close();
    console.log('\n✓ Database connection closed');
  } catch (error) {
    console.error('✗ Error:', error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
};

removeDuplicateStaff();

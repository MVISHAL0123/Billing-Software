import User from '../models/User.js';

// Seed initial users (admin and staff)
export const seedUsers = async () => {
  try {
    const adminExists = await User.findByUsername('admin');
    const staffExists = await User.findByUsername('staff');

    if (!adminExists) {
      const admin = new User({
        username: 'admin',
        password: 'admin123', // In production, this should be hashed
        name: 'Admin User',
        role: 'admin'
      });
      await admin.save();
      console.log('Admin user created');
    }

    if (!staffExists) {
      const staff = new User({
        username: 'staff',
        password: 'staff123', // In production, this should be hashed
        name: 'Staff User',
        role: 'staff'
      });
      await staff.save();
      console.log('Staff user created');
    }

    console.log('User seeding completed');
  } catch (error) {
    console.error('Error seeding users:', error);
  }
};

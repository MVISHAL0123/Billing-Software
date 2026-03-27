import User from '../models/User.js';

export const seedUsers = async () => {
  try {
    console.log('🌱 Starting user seeding...');
    
    const adminExists = await User.findByUsername('admin');
    console.log('Check admin:', adminExists ? '✅ Exists' : '❌ Missing');
    
    const staffExists = await User.findByUsername('staff');
    console.log('Check staff:', staffExists ? '✅ Exists' : '❌ Missing');
    
    const demoExists = await User.findByUsername('demo');
    console.log('Check demo:', demoExists ? '✅ Exists' : '❌ Missing');

    if (!adminExists) {
      console.log('Creating admin user...');
      const admin = new User({
        username: 'admin',
        password: 'admin123', // In production, this should be hashed
        name: 'Admin User',
        role: 'admin'
      });
      await admin.save();
      console.log('✅ Admin user created');
    }

    if (!staffExists) {
      console.log('Creating staff user...');
      const staff = new User({
        username: 'staff',
        password: 'staff123', // In production, this should be hashed
        name: 'Staff User',
        role: 'staff'
      });
      await staff.save();
      console.log('✅ Staff user created');
    }

    if (!demoExists) {
      console.log('Creating demo user...');
      const demo = new User({
        username: 'demo',
        password: 'demo123', // Demo credentials for testing
        name: 'Demo Admin',
        role: 'admin'
      });
      await demo.save();
      console.log('✅ Demo user created');
    }

    console.log('✅ User seeding completed');
  } catch (error) {
    console.error('❌ Error seeding users:', error.message);
  }
};

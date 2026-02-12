import User from '../models/User.js';
import jwt from 'jsonwebtoken';

export const login = async (req, res) => {
  try {
    const { username, password, role } = req.body;

    if (!username || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Username, password, and role are required'
      });
    }

    // Find user in database
    const user = await User.findOne([
      { field: 'username', operator: '==', value: username },
      { field: 'role', operator: '==', value: role }
    ]);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: `Invalid ${role} credentials`
      });
    }

    // Check password (in production, use bcrypt to compare hashed passwords)
    if (user.password !== password) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id,
        username: user.username,
        role: user.role 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    // Return user data with token
    const userData = {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      token: token
    };

    res.status(200).json({
      success: true,
      message: `Login successful as ${role}`,
      user: userData
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

export const register = async (req, res) => {
  try {
    const { username, password, name, role } = req.body;

    if (!username || !password || !name || !role) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Check if user already exists
    const existingUser = await User.findByUsername(username);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Username already exists'
      });
    }

    // Create new user (in production, hash the password with bcrypt)
    const newUser = new User({
      username,
      password, // Should be hashed in production
      name,
      role
    });

    const savedUser = await newUser.save();

    const userData = {
      id: savedUser.id,
      username: savedUser.username,
      name: savedUser.name,
      role: savedUser.role,
      token: `${role}-jwt-token-` + Date.now()
    };

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      user: userData
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { currentPassword, username, newPassword } = req.body;

    // Get user ID from token
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'No authorization token provided'
      });
    }

    // Decode JWT token to get user info
    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    if (!currentPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password is required'
      });
    }

    if (!username) {
      return res.status(400).json({
        success: false,
        message: 'Username is required'
      });
    }

    // Find user by ID from token
    const foundUser = await User.findById(decoded.userId);

    if (!foundUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    if (foundUser.password !== currentPassword) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update username if it's different
    if (username !== foundUser.username) {
      // Check if new username already exists
      const existingUser = await User.findOne([
        { field: 'username', operator: '==', value: username },
        { field: 'role', operator: '==', value: foundUser.role }
      ]);
      if (existingUser && existingUser.id !== foundUser.id) {
        return res.status(400).json({
          success: false,
          message: 'Username already taken'
        });
      }
      foundUser.username = username;
    }

    // Update password if provided
    if (newPassword) {
      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 6 characters'
        });
      }
      foundUser.password = newPassword; // Should be hashed in production
    }

    const savedUser = await foundUser.save();

    const userData = {
      id: savedUser.id,
      username: savedUser.username,
      name: savedUser.name,
      role: savedUser.role
    };

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: userData
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

export const getStaffUsers = async (req, res) => {
  try {
    // Verify admin access
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'No authorization token provided'
      });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    if (decoded.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    // Get all staff users
    const staffUsers = await User.findAll();
    const filteredStaff = staffUsers.filter(user => user.role === 'staff').map(user => {
      const userData = user.toJSON();
      delete userData.password;
      return userData;
    });

    res.status(200).json({
      success: true,
      users: filteredStaff
    });

  } catch (error) {
    console.error('Get staff users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

export const updateStaff = async (req, res) => {
  try {
    const { staffId, username, password } = req.body;

    // Verify admin access
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'No authorization token provided'
      });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    if (decoded.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    if (!staffId) {
      return res.status(400).json({
        success: false,
        message: 'Staff ID is required'
      });
    }

    // Find staff user
    const staffUser = await User.findById(staffId);

    if (!staffUser || staffUser.role !== 'staff') {
      return res.status(404).json({
        success: false,
        message: 'Staff user not found'
      });
    }

    // Update username if provided and different
    if (username && username !== staffUser.username) {
      // Check if new username already exists
      const existingUser = await User.findOne([
        { field: 'username', operator: '==', value: username },
        { field: 'role', operator: '==', value: 'staff' }
      ]);
      if (existingUser && existingUser.id !== staffId) {
        return res.status(400).json({
          success: false,
          message: 'Username already taken'
        });
      }
      staffUser.username = username;
    }

    // Update password if provided
    if (password && password.trim() !== '') {
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 6 characters'
        });
      }
      staffUser.password = password; // Should be hashed in production
    }

    const savedStaff = await staffUser.save();

    const userData = {
      id: savedStaff.id,
      username: savedStaff.username,
      name: savedStaff.name,
      role: savedStaff.role
    };

    res.status(200).json({
      success: true,
      message: 'Staff updated successfully',
      user: userData
    });

  } catch (error) {
    console.error('Update staff error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};



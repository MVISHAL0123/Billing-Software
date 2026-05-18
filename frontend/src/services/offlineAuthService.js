/**
 * Offline Authentication Service
 * Uses IndexedDB for user management instead of API
 */

import { indexedDBService } from './indexedDBService';

// Default demo users
const DEFAULT_USERS = [
  {
    id: 'admin-001',
    username: 'admin',
    password: 'admin123',
    name: 'Admin User',
    email: 'admin@mmk.com',
    role: 'admin'
  },
  {
    id: 'staff-001',
    username: 'staff',
    password: 'staff123',
    name: 'Staff User',
    email: 'staff@mmk.com',
    role: 'staff'
  },
  {
    id: 'demo-001',
    username: 'demo',
    password: 'demo123',
    name: 'Demo Admin',
    email: 'demo@mmk.com',
    role: 'admin'
  }
];

export const offlineAuthService = {
  /**
   * Initialize default users if none exist
   */
  async initializeDefaultUsers() {
    try {
      const users = await indexedDBService.getAllUsers();
      if (users.length === 0) {
        console.log('🌱 Initializing default users...');
        for (const user of DEFAULT_USERS) {
          await indexedDBService.addUser(user);
        }
        console.log('✅ Default users created');
      }
    } catch (error) {
      console.error('Error initializing users:', error);
    }
  },

  /**
   * Login with username and password
   */
  async login(username, password, role) {
    try {
      // Find user by username
      const user = await indexedDBService.findUserByUsername(username);

      if (!user) {
        return {
          success: false,
          message: 'User not found'
        };
      }

      // Check password
      if (user.password !== password) {
        return {
          success: false,
          message: 'Invalid password'
        };
      }

      // Check role if specified
      if (role && user.role !== role) {
        return {
          success: false,
          message: `User role mismatch. Expected ${role}, got ${user.role}`
        };
      }

      // Create session
      const sessionUser = {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        token: this.generateToken(user.id)
      };

      // Store in localStorage
      localStorage.setItem('user', JSON.stringify(sessionUser));
      localStorage.setItem('token', sessionUser.token);
      localStorage.setItem('isOfflineMode', 'true');

      console.log(`✅ ${user.role} logged in: ${user.username}`);
      return { success: true, user: sessionUser };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: error.message };
    }
  },

  /**
   * Logout
   */
  async logout() {
    try {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('isOfflineMode');
      console.log('✅ User logged out');
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, message: error.message };
    }
  },

  /**
   * Get current user from localStorage
   */
  getCurrentUser() {
    try {
      const userJson = localStorage.getItem('user');
      return userJson ? JSON.parse(userJson) : null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  },

  /**
   * Get auth token
   */
  getToken() {
    return localStorage.getItem('token');
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return !!this.getToken();
  },

  /**
   * Update user profile
   */
  async updateProfile(username, newUsername, newPassword) {
    try {
      const user = await indexedDBService.findUserByUsername(username);

      if (!user) {
        return { success: false, message: 'User not found' };
      }

      // Update username
      if (newUsername && newUsername !== username) {
        const existingUser = await indexedDBService.findUserByUsername(newUsername);
        if (existingUser && existingUser.id !== user.id) {
          return { success: false, message: 'Username already taken' };
        }
        user.username = newUsername;
      }

      // Update password
      if (newPassword) {
        if (newPassword.length < 6) {
          return { success: false, message: 'Password must be at least 6 characters' };
        }
        user.password = newPassword;
      }

      // Save updated user
      await indexedDBService.addUser(user);

      // Update localStorage session
      const currentUser = this.getCurrentUser();
      if (currentUser && currentUser.id === user.id) {
        currentUser.username = user.username;
        localStorage.setItem('user', JSON.stringify(currentUser));
      }

      console.log('✅ Profile updated for user:', user.username);
      return { success: true, message: 'Profile updated successfully', user };
    } catch (error) {
      console.error('Profile update error:', error);
      return { success: false, message: error.message };
    }
  },

  /**
   * Get all staff users (for admin)
   */
  async getStaffUsers() {
    try {
      const users = await indexedDBService.getAllUsers();
      return users.filter(user => user.role === 'staff');
    } catch (error) {
      console.error('Error fetching staff users:', error);
      return [];
    }
  },

  /**
   * Update staff user (admin only)
   */
  async updateStaffUser(staffId, newUsername, newPassword) {
    try {
      const user = await indexedDBService.get('users', staffId);

      if (!user) {
        return { success: false, message: 'Staff user not found' };
      }

      if (user.role !== 'staff') {
        return { success: false, message: 'User is not a staff member' };
      }

      // Update username
      if (newUsername && newUsername !== user.username) {
        const existingUser = await indexedDBService.findUserByUsername(newUsername);
        if (existingUser && existingUser.id !== user.id) {
          return { success: false, message: 'Username already taken' };
        }
        user.username = newUsername;
      }

      // Update password
      if (newPassword) {
        if (newPassword.length < 6) {
          return { success: false, message: 'Password must be at least 6 characters' };
        }
        user.password = newPassword;
      }

      // Save updated user
      await indexedDBService.addUser(user);

      console.log('✅ Staff user updated:', user.username);
      return { success: true, message: 'Staff user updated successfully', user };
    } catch (error) {
      console.error('Staff update error:', error);
      return { success: false, message: error.message };
    }
  },

  /**
   * Register new staff user (admin only)
   */
  async registerStaffUser(username, password, name, email) {
    try {
      // Check if username exists
      const existingUser = await indexedDBService.findUserByUsername(username);
      if (existingUser) {
        return { success: false, message: 'Username already exists' };
      }

      if (password.length < 6) {
        return { success: false, message: 'Password must be at least 6 characters' };
      }

      // Create new staff user
      const newUser = {
        id: `staff-${Date.now()}`,
        username,
        password,
        name,
        email,
        role: 'staff'
      };

      await indexedDBService.addUser(newUser);

      console.log('✅ Staff user registered:', username);
      return { success: true, message: 'Staff user registered successfully', user: newUser };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, message: error.message };
    }
  },

  /**
   * Generate simple token (for demo - in production use JWT)
   */
  generateToken(userId) {
    return `offline-token-${userId}-${Date.now()}`;
  }
};

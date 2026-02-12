import firebaseService from '../services/firebaseService.js';

class User {
  constructor(data = {}) {
    this.id = data.id || null;
    this.username = data.username || '';
    this.password = data.password || '';
    this.name = data.name || '';
    this.role = data.role || 'staff';
    this.createdAt = data.createdAt || null;
    this.updatedAt = data.updatedAt || null;
  }

  static collection = 'users';

  // Validate user data
  validate() {
    const errors = [];
    
    if (!this.username || this.username.trim() === '') {
      errors.push('Username is required');
    }
    
    if (!this.password || this.password.trim() === '') {
      errors.push('Password is required');
    }
    
    if (!this.name || this.name.trim() === '') {
      errors.push('Name is required');
    }
    
    if (!['admin', 'staff'].includes(this.role)) {
      errors.push('Role must be either admin or staff');
    }
    
    return errors;
  }

  // Save user to Firestore
  async save() {
    const errors = this.validate();
    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }

    const userData = {
      username: this.username.trim(),
      password: this.password,
      name: this.name.trim(),
      role: this.role
    };

    if (this.id) {
      // Update existing user
      const updated = await firebaseService.update(User.collection, this.id, userData);
      return new User(updated);
    } else {
      // Create new user
      const created = await firebaseService.create(User.collection, userData);
      return new User(created);
    }
  }

  // Static methods
  static async findById(id) {
    const userData = await firebaseService.findById(User.collection, id);
    return userData ? new User(userData) : null;
  }

  static async findAll() {
    const users = await firebaseService.findAll(User.collection);
    return users.map(user => new User(user));
  }

  static async findOne(filters = []) {
    const userData = await firebaseService.findOne(User.collection, filters);
    return userData ? new User(userData) : null;
  }

  static async findByUsername(username) {
    return await User.findOne([{ field: 'username', operator: '==', value: username }]);
  }

  static async deleteById(id) {
    return await firebaseService.delete(User.collection, id);
  }

  // Instance methods
  toJSON() {
    return {
      id: this.id,
      username: this.username,
      name: this.name,
      role: this.role,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

export default User;

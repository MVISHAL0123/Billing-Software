import { auth, db } from '../config/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, signInAnonymously } from 'firebase/auth';
import { collection, query, where, getDocs, setDoc, doc, getDoc } from 'firebase/firestore';

// Demo user for testing
const DEMO_USER = {
  uid: 'demo-user-123',
  email: 'demo@mmk.com',
  name: 'Demo Admin',
  role: 'admin',
  username: 'demo',
  token: 'demo-token-123'
};

export const authService = {
  login: async (username, password, role) => {
    try {
      // Demo login (for testing without backend)
      if (username.toLowerCase() === 'demo' && password === 'demo123') {
        // Sign in anonymously to get Firestore permission
        try {
          await signInAnonymously(auth);
        } catch (e) {
          console.warn('Could not sign in anonymously:', e);
        }
        
        localStorage.setItem('user', JSON.stringify(DEMO_USER));
        localStorage.setItem('token', DEMO_USER.token);
        localStorage.setItem('isDemo', 'true');
        return { success: true, user: DEMO_USER };
      }

      // Try logging in with email
      let email = username;
      
      // If username doesn't contain @, try to find the user in Firestore
      if (!username.includes('@')) {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('username', '==', username));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
          return { 
            success: false, 
            message: 'User not found. Try: demo / demo123' 
          };
        }
        
        const userData = querySnapshot.docs[0].data();
        email = userData.email;
      }

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Get user details from Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.exists() ? userDoc.data() : {};

      const userObj = {
        uid: user.uid,
        email: user.email,
        name: userData.name || user.displayName || 'User',
        role: userData.role || role || 'user',
        username: userData.username || user.email.split('@')[0],
        token: await user.getIdToken()
      };

      localStorage.setItem('user', JSON.stringify(userObj));
      localStorage.setItem('token', userObj.token);
      localStorage.setItem('isDemo', 'false');
      
      return { success: true, user: userObj };
    } catch (error) {
      console.error('Login error:', error.code, error.message);
      
      // User-friendly error messages
      let message = 'Failed to login';
      if (error.code === 'auth/user-not-found') {
        message = 'Email not found. Try: demo@mmk.com';
      } else if (error.code === 'auth/wrong-password') {
        message = 'Wrong password';
      } else if (error.code === 'auth/invalid-email') {
        message = 'Invalid email address';
      } else if (error.code === 'auth/too-many-requests') {
        message = 'Too many login attempts. Try again later.';
      }
      
      return { success: false, message };
    }
  },

  register: async (name, email, password) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Save user details to Firestore
      const userObj = {
        uid: user.uid,
        email: email,
        name: name,
        username: email.split('@')[0],
        role: 'user',
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'users', user.uid), userObj);
      
      const token = await user.getIdToken();
      userObj.token = token;

      localStorage.setItem('user', JSON.stringify(userObj));
      localStorage.setItem('token', token);
      
      return { success: true, user: userObj };
    } catch (error) {
      console.error('Register error:', error);
      return { success: false, message: error.message || 'Failed to register' };
    }
  },

  logout: () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  updateCurrentUser: (updatedUser) => {
    const currentUser = authService.getCurrentUser();
    const newUser = { ...currentUser, ...updatedUser };
    localStorage.setItem('user', JSON.stringify(newUser));
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  }
};

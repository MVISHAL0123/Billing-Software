import { auth, db } from '../config/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, query, where, getDocs, setDoc, doc } from 'firebase/firestore';

export const authService = {
  login: async (username, password, role) => {
    try {
      // Try logging in with email
      let email = username;
      
      // If username doesn't contain @, try to find the user in Firestore
      if (!username.includes('@')) {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('username', '==', username));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
          return { success: false, message: 'User not found' };
        }
        
        const userData = querySnapshot.docs[0].data();
        email = userData.email;
      }

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Get user details from Firestore
      const userDoc = await getDocs(query(collection(db, 'users'), where('email', '==', user.email)));
      const userData = userDoc.docs[0]?.data() || {};

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
      
      return { success: true, user: userObj };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: error.message || 'Failed to login' };
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

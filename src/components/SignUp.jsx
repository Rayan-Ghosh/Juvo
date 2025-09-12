import React, { useState } from 'react';
import { User, Mail, Lock } from 'lucide-react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../firebase'; // Make sure the path to your firebase.js is correct

export default function SignUp({ onSwitchToSignIn }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    if (!fullName || !email || !password) {
      setError("Please fill in all fields.");
      setLoading(false);
      return;
    }

    try {
      // 1. Create the user with email and password
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Update the user's profile with their full name
      await updateProfile(user, {
        displayName: fullName
      });
      
      console.log('User created and profile updated:', user);
      // No need to call onSignUp() here. The onAuthStateChanged listener in App.jsx will handle the UI switch.
      
    } catch (err) {
      // Provide a user-friendly error message
      setError(err.message.replace('Firebase: ', ''));
      console.error("Error signing up:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signin-page">
      <div className="signin-card">
        <div className="signin-header">
          <img src="logo.png" alt="Juvo Logo" className="logo" />
          <h2>Create an Account</h2>
          <p>Join Juvo to start your journey to a better well-being.</p>
        </div>
        <form className="signin-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <User className="input-icon" />
            <input 
              type="text" 
              placeholder="Full Name" 
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required 
            />
          </div>
          <div className="input-group">
            <Mail className="input-icon" />
            <input 
              type="email" 
              placeholder="Email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
          </div>
          <div className="input-group">
            <Lock className="input-icon" />
            <input 
              type="password" 
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>
          
          {error && <p className="error-message" style={{color: 'red', fontSize: '0.9em', textAlign: 'center'}}>{error}</p>}

          <button type="submit" className="button primary signin-button" disabled={loading}>
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>
        <p className="auth-switch">
          Already have an account? <a href="#" onClick={onSwitchToSignIn}>Sign In</a>
        </p>
      </div>
    </div>
  );
}
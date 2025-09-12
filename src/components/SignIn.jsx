import React, { useState } from 'react';
import { Mail, Lock } from 'lucide-react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase'; // Make sure the path to your firebase.js is correct

export default function SignIn({ onSwitchToSignUp }) {
  // Initialize state with the default values from your original code
  const [email, setEmail] = useState('aditya@gmail.com');
  const [password, setPassword] = useState('password');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Successful sign-in will be handled by the onAuthStateChanged listener in App.jsx
      console.log('User signed in successfully!');

    } catch (err) {
      // Handle specific errors for better user feedback
      if (err.code === 'auth/invalid-credential') {
        setError('Invalid email or password. Please try again.');
      } else {
        setError(err.message.replace('Firebase: ', ''));
      }
      console.error("Error signing in:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signin-page">
      <div className="signin-card">
        <div className="signin-header">
          <img src="logo.png" alt="Juvo Logo" className="logo" />
          <h2>Welcome to Juvo</h2>
          <p>Please sign in to access your dashboard.</p>
        </div>
        <form className="signin-form" onSubmit={handleSubmit}>
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
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
        <p className="auth-switch">
          Don't have an account? <a href="#" onClick={onSwitchToSignUp}>Sign Up</a>
        </p>
      </div>
    </div>
  );
}
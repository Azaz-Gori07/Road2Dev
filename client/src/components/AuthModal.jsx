import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const AuthModal = ({ isOpen, onClose, onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Connect to auth API
    console.log('Login submitted', { email, password });
    onLoginSuccess();
  };

  const variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="auth-modal-overlay">
          <motion.div 
            className="auth-modal"
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={variants}
            transition={{ duration: 0.3 }}
          >
            <button className="close-btn" onClick={onClose}>×</button>
            <h2>{isLogin ? 'Login' : 'Register'}</h2>
            
            <form onSubmit={handleSubmit}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                required
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
              />
              <button type="submit">{isLogin ? 'Login' : 'Register'}</button>
            </form>
            
            <div className="auth-toggle">
              {isLogin ? (
                <p>Don't have an account? <button onClick={() => setIsLogin(false)}>Register</button></p>
              ) : (
                <p>Already have an account? <button onClick={() => setIsLogin(true)}>Login</button></p>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AuthModal;
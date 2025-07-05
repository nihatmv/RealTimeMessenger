import React, { useState } from 'react';
import '../style.css';
import { Link, useNavigate } from 'react-router-dom';
import { UserAuth } from '../context/AuthContext';

const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { signUpNewUser } = UserAuth();
  const navigate = useNavigate();

  const handleSignUp = async (e) => {
    e.preventDefault();

    // Check if fields are empty
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await signUpNewUser(email, password);

      if (result.success) {
        // Use replace: true to replace current history entry
        navigate('/dashboard', { replace: true });
      } else {
        // Handle signup errors
        setError(result.error || 'Failed to create account');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const validateEmail = (email) => {
    if (!email.trim()) {
      setEmailError('Email is required');
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Please enter a valid email');
    } else {
      setEmailError('');
    }
  };

  const validatePassword = (password) => {
    if (!password.trim()) {
      setPasswordError('Password is required');
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
    } else {
      setPasswordError('');
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-black to-purple-200">
      <form
        onSubmit={handleSignUp}
        className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md"
      >
        <h2 className="text-3xl font-bold text-center mb-6">Signup Form</h2>
        <div className="flex mb-6 bg-gray-100 rounded-full p-1">
          <button
            type="button"
            className="w-1/2 py-2 rounded-full text-black font-semibold focus:outline-none"
            onClick={() => navigate('/signin')}
          >
            Login
          </button>
          <button
            type="button"
            className="w-1/2 py-2 rounded-full bg-gradient-to-r from-blue-500 to-blue-700 text-white font-semibold shadow focus:outline-none"
          >
            Signup
          </button>
        </div>
        <div className="flex flex-col py-4">
          <div className="mb-4">
            <input
              onChange={(e) => {
                setEmail(e.target.value);
                validateEmail(e.target.value);
              }}
              onBlur={(e) => validateEmail(e.target.value)}
              value={email}
              placeholder="Email Address"
              className={`w-full p-3 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 ${emailError ? 'border-red-500' : ''}`}
              type="email"
              maxLength={50}
            />
            <div className="text-xs text-gray-500 text-right mt-1">
              {email.length}/50
            </div>
            {emailError && (
              <p className="text-red-500 text-sm mt-1">{emailError}</p>
            )}
          </div>

          <div className="mb-4">
            <div className="relative">
              <input
                onChange={(e) => {
                  setPassword(e.target.value);
                  validatePassword(e.target.value);
                }}
                onBlur={(e) => validatePassword(e.target.value)}
                value={password}
                placeholder="Password"
                type={showPassword ? 'text' : 'password'}
                className={`w-full p-3 pr-10 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 ${passwordError ? 'border-red-500' : ''}`}
                maxLength={40}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                onClick={togglePasswordVisibility}
              >
                {showPassword ? (
                  <span className="text-lg">👁️</span>
                ) : (
                  <span className="text-lg">👁️‍🗨️</span>
                )}
              </button>
            </div>
            <div className="text-xs text-gray-500 text-right mt-1">
              {password.length}/40
            </div>
            {passwordError && (
              <p className="text-red-500 text-sm mt-1">{passwordError}</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-3 mt-2 bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-lg text-lg font-semibold shadow"
          >
            Sign Up
          </button>
          {error && <p className="text-red-600 text-center pt-4">{error}</p>}
        </div>
        <div className="text-center mt-6 text-black">
          Already have an account?{' '}
          <Link
            to="/signin"
            className="text-blue-500 underline hover:text-blue-700 font-medium"
          >
            Login now
          </Link>
        </div>
      </form>
    </div>
  );
};

export default Signup;

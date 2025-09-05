// src/components/Auth/SignupForm.jsx - COMPLETE FIXED VERSION
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Button from '../UI/Button';
import Input from '../UI/Input';
import { useAuth } from '../../context/AuthContext';
import { validateForm } from '../../utils/validation';

const SignupForm = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { register, setPendingVerificationEmail } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validation = validateForm(formData, ['firstName', 'lastName', 'email', 'password', 'confirmPassword']);
    
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrors({ confirmPassword: 'Passwords do not match' });
      return;
    }
    
    if (!acceptTerms) {
      setErrors({ terms: 'You must accept the terms and conditions' });
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const result = await register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password
      });
      
      console.log('Signup result:', result);
      
      if (result && result.success) {
        // Store email for verification process
        setPendingVerificationEmail(formData.email);
        
        // Always redirect to verification page after successful signup
        navigate('/verify-email', { 
          state: { 
            email: formData.email,
            message: 'Account created successfully! Please check your email for verification code.'
          },
          replace: true
        });
      } else {
        setError(result.message || 'Failed to create account. Please try again.');
      }
    } catch (err) {
      console.error('Signup error:', err);
      setError(err.message || 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name] || error) {
      setErrors(prev => ({ ...prev, [name]: '' }));
      setError('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Create your account</h2>
        <p className="mt-2 text-sm text-gray-600">
          Join us and get started today
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="First Name"
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            error={errors.firstName}
            placeholder="First name"
            required
            autoComplete="given-name"
          />
          
          <Input
            label="Last Name"
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            error={errors.lastName}
            placeholder="Last name"
            required
            autoComplete="family-name"
          />
        </div>
        
        <Input
          label="Email"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          error={errors.email}
          placeholder="Enter your email"
          required
          autoComplete="email"
        />
        
        <Input
          label="Password"
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          error={errors.password}
          placeholder="Create a password"
          required
          autoComplete="new-password"
        />
        
        <Input
          label="Confirm Password"
          type="password"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          error={errors.confirmPassword}
          placeholder="Confirm your password"
          required
          autoComplete="new-password"
        />

        <div className="flex items-center">
          <input
            id="accept-terms"
            name="acceptTerms"
            type="checkbox"
            checked={acceptTerms}
            onChange={(e) => {
              setAcceptTerms(e.target.checked);
              if (errors.terms) {
                setErrors(prev => ({ ...prev, terms: '' }));
              }
            }}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="accept-terms" className="ml-2 block text-sm text-gray-900">
            I agree to the{' '}
            <a href="#" className="text-blue-600 hover:text-blue-500">
              Terms and Conditions
            </a>{' '}
            and{' '}
            <a href="#" className="text-blue-600 hover:text-blue-500">
              Privacy Policy
            </a>
          </label>
        </div>
        
        {errors.terms && (
          <p className="text-sm text-red-600">{errors.terms}</p>
        )}

        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
            {error}
          </div>
        )}

        <Button type="submit" loading={loading} className="w-full">
          Create Account
        </Button>
      </form>
    </div>
  );
};

export default SignupForm;

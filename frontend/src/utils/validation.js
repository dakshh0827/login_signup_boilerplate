// src/utils/validation.js - FIXED
import { VALIDATION_RULES, ERROR_MESSAGES } from './constants';

export const validateField = (name, value) => {
  if (!value || !value.trim()) {
    return ERROR_MESSAGES.REQUIRED_FIELD(name);
  }
 
  switch (name.toLowerCase()) {
    case 'email':
      return VALIDATION_RULES.email.test(value) ? '' : ERROR_MESSAGES.INVALID_EMAIL;
    case 'password':
      return VALIDATION_RULES.password.test(value) ? '' : ERROR_MESSAGES.INVALID_PASSWORD;
    case 'firstname':
    case 'lastname':
    case 'name':
      return VALIDATION_RULES.name.test(value) ? '' : ERROR_MESSAGES.INVALID_NAME;
    default:
      return '';
  }
};

export const validateForm = (formData, fields) => {
  const errors = {};
 
  fields.forEach(field => {
    const error = validateField(field, formData[field]);
    if (error) {
      errors[field] = error;
    }
  });
 
  return {
    errors,
    isValid: Object.keys(errors).length === 0
  };
};

export const validateOTP = (otp) => {
  if (!otp || otp.length !== 6 || !/^\d{6}$/.test(otp)) {
    return ERROR_MESSAGES.INVALID_OTP;
  }
  return '';
};
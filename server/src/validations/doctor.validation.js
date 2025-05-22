import { body, param, query } from 'express-validator';

// Validation for adding a new doctor
export const addDoctorValidation = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required'),
  
  body('middleName')
    .trim()
    .notEmpty()
    .withMessage('Middle name is required'),
  
  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Last name is required'),
  
  body('gender')
    .isIn(['male', 'female', 'other'])
    .withMessage('Gender must be male, female, or other'),
  
  body('dateOfBirth')
    .isISO8601()
    .withMessage('Please provide a valid date of birth'),
  
  body('nationalIdFanNumber')
    .trim()
    .notEmpty()
    .withMessage('National ID/FAN number is required'),
  
  body('licenseNumber')
    .trim()
    .notEmpty()
    .withMessage('License number is required'),
  
  body('specialization')
    .trim()
    .notEmpty()
    .withMessage('Specialization is required'),
  
  body('qualifications')
    .isArray()
    .withMessage('Qualifications must be an array')
    .notEmpty()
    .withMessage('At least one qualification is required'),
  
  body('qualifications.*.degree')
    .trim()
    .notEmpty()
    .withMessage('Degree is required'),
  
  body('qualifications.*.institution')
    .trim()
    .notEmpty()
    .withMessage('Institution is required'),
  
  body('qualifications.*.year')
    .trim()
    .notEmpty()
    .withMessage('Year is required'),
  
  body('yearsOfExperience')
    .isInt({ min: 0 })
    .withMessage('Years of experience must be a positive number'),
  
  body('languages')
    .isArray()
    .withMessage('Languages must be an array')
    .notEmpty()
    .withMessage('At least one language is required'),
  
  body('hospitalName')
    .trim()
    .notEmpty()
    .withMessage('Hospital name is required'),
  
  body('phoneNumber')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/)
    .withMessage('Please provide a valid phone number'),
  
  body('consultationFee')
    .isFloat({ min: 0 })
    .withMessage('Consultation fee must be a positive number'),
  
  body('serviceAreas')
    .optional()
    .isString()
    .withMessage('Service areas must be a string'),
  
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Bio must be under 1000 characters')
];

// Validation for updating a doctor
export const updateDoctorValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid doctor ID'),
  
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  
  body('middleName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Middle name must be between 2 and 50 characters'),
  
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  
  body('specialization')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Specialization is required'),
  
  body('qualifications')
    .optional()
    .isArray()
    .withMessage('Qualifications must be an array'),
  
  body('yearsOfExperience')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Years of experience must be a positive number'),
  
  body('languages')
    .optional()
    .isArray()
    .withMessage('Languages must be an array'),
  
  body('hospitalName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Hospital name must be between 2 and 100 characters'),
  
  body('phoneNumber')
    .optional()
    .trim()
    .matches(/^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/)
    .withMessage('Please provide a valid phone number'),
  
  body('consultationFee')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Consultation fee must be a positive number'),
  
  body('serviceAreas')
    .optional()
    .isString()
    .withMessage('Service areas must be a string'),
  
  body('bio')
    .optional()
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Bio must be between 10 and 1000 characters')
];

// Validation for doctor ID parameter
export const doctorIdValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid doctor ID')
];

// Validation for toggling doctor status
export const toggleDoctorStatusValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid doctor ID'),
  
  body('isActive')
    .isBoolean()
    .withMessage('isActive must be a boolean value')
];

// Validation for listing doctors
export const listDoctorsValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('sortBy')
    .optional()
    .isIn(['createdAt', 'firstName', 'lastName', 'specialization'])
    .withMessage('Invalid sort field'),
  
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be either asc or desc')
]; 
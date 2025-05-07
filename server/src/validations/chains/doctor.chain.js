const { body } = require('express-validator');

exports.validateDoctorProfile = [
  body('fullName')
    .notEmpty().withMessage('Full name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Full name must be between 2 and 100 characters'),

  body('specialization')
    .notEmpty().withMessage('Specialization is required')
    .isLength({ min: 3 }).withMessage('Specialization must be at least 3 characters long'),

  body('qualifications')
    .isArray({ min: 1 }).withMessage('At least one qualification is required'),

  body('experience')
    .optional()
    .isInt({ min: 0, max: 100 }).withMessage('Experience must be a number between 0 and 100'),

  body('bio')
    .optional()
    .isLength({ max: 1000 }).withMessage('Bio must be at most 1000 characters'),

  body('hospitalName')
    .optional()
    .isLength({ max: 150 }).withMessage('Hospital name must be at most 150 characters'),

  body('consultationFee')
    .optional()
    .isFloat({ min: 0 }).withMessage('Consultation fee must be a positive number'),

  body('weeklyAvailability')
    .optional()
    .custom(value => {
      if (typeof value !== 'object' || Array.isArray(value)) {
        throw new Error('Weekly availability must be an object');
      }
      for (let day in value) {
        if (!Array.isArray(value[day])) {
          throw new Error(`Availability for ${day} must be an array`);
        }
        value[day].forEach(slot => {
          if (!slot.start || !slot.end) {
            throw new Error(`Each slot for ${day} must have start and end`);
          }
        });
      }
      return true;
    }),

  body('location.city').optional().isLength({ max: 50 }),
  body('location.state').optional().isLength({ max: 50 }),
  body('location.country').optional().isLength({ max: 50 }),

  body('profilePicture')
    .optional()
    .isURL().withMessage('Profile picture must be a valid URL'),

  body('licenseNumber')
    .notEmpty().withMessage('License number is required')
    .isLength({ min: 5 }).withMessage('License number must be at least 5 characters'),

  body('licenseDocument')
    .notEmpty().withMessage('License document is required'),

  body('idProof')
    .optional()
    .isURL().withMessage('ID proof must be a valid URL'),

  body('applicationNotes')
    .optional()
    .isLength({ max: 1000 }).withMessage('Application notes must be at most 1000 characters'),
];

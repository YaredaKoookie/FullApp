import { validationResult } from 'express-validator';
import ServerError from '../utils/ServerError.js';

/**
 * Middleware to validate request data against a Joi schema
 * @param {Joi.Schema} schema - The Joi schema to validate against
 * @returns {Function} Express middleware function
 */
export const validateRequest = (validations) => {
  return async (req, res, next) => {
    // Run all validations
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(err => err.msg).join(', ');
      throw ServerError.badRequest(errorMessages);
    }
    next();
  };
};

/**
 * Middleware to validate request parameters against a Joi schema
 * @param {Joi.Schema} schema - The Joi schema to validate against
 * @returns {Function} Express middleware function
 */
export const validateParams = (validations) => {
  return async (req, res, next) => {
    // Run all validations
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(err => err.msg).join(', ');
      throw ServerError.badRequest(errorMessages);
    }
    next();
  };
};

/**
 * Middleware to validate request query parameters against a Joi schema
 * @param {Joi.Schema} schema - The Joi schema to validate against
 * @returns {Function} Express middleware function
 */
export const validateQuery = (validations) => {
  return async (req, res, next) => {
    // Run all validations
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(err => err.msg).join(', ');
      throw ServerError.badRequest(errorMessages);
    }
    next();
  };
}; 
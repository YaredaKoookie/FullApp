import { validationResult, matchedData } from "express-validator";
import { logger, ServerError } from "../../utils";

/**
 * Enhanced validation middleware with better error handling and debugging
 * @param {Array} validations - Array of express-validator chains
 * @param {Object} options - Configuration options
 * @param {Boolean} options.matchData - Whether to filter request data
 * @param {Boolean} options.debug - Enable detailed logging
 */
const validate = (validations, options = { matchData: true, debug: false }) => 
  async (req, res, next) => {
    console.log("body", req.body);
    try {
      if (options.debug) {
        logger.debug('Original request body:', req.body);
        logger.debug('Running validations:', validations.map(v => v.toString()));
      }

      // Run all validations in parallel
      await Promise.all(validations.map(validation => validation.run(req)));

      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        if (options.debug) {
          logger.debug('Validation errors:', errors.array());
        }

        const error = new ServerError("Validation failed", 400);
        error.name = "ValidationError";
        error.details = errors.array().map(({ param, msg }) => ({
          path: param,
          message: msg
        }));

        return next(error);
      }

      // Filter request data if enabled
      if (options.matchData) {
        const filteredData = matchedData(req, { includeOptionals: false });
        if (options.debug) {
          logger.debug('Filtered request data:', filteredData);
        }
        req.body = filteredData;
      }

      next();
    } catch (err) {
      if (options.debug) {
        logger.error('Validation middleware error:', err);
      }
      next(new ServerError("Validation processing failed", 500));
    }
  };

export default validate;
import { query, param } from 'express-validator';

export const listPaymentsValidation = [
  query('page').optional().isInt({ min: 1 }).toInt().default(1),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt().default(10),
  query('startDate').optional().isISO8601().toDate(),
  query('endDate')
    .optional()
    .isISO8601()
    .toDate()
    .custom((value, { req }) => {
      if (value && req.query.startDate && value < req.query.startDate) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
  query('status')
    .optional()
    .isIn(['pending', 'paid', 'failed', 'refunded', 'cancelled', 'refund_initiated', 'partially_refunded', '']),
  query('search').optional().isString().trim(),
  query('sortBy')
    .optional()
    .isIn(['createdAt', 'amount', 'status'])
    .default('createdAt'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .default('desc')
];

export const paymentIdValidation = [
  param('id').isString().notEmpty().withMessage('Payment ID is required')
];

export const exportPaymentsValidation = [
  query('startDate').optional().isISO8601().toDate(),
  query('endDate')
    .optional()
    .isISO8601()
    .toDate()
    .custom((value, { req }) => {
      if (value && req.query.startDate && value < req.query.startDate) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
  query('status')
    .optional()
    .isIn(['pending', 'success', 'failed', 'refunded', ''])
]; 
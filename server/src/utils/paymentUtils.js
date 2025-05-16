import Payment from '../models/appointment/payment.model.js';

/**
 * Calculates revenue summary from payments matching the given query
 * @param {Object} query - MongoDB query to filter payments
 * @returns {Promise<Object>} Revenue summary
 */
export const calculateRevenueSummary = async (query) => {
  try {
    // Get all payments that match the query (without pagination)
    const payments = await Payment.find(query);
    
    if (!payments || payments.length === 0) {
      return {
        totalRevenue: 0,
        averageRevenue: 0,
        totalTransactions: 0,
        totalCommission: 0,
        netRevenue: 0,
      };
    }

    // Calculate totals
    const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const totalCommission = payments.reduce((sum, payment) => sum + (payment.commission || 0), 0);
    const netRevenue = totalRevenue - totalCommission;
    const averageRevenue = totalRevenue / payments.length;

    return {
      totalRevenue,
      averageRevenue,
      totalTransactions: payments.length,
      totalCommission,
      netRevenue,
    };
  } catch (error) {
    console.error('Error calculating revenue summary:', error);
    throw error; // Let the controller handle the error
  }
};
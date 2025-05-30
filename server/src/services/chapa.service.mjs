import axios from 'axios';
import { env } from '../config';

const CHAPA_BASE_URL = 'https://api.chapa.co/v1';

class ChapaService {
  constructor() {
    if (!env.CHAPA_SECRET_KEY) {
      throw new Error('CHAPA_SECRET_KEY is not configured');
    }
    
    this.api = axios.create({
      baseURL: 'https://api.chapa.co',
      headers: {
        'Authorization': `Bearer ${env.CHAPA_SECRET_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    // Add response interceptor for better error handling
    this.api.interceptors.response.use(
      response => response,
      error => {
        console.log('Chapa API Error:', {
          endpoint: error.config?.url,
          method: error.config?.method,
          status: error.response?.status,
          message: error.response?.data?.message || error.message,
          data: error.response?.data
        });
        throw error;
      }
    );
  }

  async getBanks() {
    try {
      const response = await this.api.get('/v1/banks');
      console.log('Banks response:', response.data);
      
      if (!response.data?.data || !Array.isArray(response.data.data)) {
        throw new Error('Invalid response from banks endpoint');
      }

      return response.data;
    } catch (error) {
      console.error('Failed to fetch banks:', error.response?.data || error.message);
      throw error;
    }
  }

  async checkSubaccountExists({ accountNumber, bankName }) {
    try {
      // Get bank ID from name
      const bankId = await this.validateBankCode(bankName);
      
      // Try to get subaccount list
      const response = await this.api.get('/subaccount');
      
      if (!response.data || !response.data.data || !Array.isArray(response.data.data)) {
        return false; // Assume it doesn't exist if we can't verify
      }

      // Check if a subaccount with the same bank and account number exists
      const exists = response.data.data.some(subaccount => 
        subaccount.bank_code === bankId && 
        subaccount.account_number === accountNumber
      );

      return exists;
    } catch (error) {
      console.error('Failed to check subaccount:', error.response?.data || error.message);
      return false; // Assume it doesn't exist if we can't verify
    }
  }

  async validateBankCode(bankName) {
    try {
      console.log('Validating bank:', bankName);
      const response = await this.api.get('/v1/banks');
      
      if (!response.data?.data || !Array.isArray(response.data.data)) {
        console.error('Invalid response from banks endpoint:', response.data);
        throw new Error('Invalid response from banks endpoint');
      }

      const banks = response.data.data;
      console.log('Available banks:', banks.map(b => ({
        name: b.name,
        id: b.id,
        swift: b.swift
      })));

      // Find bank by name with flexible matching
      const bank = banks.find(b => {
        const normalizedBankName = b.name.toLowerCase().trim();
        const normalizedInputName = bankName.toLowerCase().trim();
        
        // Special case for CBE first
        if (normalizedInputName.includes('commercial bank of ethiopia')) {
          return normalizedBankName.includes('commercial bank of ethiopia');
        }
        
        // For other banks, try exact match first
        if (normalizedBankName === normalizedInputName) {
          return true;
        }
        
        // Then try partial matches
        return normalizedBankName.includes(normalizedInputName) ||
               normalizedInputName.includes(normalizedBankName);
      });

      if (!bank) {
        console.error(`Bank "${bankName}" not found in:`, banks.map(b => b.name));
        throw new Error(`Bank "${bankName}" not found in available banks list`);
      }

      console.log('Found bank:', {
        name: bank.name,
        id: bank.id,
        swift: bank.swift
      });

      return bank;
    } catch (error) {
      console.error('Bank validation error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw error;
    }
  }

  async getExistingSubaccount({
    accountNumber,
    bankName
  }) {
    try {
      // Get bank ID from name
      const bankId = await this.validateBankCode(bankName);
      
      // Get subaccount list
      const response = await this.api.get('/subaccount');
      
      if (!response.data || !response.data.data || !Array.isArray(response.data.data)) {
        return null;
      }

      // Find matching subaccount
      const subaccount = response.data.data.find(acc => 
        acc.bank_code === bankId && 
        acc.account_number === accountNumber
      );

      if (subaccount) {
        console.log('Found existing subaccount:', subaccount);
      }

      return subaccount || null;
    } catch (error) {
      console.error('Failed to check subaccount:', error.response?.data || error.message);
      return null;
    }
  }

  async findOrCreateSubaccount({
    businessName,
    accountName,
    bankName,
    accountNumber,
    splitType,
    splitValue
  }) {
    try {
      // First validate the bank
      const bank = await this.validateBankCode(bankName);
      
      // Validate account number length if available
      if (bank.acct_length && accountNumber.length !== bank.acct_length) {
        throw new Error(`Invalid account number length for ${bank.name}. Expected ${bank.acct_length} digits.`);
      }

      // Format split value according to documentation
      const formattedSplitValue = splitType === 'percentage' ? splitValue / 100 : splitValue;

      // First check if this account already exists in Chapa
      try {
        const listResponse = await this.api.get('/v1/subaccount');
        const existingSubaccount = listResponse.data?.data?.find(acc => 
          acc.bank_code === bank.id.toString() && 
          acc.account_number === accountNumber
        );

        if (existingSubaccount) {
          console.log('Found existing subaccount, will reuse it:', existingSubaccount);
          // Check if any other doctor is using this account (just for logging)
          const Doctor = require('../models/doctors/doctor.model').default;
          const existingDoctor = await Doctor.findOne({
            'paymentDetails.bankName': bankName,
            'paymentDetails.accountNumber': accountNumber
          }).select('firstName lastName');

          if (existingDoctor) {
            console.log(`Note: This bank account is also used by Dr. ${existingDoctor.firstName} ${existingDoctor.lastName}`);
          }

          return {
            status: 'success',
            message: 'Using existing subaccount from Chapa',
            data: {
              subaccount: existingSubaccount
            }
          };
        }
      } catch (fetchError) {
        console.error('Failed to fetch subaccounts from Chapa:', fetchError);
      }

      // If we get here, no existing subaccount was found, so create a new one
      const subaccountData = {
        business_name: businessName,
        account_name: accountName,
        bank_code: bank.id.toString(),
        account_number: accountNumber,
        split_type: splitType,
        split_value: formattedSplitValue
      };

      try {
        // Try to create the subaccount
        const createResponse = await this.api.post('/v1/subaccount', subaccountData);
        console.log('Successfully created new subaccount:', createResponse.data);
        return createResponse;
      } catch (error) {
        // If subaccount exists in Chapa but we couldn't fetch it earlier
        if (error.response?.data?.message === 'This subaccount does exist') {
          // Try one more time to get the subaccount details
          try {
            const retryResponse = await this.api.get('/v1/subaccount');
            const existingSubaccount = retryResponse.data?.data?.find(acc => 
              acc.bank_code === bank.id.toString() && 
              acc.account_number === accountNumber
            );

            if (existingSubaccount) {
              return {
                status: 'success',
                message: 'Using existing subaccount from Chapa',
                data: {
                  subaccount: existingSubaccount
                }
              };
            }
          } catch (retryError) {
            console.error('Failed to fetch subaccount on retry:', retryError);
          }

          // If we still can't get the details, return with basic info
          return {
            status: 'success',
            message: 'Using existing subaccount from Chapa',
            data: {
              subaccount: {
                ...subaccountData,
                id: `${bank.id}_${accountNumber}` // Use predictable ID format
              }
            }
          };
        }
        throw error;
      }

    } catch (error) {
      console.error('Chapa API Error:', {
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
        data: error.response?.data
      });

      if (error.response?.status === 400) {
        const message = error.response.data?.message || 'Invalid request data';
        throw new Error(message);
      }
      throw error;
    }
  }

  async verifySubaccount(subaccountId) {
    try {
      const response = await this.api.get(`/subaccount/${subaccountId}`);
      return response.data;
    } catch (error) {
      console.error('Chapa subaccount verification error:', error.response?.data || error.message);
      throw error;
    }
  }
}

// Export the class itself
export default ChapaService;
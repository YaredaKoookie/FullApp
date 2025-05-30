import mongoose from 'mongoose';
import { env } from '../config/index.js';
import Doctor from '../models/doctors/doctor.model.js';
import { ChapaService } from '../services/index.js';

const chapaService = new ChapaService();

async function updateChapaSubaccounts() {
  try {
    // Connect to MongoDB
    await mongoose.connect(env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get all doctors with payment details
    const doctors = await Doctor.find({
      'paymentDetails.bankName': { $exists: true },
      'paymentDetails.accountNumber': { $exists: true }
    }).select('firstName lastName paymentDetails');

    console.log(`Found ${doctors.length} doctors with payment details`);

    // Get all subaccounts from Chapa
    const listResponse = await chapaService.api.get('/v1/subaccount');
    const chapaSubaccounts = listResponse.data?.data || [];
    
    console.log(`Found ${chapaSubaccounts.length} subaccounts in Chapa`);

    // For each doctor
    for (const doctor of doctors) {
      try {
        // First validate the bank to get the correct bank ID
        const bank = await chapaService.validateBankCode(doctor.paymentDetails.bankName);
        
        // Find matching subaccount
        const matchingSubaccount = chapaSubaccounts.find(acc => 
          acc.bank_code === bank.id.toString() && 
          acc.account_number === doctor.paymentDetails.accountNumber
        );

        if (matchingSubaccount) {
          console.log(`Found matching subaccount for Dr. ${doctor.firstName} ${doctor.lastName}:`, {
            bankName: doctor.paymentDetails.bankName,
            accountNumber: doctor.paymentDetails.accountNumber,
            subaccountId: matchingSubaccount.id
          });

          // Update the doctor's record
          await Doctor.findByIdAndUpdate(doctor._id, {
            'paymentDetails.chapaSubaccountId': matchingSubaccount.id,
            'paymentDetails.isVerified': true
          });

          console.log('✅ Updated successfully');
        } else {
          console.log(`❌ No matching subaccount found for Dr. ${doctor.firstName} ${doctor.lastName}:`, {
            bankName: doctor.paymentDetails.bankName,
            accountNumber: doctor.paymentDetails.accountNumber
          });
        }
      } catch (error) {
        console.error(`Failed to process doctor ${doctor.firstName} ${doctor.lastName}:`, error.message);
      }
    }

    console.log('Finished updating subaccount IDs');
  } catch (error) {
    console.error('Script failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
updateChapaSubaccounts().catch(console.error); 
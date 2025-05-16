import { useState } from 'react';
import axios from 'axios';
import { AlertCircle } from 'lucide-react';
import { Dialog } from '@headlessui/react';
import apiClient from '@/lib/apiClient';

const AccountSetting = ({ user }) => {
  const [deleteReason, setDeleteReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [error, setError] = useState(null);

  const handleDeleteAccount = async () => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      await apiClient.delete('/doctors/delete-account', {
        data: { reason: deleteReason },
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      // Redirect or show success message
      window.location.href = '/goodbye'; // Example redirect
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete account');
      setIsSubmitting(false);
      setIsConfirmOpen(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      {/* Caution Card */}
      <div className="border border-red-200 bg-red-50 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-red-800">Account Deletion</h3>
            <div className="mt-1 text-sm text-red-700">
              <p>Email: {user?.email}</p>
              <p>Role: {user?.role}</p>
              <p className="font-bold mt-2">
                This action is irreversible. Your data will be permanently deleted.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Deletion Reason Field */}
      <div className="mb-6">
        <label htmlFor="deleteReason" className="block text-sm font-medium text-gray-700 mb-1">
          Why are you deleting your account? <span className="text-red-500">*</span>
        </label>
        <textarea
          id="deleteReason"
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="Please explain your reason for deleting the account..."
          value={deleteReason}
          onChange={(e) => setDeleteReason(e.target.value)}
          required
        />
      </div>

      {/* Delete Button */}
      <button
        onClick={() => setIsConfirmOpen(true)}
        disabled={!deleteReason || isSubmitting}
        className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
          !deleteReason || isSubmitting
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500'
        }`}
      >
        {isSubmitting ? 'Deleting...' : 'Delete My Account'}
      </button>

      {error && (
        <p className="mt-3 text-sm text-red-600">{error}</p>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-sm rounded-xl bg-white p-6">
            <Dialog.Title className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Confirm Account Deletion
            </Dialog.Title>
            
            <div className="mt-4">
              <p className="text-sm text-gray-500">
                Are you sure you want to delete your account? This cannot be undone.
              </p>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setIsConfirmOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
              >
                {isSubmitting ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
};

export default AccountSetting;
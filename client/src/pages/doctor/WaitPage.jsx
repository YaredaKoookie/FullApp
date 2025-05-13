import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Spinner } from '@headlessui/react';
import { CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';

export default function DoctorFlow() {
  const navigate = useNavigate();
  const [approvalStatus, setApprovalStatus] = useState('pending'); // 'pending' | 'approved' | 'rejected'
  const [isLoading, setIsLoading] = useState(true);
  const [profileComplete, setProfileComplete] = useState(false);

  // Simulate checking profile completion on mount
  useEffect(() => {
    const checkProfile = async () => {
      try {
        // Replace with actual API call
        const response = await fetch('/api/doctor/check-profile');
        const data = await response.json();
        
        setProfileComplete(data.isComplete);
        if (!data.isComplete) {
          navigate('/doctor/complete-profile');
        } else {
          checkApprovalStatus();
        }
      } catch (error) {
        console.error('Profile check failed:', error);
      }
    };

    checkProfile();
  }, [navigate]);

  // Simulate checking approval status
  const checkApprovalStatus = async () => {
    setIsLoading(true);
    try {
      // Replace with actual API call
      const response = await fetch('/api/doctor/approval-status');
      const data = await response.json();
      
      setApprovalStatus(data.status);
      
      // If approved, skip waiting page
      if (data.status === 'approved') {
        navigate('/doctor/dashboard', { state: { message: 'Approval successful!' } });
      }
    } catch (error) {
      console.error('Approval check failed:', error);
      setApprovalStatus('rejected');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle profile submission
  const handleProfileSubmit = async () => {
    // Your existing profile submission logic
    navigate('/doctor/waiting');
  };

  // Handle continue to dashboard
  const handleContinue = () => {
    navigate('/doctor/dashboard', { 
      state: { message: 'Your account has been approved!' } 
    });
  };

  // Handle try again
  const handleTryAgain = () => {
    navigate('/doctor/complete-profile');
  };

  if (!profileComplete) {
    // Your existing CompleteProfile component
    return <CompleteProfile onSubmit={handleProfileSubmit} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {isLoading ? (
            <div className="text-center">
              <Spinner className="mx-auto h-12 w-12 text-blue-500" />
              <p className="mt-4 text-sm text-gray-600">Checking approval status...</p>
            </div>
          ) : approvalStatus === 'approved' ? (
            <div className="text-center">
              <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">Approval Successful!</h3>
              <p className="mt-2 text-sm text-gray-600">
                Your doctor profile has been approved.
              </p>
              <button
                onClick={handleContinue}
                className="mt-6 w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                Continue to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="text-center">
              <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">Approval Pending</h3>
              <p className="mt-2 text-sm text-gray-600">
                {approvalStatus === 'rejected'
                  ? 'Your submission was rejected. Please update your profile and try again.'
                  : 'Your profile is under review. We will notify you once approved.'}
              </p>
              <button
                onClick={approvalStatus === 'rejected' ? handleTryAgain : checkApprovalStatus}
                className={`mt-6 w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                  approvalStatus === 'rejected' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {approvalStatus === 'rejected' ? 'Update Profile' : 'Check Again'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Your existing CompleteProfile component (simplified example)
function CompleteProfile({ onSubmit }) {
  const [formData, setFormData] = useState({});
  
  const handleSubmit = (e) => {
    e.preventDefault();
    // Submit logic here
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Your existing profile form fields */}
      <button type="submit">Submit Profile</button>
    </form>
  );
}
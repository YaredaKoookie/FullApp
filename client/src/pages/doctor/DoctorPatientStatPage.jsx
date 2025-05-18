import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/apiClient';
import { 
  ArrowDown, 
  ArrowUp, 
  Banknote, 
  Clock, 
  CreditCard, 
  DollarSign, 
  History, 
  Loader2, 
  Mail, 
  Phone, 
  Plus, 
  Send, 
  Wallet 
} from 'lucide-react';
import { Dialog, Transition, Listbox } from '@headlessui/react';

const DoctorPaymentStatPage = () => {
  const queryClient = useQueryClient();
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState('bank');
  const [withdrawDetails, setWithdrawDetails] = useState({
    // bankName: '',
    accountNumber: '',
    // ifscCode: '',
    // phoneNumber: '',
    // upiId: ''
  });
  const [reason, setReason] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);

  // Fetch payment statistics
  const { data: paymentStats, isLoading: statsLoading } = useQuery({
    queryKey: ['paymentStats'],
    queryFn: async () => {
      const response = await apiClient.get('/doctors/payment-stats');
      return response.data || [];
    }
});

console.log(" the data " , paymentStats)
  // Fetch earnings breakdown
  const { data: earnings, isLoading: earningsLoading } = useQuery({
    queryKey: ['earnings'],
    queryFn: async () => {
      const response = await apiClient.get('/doctors/earnings');
      return response.data;
    }
});

  // Fetch withdrawal history
  const { data: withdrawals, isLoading: withdrawalsLoading } = useQuery({
    queryKey: ['withdrawals'],
    queryFn: async () => {
      const response = await apiClient.get('/doctors/withdrawals');
      return response.data;
    }
  });

  // Mutation for withdrawal request
  const { mutate: requestWithdrawal, isLoading: isSubmitting } = useMutation({
      mutationFn: async (withdrawalData) => {
          const response = await apiClient.post('/doctors/withdraw', withdrawalData);
          console.log("4" , response)
          return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['paymentStats']);
            queryClient.invalidateQueries(['withdrawals']);
            setIsOpen(false);
            resetForm();
        }
    });
    console.log("this is the console" , requestWithdrawal)
    
  const resetForm = () => {
    setWithdrawAmount('');
    setWithdrawMethod('bank');
    setWithdrawDetails({
    //   bankName: '',
      accountNumber: '',
    //   phoneNumber: '',
    //   ifscCode: '',
    //   paypalEmail: '',
    //   upiId: ''
    });
    setReason('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const withdrawalData = {
      amount: parseFloat(withdrawAmount),
      method: withdrawMethod,
      accountNumber: withdrawDetails.accountNumber,
    //   details: withdrawMethod === 'bank' 
        // ? { 
            // bankName: withdrawDetails.bankName,
            // accountNumber: withdrawDetails.accountNumber,
            // ifscCode: withdrawDetails.ifscCode
        //   }
        // : withdrawMethod === 'teleBirr'
        // ? { phoneNumber: withdrawDetails.phoneNumber } : {},
        // : { upiId: withdrawDetails.upiId },
      reason
    };
    requestWithdrawal(withdrawalData);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ETB', {
      style: 'currency',
      currency: 'ETB'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ETB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch ("status.toLowerCase()") {
      case 'paid':
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'refunded':
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (statsLoading || earningsLoading || withdrawalsLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin h-12 w-12 text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">Payment Dashboard</h1>
        
        {/* Earnings Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Total Earnings</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">
                  {formatCurrency(paymentStats?.totalEarnings || 0)}
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Pending Balance</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">
                  {formatCurrency(paymentStats?.pendingBalance || 0)}
                </p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-full">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Available Balance</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">
                  {formatCurrency(paymentStats?.availableBalance || 0)}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <Wallet className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Last Payment</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">
                  {paymentStats?.lastPaymentDate ? formatDate(paymentStats.lastPaymentDate) : 'N/A'}
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <History className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Earning Breakdown */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                <Banknote className="h-5 w-5 mr-2 text-blue-500" />
                Earning Breakdown
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Appointment / Patient
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {earnings?.map((earning) => (
                    <tr 
                      key={earning.id} 
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => setSelectedPayment(earning)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">#{earning.appointmentId}</div>
                        <div className="text-sm text-gray-500">{earning.patientName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(earning.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(earning.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(earning.status)}`}>
                          {earning.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {earnings?.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No earnings records found
              </div>
            )}
          </div>

          {/* Withdraw Request Section */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                <Send className="h-5 w-5 mr-2 text-green-500" />
                Withdraw Funds
              </h2>
            </div>
            <div className="p-6">
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                    Amount to Withdraw
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">$</span>
                    </div>
                    <input
                      type="number"
                      id="amount"
                      min="0"
                      max={paymentStats?.availableBalance || 0}
                      step="0.01"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md py-2"
                      placeholder="0.00"
                      required
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">
                        Max: {formatCurrency(paymentStats?.availableBalance || 0)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <label htmlFor="method" className="block text-sm font-medium text-gray-700 mb-1">
                    Withdrawal Method
                  </label>
                  <Listbox value={withdrawMethod} onChange={setWithdrawMethod}>
                    <div className="relative mt-1">
                      <Listbox.Button className="relative w-full py-2 pl-3 pr-10 text-left bg-white rounded-lg border border-gray-300 shadow-sm cursor-default focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                        <span className="block truncate">
                          {withdrawMethod === 'bank' && 'Bank Transfer'}
                          {withdrawMethod === 'teleBirr' && 'teleBirr'}
                          {/* {withdrawMethod === 'upi' && 'UPI'} */}
                        </span>
                        <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                          <ArrowDown className="h-5 w-5 text-gray-400" />
                        </span>
                      </Listbox.Button>
                      <Listbox.Options className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                        <Listbox.Option
                          value="bank"
                          className={({ active }) =>
                            `cursor-default select-none relative py-2 pl-10 pr-4 ${
                              active ? 'text-blue-900 bg-blue-100' : 'text-gray-900'
                            }`
                          }
                        >
                          {({ selected }) => (
                            <>
                              <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                Bank Transfer
                              </span>
                              {selected && (
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600">
                                  <Banknote className="h-5 w-5" />
                                </span>
                              )}
                            </>
                          )}
                        </Listbox.Option>
                        <Listbox.Option
                          value="teleBirr"
                          className={({ active }) =>
                            `cursor-default select-none relative py-2 pl-10 pr-4 ${
                              active ? 'text-blue-900 bg-blue-100' : 'text-gray-900'
                            }`
                          }
                        >
                          {({ selected }) => (
                            <>
                              <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                teleBirr
                              </span>
                              {selected && (
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600">
                                  <Phone className="h-5 w-5" />
                                </span>
                              )}
                            </>
                          )}
                        </Listbox.Option>
                        {/* <Listbox.Option
                          value="upi"
                          className={({ active }) =>
                            `cursor-default select-none relative py-2 pl-10 pr-4 ${
                              active ? 'text-blue-900 bg-blue-100' : 'text-gray-900'
                            }`
                          }
                        >
                          {({ selected }) => (
                            <>
                              <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                UPI
                              </span>
                              {selected && (
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600">
                                  <CreditCard className="h-5 w-5" />
                                </span>
                              )}
                            </>
                          )}
                        </Listbox.Option> */}
                      </Listbox.Options>
                    </div>
                  </Listbox>
                </div>

                {withdrawMethod === 'bank' && (
                  <div className="mb-4 space-y-3">
                    {/* <div>
                      <label htmlFor="bankName" className="block text-sm font-medium text-gray-700 mb-1">
                        Bank Name
                      </label>
                      <input
                        type="text"
                        id="bankName"
                        value={withdrawDetails.bankName}
                        onChange={(e) => setWithdrawDetails({...withdrawDetails, bankName: e.target.value})}
                        className="focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 px-3"
                        required
                      />
                    </div> */}
                    <div>
                      <label htmlFor="accountNumber" className="block text-sm font-medium text-gray-700 mb-1">
                        Account Number
                      </label>
                      <input
                        type="text"
                        id="accountNumber"
                        value={withdrawDetails.accountNumber}
                        onChange={(e) => setWithdrawDetails({...withdrawDetails, accountNumber: e.target.value})}
                        className="focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 px-3"
                        required
                      />
                    </div>
                    {/* <div>
                      <label htmlFor="ifscCode" className="block text-sm font-medium text-gray-700 mb-1">
                        IFSC/SWIFT Code
                      </label>
                      <input
                        type="text"
                        id="ifscCode"
                        value={withdrawDetails.ifscCode}
                        onChange={(e) => setWithdrawDetails({...withdrawDetails, ifscCode: e.target.value})}
                        className="focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 px-3"
                        required
                      />
                    </div> */}
                  </div>
                )}

                {withdrawMethod === 'telBirr' && (
                  <div className="mb-4">
                    <label htmlFor="paypalEmail" className="block text-sm font-medium text-gray-700 mb-1">
                      teleBirr Number
                    </label>
                    <input
                      type="text"
                      id="phoneNumber"
                      value={withdrawDetails.phoneNumber}
                      onChange={(e) => setWithdrawDetails({...withdrawDetails, phoneNumber: e.target.value})}
                      className="focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 px-3"
                      required
                    />
                  </div>
                )}

                {/* {withdrawMethod === 'upi' && (
                  <div className="mb-4">
                    <label htmlFor="upiId" className="block text-sm font-medium text-gray-700 mb-1">
                      UPI ID
                    </label>
                    <input
                      type="text"
                      id="upiId"
                      value={withdrawDetails.upiId}
                      onChange={(e) => setWithdrawDetails({...withdrawDetails, upiId: e.target.value})}
                      className="focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 px-3"
                      required
                    />
                  </div>
                )} */}

                <div className="mb-4">
                  <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
                    Reason for Withdrawal (Optional)
                  </label>
                  <textarea
                    id="reason"
                    rows={3}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 px-3"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || parseFloat(withdrawAmount) > (paymentStats?.availableBalance || 0)}
                  className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin h-4 w-4 mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Request Withdrawal
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Withdrawal History */}
        <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center">
              <History className="h-5 w-5 mr-2 text-purple-500" />
              Withdrawal History
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Request ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Requested Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sent To
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {withdrawals?.map((withdrawal) => (
                  <tr key={withdrawal.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{withdrawal.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(withdrawal.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(withdrawal.requestedDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(withdrawal.status)}`}>
                        {withdrawal.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {withdrawal.method === 'bank' && 'Bank Transfer'}
                      {withdrawal.method === 'paypal' && `PayPal: ${withdrawal.details.phoneNumber}`}
                      {/* {withdrawal.method === 'upi' && `UPI: ${withdrawal.details.upiId}`} */}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {withdrawal.notes || 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {withdrawals?.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No withdrawal history found
            </div>
          )}
        </div>
      </div>

      {/* Payment Detail Modal */}
      <Transition appear show={!!selectedPayment} as="div">
        <Dialog as="div" className="relative z-10" onClose={() => setSelectedPayment(null)}>
          <Transition.Child
            as="div"
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as="div"
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900"
                  >
                    Payment Details
                  </Dialog.Title>
                  <div className="mt-4 space-y-4">
                    <div>
                      <p className="text-sm text-gray-500">Appointment ID</p>
                      <p className="text-sm font-medium text-gray-900">#{selectedPayment?.appointmentId}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Patient Name</p>
                      <p className="text-sm font-medium text-gray-900">{selectedPayment?.patientName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Amount</p>
                      <p className="text-sm font-medium text-gray-900">{formatCurrency(selectedPayment?.amount)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Date</p>
                      <p className="text-sm font-medium text-gray-900">{formatDate(selectedPayment?.date)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Status</p>
                      <p className="text-sm font-medium text-gray-900">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(selectedPayment?.status)}`}>
                          {selectedPayment?.status}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="mt-6">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-blue-100 px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                      onClick={() => setSelectedPayment(null)}
                    >
                      Close
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
};

export default DoctorPaymentStatPage;
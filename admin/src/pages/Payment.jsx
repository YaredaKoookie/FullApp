import { useEffect, useState } from 'react';
import { AdminLayout } from '../layouts/AdminLayout';
import { adminAPI } from '../lib/api';
import { Loader2, ArrowDownRight, ArrowUpRight, Users, Stethoscope, DollarSign } from 'lucide-react';

const Payment = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    total: 0,
    doctorTotal: 0,
    appTotal: 0,
    count: 0,
    patients: 0,
    doctors: 0,
  });

  useEffect(() => {
    const fetchPayments = async () => {
      setLoading(true);
      try {
        // Example: adminAPI.payments.list() should return all transactions with doctor, patient, amount, split info
        const res = await adminAPI.payments.list();
        const txs = res.data.transactions || [];
        let total = 0, doctorTotal = 0, appTotal = 0, patients = new Set(), doctors = new Set();
        txs.forEach(tx => {
          total += tx.amount;
          doctorTotal += tx.doctorShare;
          appTotal += tx.appShare;
          if (tx.patient?._id) patients.add(tx.patient._id);
          if (tx.doctor?._id) doctors.add(tx.doctor._id);
        });
        setSummary({
          total,
          doctorTotal,
          appTotal,
          count: txs.length,
          patients: patients.size,
          doctors: doctors.size,
        });
        setTransactions(txs);
      } catch (err) {
        setTransactions([]);
      }
      setLoading(false);
    };
    fetchPayments();
  }, []);

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Payments & Transactions</h1>
        <p className="text-gray-500 mb-8">Overview of all payments, revenue, and splits</p>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-10">
          <div className="rounded-xl shadow p-6 bg-green-50 flex items-center gap-4">
            <DollarSign className="h-8 w-8 text-green-600" />
            <div>
              <div className="text-sm text-gray-500">Total Revenue</div>
              <div className="text-2xl font-bold text-green-700">${summary.total.toFixed(2)}</div>
            </div>
          </div>
          <div className="rounded-xl shadow p-6 bg-blue-50 flex items-center gap-4">
            <Stethoscope className="h-8 w-8 text-blue-600" />
            <div>
              <div className="text-sm text-gray-500">Doctors' Share</div>
              <div className="text-2xl font-bold text-blue-700">${summary.doctorTotal.toFixed(2)}</div>
            </div>
          </div>
          <div className="rounded-xl shadow p-6 bg-indigo-50 flex items-center gap-4">
            <ArrowUpRight className="h-8 w-8 text-indigo-600" />
            <div>
              <div className="text-sm text-gray-500">App's Share</div>
              <div className="text-2xl font-bold text-indigo-700">${summary.appTotal.toFixed(2)}</div>
            </div>
          </div>
          <div className="rounded-xl shadow p-6 bg-yellow-50 flex items-center gap-4">
            <Users className="h-8 w-8 text-yellow-600" />
            <div>
              <div className="text-sm text-gray-500">Transactions</div>
              <div className="text-2xl font-bold text-yellow-700">{summary.count}</div>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">All Transactions</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Doctor</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Doctor's Share</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">App's Share</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr><td colSpan={7} className="py-6 text-center"><Loader2 className="animate-spin h-6 w-6 mx-auto" /></td></tr>
                ) : transactions.length === 0 ? (
                  <tr><td colSpan={7} className="py-6 text-center text-gray-400">No transactions found</td></tr>
                ) : (
                  transactions.map((tx) => (
                    <tr key={tx._id} className="hover:bg-gray-50">
                      <td className="px-4 py-2">{new Date(tx.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                      <td className="px-4 py-2">{tx.patient?.fullName || '-'}</td>
                      <td className="px-4 py-2">{tx.doctor?.fullName || '-'}</td>
                      <td className="px-4 py-2 font-semibold">${tx.amount.toFixed(2)}</td>
                      <td className="px-4 py-2 text-blue-700">${tx.doctorShare.toFixed(2)}</td>
                      <td className="px-4 py-2 text-indigo-700">${tx.appShare.toFixed(2)}</td>
                      <td className="px-4 py-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                          tx.status === 'success' ? 'bg-green-100 text-green-700' :
                          tx.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'}`}
                        >
                          {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Payment;

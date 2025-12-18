import { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosConfig';
import DashboardLayout from '../../components/DashboardLayout';
import { DollarSign, CreditCard, Clock, CheckCircle } from 'lucide-react';
import Swal from 'sweetalert2';

const Billing = () => {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchInvoices();
    }, []);

    const fetchInvoices = async () => {
        try {
            const token = localStorage.getItem('token');
            const { data } = await axiosInstance.get('/api/billing', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setInvoices(data.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching invoices:', error);
            setLoading(false);
            Swal.fire('Error', 'Failed to load invoices', 'error');
        }
    };

    const handlePay = async (invoice) => {
        const { value: paymentMethod } = await Swal.fire({
            title: 'Select Payment Method',
            input: 'select',
            inputOptions: {
                'Stripe': 'Stripe (Credit Card)',
                'JazzCash': 'JazzCash',
                'Easypaisa': 'Easypaisa'
            },
            inputPlaceholder: 'Choose a payment method',
            showCancelButton: true,
        });

        if (paymentMethod) {
            try {
                // Mock Payment
                Swal.fire({
                    title: 'Processing Payment...',
                    text: 'Redirecting to secure gateway',
                    timer: 2000,
                    didOpen: () => Swal.showLoading()
                });

                const token = localStorage.getItem('token');
                await axiosInstance.post(`/api/billing/${invoice._id}/pay`, {
                    paymentGateway: paymentMethod,
                    paymentToken: 'tok_mock_123'
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                Swal.fire('Success!', 'Payment processed successfully.', 'success');
                fetchInvoices(); // Refresh list
            } catch (error) {
                Swal.fire('Error', error.response?.data?.message || 'Payment failed', 'error');
            }
        }
    };

    return (
        <DashboardLayout>
            <div className="p-8">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-2xl font-bold text-gray-800 mb-8">Invoices & Billing</h1>

                    {loading ? (
                        <div className="text-center py-12">Loading...</div>
                    ) : (
                        <div className="grid gap-6">
                            {invoices.length === 0 ? (
                                <div className="text-center py-12 bg-white rounded-xl shadow-sm">
                                    <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900">No Invoices Found</h3>
                                    <p className="text-gray-500">You have no pending or past invoices.</p>
                                </div>
                            ) : (
                                invoices.map((invoice) => (
                                    <div key={invoice._id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row justify-between items-center gap-4 hover:shadow-md transition">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-4 mb-2">
                                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${invoice.status === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                    }`}>
                                                    {invoice.status}
                                                </span>
                                                <span className="text-gray-500 text-sm">
                                                    Invoice #{invoice.invoiceId}
                                                </span>
                                            </div>
                                            <h3 className="text-xl font-bold text-gray-800 mb-1">
                                                ${invoice.finalAmount.toFixed(2)}
                                            </h3>
                                            <div className="text-gray-600 text-sm">
                                                {invoice.items.map(item => item.description).join(', ')}
                                            </div>
                                            <div className="text-gray-400 text-xs mt-1">
                                                Date: {new Date(invoice.createdAt).toLocaleDateString()}
                                            </div>
                                        </div>

                                        {invoice.status === 'Unpaid' ? (
                                            <button
                                                onClick={() => handlePay(invoice)}
                                                className="flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium shadow-sm"
                                            >
                                                <CreditCard size={18} />
                                                Pay Now
                                            </button>
                                        ) : (
                                            <button
                                                disabled
                                                className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-500 rounded-lg cursor-not-allowed font-medium"
                                            >
                                                <CheckCircle size={18} />
                                                Paid via {invoice.paymentGateway}
                                            </button>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default Billing;

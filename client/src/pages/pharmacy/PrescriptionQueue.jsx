import { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../../api/axiosConfig';
import { FileText, User, Calendar, Package } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { showSuccess, showError } from '../../utils/sweetalert';

const PrescriptionQueue = () => {
    const [prescriptions, setPrescriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('pending');

    const fetchPrescriptions = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            const { data } = await axiosInstance.get(`/api/prescriptions/queue?status=${filter}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPrescriptions(data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching prescriptions:', error);
            setLoading(false);
        }
    }, [filter]);

    useEffect(() => {
        fetchPrescriptions();
    }, [fetchPrescriptions]);

    const handleProcess = async (id) => {
        try {
            const token = localStorage.getItem('token');
            await axiosInstance.put(`/api/prescriptions/${id}/process`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchPrescriptions();
            showSuccess('Prescription marked as processing');
        } catch (error) {
            console.error('Error processing prescription:', error);
            showError('Failed to process prescription');
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            pending: 'bg-yellow-100 text-yellow-800',
            processing: 'bg-blue-100 text-blue-800',
            ready: 'bg-green-100 text-green-800',
            completed: 'bg-gray-100 text-gray-800',
            cancelled: 'bg-red-100 text-red-800',
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    return (
        <DashboardLayout>
            <div className="p-8 max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Prescription Queue</h1>
                        <p className="text-slate-500 mt-1">Manage and process patient prescriptions.</p>
                    </div>
                    <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                        {['pending', 'processing', 'ready', 'completed'].map((status) => (
                            <button
                                key={status}
                                onClick={() => setFilter(status)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all duration-200 ${filter === status
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                    }`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-slate-500">Loading prescriptions...</p>
                    </div>
                ) : prescriptions.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FileText className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-medium text-slate-800 mb-1">No prescriptions found</h3>
                        <p className="text-slate-500">There are no {filter} prescriptions at the moment.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {prescriptions.map((prescription) => (
                            <div key={prescription._id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 transition-all duration-200 hover:shadow-md">
                                <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                                <User className="w-5 h-5 text-blue-600" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-slate-800">
                                                    {prescription.patientId?.name || 'Unknown Patient'}
                                                </h3>
                                                <div className="flex items-center gap-2 text-sm text-slate-500">
                                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium uppercase tracking-wide ${getStatusColor(prescription.status)}`}>
                                                        {prescription.status}
                                                    </span>
                                                    <span>•</span>
                                                    <span>ID: #{prescription._id.slice(-6)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6 text-sm text-slate-500 bg-slate-50 px-4 py-2 rounded-xl">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-slate-400" />
                                            <span>{new Date(prescription.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <div className="w-px h-4 bg-slate-300"></div>
                                        <div>
                                            <span className="block text-xs text-slate-400">Prescribed by</span>
                                            <span className="font-medium text-slate-700">Dr. {prescription.doctorId?.name || 'Unknown'}</span>
                                        </div>
                                    </div>

                                    {prescription.status === 'pending' && (
                                        <button
                                            onClick={() => handleProcess(prescription._id)}
                                            className="btn-primary whitespace-nowrap"
                                        >
                                            Start Processing
                                        </button>
                                    )}
                                </div>

                                <div className="border-t border-slate-100 pt-4">
                                    <h4 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
                                        <Package className="w-5 h-5 text-slate-400" />
                                        Prescribed Medicines
                                        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs">
                                            {prescription.medicines?.length || 0}
                                        </span>
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {prescription.medicines?.map((med, index) => (
                                            <div key={index} className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                                <p className="font-bold text-slate-800 mb-2">{med.name}</p>
                                                <div className="space-y-1 text-sm text-slate-600">
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-400">Dosage:</span>
                                                        <span className="font-medium">{med.dosage}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-400">Frequency:</span>
                                                        <span className="font-medium">{med.frequency}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-400">Duration:</span>
                                                        <span className="font-medium">{med.duration}</span>
                                                    </div>
                                                    <div className="flex justify-between pt-2 border-t border-slate-200 mt-2">
                                                        <span className="text-slate-400">Quantity:</span>
                                                        <span className="font-bold text-blue-600">{med.quantity}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {prescription.notes && (
                                    <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
                                        <p className="text-sm text-blue-800">
                                            <span className="font-bold block mb-1">Doctor's Notes:</span>
                                            {prescription.notes}
                                        </p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default PrescriptionQueue;

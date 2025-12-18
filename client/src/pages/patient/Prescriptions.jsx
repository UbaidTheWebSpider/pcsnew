import { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosConfig';
import DashboardLayout from '../../components/DashboardLayout';
import { FileText, Download, Eye, Calendar, User } from 'lucide-react';
import Swal from 'sweetalert2';

const Prescriptions = () => {
    const [prescriptions, setPrescriptions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPrescriptions();
    }, []);

    const fetchPrescriptions = async () => {
        try {
            const token = localStorage.getItem('token');
            const { data } = await axiosInstance.get('/api/patient/prescriptions', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPrescriptions(data.data.prescriptions);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching prescriptions:', error);
            setLoading(false);
            Swal.fire('Error', 'Failed to load prescriptions', 'error');
        }
    };

    const handleDownload = (prescription) => {
        Swal.fire({
            icon: 'info',
            title: 'Downloading...',
            text: 'This feature will generate a PDF (Mock).',
            timer: 1500
        });
        // In real app: window.open(prescription.fileUrl, '_blank');
    };

    return (
        <DashboardLayout>
            <div className="p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">My Prescriptions</h1>
                            <p className="text-gray-600">View and download your medical prescriptions</p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="text-center py-12">Loading...</div>
                    ) : (
                        <div className="grid gap-6">
                            {prescriptions.length === 0 ? (
                                <div className="text-center py-12 bg-white rounded-xl shadow-sm">
                                    <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900">No Prescriptions Found</h3>
                                    <p className="text-gray-500">You haven't received any prescriptions yet.</p>
                                </div>
                            ) : (
                                prescriptions.map((prescription) => (
                                    <div key={prescription._id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row justify-between items-center gap-4 hover:shadow-md transition">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-4 mb-2">
                                                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                                                    {prescription.prescriptionId || 'RX-000'}
                                                </span>
                                                <div className="flex items-center text-gray-500 text-sm">
                                                    <Calendar className="w-4 h-4 mr-1" />
                                                    {new Date(prescription.createdAt).toLocaleDateString()}
                                                </div>
                                            </div>
                                            <h3 className="text-lg font-semibold text-gray-800 mb-1">
                                                Dr. {prescription.doctorId?.name}
                                            </h3>
                                            <div className="flex items-center text-gray-600 text-sm mb-3">
                                                <User className="w-4 h-4 mr-1" />
                                                {prescription.doctorId?.specialization}
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {prescription.medicines?.map((med, idx) => (
                                                    <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded border border-gray-200">
                                                        {med.name}
                                                    </span>
                                                ))}
                                                {prescription.medicines?.length > 3 && (
                                                    <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded">
                                                        +{prescription.medicines.length - 3} more
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex gap-2 w-full md:w-auto">
                                            <button
                                                onClick={() => handleDownload(prescription)}
                                                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                                            >
                                                <Download size={18} />
                                                Download
                                            </button>
                                            {/* <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                                                <Eye size={18} />
                                                View
                                            </button> */}
                                        </div>
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

export default Prescriptions;

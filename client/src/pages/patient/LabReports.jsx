import { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosConfig';
import DashboardLayout from '../../components/DashboardLayout';
import { FileText, Download, Upload, Activity, Calendar } from 'lucide-react';
import Swal from 'sweetalert2';

const LabReports = () => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            const token = localStorage.getItem('token');
            const { data } = await axiosInstance.get('/api/lab-reports', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setReports(data.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching lab reports:', error);
            setLoading(false);
            Swal.fire('Error', 'Failed to load lab reports', 'error');
        }
    };

    const handleUpload = async () => {
        const { value: file } = await Swal.fire({
            title: 'Upload Old Report',
            input: 'file',
            inputAttributes: {
                'accept': 'application/pdf,image/*',
                'aria-label': 'Upload your lab report'
            },
            showCancelButton: true
        });

        if (file) {
            // Mock upload - in real app would use FormData
            Swal.fire('Uploaded!', 'Your report has been uploaded successfully (Mock).', 'success');
            // Optimistic UI update
            setReports([{
                _id: 'temp_' + Date.now(),
                testName: 'Manual Upload',
                status: 'Completed',
                createdAt: new Date(),
                uploadedBy: 'Me'
            }, ...reports]);
        }
    };

    return (
        <DashboardLayout>
            <div className="p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">Lab Reports</h1>
                            <p className="text-gray-600">View and manage your diagnostic reports</p>
                        </div>
                        <button
                            onClick={handleUpload}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                        >
                            <Upload size={18} />
                            Upload Report
                        </button>
                    </div>

                    {loading ? (
                        <div className="text-center py-12">Loading...</div>
                    ) : (
                        <div className="grid gap-6">
                            {reports.length === 0 ? (
                                <div className="text-center py-12 bg-white rounded-xl shadow-sm">
                                    <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900">No Reports Found</h3>
                                    <p className="text-gray-500">You don't have any lab reports yet.</p>
                                </div>
                            ) : (
                                reports.map((report) => (
                                    <div key={report._id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row justify-between items-center gap-4 hover:shadow-md transition">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-4 mb-2">
                                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${report.status === 'Completed' ? 'bg-green-100 text-green-800' :
                                                        report.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {report.status}
                                                </span>
                                                <div className="flex items-center text-gray-500 text-sm">
                                                    <Calendar className="w-4 h-4 mr-1" />
                                                    {new Date(report.createdAt).toLocaleDateString()}
                                                </div>
                                            </div>
                                            <h3 className="text-lg font-semibold text-gray-800 mb-1">
                                                {report.testName}
                                            </h3>
                                            <p className="text-gray-600 text-sm">
                                                {report.doctorId ? `Ordered by Dr. ${report.doctorId.name}` : 'Manually Uploaded'}
                                            </p>
                                            {report.resultSummary && (
                                                <p className="mt-2 text-sm text-gray-500 bg-gray-50 p-2 rounded">
                                                    Required: {report.resultSummary}
                                                </p>
                                            )}
                                        </div>

                                        <button className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition">
                                            <Download size={18} />
                                            Download PDF
                                        </button>
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

export default LabReports;

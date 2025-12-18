import { useState, useEffect, useCallback } from 'react';
import { Search, CreditCard, Download, User, Filter, Sparkles, CheckCircle, XCircle, Loader } from 'lucide-react';
import axiosInstance from '../../api/axiosConfig';
import DashboardLayout from '../../components/DashboardLayout';
import HealthCardViewer from '../../components/HealthCardViewer';
import Swal from 'sweetalert2';
import { mapStaffPatientsToDisplay } from '../../utils/patientMapper';

const DigitalHealthCards = () => {
    const [patients, setPatients] = useState([]);
    const [filteredPatients, setFilteredPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all'); // all, with-id, without-id
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [viewerOpen, setViewerOpen] = useState(false);

    const fetchPatients = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const { data } = await axiosInstance.get('/api/staff/patients', {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (data.success && data.data) {
                // Map StaffPatient model to display format
                const mappedPatients = mapStaffPatientsToDisplay(data.data);
                setPatients(mappedPatients);
            }
        } catch (error) {
            console.error('Error fetching patients:', error);
            Swal.fire('Error', 'Failed to load patients', 'error');
        } finally {
            setLoading(false);
        }
    };

    const filterPatientList = useCallback(() => {
        let filtered = patients;

        // Search filter
        if (searchTerm) {
            filtered = filtered.filter(p =>
                p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.cnic?.includes(searchTerm) ||
                p.healthId?.includes(searchTerm)
            );
        }

        // Status filter
        if (filterStatus === 'with-id') {
            filtered = filtered.filter(p => p.healthId);
        } else if (filterStatus === 'without-id') {
            filtered = filtered.filter(p => !p.healthId);
        }

        setFilteredPatients(filtered);
    }, [patients, searchTerm, filterStatus]);

    useEffect(() => {
        fetchPatients();
    }, []);

    useEffect(() => {
        filterPatientList();
    }, [filterPatientList]);

    const handleGenerateHealthId = async (patientId) => {
        try {
            const token = localStorage.getItem('token');
            const { data } = await axiosInstance.post(`/api/users/patients/${patientId}/generate-health-id`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            Swal.fire({
                icon: 'success',
                title: 'Health ID Generated!',
                text: `Health ID: ${data.healthId}`,
                timer: 3000
            });

            fetchPatients(); // Refresh list
        } catch (error) {
            console.error('Error generating health ID:', error);
            Swal.fire('Error', 'Failed to generate Health ID', 'error');
        }
    };

    const openHealthCardViewer = (patient) => {
        setSelectedPatient(patient);
        setViewerOpen(true);
    };

    return (
        <DashboardLayout>
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-8">
                {/* Header */}
                <div className="max-w-7xl mx-auto mb-8">
                    <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <div className="p-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg">
                                    <CreditCard className="text-white" size={32} />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900">Digital Health Cards</h1>
                                    <p className="text-gray-600 mt-1">Manage and export patient health cards</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="text-right">
                                    <p className="text-sm text-gray-500">Total Patients</p>
                                    <p className="text-2xl font-bold text-indigo-600">{patients.length}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-gray-500">With Health ID</p>
                                    <p className="text-2xl font-bold text-emerald-600">
                                        {patients.filter(p => p.healthId).length}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Search and Filter Bar */}
                        <div className="flex gap-4">
                            <div className="flex-1 relative">
                                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="text"
                                    placeholder="Search by name, email, CNIC, or Health ID..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                />
                            </div>
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="px-6 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                            >
                                <option value="all">All Patients</option>
                                <option value="with-id">With Health ID</option>
                                <option value="without-id">Without Health ID</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Patient Grid */}
                <div className="max-w-7xl mx-auto">
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <Loader className="animate-spin text-indigo-600" size={48} />
                        </div>
                    ) : filteredPatients.length === 0 ? (
                        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                            <User className="mx-auto text-gray-300 mb-4" size={64} />
                            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Patients Found</h3>
                            <p className="text-gray-500">Try adjusting your search or filter criteria</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredPatients.map((patient) => (
                                <PatientCard
                                    key={patient._id}
                                    patient={patient}
                                    onViewCard={() => openHealthCardViewer(patient)}
                                    onGenerateId={() => handleGenerateHealthId(patient._id)}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Health Card Viewer Modal */}
                {viewerOpen && selectedPatient && (
                    <HealthCardViewer
                        patient={selectedPatient}
                        onClose={() => {
                            setViewerOpen(false);
                            setSelectedPatient(null);
                        }}
                    />
                )}
            </div>
        </DashboardLayout>
    );
};

// Patient Card Component
const PatientCard = ({ patient, onViewCard, onGenerateId }) => {
    const hasHealthId = Boolean(patient.healthId);

    return (
        <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 group">
            {/* Card Header */}
            <div className={`p-6 ${hasHealthId ? 'bg-gradient-to-r from-emerald-500 to-teal-600' : 'bg-gradient-to-r from-gray-400 to-gray-500'}`}>
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/30">
                        {patient.photoUrl ? (
                            <img src={patient.photoUrl} alt="" className="w-full h-full rounded-full object-cover" />
                        ) : (
                            <User className="text-white" size={32} />
                        )}
                    </div>
                    <div className="flex-1">
                        <h3 className="text-white font-bold text-lg truncate">{patient.name}</h3>
                        <p className="text-white/80 text-sm">{patient.gender || 'N/A'} • {patient.age || '?'} years</p>
                    </div>
                    {hasHealthId ? (
                        <CheckCircle className="text-white" size={24} />
                    ) : (
                        <XCircle className="text-white/60" size={24} />
                    )}
                </div>
            </div>

            {/* Card Body */}
            <div className="p-6">
                <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-500 font-medium">Email:</span>
                        <span className="text-gray-900 truncate">{patient.email || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-500 font-medium">CNIC:</span>
                        <span className="text-gray-900 font-mono">{patient.cnic || 'N/A'}</span>
                    </div>
                    {hasHealthId && (
                        <div className="flex items-center gap-2 text-sm">
                            <span className="text-gray-500 font-medium">Health ID:</span>
                            <span className="text-emerald-600 font-mono font-bold">{patient.healthId}</span>
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                    {hasHealthId ? (
                        <button
                            onClick={onViewCard}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg"
                        >
                            <Download size={18} />
                            View & Export
                        </button>
                    ) : (
                        <button
                            onClick={onGenerateId}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-semibold hover:from-amber-600 hover:to-orange-700 transition-all shadow-md hover:shadow-lg"
                        >
                            <Sparkles size={18} />
                            Generate Health ID
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DigitalHealthCards;

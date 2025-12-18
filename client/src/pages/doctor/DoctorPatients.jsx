import { useState, useEffect } from 'react';
import { Search, User, Phone, Calendar, FileText, ChevronRight } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import axiosInstance from '../../api/axiosConfig';

const DoctorPatients = () => {
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchPatients();
    }, []);

    const fetchPatients = async () => {
        try {
            const token = localStorage.getItem('token');
            const { data } = await axiosInstance.get('/api/doctor/patients', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPatients(data.data.patients);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching patients:', error);
            setLoading(false);
        }
    };

    const filteredPatients = patients.filter(patient =>
        patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.contact?.includes(searchTerm)
    );

    return (
        <DashboardLayout>
            <div className="p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800">My Patients</h1>
                            <p className="text-gray-500 mt-1">Manage and view patient records</p>
                        </div>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search patients..."
                                className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    {loading ? (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="text-gray-500 mt-4">Loading patients...</p>
                        </div>
                    ) : filteredPatients.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
                            <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-800">No Patients Found</h3>
                            <p className="text-gray-500">Try adjusting your search or add new patients.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredPatients.map((patient) => (
                                <div key={patient._id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition duration-200">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xl">
                                                {patient.name.charAt(0)}
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-gray-800">{patient.name}</h3>
                                                <p className="text-sm text-gray-500">ID: {patient.patientId || 'N/A'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3 mb-6">
                                        <div className="flex items-center gap-3 text-sm text-gray-600">
                                            <Phone className="w-4 h-4 text-gray-400" />
                                            <span>{patient.contact || 'No contact info'}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm text-gray-600">
                                            <Calendar className="w-4 h-4 text-gray-400" />
                                            <span>Age: {patient.age || 'N/A'} • {patient.gender || 'N/A'}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm text-gray-600">
                                            <FileText className="w-4 h-4 text-gray-400" />
                                            <span>Last Visit: {patient.lastVisit ? new Date(patient.lastVisit).toLocaleDateString() : 'Never'}</span>
                                        </div>
                                    </div>

                                    <button className="w-full py-2 px-4 bg-gray-50 text-blue-600 font-medium rounded-lg hover:bg-blue-50 transition flex items-center justify-center gap-2 group">
                                        View Details
                                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default DoctorPatients;

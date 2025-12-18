import { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosConfig';
import { Users, Search, Filter, X, Phone, MapPin, Calendar, Activity, User, Stethoscope } from 'lucide-react';

const PatientListSidebar = ({ onPatientSelect }) => {
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDepartment, setFilterDepartment] = useState('');
    const [filterType, setFilterType] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [selectedPatientId, setSelectedPatientId] = useState(null);

    useEffect(() => {
        fetchPatients();
    }, [searchTerm, filterDepartment, filterType]);

    const fetchPatients = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const params = {};
            if (searchTerm) params.search = searchTerm;
            if (filterDepartment) params.department = filterDepartment;
            if (filterType) params.type = filterType;

            const { data } = await axiosInstance.get('/api/staff/patients', {
                params,
                headers: { Authorization: `Bearer ${token}` }
            });

            if (data.success) {
                setPatients(data.data || []);
            }
        } catch (error) {
            console.error('Error fetching patients:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePatientClick = (patient) => {
        setSelectedPatientId(patient._id);
        if (onPatientSelect) {
            onPatientSelect(patient);
        }
    };

    const clearFilters = () => {
        setSearchTerm('');
        setFilterDepartment('');
        setFilterType('');
    };

    const calculateAge = (dob) => {
        if (!dob) return 'N/A';
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    return (
        <div className="h-full flex flex-col bg-gradient-to-br from-blue-50 to-indigo-50">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                            <Users className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Patient Registry</h2>
                            <p className="text-sm text-blue-100">
                                {patients.length} {patients.length === 1 ? 'Patient' : 'Patients'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`p-2 rounded-lg transition-all ${showFilters ? 'bg-white/30' : 'bg-white/10 hover:bg-white/20'
                            }`}
                        title="Toggle Filters"
                    >
                        <Filter className="w-5 h-5" />
                    </button>
                </div>

                {/* Search Bar */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-200 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search by name, ID, CNIC..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
                    />
                </div>

                {/* Filters */}
                {showFilters && (
                    <div className="mt-4 space-y-3 animate-fadeIn">
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="w-full px-3 py-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                        >
                            <option value="" className="text-gray-800">All Types</option>
                            <option value="OPD" className="text-gray-800">OPD</option>
                            <option value="IPD" className="text-gray-800">IPD</option>
                            <option value="ER" className="text-gray-800">ER</option>
                        </select>

                        <input
                            type="text"
                            placeholder="Filter by department..."
                            value={filterDepartment}
                            onChange={(e) => setFilterDepartment(e.target.value)}
                            className="w-full px-3 py-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-white/50"
                        />

                        {(searchTerm || filterDepartment || filterType) && (
                            <button
                                onClick={clearFilters}
                                className="w-full py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2"
                            >
                                <X className="w-4 h-4" /> Clear Filters
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Patient List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-12">
                        <Activity className="w-12 h-12 text-blue-400 animate-pulse mb-3" />
                        <p className="text-gray-600 font-medium">Loading patients...</p>
                    </div>
                ) : patients.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12">
                        <Users className="w-16 h-16 text-gray-300 mb-3" />
                        <p className="text-gray-500 font-medium">No patients found</p>
                        <p className="text-sm text-gray-400 mt-1">Try adjusting your filters</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-3">
                        {patients.map((patient) => (
                            <div
                                key={patient._id}
                                onClick={() => handlePatientClick(patient)}
                                className={`bg-white rounded-xl shadow-sm border-2 transition-all cursor-pointer hover:shadow-md ${selectedPatientId === patient._id
                                        ? 'border-blue-500 ring-2 ring-blue-200'
                                        : 'border-gray-200 hover:border-blue-300'
                                    }`}
                            >
                                <div className="p-4">
                                    {/* Patient Header */}
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${patient.personalInfo?.gender === 'Male'
                                                    ? 'bg-gradient-to-br from-blue-500 to-blue-600'
                                                    : patient.personalInfo?.gender === 'Female'
                                                        ? 'bg-gradient-to-br from-pink-500 to-pink-600'
                                                        : 'bg-gradient-to-br from-purple-500 to-purple-600'
                                                }`}>
                                                {patient.personalInfo?.fullName?.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-800 text-sm leading-tight">
                                                    {patient.personalInfo?.fullName}
                                                </h3>
                                                <p className="text-xs text-gray-500 font-mono mt-0.5">
                                                    {patient.patientId}
                                                </p>
                                            </div>
                                        </div>
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${patient.admissionDetails?.patientType === 'OPD'
                                                ? 'bg-green-100 text-green-700'
                                                : patient.admissionDetails?.patientType === 'IPD'
                                                    ? 'bg-blue-100 text-blue-700'
                                                    : 'bg-red-100 text-red-700'
                                            }`}>
                                            {patient.admissionDetails?.patientType}
                                        </span>
                                    </div>

                                    {/* Patient Details */}
                                    <div className="space-y-2 text-xs">
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <User className="w-3.5 h-3.5 text-gray-400" />
                                            <span>
                                                {patient.personalInfo?.gender} • {calculateAge(patient.personalInfo?.dateOfBirth)} yrs
                                                {patient.personalInfo?.bloodGroup && ` • ${patient.personalInfo.bloodGroup}`}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2 text-gray-600">
                                            <Phone className="w-3.5 h-3.5 text-gray-400" />
                                            <span>{patient.contactInfo?.mobileNumber || 'N/A'}</span>
                                        </div>

                                        {patient.admissionDetails?.department && (
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <Stethoscope className="w-3.5 h-3.5 text-gray-400" />
                                                <span className="font-medium">{patient.admissionDetails.department}</span>
                                            </div>
                                        )}

                                        {patient.contactInfo?.address && (
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <MapPin className="w-3.5 h-3.5 text-gray-400" />
                                                <span className="truncate">{patient.contactInfo.address}</span>
                                            </div>
                                        )}

                                        <div className="flex items-center gap-2 text-gray-500 pt-1 border-t border-gray-100">
                                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                            <span>Registered: {new Date(patient.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PatientListSidebar;

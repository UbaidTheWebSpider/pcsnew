import { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../../api/axiosConfig';
import {
    Users, UserPlus, Search, Trash2, Filter, Eye, CreditCard, RefreshCw,
    ChevronLeft, ChevronRight, MoreVertical
} from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { showSuccess, showError, showConfirm } from '../../utils/sweetalert';
import PatientProfileModal from './PatientProfileModal';
import HealthCardViewer from '../../components/HealthCardViewer';

const ManagePatients = () => {
    // Grid State
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const [limit, setLimit] = useState(10);

    // Filters State
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        status: '',
        patientType: '',
        gender: ''
    });

    // Modals & UI State
    const [showForm, setShowForm] = useState(false);
    const [selectedPatientId, setSelectedPatientId] = useState(null); // Profile Modal
    const [healthCardPatient, setHealthCardPatient] = useState(null); // Health Card Modal

    // Form Data (for registration)
    const [formData, setFormData] = useState({
        name: '', cnic: '', email: '', password: '', phone: '',
        address: '', dateOfBirth: '', gender: '',
        patientType: 'OPD', status: 'Active'
    });

    // Initial Load & Updates
    const fetchPatients = useCallback(async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const params = {
                page,
                limit,
                search: searchTerm,
                ...filters
            };

            // Clean empty filters
            Object.keys(params).forEach(key => params[key] === '' && delete params[key]);

            const { data } = await axiosInstance.get('/api/admin/patients', {
                params,
                headers: { Authorization: `Bearer ${token}` }
            });

            setPatients(data.patients);
            setTotalPages(data.totalPages);
            setTotalRecords(data.totalRecords);
        } catch (error) {
            console.error('Error fetching patients:', error);
            showError('Failed to load patients data');
        } finally {
            setLoading(false);
        }
    }, [page, limit, searchTerm, filters]);

    useEffect(() => {
        // Debounce search
        const timer = setTimeout(() => {
            fetchPatients();
        }, 300);
        return () => clearTimeout(timer);
    }, [fetchPatients]);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPage(1); // Reset page on filter change
    };

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
        setPage(1);
    };

    const handleDelete = async (id) => {
        const result = await showConfirm(
            'This action cannot be undone. All patient records will be removed.',
            'Delete Patient?'
        );

        if (result.isConfirmed) {
            try {
                const token = localStorage.getItem('token');
                await axiosInstance.delete(`/api/users/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                fetchPatients();
                showSuccess('Patient removed successfully');
            } catch (error) {
                showError('Failed to delete patient');
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axiosInstance.post('/api/users/patients', formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setShowForm(false);
            // Reset Form but keep defaults
            setFormData({
                name: '', cnic: '', email: '', password: '', phone: '',
                address: '', dateOfBirth: '', gender: '',
                patientType: 'OPD', status: 'Active'
            });
            fetchPatients();
            showSuccess('Patient registered successfully!');
        } catch (error) {
            showError('Failed to register patient: ' + (error.response?.data?.message || 'Unknown error'));
        }
    };

    return (
        <DashboardLayout>
            <div className="p-8 bg-gray-50 min-h-screen">
                {/* Modals */}
                <PatientProfileModal
                    patientId={selectedPatientId}
                    onClose={() => setSelectedPatientId(null)}
                />

                {healthCardPatient && (
                    <HealthCardViewer
                        patient={healthCardPatient}
                        onClose={() => setHealthCardPatient(null)}
                    />
                )}

                <div className="max-w-7xl mx-auto space-y-6">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800">Registered Patients</h1>
                            <p className="text-gray-500 mt-1">Hospital Patient Management System</p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={fetchPatients}
                                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200 bg-white"
                                title="Refresh Data"
                            >
                                <RefreshCw size={20} />
                            </button>
                            <button
                                onClick={() => setShowForm(!showForm)}
                                className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 shadow-sm transition-all"
                            >
                                <UserPlus size={20} /> Add New Patient
                            </button>
                        </div>
                    </div>

                    {/* Registration Form (Collapsible) */}
                    {showForm && (
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 transition-all">
                            <h2 className="text-lg font-semibold mb-4 text-gray-800">New Patient Registration</h2>
                            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {/* Basic Info */}
                                <input type="text" placeholder="Full Name *" className="input-field" required
                                    value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                <input type="text" placeholder="CNIC / ID" className="input-field"
                                    value={formData.cnic} onChange={e => setFormData({ ...formData, cnic: e.target.value })} />
                                <input type="text" placeholder="Phone *" className="input-field" required
                                    value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />

                                {/* Demographics */}
                                <input type="date" placeholder="DOB" className="input-field"
                                    value={formData.dateOfBirth} onChange={e => setFormData({ ...formData, dateOfBirth: e.target.value })} />
                                <select className="input-field" value={formData.gender} onChange={e => setFormData({ ...formData, gender: e.target.value })}>
                                    <option value="">Select Gender</option>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                    <option value="other">Other</option>
                                </select>
                                <select className="input-field" value={formData.patientType} onChange={e => setFormData({ ...formData, patientType: e.target.value })}>
                                    <option value="OPD">OPD (Outpatient)</option>
                                    <option value="IPD">IPD (Inpatient)</option>
                                    <option value="ER">ER (Emergency)</option>
                                </select>

                                {/* Account */}
                                <input type="email" placeholder="Email" className="input-field"
                                    value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                                <input type="password" placeholder="Password *" className="input-field" required
                                    value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
                                <input type="text" placeholder="Address" className="input-field md:col-span-2 lg:col-span-1"
                                    value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />

                                <div className="md:col-span-2 lg:col-span-3 flex justify-end gap-3 mt-2">
                                    <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
                                    <button type="submit" className="btn-primary">Register Patient</button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Filters & Search Toolbar */}
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search by name, ID, or phone..."
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                                value={searchTerm}
                                onChange={handleSearch}
                            />
                        </div>

                        <div className="flex flex-wrap gap-3 w-full md:w-auto">
                            <select
                                className="filter-select"
                                value={filters.status}
                                onChange={(e) => handleFilterChange('status', e.target.value)}
                            >
                                <option value="">All Status</option>
                                <option value="Active">Active</option>
                                <option value="Discharged">Discharged</option>
                                <option value="Deceased">Deceased</option>
                            </select>

                            <select
                                className="filter-select"
                                value={filters.patientType}
                                onChange={(e) => handleFilterChange('patientType', e.target.value)}
                            >
                                <option value="">All Types</option>
                                <option value="OPD">OPD</option>
                                <option value="IPD">IPD</option>
                                <option value="ER">ER</option>
                            </select>

                            <select
                                className="filter-select"
                                value={filters.gender}
                                onChange={(e) => handleFilterChange('gender', e.target.value)}
                            >
                                <option value="">All Genders</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                            </select>
                        </div>
                    </div>

                    {/* Data Grid */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-200">
                                        <th className="p-4 font-semibold text-gray-600 text-sm">Patient</th>
                                        <th className="p-4 font-semibold text-gray-600 text-sm">Type</th>
                                        <th className="p-4 font-semibold text-gray-600 text-sm">Contact</th>
                                        <th className="p-4 font-semibold text-gray-600 text-sm">Age/Gender</th>
                                        <th className="p-4 font-semibold text-gray-600 text-sm">Status</th>
                                        <th className="p-4 font-semibold text-gray-600 text-sm">Registered</th>
                                        <th className="p-4 font-semibold text-gray-600 text-sm text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {loading ? (
                                        <tr>
                                            <td colSpan="7" className="p-8 text-center text-gray-500">
                                                <div className="flex justify-center items-center gap-2">
                                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
                                                    Loading records...
                                                </div>
                                            </td>
                                        </tr>
                                    ) : patients.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="p-12 text-center text-gray-500">
                                                <div className="flex flex-col items-center gap-3">
                                                    <Users size={48} className="text-gray-300" />
                                                    <p className="font-medium">No patients found</p>
                                                    <p className="text-sm">Try adjusting your filters or search terms</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        patients.map((patient) => (
                                            <tr key={patient._id} className="hover:bg-gray-50 transition-colors group">
                                                <td className="p-4">
                                                    <div>
                                                        <p className="font-medium text-gray-900">{patient.name}</p>
                                                        <p className="text-xs text-gray-500 font-mono">{patient.patientId || 'Pending ID'}</p>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${patient.patientType === 'ER' ? 'bg-red-50 text-red-700 border-red-200' :
                                                        patient.patientType === 'IPD' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                                            'bg-blue-50 text-blue-700 border-blue-200'
                                                        }`}>
                                                        {patient.patientType || 'OPD'}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <div className="text-sm text-gray-600">
                                                        <p>{patient.contact?.phone || 'N/A'}</p>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-sm text-gray-600">
                                                    {patient.age || '?'} Y / <span className="capitalize">{patient.gender || '-'}</span>
                                                </td>
                                                <td className="p-4">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${patient.status === 'Active' ? 'bg-emerald-50 text-emerald-700' :
                                                        patient.status === 'Discharged' ? 'bg-gray-100 text-gray-600' :
                                                            'bg-red-50 text-red-600'
                                                        }`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${patient.status === 'Active' ? 'bg-emerald-500' :
                                                            patient.status === 'Discharged' ? 'bg-gray-400' :
                                                                'bg-red-500'
                                                            }`}></span>
                                                        {patient.status || 'Active'}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-sm text-gray-500">
                                                    {new Date(patient.createdAt).toLocaleDateString()}
                                                </td>
                                                <td className="p-4 text-right">
                                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => setSelectedPatientId(patient._id)}
                                                            className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                            title="View Profile"
                                                        >
                                                            <Eye size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => setHealthCardPatient(patient)}
                                                            className="p-1.5 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                                            title="Digital Health Card"
                                                        >
                                                            <CreditCard size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(patient._id)}
                                                            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Delete"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
                            <p className="text-sm text-gray-500">
                                Showing <span className="font-medium">{(page - 1) * limit + 1}</span> to <span className="font-medium">{Math.min(page * limit, totalRecords)}</span> of <span className="font-medium">{totalRecords}</span> results
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="p-2 border border-gray-300 rounded-lg bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                <button
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="p-2 border border-gray-300 rounded-lg bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .input-field {
                    @apply p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 focus:bg-white transition-all outline-none w-full text-sm;
                }
                .filter-select {
                    @apply px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm text-gray-700 min-w-[140px];
                }
                .btn-primary {
                    @apply bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition-colors shadow-sm text-sm;
                }
                .btn-secondary {
                    @apply bg-white text-gray-700 border border-gray-200 px-5 py-2.5 rounded-xl font-medium hover:bg-gray-50 transition-colors text-sm;
                }
            `}</style>
        </DashboardLayout>
    );
};

export default ManagePatients;

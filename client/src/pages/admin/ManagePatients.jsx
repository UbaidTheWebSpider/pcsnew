import { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../../api/axiosConfig';
import {
    Users, UserPlus, Search, Trash2, Filter, Eye, CreditCard, RefreshCw,
    ChevronLeft, ChevronRight, MoreVertical, Edit
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
    const [editMode, setEditMode] = useState(false);
    const [editingPatientId, setEditingPatientId] = useState(null);
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
            'This action cannot be undone. All patient records will be removed from the active system.',
            'Delete Patient?'
        );

        if (result.isConfirmed) {
            try {
                const token = localStorage.getItem('token');
                await axiosInstance.delete(`/api/admin/patients/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                fetchPatients();
                showSuccess('Patient removed successfully');
            } catch (error) {
                showError('Failed to delete patient');
            }
        }
    };

    const handleEdit = (patient) => {
        setEditMode(true);
        setEditingPatientId(patient._id);
        setFormData({
            name: patient.name || '',
            fatherName: patient.fatherName || '',
            cnic: patient.cnic || '',
            email: patient.contact?.email || patient.email || '',
            password: '',
            phone: patient.contact?.phone || '',
            address: patient.contact?.address || '',
            dateOfBirth: patient.dateOfBirth ? new Date(patient.dateOfBirth).toISOString().split('T')[0] : '',
            gender: patient.gender || '',
            bloodGroup: patient.bloodGroup || '',
            patientType: patient.patientType || 'OPD',
            status: patient.status || 'Active',
            emergencyContact: {
                name: patient.emergencyContact?.name || '',
                phone: patient.emergencyContact?.phone || '',
                relation: patient.emergencyContact?.relation || ''
            }
        });
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const resetForm = () => {
        setShowForm(false);
        setEditMode(false);
        setEditingPatientId(null);
        setFormData({
            name: '', fatherName: '', cnic: '', email: '', password: '', phone: '',
            address: '', dateOfBirth: '', gender: '', bloodGroup: '',
            patientType: 'OPD', status: 'Active',
            emergencyContact: { name: '', phone: '', relation: '' }
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');

            if (editMode) {
                // Update Logic
                await axiosInstance.put(`/api/admin/patients/${editingPatientId}`, formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                showSuccess('Patient updated successfully!');
            } else {
                // Create Logic
                await axiosInstance.post('/api/users/patients', formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                showSuccess('Patient registered successfully!');
            }

            resetForm();
            fetchPatients();
        } catch (error) {
            showError((editMode ? 'Failed to update' : 'Failed to register') + ' patient: ' + (error.response?.data?.message || 'Unknown error'));
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
                                onClick={() => {
                                    if (showForm) {
                                        resetForm();
                                    } else {
                                        setShowForm(true);
                                    }
                                }}
                                className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 shadow-sm transition-all"
                            >
                                <UserPlus size={20} /> {showForm && editMode ? 'New Enrollment' : 'Add New Patient'}
                            </button>
                        </div>
                    </div>

                    {/* Registration Form (Collapsible) */}
                    {showForm && (
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 transition-all">
                            <h2 className="text-lg font-semibold mb-4 text-gray-800">
                                {editMode ? `Edit Patient: ${formData.name}` : 'New Patient Registration'}
                            </h2>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {/* Personal Info */}
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-semibold text-indigo-600 uppercase tracking-wider">Personal Information</h3>
                                        <input type="text" placeholder="Full Name *" className="input-field" required
                                            value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                        <input type="text" placeholder="Father's / Guardian Name" className="input-field"
                                            value={formData.fatherName} onChange={e => setFormData({ ...formData, fatherName: e.target.value })} />
                                        <div className="grid grid-cols-2 gap-3">
                                            <input type="date" placeholder="DOB" className="input-field"
                                                value={formData.dateOfBirth} onChange={e => setFormData({ ...formData, dateOfBirth: e.target.value })} />
                                            <select className="input-field" value={formData.gender} onChange={e => setFormData({ ...formData, gender: e.target.value })}>
                                                <option value="">Gender</option>
                                                <option value="male">Male</option>
                                                <option value="female">Female</option>
                                                <option value="other">Other</option>
                                            </select>
                                        </div>
                                        <select className="input-field" value={formData.bloodGroup} onChange={e => setFormData({ ...formData, bloodGroup: e.target.value })}>
                                            <option value="">Select Blood Group</option>
                                            {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                                                <option key={bg} value={bg}>{bg}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Contact & Bio Info */}
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-semibold text-indigo-600 uppercase tracking-wider">Contact & Identity</h3>
                                        <input type="text" placeholder="CNIC / ID Number" className="input-field"
                                            value={formData.cnic} onChange={e => setFormData({ ...formData, cnic: e.target.value })} />
                                        <input type="text" placeholder="Phone Number *" className="input-field" required
                                            value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                                        <input type="email" placeholder="Email Address" className="input-field"
                                            value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                                        <input type="text" placeholder="Residential Address" className="input-field"
                                            value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                                    </div>

                                    {/* System & Emergency */}
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-semibold text-indigo-600 uppercase tracking-wider">System & Emergency</h3>
                                        <div className="grid grid-cols-2 gap-3">
                                            <select className="input-field" value={formData.patientType} onChange={e => setFormData({ ...formData, patientType: e.target.value })}>
                                                <option value="OPD">OPD</option>
                                                <option value="IPD">IPD</option>
                                                <option value="ER">ER</option>
                                            </select>
                                            <select className="input-field" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                                                <option value="Active">Active</option>
                                                <option value="Discharged">Discharged</option>
                                                <option value="Deceased">Deceased</option>
                                            </select>
                                        </div>
                                        <input type="password" placeholder={editMode ? "New Password (Optional)" : "Account Password *"} className="input-field" required={!editMode}
                                            value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
                                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-3">
                                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Emergency Contact</p>
                                            <input type="text" placeholder="Name" className="input-field bg-white"
                                                value={formData.emergencyContact?.name} onChange={e => setFormData({ ...formData, emergencyContact: { ...formData.emergencyContact, name: e.target.value } })} />
                                            <div className="grid grid-cols-2 gap-2">
                                                <input type="text" placeholder="Phone" className="input-field bg-white"
                                                    value={formData.emergencyContact?.phone} onChange={e => setFormData({ ...formData, emergencyContact: { ...formData.emergencyContact, phone: e.target.value } })} />
                                                <input type="text" placeholder="Relation" className="input-field bg-white"
                                                    value={formData.emergencyContact?.relation} onChange={e => setFormData({ ...formData, emergencyContact: { ...formData.emergencyContact, relation: e.target.value } })} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                                    <button type="button" onClick={resetForm} className="btn-secondary">Cancel</button>
                                    <button type="submit" className="btn-primary px-10">
                                        {editMode ? 'Update Profile' : 'Register Patient'}
                                    </button>
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
                                        <th className="p-4 font-semibold text-gray-400 text-[10px] uppercase tracking-widest">ID</th>
                                        <th className="p-4 font-semibold text-gray-400 text-[10px] uppercase tracking-widest">Patient Details</th>
                                        <th className="p-4 font-semibold text-gray-400 text-[10px] uppercase tracking-widest">Classification</th>
                                        <th className="p-4 font-semibold text-gray-400 text-[10px] uppercase tracking-widest">Blood</th>
                                        <th className="p-4 font-semibold text-gray-400 text-[10px] uppercase tracking-widest">Status</th>
                                        <th className="p-4 font-semibold text-gray-400 text-[10px] uppercase tracking-widest">Created</th>
                                        <th className="p-4 font-semibold text-gray-400 text-[10px] uppercase tracking-widest text-right">Actions</th>
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
                                            <tr key={patient._id} className="hover:bg-gray-50 transition-all group">
                                                <td className="p-4">
                                                    <span className="font-mono text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded border border-indigo-100 uppercase">
                                                        {patient.patientId}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-50 to-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-xs">
                                                            {patient.name?.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-bold text-gray-900 leading-tight">{patient.name}</div>
                                                            <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-tight">{patient.contact?.phone || 'No Phone'}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex flex-col">
                                                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold inline-block w-fit uppercase border ${patient.patientType === 'ER' ? 'bg-red-50 text-red-700 border-red-200' :
                                                            patient.patientType === 'IPD' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                                                'bg-blue-50 text-blue-700 border-blue-200'
                                                            }`}>
                                                            {patient.patientType || 'OPD'}
                                                        </span>
                                                        <span className="text-[10px] text-gray-400 font-bold uppercase mt-1">{patient.gender || 'Unknown'}</span>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    {patient.bloodGroup ? (
                                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                                                            <span className="w-1 h-1 rounded-full bg-indigo-500"></span>
                                                            {patient.bloodGroup}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-300 font-semibold text-xs">-</span>
                                                    )}
                                                </td>
                                                <td className="p-4">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight ${patient.status === 'Active' ? 'bg-emerald-50 text-emerald-700' :
                                                        patient.status === 'Discharged' ? 'bg-gray-100 text-gray-600' :
                                                            'bg-red-50 text-red-600'
                                                        }`}>
                                                        {patient.status || 'Active'}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-[10px] text-gray-500 font-semibold uppercase">
                                                    {new Date(patient.createdAt).toLocaleDateString()}
                                                </td>
                                                <td className="p-4 text-right">
                                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => handleEdit(patient)}
                                                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                            title="Edit Profile"
                                                        >
                                                            <Edit size={18} />
                                                        </button>
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

import { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../../api/axiosConfig';
import {
    Users, UserPlus, Search, Trash2, Filter, Eye, RefreshCw,
    ChevronLeft, ChevronRight, Edit, Briefcase, GraduationCap, Clock, Phone, Mail, MapPin
} from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { showSuccess, showError, showConfirm } from '../../utils/sweetalert';

const ManagePharmacists = () => {
    // Grid State
    const [pharmacists, setPharmacists] = useState([]);
    const [pharmacies, setPharmacies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const [limit, setLimit] = useState(10);

    // Filters State
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        status: '',
        employmentType: ''
    });

    // Modals & UI State
    const [showForm, setShowForm] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [editingPharmacistId, setEditingPharmacistId] = useState(null);
    const [viewingPharmacist, setViewingPharmacist] = useState(null);

    // Form Data
    const [formData, setFormData] = useState({
        fullName: '',
        gender: 'Male',
        dateOfBirth: '',
        professionalDetails: {
            registrationNumber: '',
            qualification: 'Pharm-D',
            yearsOfExperience: 0,
            licenseExpiryDate: '',
            specialization: ''
        },
        assignment: {
            assignedPharmacy: '',
            employmentType: 'Full-Time',
            shift: 'Morning',
            status: 'Active'
        },
        contact: {
            email: '',
            phoneNumber: '',
            address: ''
        }
    });

    const fetchPharmacists = useCallback(async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const params = {
                page,
                limit,
                search: searchTerm,
                ...filters
            };

            const { data } = await axiosInstance.get('/api/pharmacists', {
                params,
                headers: { Authorization: `Bearer ${token}` }
            });

            setPharmacists(data.pharmacists);
            setTotalPages(data.totalPages);
            setTotalRecords(data.totalRecords);
        } catch (error) {
            console.error('Error fetching pharmacists:', error);
            showError('Failed to load pharmacists data');
        } finally {
            setLoading(false);
        }
    }, [page, limit, searchTerm, filters]);

    const fetchPharmacies = async () => {
        try {
            const token = localStorage.getItem('token');
            const { data } = await axiosInstance.get('/api/pharmacies', {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Assuming the structure from Pharmacy model
            setPharmacies(data.pharmacies || []);
        } catch (error) {
            console.error('Error fetching pharmacies:', error);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchPharmacists();
        }, 300);
        return () => clearTimeout(timer);
    }, [fetchPharmacists]);

    useEffect(() => {
        fetchPharmacies();
    }, []);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPage(1);
    };

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
        setPage(1);
    };

    const handleDelete = async (id) => {
        const result = await showConfirm(
            'This will soft-delete the pharmacist record. Their status will be set to Inactive.',
            'Remove Pharmacist?'
        );

        if (result.isConfirmed) {
            try {
                const token = localStorage.getItem('token');
                await axiosInstance.delete(`/api/pharmacists/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                fetchPharmacists();
                showSuccess('Pharmacist removed successfully');
            } catch (error) {
                showError('Failed to delete pharmacist');
            }
        }
    };

    const handleEdit = (pharmacist) => {
        setEditMode(true);
        setEditingPharmacistId(pharmacist._id);
        setFormData({
            fullName: pharmacist.fullName || '',
            gender: pharmacist.gender || 'Male',
            dateOfBirth: pharmacist.dateOfBirth ? new Date(pharmacist.dateOfBirth).toISOString().split('T')[0] : '',
            professionalDetails: {
                registrationNumber: pharmacist.professionalDetails?.registrationNumber || '',
                qualification: pharmacist.professionalDetails?.qualification || 'Pharm-D',
                yearsOfExperience: pharmacist.professionalDetails?.yearsOfExperience || 0,
                licenseExpiryDate: pharmacist.professionalDetails?.licenseExpiryDate ? new Date(pharmacist.professionalDetails.licenseExpiryDate).toISOString().split('T')[0] : '',
                specialization: pharmacist.professionalDetails?.specialization || ''
            },
            assignment: {
                assignedPharmacy: pharmacist.assignment?.assignedPharmacy?._id || pharmacist.assignment?.assignedPharmacy || '',
                employmentType: pharmacist.assignment?.employmentType || 'Full-Time',
                shift: pharmacist.assignment?.shift || 'Morning',
                status: pharmacist.assignment?.status || 'Active'
            },
            contact: {
                email: pharmacist.contact?.email || '',
                phoneNumber: pharmacist.contact?.phoneNumber || '',
                address: pharmacist.contact?.address || ''
            }
        });
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const resetForm = () => {
        setShowForm(false);
        setEditMode(false);
        setEditingPharmacistId(null);
        setFormData({
            fullName: '',
            gender: 'Male',
            dateOfBirth: '',
            professionalDetails: {
                registrationNumber: '',
                qualification: 'Pharm-D',
                yearsOfExperience: 0,
                licenseExpiryDate: '',
                specialization: ''
            },
            assignment: {
                assignedPharmacy: '',
                employmentType: 'Full-Time',
                shift: 'Morning',
                status: 'Active'
            },
            contact: {
                email: '',
                phoneNumber: '',
                address: ''
            }
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');

            if (editMode) {
                await axiosInstance.put(`/api/pharmacists/${editingPharmacistId}`, formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                showSuccess('Pharmacist updated successfully!');
            } else {
                await axiosInstance.post('/api/pharmacists', formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                showSuccess('Pharmacist registered successfully!');
            }

            resetForm();
            fetchPharmacists();
        } catch (error) {
            showError((editMode ? 'Failed to update' : 'Failed to register') + ' pharmacist: ' + (error.response?.data?.message || 'Unknown error'));
        }
    };

    return (
        <DashboardLayout>
            <div className="p-8 bg-gray-50 min-h-screen">
                <div className="max-w-7xl mx-auto space-y-6">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800">Pharmacist Management</h1>
                            <p className="text-gray-500 mt-1">Manage hospital pharmacy staff and assignments</p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={fetchPharmacists}
                                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200 bg-white"
                                title="Refresh Data"
                            >
                                <RefreshCw size={20} />
                            </button>
                            <button
                                onClick={() => (showForm ? resetForm() : setShowForm(true))}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 shadow-sm transition-all"
                            >
                                <UserPlus size={20} /> {showForm && editMode ? 'New Enrollment' : 'Add Pharmacist'}
                            </button>
                        </div>
                    </div>

                    {/* Registration Form */}
                    {showForm && (
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 transition-all">
                            <h2 className="text-lg font-semibold mb-4 text-gray-800">
                                {editMode ? `Edit Pharmacist: ${formData.fullName}` : 'New Pharmacist Registration'}
                            </h2>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {/* Personal Info */}
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-bold text-blue-600 uppercase tracking-wider">Personal Information</h3>
                                        <input type="text" placeholder="Full Name *" className="input-field" required
                                            value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })} />
                                        <div className="grid grid-cols-2 gap-3">
                                            <input type="date" placeholder="DOB" className="input-field"
                                                value={formData.dateOfBirth} onChange={e => setFormData({ ...formData, dateOfBirth: e.target.value })} />
                                            <select className="input-field" value={formData.gender} onChange={e => setFormData({ ...formData, gender: e.target.value })}>
                                                <option value="Male">Male</option>
                                                <option value="Female">Female</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>
                                        <input type="email" placeholder="Email Address *" className="input-field" required
                                            value={formData.contact.email} onChange={e => setFormData({ ...formData, contact: { ...formData.contact, email: e.target.value } })} />
                                        <input type="text" placeholder="Phone Number *" className="input-field" required
                                            value={formData.contact.phoneNumber} onChange={e => setFormData({ ...formData, contact: { ...formData.contact, phoneNumber: e.target.value } })} />
                                    </div>

                                    {/* Professional Details */}
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-bold text-blue-600 uppercase tracking-wider">Professional Details</h3>
                                        <input type="text" placeholder="Registration Number *" className="input-field" required
                                            value={formData.professionalDetails.registrationNumber} onChange={e => setFormData({ ...formData, professionalDetails: { ...formData.professionalDetails, registrationNumber: e.target.value } })} />
                                        <div className="grid grid-cols-2 gap-3">
                                            <select className="input-field" value={formData.professionalDetails.qualification} onChange={e => setFormData({ ...formData, professionalDetails: { ...formData.professionalDetails, qualification: e.target.value } })}>
                                                <option value="Pharm-D">Pharm-D</option>
                                                <option value="B.Pharm">B.Pharm</option>
                                                <option value="M.Pharm">M.Pharm</option>
                                                <option value="Other">Other</option>
                                            </select>
                                            <input type="number" placeholder="Experience (Years)" className="input-field"
                                                value={formData.professionalDetails.yearsOfExperience} onChange={e => setFormData({ ...formData, professionalDetails: { ...formData.professionalDetails, yearsOfExperience: e.target.value } })} />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">License Expiry *</label>
                                            <input type="date" className="input-field" required
                                                value={formData.professionalDetails.licenseExpiryDate} onChange={e => setFormData({ ...formData, professionalDetails: { ...formData.professionalDetails, licenseExpiryDate: e.target.value } })} />
                                        </div>
                                        <input type="text" placeholder="Specialization" className="input-field"
                                            value={formData.professionalDetails.specialization} onChange={e => setFormData({ ...formData, professionalDetails: { ...formData.professionalDetails, specialization: e.target.value } })} />
                                    </div>

                                    {/* Work Assignment */}
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-bold text-blue-600 uppercase tracking-wider">Work Assignment</h3>
                                        <select className="input-field" value={formData.assignment.assignedPharmacy} onChange={e => setFormData({ ...formData, assignment: { ...formData.assignment, assignedPharmacy: e.target.value } })}>
                                            <option value="">Select Pharmacy</option>
                                            {pharmacies.map(p => (
                                                <option key={p._id} value={p._id}>{p.basicProfile?.pharmacyName}</option>
                                            ))}
                                        </select>
                                        <div className="grid grid-cols-2 gap-3">
                                            <select className="input-field" value={formData.assignment.employmentType} onChange={e => setFormData({ ...formData, assignment: { ...formData.assignment, employmentType: e.target.value } })}>
                                                <option value="Full-Time">Full-Time</option>
                                                <option value="Part-Time">Part-Time</option>
                                                <option value="Contract">Contract</option>
                                            </select>
                                            <select className="input-field" value={formData.assignment.shift} onChange={e => setFormData({ ...formData, assignment: { ...formData.assignment, shift: e.target.value } })}>
                                                <option value="Morning">Morning</option>
                                                <option value="Evening">Evening</option>
                                                <option value="Night">Night</option>
                                                <option value="Rotating">Rotating</option>
                                            </select>
                                        </div>
                                        <select className="input-field" value={formData.assignment.status} onChange={e => setFormData({ ...formData, assignment: { ...formData.assignment, status: e.target.value } })}>
                                            <option value="Active">Active</option>
                                            <option value="Inactive">Inactive</option>
                                            <option value="Suspended">Suspended</option>
                                        </select>
                                        <textarea placeholder="Address" className="input-field h-20 resize-none"
                                            value={formData.contact.address} onChange={e => setFormData({ ...formData, contact: { ...formData.contact, address: e.target.value } })} />
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                                    <button type="button" onClick={resetForm} className="btn-secondary">Cancel</button>
                                    <button type="submit" className="btn-primary px-10">
                                        {editMode ? 'Update Profile' : 'Register Pharmacist'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Toolbar */}
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search by name, ID, or registration..."
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
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
                                <option value="Inactive">Inactive</option>
                                <option value="Suspended">Suspended</option>
                            </select>

                            <select
                                className="filter-select"
                                value={filters.employmentType}
                                onChange={(e) => handleFilterChange('employmentType', e.target.value)}
                            >
                                <option value="">All Types</option>
                                <option value="Full-Time">Full-Time</option>
                                <option value="Part-Time">Part-Time</option>
                                <option value="Contract">Contract</option>
                            </select>
                        </div>
                    </div>

                    {/* Data Grid */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-200">
                                        <th className="p-4 font-bold text-gray-400 text-[10px] uppercase tracking-widest">ID</th>
                                        <th className="p-4 font-bold text-gray-400 text-[10px] uppercase tracking-widest">Pharmacist</th>
                                        <th className="p-4 font-bold text-gray-400 text-[10px] uppercase tracking-widest">Professional</th>
                                        <th className="p-4 font-bold text-gray-400 text-[10px] uppercase tracking-widest">Assignment</th>
                                        <th className="p-4 font-bold text-gray-400 text-[10px] uppercase tracking-widest">Status</th>
                                        <th className="p-4 font-bold text-gray-400 text-[10px] uppercase tracking-widest text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {loading ? (
                                        <tr>
                                            <td colSpan="6" className="p-12 text-center">
                                                <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-2" />
                                                <p className="text-gray-500 text-sm">Loading pharmacists...</p>
                                            </td>
                                        </tr>
                                    ) : pharmacists.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="p-12 text-center">
                                                <Users className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                                                <p className="text-gray-500 font-medium">No pharmacists found</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        pharmacists.map((pharmacist) => (
                                            <tr key={pharmacist._id} className="hover:bg-gray-50 transition-all group">
                                                <td className="p-4">
                                                    <span className="font-mono text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-100 uppercase">
                                                        {pharmacist.pharmacistId}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700 font-bold text-xs uppercase">
                                                            {pharmacist.fullName?.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-bold text-gray-900 leading-tight">{pharmacist.fullName}</div>
                                                            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">{pharmacist.contact?.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-600 uppercase">
                                                            <GraduationCap size={12} className="text-blue-500" />
                                                            {pharmacist.professionalDetails?.qualification}
                                                        </div>
                                                        <div className="text-[9px] text-gray-400 font-bold uppercase">
                                                            Reg: {pharmacist.professionalDetails?.registrationNumber}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-700 uppercase">
                                                            <Briefcase size={12} className="text-indigo-500" />
                                                            {pharmacist.assignment?.assignedPharmacy?.basicProfile?.pharmacyName || 'Unassigned'}
                                                        </div>
                                                        <div className="flex items-center gap-3 text-[9px] text-gray-400 font-bold uppercase">
                                                            <span className="flex items-center gap-1"><Clock size={10} /> {pharmacist.assignment?.shift}</span>
                                                            <span className="bg-gray-100 px-1 rounded">{pharmacist.assignment?.employmentType}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-tight ${pharmacist.assignment?.status === 'Active' ? 'bg-emerald-50 text-emerald-700' :
                                                        pharmacist.assignment?.status === 'Inactive' ? 'bg-gray-100 text-gray-600' :
                                                            'bg-red-50 text-red-600'
                                                        }`}>
                                                        {pharmacist.assignment?.status}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => setViewingPharmacist(pharmacist)}
                                                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                            title="View Profile"
                                                        >
                                                            <Eye size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleEdit(pharmacist)}
                                                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                            title="Edit Profile"
                                                        >
                                                            <Edit size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(pharmacist._id)}
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

            {/* Profile View Modal */}
            {viewingPharmacist && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="relative h-32 bg-gradient-to-r from-blue-600 to-indigo-700 p-6">
                            <button
                                onClick={() => setViewingPharmacist(null)}
                                className="absolute top-4 right-4 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors"
                            >
                                <ChevronRight className="rotate-45" size={20} />
                            </button>
                            <div className="flex items-end gap-6 h-full translate-y-12">
                                <div className="w-24 h-24 rounded-2xl bg-white p-1 shadow-lg border-4 border-white">
                                    <div className="w-full h-full rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-black text-3xl uppercase">
                                        {viewingPharmacist.fullName?.charAt(0)}
                                    </div>
                                </div>
                                <div className="mb-2">
                                    <div className="text-2xl font-black text-white drop-shadow-sm">{viewingPharmacist.fullName}</div>
                                    <div className="flex items-center gap-2 text-white/90 font-bold text-xs uppercase tracking-widest mt-1">
                                        <span className="bg-white/20 px-2 py-0.5 rounded uppercase">{viewingPharmacist.pharmacistId}</span>
                                        <span>•</span>
                                        <span>{viewingPharmacist.professionalDetails?.qualification}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Content */}
                        <div className="p-8 pt-16 grid grid-cols-1 md:grid-cols-2 gap-8 max-h-[70vh] overflow-y-auto">
                            {/* Left Column: Professional */}
                            <div className="space-y-6">
                                <div>
                                    <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <GraduationCap size={14} /> Professional Details
                                    </h4>
                                    <div className="space-y-3 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500 font-medium">Registration No:</span>
                                            <span className="text-gray-900 font-black">{viewingPharmacist.professionalDetails?.registrationNumber}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500 font-medium">Experience:</span>
                                            <span className="text-gray-900 font-black">{viewingPharmacist.professionalDetails?.yearsOfExperience} Years</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500 font-medium">License Expiry:</span>
                                            <span className="text-gray-900 font-black">{viewingPharmacist.professionalDetails?.licenseExpiryDate ? new Date(viewingPharmacist.professionalDetails.licenseExpiryDate).toLocaleDateString() : 'N/A'}</span>
                                        </div>
                                        {viewingPharmacist.professionalDetails?.specialization && (
                                            <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
                                                <span className="text-gray-500 font-medium">Specialization:</span>
                                                <span className="text-gray-900 font-black">{viewingPharmacist.professionalDetails?.specialization}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <Briefcase size={14} /> Workplace Assignment
                                    </h4>
                                    <div className="space-y-3 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-gray-500 font-medium text-[10px] uppercase">Pharmacy</span>
                                            <span className="text-gray-900 font-black">{viewingPharmacist.assignment?.assignedPharmacy?.basicProfile?.pharmacyName || 'Not Assigned'}</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 pt-2">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-gray-500 font-medium text-[10px] uppercase">Shift</span>
                                                <span className="text-gray-900 font-black">{viewingPharmacist.assignment?.shift}</span>
                                            </div>
                                            <div className="flex flex-col gap-1 text-right">
                                                <span className="text-gray-500 font-medium text-[10px] uppercase">Employment</span>
                                                <span className="text-gray-900 font-black">{viewingPharmacist.assignment?.employmentType}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Contact & Personal */}
                            <div className="space-y-6">
                                <div>
                                    <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <Phone size={14} /> Contact Information
                                    </h4>
                                    <div className="space-y-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                        <div className="flex gap-3">
                                            <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600"><Mail size={16} /></div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] text-gray-400 font-bold uppercase">Email</span>
                                                <span className="text-sm text-gray-900 font-bold break-all">{viewingPharmacist.contact?.email}</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-3">
                                            <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600"><Phone size={16} /></div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] text-gray-400 font-bold uppercase">Phone</span>
                                                <span className="text-sm text-gray-900 font-bold">{viewingPharmacist.contact?.phoneNumber}</span>
                                            </div>
                                        </div>
                                        {viewingPharmacist.contact?.address && (
                                            <div className="flex gap-3">
                                                <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600"><MapPin size={16} /></div>
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] text-gray-400 font-bold uppercase">Address</span>
                                                    <span className="text-sm text-gray-900 font-bold">{viewingPharmacist.contact?.address}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-3">Other Details</h4>
                                    <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-gray-400 font-bold uppercase">Gender</span>
                                            <span className="text-sm text-gray-900 font-bold">{viewingPharmacist.gender}</span>
                                        </div>
                                        <div className="flex flex-col text-right">
                                            <span className="text-[10px] text-gray-400 font-bold uppercase">Date of Birth</span>
                                            <span className="text-sm text-gray-900 font-bold">{viewingPharmacist.dateOfBirth ? new Date(viewingPharmacist.dateOfBirth).toLocaleDateString() : 'N/A'}</span>
                                        </div>
                                        <div className="col-span-2 pt-2 border-t border-gray-200">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] text-gray-400 font-bold uppercase">Account Status</span>
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${viewingPharmacist.assignment?.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                                                    {viewingPharmacist.assignment?.status}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
                            <button
                                onClick={() => setViewingPharmacist(null)}
                                className="bg-white text-gray-700 font-bold text-xs uppercase tracking-widest px-6 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors shadow-sm"
                            >
                                Close Profile
                            </button>
                            <button
                                onClick={() => {
                                    const p = viewingPharmacist;
                                    setViewingPharmacist(null);
                                    handleEdit(p);
                                }}
                                className="bg-blue-600 text-white font-bold text-xs uppercase tracking-widest px-6 py-2.5 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
                            >
                                Edit Record
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .input-field {
                    @apply p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 focus:bg-white transition-all outline-none w-full text-sm;
                }
                .filter-select {
                    @apply px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm text-gray-700 min-w-[140px];
                }
                .btn-primary {
                    @apply bg-blue-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-sm text-sm;
                }
                .btn-secondary {
                    @apply bg-white text-gray-700 border border-gray-200 px-5 py-2.5 rounded-xl font-medium hover:bg-gray-50 transition-colors text-sm;
                }
            `}</style>
        </DashboardLayout>
    );
};

export default ManagePharmacists;

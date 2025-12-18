import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosConfig';
import { Plus, Trash2, Edit, Eye, CheckCircle, XCircle, Clock, FileText } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import Swal from 'sweetalert2';

const ManagePharmacies = () => {
    const navigate = useNavigate();
    const [pharmacies, setPharmacies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPharmacy, setSelectedPharmacy] = useState(null);
    const [editingPharmacy, setEditingPharmacy] = useState(null);
    const [stats, setStats] = useState({
        total: 0,
        active: 0,
        inactive: 0,
        pending: 0,
        draft: 0
    });
    const [filters, setFilters] = useState({
        status: '',
        approvalStatus: '',
        search: ''
    });

    const fetchPharmacies = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const queryParams = new URLSearchParams();
            if (filters.status) queryParams.append('status', filters.status);
            if (filters.approvalStatus) queryParams.append('approvalStatus', filters.approvalStatus);
            if (filters.search) queryParams.append('search', filters.search);

            const { data } = await axiosInstance.get(`/api/pharmacies?${queryParams.toString()}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPharmacies(data);
        } catch (error) {
            console.error('Error fetching pharmacies:', error);
            setPharmacies([]);
            if (error.response?.status !== 500) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Failed to fetch pharmacies',
                    confirmButtonColor: '#ef4444'
                });
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const token = localStorage.getItem('token');
            const { data } = await axiosInstance.get('/api/pharmacies/stats', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStats(data);
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    useEffect(() => {
        fetchPharmacies();
        fetchStats();
    }, [filters.status, filters.approvalStatus, filters.search]);

    const handleDelete = async (id, pharmacyName) => {
        const result = await Swal.fire({
            title: 'Delete Pharmacy?',
            text: `Are you sure you want to delete "${pharmacyName}"? This action cannot be undone.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Yes, delete it'
        });

        if (result.isConfirmed) {
            try {
                const token = localStorage.getItem('token');
                await axiosInstance.delete(`/api/pharmacies/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                Swal.fire('Deleted', 'Pharmacy deleted successfully', 'success');
                fetchPharmacies();
                fetchStats();
            } catch (error) {
                Swal.fire('Error', error.response?.data?.message || 'Failed to delete pharmacy', 'error');
            }
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axiosInstance.put(`/api/pharmacies/${editingPharmacy._id}`, editingPharmacy, {
                headers: { Authorization: `Bearer ${token}` }
            });

            Swal.fire('Success', 'Pharmacy updated successfully', 'success');
            setEditingPharmacy(null);
            fetchPharmacies();
        } catch (error) {
            Swal.fire('Error', error.response?.data?.message || 'Failed to update pharmacy', 'error');
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            'Active': 'bg-green-100 text-green-700 border-green-300',
            'Inactive': 'bg-gray-100 text-gray-700 border-gray-300'
        };
        return badges[status] || 'bg-gray-100 text-gray-700 border-gray-300';
    };

    const getApprovalBadge = (status) => {
        const badges = {
            'Draft': { class: 'bg-gray-100 text-gray-700 border-gray-300', icon: FileText },
            'Submitted': { class: 'bg-blue-100 text-blue-700 border-blue-300', icon: Clock },
            'Approved': { class: 'bg-green-100 text-green-700 border-green-300', icon: CheckCircle },
            'Rejected': { class: 'bg-red-100 text-red-700 border-red-300', icon: XCircle }
        };
        return badges[status] || badges['Draft'];
    };

    return (
        <DashboardLayout>
            <div className="p-8 pb-32">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800">Pharmacy Management</h1>
                            <p className="text-gray-500 mt-1">Manage hospital pharmacies and registrations</p>
                        </div>
                        <button
                            onClick={() => navigate('/admin/pharmacies/register')}
                            className="bg-blue-600 text-white px-6 py-3 rounded-xl flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-sm"
                        >
                            <Plus size={20} />
                            Register New Pharmacy
                        </button>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <div className="text-sm text-gray-500 mb-1">Total Pharmacies</div>
                            <div className="text-3xl font-bold text-gray-800">{stats.total}</div>
                        </div>
                        <div className="bg-green-50 p-6 rounded-xl shadow-sm border border-green-100">
                            <div className="text-sm text-green-600 mb-1">Active</div>
                            <div className="text-3xl font-bold text-green-700">{stats.active}</div>
                        </div>
                        <div className="bg-gray-50 p-6 rounded-xl shadow-sm border border-gray-100">
                            <div className="text-sm text-gray-600 mb-1">Inactive</div>
                            <div className="text-3xl font-bold text-gray-700">{stats.inactive}</div>
                        </div>
                        <div className="bg-blue-50 p-6 rounded-xl shadow-sm border border-blue-100">
                            <div className="text-sm text-blue-600 mb-1">Pending Approval</div>
                            <div className="text-3xl font-bold text-blue-700">{stats.pending}</div>
                        </div>
                        <div className="bg-orange-50 p-6 rounded-xl shadow-sm border border-orange-100">
                            <div className="text-sm text-orange-600 mb-1">Drafts</div>
                            <div className="text-3xl font-bold text-orange-700">{stats.draft}</div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                                <input
                                    type="text"
                                    placeholder="Search by name, code, or license..."
                                    value={filters.search}
                                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Operational Status</label>
                                <select
                                    value={filters.status}
                                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="">All Status</option>
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Approval Status</label>
                                <select
                                    value={filters.approvalStatus}
                                    onChange={(e) => setFilters({ ...filters, approvalStatus: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="">All Approvals</option>
                                    <option value="Draft">Draft</option>
                                    <option value="Submitted">Submitted</option>
                                    <option value="Approved">Approved</option>
                                    <option value="Rejected">Rejected</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Pharmacies Table */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        {loading ? (
                            <div className="p-12 text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                                <p className="text-gray-500 mt-4">Loading pharmacies...</p>
                            </div>
                        ) : pharmacies.length === 0 ? (
                            <div className="p-12 text-center">
                                <p className="text-gray-500">No pharmacies found</p>
                            </div>
                        ) : (
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className="p-4 font-semibold text-gray-600">Pharmacy Details</th>
                                        <th className="p-4 font-semibold text-gray-600">Type</th>
                                        <th className="p-4 font-semibold text-gray-600">License</th>
                                        <th className="p-4 font-semibold text-gray-600">Status</th>
                                        <th className="p-4 font-semibold text-gray-600">Approval</th>
                                        <th className="p-4 font-semibold text-gray-600">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pharmacies.map((pharmacy) => {
                                        const approvalBadge = getApprovalBadge(pharmacy.approvalWorkflow?.approvalStatus);
                                        const ApprovalIcon = approvalBadge.icon;

                                        return (
                                            <tr key={pharmacy._id} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                                                <td className="p-4">
                                                    <div className="font-medium text-gray-800">{pharmacy.basicProfile?.pharmacyName}</div>
                                                    <div className="text-sm text-gray-500">Code: {pharmacy.basicProfile?.pharmacyCode}</div>
                                                    <div className="text-sm text-gray-500">{pharmacy.basicProfile?.hospitalBranch}</div>
                                                </td>
                                                <td className="p-4">
                                                    <span className="text-gray-700">{pharmacy.basicProfile?.pharmacyType}</span>
                                                </td>
                                                <td className="p-4">
                                                    <div className="text-sm text-gray-700">{pharmacy.licensing?.licenseNumber}</div>
                                                    <div className="text-xs text-gray-500">
                                                        Expires: {pharmacy.licensing?.licenseExpiry ? new Date(pharmacy.licensing.licenseExpiry).toLocaleDateString() : 'N/A'}
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(pharmacy.basicProfile?.operationalStatus)}`}>
                                                        {pharmacy.basicProfile?.operationalStatus}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1 w-fit ${approvalBadge.class}`}>
                                                        <ApprovalIcon size={14} />
                                                        {pharmacy.approvalWorkflow?.approvalStatus}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => setSelectedPharmacy(pharmacy)}
                                                            className="text-blue-500 hover:text-blue-700 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                                                            title="View Details"
                                                        >
                                                            <Eye size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => setEditingPharmacy(pharmacy)}
                                                            className="text-amber-500 hover:text-amber-700 p-2 rounded-lg hover:bg-amber-50 transition-colors"
                                                            title="Edit Details"
                                                        >
                                                            <Edit size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(pharmacy._id, pharmacy.basicProfile?.pharmacyName)}
                                                            className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors"
                                                            title="Delete"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                {/* View Details Card - Modern UI at bottom */}
                {selectedPharmacy && (
                    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-40 transition-transform duration-300 transform translate-y-0" style={{ maxHeight: '50vh', overflowY: 'auto' }}>
                        <div className="max-w-7xl mx-auto p-6">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-800">{selectedPharmacy.basicProfile?.pharmacyName}</h2>
                                    <div className="flex items-center gap-3 mt-1">
                                        <span className="text-gray-500">In {selectedPharmacy.basicProfile?.hospitalBranch}</span>
                                        <span className="text-gray-300">|</span>
                                        <span className={`px-2 py-0.5 rounded text-xs border ${getStatusBadge(selectedPharmacy.basicProfile?.operationalStatus)}`}>
                                            {selectedPharmacy.basicProfile?.operationalStatus}
                                        </span>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedPharmacy(null)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                                    <XCircle size={24} />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <div className="space-y-3">
                                    <h3 className="font-semibold text-gray-900 border-b pb-2">Basic Info</h3>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <span className="text-gray-500">Code:</span>
                                        <span className="font-medium text-gray-900">{selectedPharmacy.basicProfile?.pharmacyCode}</span>
                                        <span className="text-gray-500">Type:</span>
                                        <span className="font-medium text-gray-900">{selectedPharmacy.basicProfile?.pharmacyType}</span>
                                        <span className="text-gray-500">Reg Date:</span>
                                        <span className="font-medium text-gray-900">{new Date(selectedPharmacy.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h3 className="font-semibold text-gray-900 border-b pb-2">Licensing</h3>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <span className="text-gray-500">License No:</span>
                                        <span className="font-medium text-gray-900">{selectedPharmacy.licensing?.licenseNumber}</span>
                                        <span className="text-gray-500">Type:</span>
                                        <span className="font-medium text-gray-900">{selectedPharmacy.licensing?.licenseType}</span>
                                        <span className="text-gray-500">Expires:</span>
                                        <span className={`font-medium ${new Date(selectedPharmacy.licensing?.licenseExpiry) < new Date() ? 'text-red-600' : 'text-green-600'}`}>
                                            {new Date(selectedPharmacy.licensing?.licenseExpiry).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h3 className="font-semibold text-gray-900 border-b pb-2">Location</h3>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <span className="text-gray-500">Branch:</span>
                                        <span className="font-medium text-gray-900">{selectedPharmacy.basicProfile?.hospitalBranch}</span>
                                        <span className="text-gray-500">Floor:</span>
                                        <span className="font-medium text-gray-900">{selectedPharmacy.physicalLocation?.floor}</span>
                                        <span className="text-gray-500">Wing:</span>
                                        <span className="font-medium text-gray-900">{selectedPharmacy.physicalLocation?.wing}</span>
                                        <span className="text-gray-500">Counters:</span>
                                        <span className="font-medium text-gray-900">{selectedPharmacy.physicalLocation?.counterNumbers?.join(', ')}</span>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h3 className="font-semibold text-gray-900 border-b pb-2">Pharmacist</h3>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <span className="text-gray-500">Registration:</span>
                                        <span className="font-medium text-gray-900">{selectedPharmacy.assignedPharmacist?.registrationNumber || 'N/A'}</span>
                                        <span className="text-gray-500">Qualification:</span>
                                        <span className="font-medium text-gray-900">{selectedPharmacy.assignedPharmacist?.qualification || 'N/A'}</span>
                                        <span className="text-gray-500">Shift:</span>
                                        <span className="font-medium text-gray-900">{selectedPharmacy.assignedPharmacist?.dutySchedule?.shift || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Edit Modal */}
                {editingPharmacy && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
                                <h2 className="text-xl font-bold text-gray-800">Edit Pharmacy Details</h2>
                                <button onClick={() => setEditingPharmacy(null)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                                    <XCircle size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleUpdate} className="p-6 space-y-6">
                                {/* Basic Info Section */}
                                <div className="space-y-4">
                                    <h3 className="text-md font-semibold text-blue-800 bg-blue-50 p-2 rounded">Basic Information</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Pharmacy Name</label>
                                            <input
                                                type="text"
                                                value={editingPharmacy.basicProfile?.pharmacyName}
                                                onChange={(e) => setEditingPharmacy({
                                                    ...editingPharmacy,
                                                    basicProfile: { ...editingPharmacy.basicProfile, pharmacyName: e.target.value }
                                                })}
                                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Pharmacy Type</label>
                                            <select
                                                value={editingPharmacy.basicProfile?.pharmacyType || ''}
                                                onChange={(e) => setEditingPharmacy({
                                                    ...editingPharmacy,
                                                    basicProfile: { ...editingPharmacy.basicProfile, pharmacyType: e.target.value }
                                                })}
                                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            >
                                                <option value="OPD Pharmacy">OPD Pharmacy</option>
                                                <option value="IPD Pharmacy">IPD Pharmacy</option>
                                                <option value="Emergency Pharmacy">Emergency Pharmacy</option>
                                                <option value="Clinical Pharmacy">Clinical Pharmacy</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Operational Status</label>
                                            <select
                                                value={editingPharmacy.basicProfile?.operationalStatus || 'Active'}
                                                onChange={(e) => setEditingPharmacy({
                                                    ...editingPharmacy,
                                                    basicProfile: { ...editingPharmacy.basicProfile, operationalStatus: e.target.value }
                                                })}
                                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            >
                                                <option value="Active">Active</option>
                                                <option value="Inactive">Inactive</option>
                                                <option value="Maintenance">Maintenance</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Hospital Branch</label>
                                            <select
                                                value={editingPharmacy.basicProfile?.hospitalBranch || 'Main Hospital'}
                                                onChange={(e) => setEditingPharmacy({
                                                    ...editingPharmacy,
                                                    basicProfile: { ...editingPharmacy.basicProfile, hospitalBranch: e.target.value }
                                                })}
                                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            >
                                                <option value="Main Hospital">Main Hospital</option>
                                                <option value="City Branch">City Branch</option>
                                                <option value="Suburban Clinic">Suburban Clinic</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Licensing Section */}
                                <div className="space-y-4">
                                    <h3 className="text-md font-semibold text-blue-800 bg-blue-50 p-2 rounded">Licensing</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">License Number</label>
                                            <input
                                                type="text"
                                                value={editingPharmacy.licensing?.licenseNumber}
                                                onChange={(e) => setEditingPharmacy({
                                                    ...editingPharmacy,
                                                    licensing: { ...editingPharmacy.licensing, licenseNumber: e.target.value }
                                                })}
                                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                                            <input
                                                type="date"
                                                value={editingPharmacy.licensing?.licenseExpiry ? new Date(editingPharmacy.licensing.licenseExpiry).toISOString().split('T')[0] : ''}
                                                onChange={(e) => setEditingPharmacy({
                                                    ...editingPharmacy,
                                                    licensing: { ...editingPharmacy.licensing, licenseExpiry: e.target.value }
                                                })}
                                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                                    <button
                                        type="button"
                                        onClick={() => setEditingPharmacy(null)}
                                        className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default ManagePharmacies;

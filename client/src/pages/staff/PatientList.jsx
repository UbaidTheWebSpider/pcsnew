import { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosConfig';
import DashboardLayout from '../../components/DashboardLayout';
import { Users, Search, Edit2, Trash2, X, ChevronLeft, ChevronRight, Eye, UserPlus, Filter, Activity } from 'lucide-react';
import Swal from 'sweetalert2';
import { mapStaffPatientsToDisplay } from '../../utils/patientMapper';

const PatientList = () => {
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editFormData, setEditFormData] = useState({});

    useEffect(() => {
        fetchPatients();
    }, [currentPage, searchTerm]);

    const fetchPatients = async () => {
        setLoading(true);
        try {
            console.log('Fetching patients from /api/staff/patients...');
            const token = localStorage.getItem('token');
            const { data } = await axiosInstance.get('/api/staff/patients', {
                params: { page: currentPage, limit: 10, search: searchTerm },
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('Patients response:', data);

            if (data.success && data.data) {
                // Map StaffPatient model to display format
                let patientsToMap = data.data;

                // Handle different response structures gracefully
                if (data.data.patients) patientsToMap = data.data.patients;

                const mappedPatients = mapStaffPatientsToDisplay(patientsToMap);
                setPatients(mappedPatients);
                setTotalPages(data.pagination?.totalPages || 1);
            } else {
                console.warn('Unexpected response structure:', data);
                setPatients([]);
            }
        } catch (error) {
            console.error('Error fetching patients:', error);
            // Enhanced error logging
            if (error.response) {
                console.error('Response data:', error.response.data);
                console.error('Response status:', error.response.status);
            }
            Swal.fire({
                icon: 'error',
                title: 'Data Fetch Error',
                text: error.response?.data?.message || 'Failed to fetch patients from the server.'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    const handleViewDetails = (patient) => {
        setSelectedPatient(patient);
    };

    const handleEdit = (patient) => {
        setEditFormData({
            name: patient.name || '',
            fatherName: patient.fatherName || '',
            gender: patient.gender || 'male',
            dateOfBirth: patient.dateOfBirth ? new Date(patient.dateOfBirth).toISOString().split('T')[0] : '',
            phone: patient.contact?.phone || '',
            address: patient.contact?.address || '',
            emergencyName: patient.emergencyContact?.name || '',
            emergencyRelation: patient.emergencyContact?.relation || '',
            emergencyPhone: patient.emergencyContact?.phone || '',
            bloodGroup: patient.bloodGroup || 'O+',
        });
        setSelectedPatient(patient);
        setShowEditModal(true);
    };

    const handleDelete = async (patient) => {
        const result = await Swal.fire({
            title: 'Delete Patient?',
            html: `Are you sure you want to delete <strong>${patient.name}</strong> (${patient.patientId})?<br><br><span class="text-red-600">This action cannot be undone.</span>`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#EF4444',
            cancelButtonColor: '#6B7280',
            confirmButtonText: 'Yes, Delete',
            cancelButtonText: 'Cancel'
        });

        if (result.isConfirmed) {
            try {
                const token = localStorage.getItem('token');
                await axiosInstance.delete(`/api/staff/patients/${patient._id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                Swal.fire({ icon: 'success', title: 'Deleted!', text: 'Patient deleted successfully', timer: 2000 });
                fetchPatients();
                if (selectedPatient?._id === patient._id) setSelectedPatient(null);
            } catch (error) {
                Swal.fire({ icon: 'error', title: 'Error', text: error.response?.data?.message || 'Failed to delete patient' });
            }
        }
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axiosInstance.put(`/api/staff/patients/${selectedPatient._id}`, {
                name: editFormData.name,
                fatherName: editFormData.fatherName,
                gender: editFormData.gender,
                dateOfBirth: editFormData.dateOfBirth,
                contact: { phone: editFormData.phone, address: editFormData.address },
                emergencyContact: {
                    name: editFormData.emergencyName,
                    relation: editFormData.emergencyRelation,
                    phone: editFormData.emergencyPhone
                },
                bloodGroup: editFormData.bloodGroup
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            Swal.fire({ icon: 'success', title: 'Updated!', text: 'Patient updated successfully', timer: 2000 });
            setShowEditModal(false);
            fetchPatients();
            setSelectedPatient(null);
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error', text: error.response?.data?.message || 'Failed to update patient' });
        }
    };

    return (
        <DashboardLayout>
            <div className="p-8 bg-gray-50 min-h-screen">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                                <Users className="text-blue-600" />
                                Patient Records
                            </h1>
                            <p className="text-gray-600 mt-1">Manage and view all registered patients</p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => window.location.href = '/staff/register-patient'}
                                className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-sm transition-all hover:shadow-md"
                            >
                                <UserPlus size={18} /> Add New Patient
                            </button>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
                        <div className="flex items-center gap-4">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="text"
                                    placeholder="Search by name, patient ID, CNIC, or phone..."
                                    value={searchTerm}
                                    onChange={handleSearch}
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none"
                                />
                            </div>
                            <button className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2">
                                <Filter size={18} /> Filter
                            </button>
                        </div>
                    </div>

                    {/* Patient Grid */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
                        {loading ? (
                            <div className="text-center py-12">
                                <p className="text-gray-500">Loading patients...</p>
                            </div>
                        ) : patients.length === 0 ? (
                            <div className="text-center py-12">
                                <Users size={48} className="text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-500">No patients found</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-blue-900">Patient ID</th>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-blue-900">Name</th>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-blue-900">CNIC</th>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-blue-900">Gender</th>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-blue-900">Contact</th>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-blue-900">Registered</th>
                                            <th className="px-6 py-4 text-center text-sm font-semibold text-blue-900">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {patients.map((patient) => (
                                            <tr
                                                key={patient._id}
                                                className={`hover:bg-blue-50 transition-colors cursor-pointer ${selectedPatient?._id === patient._id ? 'bg-blue-50' : ''}`}
                                                onClick={() => handleViewDetails(patient)}
                                            >
                                                <td className="px-6 py-4">
                                                    <span className="font-mono text-sm font-semibold text-blue-600">{patient.patientId}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-medium text-gray-900">{patient.name}</div>
                                                    {patient.fatherName && <div className="text-xs text-gray-500">S/O {patient.fatherName}</div>}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600">{patient.cnic || 'N/A'}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${patient.gender === 'male' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'}`}>
                                                        {patient.gender?.charAt(0).toUpperCase() + patient.gender?.slice(1)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600">{patient.contact?.phone || 'N/A'}</td>
                                                <td className="px-6 py-4 text-sm text-gray-600">
                                                    {new Date(patient.createdAt).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                                                        <button
                                                            onClick={() => handleViewDetails(patient)}
                                                            className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                                                            title="View Details"
                                                        >
                                                            <Eye size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleEdit(patient)}
                                                            className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                                                            title="Edit"
                                                        >
                                                            <Edit2 size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(patient)}
                                                            className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                                            title="Delete"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
                                <p className="text-sm text-gray-600">
                                    Page {currentPage} of {totalPages}
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                        disabled={currentPage === 1}
                                        className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                                    >
                                        <ChevronLeft size={16} /> Previous
                                    </button>
                                    <button
                                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                        disabled={currentPage === totalPages}
                                        className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                                    >
                                        Next <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Details Panel */}
                    {selectedPatient && !showEditModal && (
                        <div className="bg-white rounded-xl shadow-lg border border-blue-200 overflow-hidden animate-fadeIn">
                            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                    <Activity size={20} /> Patient Details
                                </h3>
                                <button onClick={() => setSelectedPatient(null)} className="text-white hover:bg-blue-500 p-1 rounded">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">Patient ID</p>
                                    <p className="font-mono font-semibold text-blue-600">{selectedPatient.patientId}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">Full Name</p>
                                    <p className="font-medium">{selectedPatient.name}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">Father's Name</p>
                                    <p className="font-medium">{selectedPatient.fatherName || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">CNIC</p>
                                    <p className="font-medium">{selectedPatient.cnic || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">Gender</p>
                                    <p className="font-medium capitalize">{selectedPatient.gender || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">Date of Birth</p>
                                    <p className="font-medium">{selectedPatient.dateOfBirth ? new Date(selectedPatient.dateOfBirth).toLocaleDateString() : 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">Phone</p>
                                    <p className="font-medium">{selectedPatient.contact?.phone || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">Address</p>
                                    <p className="font-medium">{selectedPatient.contact?.address || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">Blood Group</p>
                                    <p className="font-medium">{selectedPatient.bloodGroup || 'N/A'}</p>
                                </div>
                                <div className="md:col-span-3 border-t pt-4 mt-2">
                                    <p className="text-sm font-semibold text-gray-700 mb-3">Emergency Contact</p>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1">Name</p>
                                            <p className="font-medium">{selectedPatient.emergencyContact?.name || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1">Relation</p>
                                            <p className="font-medium">{selectedPatient.emergencyContact?.relation || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1">Phone</p>
                                            <p className="font-medium">{selectedPatient.emergencyContact?.phone || 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Edit Modal */}
                    {showEditModal && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fadeIn">
                            <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
                                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                        <Edit2 size={20} /> Edit Patient Details
                                    </h3>
                                    <button onClick={() => { setShowEditModal(false); setSelectedPatient(null); }} className="text-white hover:bg-blue-500 p-1 rounded">
                                        <X size={20} />
                                    </button>
                                </div>
                                <form onSubmit={handleEditSubmit} className="p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                        <div>
                                            <label className="text-sm font-medium text-gray-700 block mb-1">Full Name *</label>
                                            <input
                                                type="text"
                                                value={editFormData.name}
                                                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                                                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-700 block mb-1">Father's Name</label>
                                            <input
                                                type="text"
                                                value={editFormData.fatherName}
                                                onChange={(e) => setEditFormData({ ...editFormData, fatherName: e.target.value })}
                                                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-700 block mb-1">Gender</label>
                                            <select
                                                value={editFormData.gender}
                                                onChange={(e) => setEditFormData({ ...editFormData, gender: e.target.value })}
                                                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none"
                                            >
                                                <option value="male">Male</option>
                                                <option value="female">Female</option>
                                                <option value="other">Other</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-700 block mb-1">Date of Birth</label>
                                            <input
                                                type="date"
                                                value={editFormData.dateOfBirth}
                                                onChange={(e) => setEditFormData({ ...editFormData, dateOfBirth: e.target.value })}
                                                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-700 block mb-1">Phone *</label>
                                            <input
                                                type="text"
                                                value={editFormData.phone}
                                                onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                                                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-700 block mb-1">Blood Group</label>
                                            <select
                                                value={editFormData.bloodGroup}
                                                onChange={(e) => setEditFormData({ ...editFormData, bloodGroup: e.target.value })}
                                                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none"
                                            >
                                                <option value="O+">O+</option>
                                                <option value="O-">O-</option>
                                                <option value="A+">A+</option>
                                                <option value="A-">A-</option>
                                                <option value="B+">B+</option>
                                                <option value="B-">B-</option>
                                                <option value="AB+">AB+</option>
                                                <option value="AB-">AB-</option>
                                            </select>
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="text-sm font-medium text-gray-700 block mb-1">Address</label>
                                            <input
                                                type="text"
                                                value={editFormData.address}
                                                onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                                                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none"
                                            />
                                        </div>
                                    </div>

                                    <div className="border-t pt-4 mb-6">
                                        <p className="text-sm font-semibold text-gray-700 mb-3">Emergency Contact</p>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div>
                                                <label className="text-sm font-medium text-gray-700 block mb-1">Name</label>
                                                <input
                                                    type="text"
                                                    value={editFormData.emergencyName}
                                                    onChange={(e) => setEditFormData({ ...editFormData, emergencyName: e.target.value })}
                                                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-gray-700 block mb-1">Relation</label>
                                                <input
                                                    type="text"
                                                    value={editFormData.emergencyRelation}
                                                    onChange={(e) => setEditFormData({ ...editFormData, emergencyRelation: e.target.value })}
                                                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-gray-700 block mb-1">Phone</label>
                                                <input
                                                    type="text"
                                                    value={editFormData.emergencyPhone}
                                                    onChange={(e) => setEditFormData({ ...editFormData, emergencyPhone: e.target.value })}
                                                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-end gap-3">
                                        <button
                                            type="button"
                                            onClick={() => { setShowEditModal(false); setSelectedPatient(null); }}
                                            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                                        >
                                            <Edit2 size={18} /> Update Patient
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default PatientList;

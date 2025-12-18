import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosConfig';
import { Plus, Trash2, Search, Filter, Eye, MoreVertical } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import DoctorFormWizard from '../../components/admin/DoctorFormWizard';

const ManageDoctors = () => {
    const navigate = useNavigate();
    const [doctors, setDoctors] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDept, setFilterDept] = useState('All');

    const fetchDoctors = async () => {
        try {
            const token = localStorage.getItem('token');
            const { data } = await axiosInstance.get('/api/users/doctors', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setDoctors(data);
        } catch (error) {
            console.error('Error fetching doctors:', error);
        }
    };

    useEffect(() => {
        fetchDoctors();
    }, []);

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this doctor? This action cannot be undone.')) {
            try {
                const token = localStorage.getItem('token');
                await axiosInstance.delete(`/api/users/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                fetchDoctors();
            } catch (error) {
                console.error('Error deleting doctor:', error);
            }
        }
    };

    const filteredDoctors = doctors.filter(doc => {
        const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            doc.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDept = filterDept === 'All' || doc.specialization === filterDept;
        return matchesSearch && matchesDept;
    });

    const departments = ['All', ...new Set(doctors.map(d => d.specialization).filter(Boolean))];

    return (
        <DashboardLayout>
            <div className="p-8">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800">Manage Doctors</h1>
                            <p className="text-gray-500 mt-1">Add, edit, and manage hospital doctors</p>
                        </div>
                        {!showForm && (
                            <button
                                onClick={() => setShowForm(true)}
                                className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-blue-700 shadow-sm transition-all"
                            >
                                <Plus size={20} /> Add New Doctor
                            </button>
                        )}
                    </div>

                    {showForm ? (
                        <DoctorFormWizard
                            onSuccess={() => {
                                setShowForm(false);
                                fetchDoctors();
                            }}
                            onCancel={() => setShowForm(false)}
                        />
                    ) : (
                        <>
                            {/* Filters & Search */}
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row gap-4">
                                <div className="flex-1 relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                    <input
                                        type="text"
                                        placeholder="Search doctors by name or email..."
                                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <Filter size={20} className="text-gray-500" />
                                    <select
                                        className="border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        value={filterDept}
                                        onChange={(e) => setFilterDept(e.target.value)}
                                    >
                                        {departments.map(dept => (
                                            <option key={dept} value={dept}>{dept}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Doctors List */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 border-b border-gray-100">
                                        <tr>
                                            <th className="p-4 font-semibold text-gray-600">Doctor Info</th>
                                            <th className="p-4 font-semibold text-gray-600">Department</th>
                                            <th className="p-4 font-semibold text-gray-600">Contact</th>
                                            <th className="p-4 font-semibold text-gray-600">Status</th>
                                            <th className="p-4 font-semibold text-gray-600 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredDoctors.length > 0 ? (
                                            filteredDoctors.map((doctor) => (
                                                <tr key={doctor._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                                                                {doctor.name.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-gray-900">{doctor.name}</p>
                                                                <p className="text-xs text-gray-500">{doctor.profile?.professionalDetails?.qualification || 'MBBS'}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                                                            {doctor.specialization}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-sm text-gray-600">
                                                        <p>{doctor.email}</p>
                                                        <p>{doctor.contact?.phone}</p>
                                                    </td>
                                                    <td className="p-4">
                                                        <span className={`px-2 py-1 rounded text-xs font-medium ${doctor.profile?.status === 'Inactive'
                                                                ? 'bg-red-100 text-red-700'
                                                                : 'bg-green-100 text-green-700'
                                                            }`}>
                                                            {doctor.profile?.status || 'Active'}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <button
                                                                onClick={() => navigate(`/admin/doctors/${doctor._id}`)}
                                                                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                                title="View Profile"
                                                            >
                                                                <Eye size={18} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(doctor._id)}
                                                                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                                title="Delete Doctor"
                                                            >
                                                                <Trash2 size={18} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="5" className="p-8 text-center text-gray-500">
                                                    No doctors found matching your criteria.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default ManageDoctors;

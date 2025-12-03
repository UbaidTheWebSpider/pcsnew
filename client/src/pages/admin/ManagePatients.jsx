import { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosConfig';
import { Users, UserPlus, Search, Trash2 } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { showSuccess, showError } from '../../utils/sweetalert';

const ManagePatients = () => {
    const [patients, setPatients] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        phone: '',
        address: '',
        dateOfBirth: '',
        gender: ''
    });

    const fetchPatients = async () => {
        try {
            const token = localStorage.getItem('token');
            const { data } = await axiosInstance.get('/api/users/patients', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPatients(data);
        } catch (error) {
            console.error('Error fetching patients:', error);
        }
    };

    useEffect(() => {
        fetchPatients();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axiosInstance.post('/api/users/patients', {
                name: formData.name,
                email: formData.email,
                password: formData.password,
                contact: {
                    phone: formData.phone,
                    address: formData.address,
                    dateOfBirth: formData.dateOfBirth,
                    gender: formData.gender
                }
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setShowForm(false);
            setFormData({ name: '', email: '', password: '', phone: '', address: '', dateOfBirth: '', gender: '' });
            fetchPatients();
            showSuccess('Patient registered successfully!');
        } catch (error) {
            console.error('Error registering patient:', error);
            showError('Failed to register patient: ' + (error.response?.data?.message || 'Unknown error'));
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to remove this patient?')) {
            try {
                const token = localStorage.getItem('token');
                await axiosInstance.delete(`/api/users/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                fetchPatients();
            } catch (error) {
                console.error('Error deleting patient:', error);
            }
        }
    };

    return (
        <DashboardLayout>
            <div className="p-8">
                <div className="max-w-6xl mx-auto">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800">Patient Entry Console</h1>
                            <p className="text-gray-600 mt-1">Register and manage patient records</p>
                        </div>
                        <button
                            onClick={() => setShowForm(!showForm)}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
                        >
                            <UserPlus size={20} /> Register Patient
                        </button>
                    </div>

                    {showForm && (
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
                            <h2 className="text-xl font-semibold mb-4">New Patient Registration</h2>
                            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input
                                    type="text"
                                    placeholder="Full Name *"
                                    className="p-2 border rounded-lg"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                                <input
                                    type="email"
                                    placeholder="Email *"
                                    className="p-2 border rounded-lg"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    required
                                />
                                <input
                                    type="password"
                                    placeholder="Password *"
                                    className="p-2 border rounded-lg"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    required
                                />
                                <input
                                    type="text"
                                    placeholder="Phone Number *"
                                    className="p-2 border rounded-lg"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    required
                                />
                                <input
                                    type="date"
                                    placeholder="Date of Birth"
                                    className="p-2 border rounded-lg"
                                    value={formData.dateOfBirth}
                                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                                />
                                <select
                                    className="p-2 border rounded-lg"
                                    value={formData.gender}
                                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                >
                                    <option value="">Select Gender</option>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                    <option value="other">Other</option>
                                </select>
                                <input
                                    type="text"
                                    placeholder="Address"
                                    className="p-2 border rounded-lg md:col-span-2"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                />
                                <div className="md:col-span-2">
                                    <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
                                        Register Patient
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowForm(false)}
                                        className="ml-3 bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-4 bg-gray-50 border-b border-gray-200">
                            <h3 className="font-semibold text-gray-700">Registered Patients ({patients.length})</h3>
                        </div>
                        <table className="w-full text-left">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="p-4 font-semibold text-gray-600">Name</th>
                                    <th className="p-4 font-semibold text-gray-600">Email</th>
                                    <th className="p-4 font-semibold text-gray-600">Phone</th>
                                    <th className="p-4 font-semibold text-gray-600">Registered</th>
                                    <th className="p-4 font-semibold text-gray-600">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {patients.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="p-8 text-center text-gray-500">
                                            No patients registered yet. Click "Register Patient" to add one.
                                        </td>
                                    </tr>
                                ) : (
                                    patients.map((patient) => (
                                        <tr key={patient._id} className="border-t border-gray-100 hover:bg-gray-50">
                                            <td className="p-4 font-medium text-gray-800">{patient.name}</td>
                                            <td className="p-4 text-gray-600">{patient.email}</td>
                                            <td className="p-4 text-gray-600">{patient.contact?.phone || 'N/A'}</td>
                                            <td className="p-4 text-gray-600">
                                                {new Date(patient.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="p-4">
                                                <button
                                                    onClick={() => handleDelete(patient._id)}
                                                    className="text-red-500 hover:text-red-700 p-2"
                                                    title="Remove patient"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default ManagePatients;

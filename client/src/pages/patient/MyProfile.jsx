import { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosConfig';
import DashboardLayout from '../../components/DashboardLayout';
import Swal from 'sweetalert2';
import { User, Shield, Activity, Edit2, Save } from 'lucide-react';

const MyProfile = () => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [formData, setFormData] = useState({});

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem('token');
            const { data } = await axiosInstance.get('/api/patient/profile', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProfile(data.data);
            setFormData(data.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching profile:', error);
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setFormData(prev => ({
                ...prev,
                [parent]: { ...prev[parent], [child]: value }
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSave = async () => {
        try {
            const token = localStorage.getItem('token');
            await axiosInstance.put('/api/patient/profile', formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProfile(formData);
            setEditing(false);
            Swal.fire('Success', 'Profile updated successfully', 'success');
        } catch (error) {
            Swal.fire('Error', 'Failed to update profile', 'error');
        }
    };

    if (loading) return <div className="p-8 text-center">Loading...</div>;

    return (
        <DashboardLayout>
            <div className="p-8">
                <div className="max-w-4xl mx-auto">
                    <div className="flex justify-between items-center mb-8">
                        <h1 className="text-2xl font-bold text-gray-800">My Medical Profile</h1>
                        <button
                            onClick={() => editing ? handleSave() : setEditing(true)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${editing ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-blue-600 text-white hover:bg-blue-700'
                                }`}
                        >
                            {editing ? <><Save size={18} /> Save Changes</> : <><Edit2 size={18} /> Edit Profile</>}
                        </button>
                    </div>

                    <div className="grid gap-6">
                        {/* Personal Info */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <div className="flex items-center gap-3 mb-6">
                                <User className="text-blue-600" />
                                <h2 className="text-lg font-semibold text-gray-800">Personal Details</h2>
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-500 mb-1">Full Name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name || ''}
                                        disabled={!editing}
                                        onChange={handleChange}
                                        className="w-full p-2 border rounded-lg disabled:bg-gray-50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-500 mb-1">Phone</label>
                                    <input
                                        type="text"
                                        name="contact.phone"
                                        value={formData.contact?.phone || ''}
                                        disabled={!editing}
                                        onChange={handleChange}
                                        className="w-full p-2 border rounded-lg disabled:bg-gray-50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
                                    <input
                                        type="email"
                                        value={formData.email || ''}
                                        disabled={true}
                                        className="w-full p-2 border rounded-lg bg-gray-50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-500 mb-1">Address</label>
                                    <input
                                        type="text"
                                        name="contact.address"
                                        value={formData.contact?.address || ''}
                                        disabled={!editing}
                                        onChange={handleChange}
                                        className="w-full p-2 border rounded-lg disabled:bg-gray-50"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Medical Info */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <div className="flex items-center gap-3 mb-6">
                                <Activity className="text-red-500" />
                                <h2 className="text-lg font-semibold text-gray-800">Medical Information</h2>
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-500 mb-1">Blood Group</label>
                                    <select
                                        name="bloodGroup"
                                        value={formData.bloodGroup || ''}
                                        disabled={!editing}
                                        onChange={handleChange}
                                        className="w-full p-2 border rounded-lg disabled:bg-gray-50"
                                    >
                                        <option value="">Select</option>
                                        <option value="A+">A+</option>
                                        <option value="O+">O+</option>
                                        <option value="B+">B+</option>
                                        <option value="AB+">AB+</option>
                                        <option value="A-">A-</option>
                                        <option value="O-">O-</option>
                                        <option value="B-">B-</option>
                                        <option value="AB-">AB-</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-500 mb-1">Date of Birth</label>
                                    <input
                                        type="date"
                                        name="dateOfBirth"
                                        value={formData.dateOfBirth ? new Date(formData.dateOfBirth).toISOString().split('T')[0] : ''}
                                        disabled={!editing}
                                        onChange={handleChange}
                                        className="w-full p-2 border rounded-lg disabled:bg-gray-50"
                                    />
                                </div>
                            </div>
                            <div className="mt-4">
                                <label className="block text-sm font-medium text-gray-500 mb-1">Allergies (Comma separated)</label>
                                <textarea
                                    name="allergies"
                                    value={formData.allergies?.join(', ') || ''}
                                    disabled={!editing}
                                    onChange={(e) => setFormData(prev => ({ ...prev, allergies: e.target.value.split(',').map(s => s.trim()) }))}
                                    className="w-full p-2 border rounded-lg disabled:bg-gray-50"
                                    rows="2"
                                />
                            </div>
                        </div>

                        {/* Insurance Info (New) */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <div className="flex items-center gap-3 mb-6">
                                <Shield className="text-green-600" />
                                <h2 className="text-lg font-semibold text-gray-800">Insurance Details</h2>
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-500 mb-1">Provider</label>
                                    <input
                                        type="text"
                                        name="insurance.provider"
                                        value={formData.insurance?.provider || ''}
                                        disabled={!editing}
                                        onChange={handleChange}
                                        className="w-full p-2 border rounded-lg disabled:bg-gray-50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-500 mb-1">Policy Number</label>
                                    <input
                                        type="text"
                                        name="insurance.policyNumber"
                                        value={formData.insurance?.policyNumber || ''}
                                        disabled={!editing}
                                        onChange={handleChange}
                                        className="w-full p-2 border rounded-lg disabled:bg-gray-50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-500 mb-1">Expiry Date</label>
                                    <input
                                        type="date"
                                        name="insurance.expiryDate"
                                        value={formData.insurance?.expiryDate ? new Date(formData.insurance.expiryDate).toISOString().split('T')[0] : ''}
                                        disabled={!editing}
                                        onChange={handleChange}
                                        className="w-full p-2 border rounded-lg disabled:bg-gray-50"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default MyProfile;

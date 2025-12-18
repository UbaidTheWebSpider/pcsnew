import { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosConfig';
import { Search, AlertTriangle, Clock } from 'lucide-react';

const AssignedPharmacist = ({ data, updateData, updateCompletion }) => {
    const [pharmacists, setPharmacists] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);

    // Validate form completion
    useEffect(() => {
        const isComplete =
            data.chiefPharmacist !== '' &&
            data.registrationNumber?.trim() !== '' &&
            data.qualification !== '';

        updateCompletion(isComplete);
    }, [data, updateCompletion]);

    // Fetch pharmacists
    useEffect(() => {
        fetchPharmacists();
    }, []);

    const fetchPharmacists = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await axiosInstance.get('/api/users/doctors', {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Note: In production, this should fetch from a dedicated pharmacist endpoint
            // or filter users by role='pharmacist'
            setPharmacists(response.data);
        } catch (error) {
            console.error('Error fetching pharmacists:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePharmacistSelect = (pharmacistId) => {
        const selected = pharmacists.find(p => p._id === pharmacistId);
        if (selected) {
            updateData({
                chiefPharmacist: pharmacistId,
                registrationNumber: selected.profile?.professionalDetails?.licenseNumber || 'REG-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
                qualification: selected.profile?.professionalDetails?.qualification || 'B.Pharm'
            });
        }
    };

    const filteredPharmacists = pharmacists.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Assigned Pharmacist</h2>
                <p className="text-gray-500">Enforce mandatory pharmacist assignment</p>
            </div>

            {/* Warning Banner */}
            <div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-200 rounded-xl">
                <AlertTriangle className="text-orange-600 mt-0.5 flex-shrink-0" size={20} />
                <div className="text-sm text-orange-800">
                    <strong>Important:</strong> Pharmacy cannot be activated without a licensed pharmacist assignment
                </div>
            </div>

            {/* Chief Pharmacist */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chief Pharmacist <span className="text-red-500">*</span>
                </label>
                <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="input-field pl-10"
                        placeholder="Search pharmacists..."
                    />
                </div>
                <select
                    value={data.chiefPharmacist}
                    onChange={(e) => handlePharmacistSelect(e.target.value)}
                    className="input-field"
                    required
                >
                    <option value="">Select chief pharmacist</option>
                    {filteredPharmacists.map((pharmacist) => (
                        <option key={pharmacist._id} value={pharmacist._id}>
                            {pharmacist.name} - {pharmacist.email}
                        </option>
                    ))}
                </select>
            </div>

            {/* Registration Number (Auto-fetched) */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pharmacy Council Registration Number <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    value={data.registrationNumber}
                    onChange={(e) => updateData({ registrationNumber: e.target.value })}
                    className="input-field bg-gray-50"
                    placeholder="Auto-fetched from pharmacist profile"
                    required
                />
            </div>

            {/* Qualification (Auto-filled) */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Qualification <span className="text-red-500">*</span>
                </label>
                <select
                    value={data.qualification}
                    onChange={(e) => updateData({ qualification: e.target.value })}
                    className="input-field"
                    required
                >
                    <option value="">Select qualification</option>
                    <option value="Pharm-D">Pharm-D (Doctor of Pharmacy)</option>
                    <option value="B.Pharm">B.Pharm (Bachelor of Pharmacy)</option>
                    <option value="M.Pharm">M.Pharm (Master of Pharmacy)</option>
                    <option value="Other">Other</option>
                </select>
            </div>

            {/* Duty Schedule */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                    Duty Schedule
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-xs text-gray-600 mb-1">Shift</label>
                        <select
                            value={data.dutySchedule?.shift || ''}
                            onChange={(e) => updateData({
                                dutySchedule: { ...data.dutySchedule, shift: e.target.value }
                            })}
                            className="input-field"
                        >
                            <option value="">Select shift</option>
                            <option value="Morning">Morning</option>
                            <option value="Evening">Evening</option>
                            <option value="Night">Night</option>
                            <option value="Rotating">Rotating</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs text-gray-600 mb-1">Start Time</label>
                        <div className="relative">
                            <input
                                type="time"
                                value={data.dutySchedule?.startTime || ''}
                                onChange={(e) => updateData({
                                    dutySchedule: { ...data.dutySchedule, startTime: e.target.value }
                                })}
                                className="input-field"
                            />
                            <Clock className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs text-gray-600 mb-1">End Time</label>
                        <div className="relative">
                            <input
                                type="time"
                                value={data.dutySchedule?.endTime || ''}
                                onChange={(e) => updateData({
                                    dutySchedule: { ...data.dutySchedule, endTime: e.target.value }
                                })}
                                className="input-field"
                            />
                            <Clock className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Backup Pharmacist (Optional) */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Backup Pharmacist <span className="text-gray-400">(Optional)</span>
                </label>
                <select
                    value={data.backupPharmacist || ''}
                    onChange={(e) => updateData({ backupPharmacist: e.target.value })}
                    className="input-field"
                >
                    <option value="">Select backup pharmacist</option>
                    {pharmacists
                        .filter(p => p._id !== data.chiefPharmacist)
                        .map((pharmacist) => (
                            <option key={pharmacist._id} value={pharmacist._id}>
                                {pharmacist.name} - {pharmacist.email}
                            </option>
                        ))}
                </select>
            </div>
        </div>
    );
};

export default AssignedPharmacist;


import React, { useState } from 'react';
import {
    User, Briefcase, Phone, Calendar, DollarSign, Video, Lock, CheckCircle,
    ChevronRight, ChevronLeft, Upload, X
} from 'lucide-react';
import axiosInstance from '../../api/axiosConfig';

const steps = [
    { id: 1, title: 'Personal', icon: User },
    { id: 2, title: 'Professional', icon: Briefcase },
    { id: 3, title: 'Contact', icon: Phone },
    { id: 4, title: 'Schedule', icon: Calendar },
    { id: 5, title: 'Fees', icon: DollarSign },
    { id: 6, title: 'Telemedicine', icon: Video },
    { id: 7, title: 'Account', icon: Lock },
];

const DoctorFormWizard = ({ onSuccess, onCancel }) => {
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        // Personal
        name: '',
        gender: 'Male',
        dob: '',
        photoUrl: '',
        bio: '',
        languages: '',

        // Professional
        qualification: '',
        experience: '',
        licenseNumber: '',
        department: '',
        employmentType: 'Full-time',

        // Contact
        email: '',
        phone: '',
        address: '',
        city: '',

        // Schedule
        slotDuration: 30,
        weeklyAvailability: [
            { day: 'Monday', startTime: '09:00', endTime: '17:00', isAvailable: true },
            { day: 'Tuesday', startTime: '09:00', endTime: '17:00', isAvailable: true },
            { day: 'Wednesday', startTime: '09:00', endTime: '17:00', isAvailable: true },
            { day: 'Thursday', startTime: '09:00', endTime: '17:00', isAvailable: true },
            { day: 'Friday', startTime: '09:00', endTime: '17:00', isAvailable: true },
            { day: 'Saturday', startTime: '09:00', endTime: '13:00', isAvailable: false },
            { day: 'Sunday', startTime: '09:00', endTime: '13:00', isAvailable: false },
        ],

        // Fees
        consultationFees: {
            physical: 0,
            online: 0
        },

        // Telemedicine
        telemedicine: {
            isEnabled: false,
            platform: 'BigBlueButton',
            meetingUrl: ''
        },

        // Account
        password: '',
        confirmPassword: ''
    });

    const handleChange = (e, section = null) => {
        const { name, value, type, checked } = e.target;

        if (section) {
            setFormData(prev => ({
                ...prev,
                [section]: {
                    ...prev[section],
                    [name]: type === 'checkbox' ? checked : value
                }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : value
            }));
        }
    };

    const handleScheduleChange = (index, field, value) => {
        const newSchedule = [...formData.weeklyAvailability];
        newSchedule[index][field] = value;
        setFormData(prev => ({ ...prev, weeklyAvailability: newSchedule }));
    };

    const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, steps.length));
    const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

    const handleSubmit = async () => {
        if (formData.password !== formData.confirmPassword) {
            alert("Passwords don't match!");
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const payload = {
                ...formData,
                specialization: formData.department, // Map department to specialization for User model
                contact: {
                    phone: formData.phone,
                    address: `${formData.address}, ${formData.city}`
                },
                languages: formData.languages.split(',').map(l => l.trim())
            };

            await axiosInstance.post('/api/users/doctors', payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            onSuccess();
        } catch (error) {
            console.error('Error creating doctor:', error);
            alert(error.response?.data?.message || 'Failed to create doctor');
        } finally {
            setLoading(false);
        }
    };

    const renderStepContent = () => {
        switch (currentStep) {
            case 1: // Personal
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                            <input type="text" name="name" value={formData.name} onChange={handleChange} className="input-field" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Gender *</label>
                            <select name="gender" value={formData.gender} onChange={handleChange} className="input-field">
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth *</label>
                            <input type="date" name="dob" value={formData.dob} onChange={handleChange} className="input-field" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Languages (comma separated)</label>
                            <input type="text" name="languages" value={formData.languages} onChange={handleChange} className="input-field" placeholder="English, Spanish" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                            <textarea name="bio" value={formData.bio} onChange={handleChange} className="input-field h-24" placeholder="Short biography..." />
                        </div>
                    </div>
                );
            case 2: // Professional
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Qualification *</label>
                            <input type="text" name="qualification" value={formData.qualification} onChange={handleChange} className="input-field" placeholder="MBBS, MD" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Experience (Years) *</label>
                            <input type="number" name="experience" value={formData.experience} onChange={handleChange} className="input-field" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">License Number *</label>
                            <input type="text" name="licenseNumber" value={formData.licenseNumber} onChange={handleChange} className="input-field" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
                            <select name="department" value={formData.department} onChange={handleChange} className="input-field" required>
                                <option value="">Select Department</option>
                                <option value="Cardiology">Cardiology</option>
                                <option value="Neurology">Neurology</option>
                                <option value="Orthopedics">Orthopedics</option>
                                <option value="Pediatrics">Pediatrics</option>
                                <option value="General">General</option>
                                <option value="Dermatology">Dermatology</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Employment Type</label>
                            <select name="employmentType" value={formData.employmentType} onChange={handleChange} className="input-field">
                                <option value="Full-time">Full-time</option>
                                <option value="Part-time">Part-time</option>
                                <option value="Visiting">Visiting</option>
                                <option value="Contract">Contract</option>
                            </select>
                        </div>
                    </div>
                );
            case 3: // Contact
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                            <input type="email" name="email" value={formData.email} onChange={handleChange} className="input-field" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                            <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="input-field" required />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                            <input type="text" name="address" value={formData.address} onChange={handleChange} className="input-field" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                            <input type="text" name="city" value={formData.city} onChange={handleChange} className="input-field" />
                        </div>
                    </div>
                );
            case 4: // Schedule
                return (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Slot Duration (Minutes)</label>
                            <select name="slotDuration" value={formData.slotDuration} onChange={handleChange} className="input-field w-32">
                                <option value="15">15 mins</option>
                                <option value="30">30 mins</option>
                                <option value="45">45 mins</option>
                                <option value="60">60 mins</option>
                            </select>
                        </div>
                        <div className="border rounded-lg overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="p-3">Day</th>
                                        <th className="p-3">Available</th>
                                        <th className="p-3">Start Time</th>
                                        <th className="p-3">End Time</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {formData.weeklyAvailability.map((day, index) => (
                                        <tr key={day.day} className="border-t">
                                            <td className="p-3 font-medium">{day.day}</td>
                                            <td className="p-3">
                                                <input
                                                    type="checkbox"
                                                    checked={day.isAvailable}
                                                    onChange={(e) => handleScheduleChange(index, 'isAvailable', e.target.checked)}
                                                    className="w-4 h-4 text-blue-600 rounded"
                                                />
                                            </td>
                                            <td className="p-3">
                                                <input
                                                    type="time"
                                                    value={day.startTime}
                                                    disabled={!day.isAvailable}
                                                    onChange={(e) => handleScheduleChange(index, 'startTime', e.target.value)}
                                                    className="p-1 border rounded disabled:bg-gray-100"
                                                />
                                            </td>
                                            <td className="p-3">
                                                <input
                                                    type="time"
                                                    value={day.endTime}
                                                    disabled={!day.isAvailable}
                                                    onChange={(e) => handleScheduleChange(index, 'endTime', e.target.value)}
                                                    className="p-1 border rounded disabled:bg-gray-100"
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            case 5: // Fees
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Physical Consultation Fee ($)</label>
                            <input
                                type="number"
                                name="physical"
                                value={formData.consultationFees.physical}
                                onChange={(e) => handleChange(e, 'consultationFees')}
                                className="input-field"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Online Consultation Fee ($)</label>
                            <input
                                type="number"
                                name="online"
                                value={formData.consultationFees.online}
                                onChange={(e) => handleChange(e, 'consultationFees')}
                                className="input-field"
                            />
                        </div>
                    </div>
                );
            case 6: // Telemedicine
                return (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="telemedicineEnabled"
                                name="isEnabled"
                                checked={formData.telemedicine.isEnabled}
                                onChange={(e) => handleChange(e, 'telemedicine')}
                                className="w-5 h-5 text-blue-600 rounded"
                            />
                            <label htmlFor="telemedicineEnabled" className="font-medium text-gray-700">Enable Telemedicine</label>
                        </div>

                        {formData.telemedicine.isEnabled && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-7">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Platform</label>
                                    <select
                                        name="platform"
                                        value={formData.telemedicine.platform}
                                        onChange={(e) => handleChange(e, 'telemedicine')}
                                        className="input-field"
                                    >
                                        <option value="BigBlueButton">BigBlueButton</option>
                                        <option value="Zoom">Zoom</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Static Meeting URL (Optional)</label>
                                    <input
                                        type="url"
                                        name="meetingUrl"
                                        value={formData.telemedicine.meetingUrl}
                                        onChange={(e) => handleChange(e, 'telemedicine')}
                                        className="input-field"
                                        placeholder="https://..."
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                );
            case 7: // Account
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                            <input type="password" name="password" value={formData.password} onChange={handleChange} className="input-field" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password *</label>
                            <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} className="input-field" required />
                        </div>
                        <div className="md:col-span-2 bg-blue-50 p-4 rounded-lg text-sm text-blue-700">
                            <p className="font-semibold flex items-center gap-2"><Lock size={16} /> Security Note</p>
                            <p>The doctor will use their email and this password to log in. They can change it later.</p>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden max-w-4xl mx-auto">
            {/* Header */}
            <div className="bg-gray-50 border-b border-gray-100 p-4 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">Add New Doctor</h2>
                <button onClick={onCancel} className="text-gray-500 hover:text-gray-700">
                    <X size={24} />
                </button>
            </div>

            {/* Steps Indicator */}
            <div className="flex overflow-x-auto p-4 border-b border-gray-100 gap-2 no-scrollbar">
                {steps.map((step) => (
                    <div
                        key={step.id}
                        className={`flex items-center gap-2 px-3 py-2 rounded-full whitespace-nowrap transition-colors ${currentStep === step.id
                                ? 'bg-blue-600 text-white'
                                : currentStep > step.id
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-gray-100 text-gray-500'
                            }`}
                    >
                        {currentStep > step.id ? <CheckCircle size={16} /> : <step.icon size={16} />}
                        <span className="text-sm font-medium">{step.title}</span>
                    </div>
                ))}
            </div>

            {/* Content */}
            <div className="p-6 min-h-[400px]">
                {renderStepContent()}
            </div>

            {/* Footer */}
            <div className="bg-gray-50 border-t border-gray-100 p-4 flex justify-between">
                <button
                    onClick={prevStep}
                    disabled={currentStep === 1}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <ChevronLeft size={20} /> Previous
                </button>

                {currentStep < steps.length ? (
                    <button
                        onClick={nextStep}
                        className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Next <ChevronRight size={20} />
                    </button>
                ) : (
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                        {loading ? 'Creating...' : 'Create Doctor'} <CheckCircle size={20} />
                    </button>
                )}
            </div>
        </div>
    );
};

export default DoctorFormWizard;

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    User, Briefcase, Phone, Calendar, DollarSign, Video,
    ArrowLeft, Mail, MapPin, Award, Clock, Shield
} from 'lucide-react';
import axiosInstance from '../../api/axiosConfig';
import DashboardLayout from '../../components/DashboardLayout';

const DoctorProfile = () => {
    const { id } = useParams(); // This is the User ID
    const navigate = useNavigate();
    const [doctor, setDoctor] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = localStorage.getItem('token');
                // We need to fetch the doctor profile based on the user ID
                // Since we don't have a direct endpoint for "get doctor by user id" for admin,
                // we might need to fetch all doctors and find this one, or update the API.
                // For now, let's assume we can filter or the previous list passed it.
                // Actually, let's use the getDoctors endpoint and find it.
                const { data } = await axiosInstance.get('/api/users/doctors', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const foundDoctor = data.find(d => d._id === id);
                setDoctor(foundDoctor);
            } catch (error) {
                console.error('Error fetching profile:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [id]);

    if (loading) return <DashboardLayout><div className="p-8">Loading...</div></DashboardLayout>;
    if (!doctor) return <DashboardLayout><div className="p-8">Doctor not found</div></DashboardLayout>;

    const profile = doctor.profile || {};
    const personal = profile.personalDetails || {};
    const professional = profile.professionalDetails || {};
    const schedule = profile.scheduleSettings || {};
    const fees = profile.consultationFees || {};
    const telemedicine = profile.telemedicine || {};

    return (
        <DashboardLayout>
            <div className="p-8">
                <div className="max-w-5xl mx-auto">
                    <button
                        onClick={() => navigate('/admin/doctors')}
                        className="flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-6"
                    >
                        <ArrowLeft size={20} /> Back to Doctors
                    </button>

                    {/* Header Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6 flex flex-col md:flex-row gap-6 items-center md:items-start">
                        <div className="w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center text-4xl text-gray-400 overflow-hidden">
                            {personal.photoUrl ? (
                                <img src={personal.photoUrl} alt={doctor.name} className="w-full h-full object-cover" />
                            ) : (
                                <User size={48} />
                            )}
                        </div>
                        <div className="flex-1 text-center md:text-left">
                            <h1 className="text-3xl font-bold text-gray-900">{doctor.name}</h1>
                            <p className="text-blue-600 font-medium text-lg">{professional.qualification} - {professional.department}</p>
                            <div className="flex flex-wrap gap-4 mt-4 justify-center md:justify-start text-gray-600">
                                <span className="flex items-center gap-1"><Mail size={16} /> {doctor.email}</span>
                                <span className="flex items-center gap-1"><Phone size={16} /> {doctor.contact?.phone}</span>
                                <span className="flex items-center gap-1"><MapPin size={16} /> {doctor.contact?.address}</span>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2">
                            <span className={`px-4 py-1 rounded-full text-sm font-medium ${profile.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                                }`}>
                                {profile.status || 'Active'}
                            </span>
                            <span className="text-sm text-gray-500">ID: {professional.licenseNumber}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Left Column */}
                        <div className="space-y-6">
                            {/* Professional Info */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                    <Briefcase size={20} className="text-blue-600" /> Professional
                                </h3>
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Experience</span>
                                        <span className="font-medium">{professional.experience} Years</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Employment</span>
                                        <span className="font-medium">{professional.employmentType}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Languages</span>
                                        <span className="font-medium text-right">{(personal.languages || []).join(', ')}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Fees */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                    <DollarSign size={20} className="text-green-600" /> Consultation Fees
                                </h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                        <span className="text-gray-600">Physical</span>
                                        <span className="font-bold text-gray-900">${fees.physical}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                                        <span className="text-gray-600">Online</span>
                                        <span className="font-bold text-blue-700">${fees.online}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Middle Column - Schedule */}
                        <div className="md:col-span-2 space-y-6">
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                    <Calendar size={20} className="text-purple-600" /> Weekly Schedule
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {(schedule.weeklyAvailability || []).map((day) => (
                                        <div key={day.day} className={`p-3 rounded-lg border ${day.isAvailable ? 'border-green-100 bg-green-50' : 'border-gray-100 bg-gray-50 opacity-60'
                                            }`}>
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="font-medium text-gray-900">{day.day}</span>
                                                {day.isAvailable ? (
                                                    <span className="text-xs bg-green-200 text-green-800 px-2 py-0.5 rounded">Available</span>
                                                ) : (
                                                    <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">Off</span>
                                                )}
                                            </div>
                                            {day.isAvailable && (
                                                <div className="text-sm text-gray-600 flex items-center gap-1">
                                                    <Clock size={14} /> {day.startTime} - {day.endTime}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-4 text-sm text-gray-500">
                                    Slot Duration: <span className="font-medium text-gray-900">{schedule.slotDuration} minutes</span>
                                </div>
                            </div>

                            {/* Telemedicine */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                    <Video size={20} className="text-indigo-600" /> Telemedicine Settings
                                </h3>
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-lg ${telemedicine.isEnabled ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {telemedicine.isEnabled ? 'Enabled' : 'Disabled'}
                                    </div>
                                    {telemedicine.isEnabled && (
                                        <div className="flex-1">
                                            <p className="text-sm text-gray-500">Platform</p>
                                            <p className="font-medium">{telemedicine.platform}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default DoctorProfile;

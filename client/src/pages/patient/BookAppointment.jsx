import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosConfig';
import { Calendar, Clock, User, MapPin, AlertCircle } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { showSuccess, showError } from '../../utils/sweetalert';

const BookAppointment = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const doctorId = searchParams.get('doctorId');

    const [doctor, setDoctor] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        scheduledDate: '',
        scheduledTime: '',
        reason: '',
        type: 'consultation',
        isTelemedicine: false,
    });

    useEffect(() => {
        if (!doctorId) {
            setError('No doctor selected');
            setLoading(false);
            return;
        }
        fetchDoctor();
    }, [doctorId]);

    const fetchDoctor = async () => {
        try {
            const token = localStorage.getItem('token');
            const { data } = await axiosInstance.get(`/api/patient/doctors/${doctorId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setDoctor(data.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching doctor:', error);
            setError('Failed to load doctor details');
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axiosInstance.post('/api/patient/appointments', {
                doctorId,
                ...formData
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            showSuccess('Appointment booked successfully!');
            navigate('/patient');
        } catch (error) {
            console.error('Error booking appointment:', error);
            showError(error.response?.data?.message || 'Failed to book appointment');
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="p-8 flex justify-center">
                    <div className="text-gray-500">Loading...</div>
                </div>
            </DashboardLayout>
        );
    }

    if (error) {
        return (
            <DashboardLayout>
                <div className="p-8">
                    <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-2">
                        <AlertCircle size={20} />
                        {error}
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="p-8">
                <div className="max-w-3xl mx-auto">
                    <h1 className="text-3xl font-bold text-gray-800 mb-8">Book Appointment</h1>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Doctor Info Card */}
                        <div className="md:col-span-1">
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-2xl font-bold mb-4 mx-auto">
                                    {doctor.name.charAt(0)}
                                </div>
                                <h3 className="text-lg font-semibold text-center text-gray-800 mb-1">{doctor.name}</h3>
                                <p className="text-sm text-blue-600 text-center mb-4">{doctor.specialization}</p>

                                <div className="space-y-3 text-sm text-gray-600">
                                    {doctor.contact?.address && (
                                        <div className="flex items-start gap-2">
                                            <MapPin size={16} className="mt-1 shrink-0" />
                                            <span>{doctor.contact.address}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2">
                                        <User size={16} />
                                        <span>{doctor.experience || '5+'} Years Exp.</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Booking Form */}
                        <div className="md:col-span-2">
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                            <div className="relative">
                                                <Calendar className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
                                                <input
                                                    type="date"
                                                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                                    value={formData.scheduledDate}
                                                    onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                                                    min={new Date().toISOString().split('T')[0]}
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                                            <div className="relative">
                                                <Clock className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
                                                <input
                                                    type="time"
                                                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                                    value={formData.scheduledTime}
                                                    onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Appointment Type</label>
                                        <select
                                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                            value={formData.type}
                                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                        >
                                            <option value="consultation">General Consultation</option>
                                            <option value="follow-up">Follow-up</option>
                                            <option value="checkup">Routine Checkup</option>
                                            <option value="emergency">Emergency</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                                checked={formData.isTelemedicine}
                                                onChange={(e) => setFormData({ ...formData, isTelemedicine: e.target.checked })}
                                            />
                                            <span className="text-gray-700">Video Consultation (Telemedicine)</span>
                                        </label>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Visit</label>
                                        <textarea
                                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 h-32"
                                            placeholder="Please describe your symptoms or reason for visit..."
                                            value={formData.reason}
                                            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                            required
                                        ></textarea>
                                    </div>

                                    <div className="flex gap-4 pt-4">
                                        <button
                                            type="button"
                                            onClick={() => navigate('/patient/doctors')}
                                            className="flex-1 px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                                        >
                                            Confirm Booking
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default BookAppointment;

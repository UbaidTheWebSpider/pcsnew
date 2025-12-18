import { useState, useEffect } from 'react';
import { Calendar, Clock, User, Video, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import axiosInstance from '../../api/axiosConfig';
import Swal from 'sweetalert2';

const DoctorAppointments = () => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        fetchAppointments();
    }, []);

    const fetchAppointments = async () => {
        try {
            const token = localStorage.getItem('token');
            const { data } = await axiosInstance.get('/api/doctor/appointments', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAppointments(data.data.appointments);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching appointments:', error);
            setLoading(false);
        }
    };

    const startConsultation = async (appointmentId) => {
        try {
            Swal.fire({
                title: 'Creating Video Room...',
                text: 'Please wait',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            const token = localStorage.getItem('token');
            const { data } = await axiosInstance.post('/api/appointments/start-consultation', {
                appointmentId
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (data.success && data.videoCallUrl) {
                Swal.close();
                window.open(data.videoCallUrl, '_blank');
                fetchAppointments(); // Refresh to show updated status
            }
        } catch (error) {
            console.error('Error starting consultation:', error);
            Swal.fire({
                icon: 'error',
                title: 'Failed to Start Video Call',
                text: error.response?.data?.message || 'Failed to create video room',
                confirmButtonText: 'OK'
            });
        }
    };

    const updateStatus = async (id, status) => {
        try {
            const token = localStorage.getItem('token');
            await axiosInstance.put(`/api/appointments/${id}/status`, { status }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchAppointments();
            Swal.fire({
                icon: 'success',
                title: 'Status Updated',
                timer: 1500,
                showConfirmButton: false
            });
        } catch (error) {
            console.error('Error updating status:', error);
            Swal.fire({
                icon: 'error',
                title: 'Update Failed',
                text: 'Could not update appointment status'
            });
        }
    };

    const filteredAppointments = appointments.filter(app => {
        if (filter === 'all') return true;
        return app.status === filter;
    });

    const getStatusColor = (status) => {
        const colors = {
            pending: 'bg-yellow-100 text-yellow-800',
            confirmed: 'bg-blue-100 text-blue-800',
            completed: 'bg-green-100 text-green-800',
            cancelled: 'bg-red-100 text-red-800',
            'in-progress': 'bg-purple-100 text-purple-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    return (
        <DashboardLayout>
            <div className="p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800">Appointments</h1>
                            <p className="text-gray-500 mt-1">Manage your schedule and consultations</p>
                        </div>
                        <div className="flex gap-2">
                            {['all', 'pending', 'confirmed', 'completed'].map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition ${filter === f
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                                        }`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>

                    {loading ? (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="text-gray-500 mt-4">Loading appointments...</p>
                        </div>
                    ) : filteredAppointments.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
                            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-800">No Appointments Found</h3>
                            <p className="text-gray-500">No appointments match the selected filter.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredAppointments.map((appointment) => (
                                <div key={appointment._id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition duration-200">
                                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                                        <div className="flex items-start gap-4">
                                            <div className="flex-shrink-0 w-16 h-16 bg-blue-50 rounded-lg flex flex-col items-center justify-center text-blue-600">
                                                <span className="text-xl font-bold">{new Date(appointment.scheduledDate).getDate()}</span>
                                                <span className="text-xs uppercase">{new Date(appointment.scheduledDate).toLocaleDateString('en-US', { month: 'short' })}</span>
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-3 mb-1">
                                                    <h3 className="font-semibold text-gray-800 text-lg">{appointment.patientId?.name || 'Unknown Patient'}</h3>
                                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                                                        {appointment.status}
                                                    </span>
                                                </div>
                                                <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                                                    <div className="flex items-center gap-1">
                                                        <Clock className="w-4 h-4" />
                                                        {appointment.scheduledTime} ({appointment.duration} min)
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <AlertCircle className="w-4 h-4" />
                                                        {appointment.type}
                                                    </div>
                                                </div>
                                                {appointment.reason && (
                                                    <p className="text-gray-600 mt-2 text-sm">Reason: {appointment.reason}</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-3">
                                            {appointment.status === 'pending' && (
                                                <>
                                                    <button
                                                        onClick={() => updateStatus(appointment._id, 'confirmed')}
                                                        className="px-4 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 font-medium flex items-center gap-2 transition"
                                                    >
                                                        <CheckCircle className="w-4 h-4" />
                                                        Confirm
                                                    </button>
                                                    <button
                                                        onClick={() => updateStatus(appointment._id, 'cancelled')}
                                                        className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-medium flex items-center gap-2 transition"
                                                    >
                                                        <XCircle className="w-4 h-4" />
                                                        Cancel
                                                    </button>
                                                </>
                                            )}

                                            {appointment.isTelemedicine && appointment.status !== 'cancelled' && appointment.status !== 'completed' && (
                                                <button
                                                    onClick={() => startConsultation(appointment._id)}
                                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2 transition shadow-sm"
                                                >
                                                    <Video className="w-4 h-4" />
                                                    Start Meeting
                                                </button>
                                            )}

                                            {appointment.status === 'confirmed' && (
                                                <button
                                                    onClick={() => updateStatus(appointment._id, 'completed')}
                                                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium flex items-center gap-2 transition"
                                                >
                                                    <CheckCircle className="w-4 h-4" />
                                                    Mark Complete
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default DoctorAppointments;

import { Link, useNavigate } from 'react-router-dom';
import { Users, Calendar, FileText, Clock, CheckCircle, Video } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosConfig';
import Swal from 'sweetalert2';

const DoctorDashboard = () => {
    const navigate = useNavigate();
    const [todayAppointments, setTodayAppointments] = useState([]);
    const [stats, setStats] = useState({
        today: 0,
        pending: 0,
        patients: 0,
        completed: 0,
    });

    useEffect(() => {
        fetchTodayAppointments();
        fetchStats();
    }, []);

    const fetchTodayAppointments = async () => {
        try {
            const token = localStorage.getItem('token');
            const today = new Date().toISOString().split('T')[0];
            const { data } = await axiosInstance.get(`/api/doctor/appointments?date=${today}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTodayAppointments(data.data.appointments);
        } catch (error) {
            console.error('Error fetching appointments:', error);
        }
    };

    const fetchStats = async () => {
        try {
            const token = localStorage.getItem('token');
            const [appointmentsRes, patientsRes] = await Promise.all([
                axiosInstance.get('/api/doctor/appointments', {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axiosInstance.get('/api/doctor/patients', {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);

            const appointments = appointmentsRes.data.data.appointments;
            const today = new Date().toISOString().split('T')[0];

            setStats({
                today: appointments.filter(a => a.scheduledDate.startsWith(today)).length,
                pending: appointments.filter(a => a.status === 'pending').length,
                patients: patientsRes.data.data.total,
                completed: appointments.filter(a => a.status === 'completed').length,
            });
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            pending: 'bg-yellow-100 text-yellow-800',
            confirmed: 'bg-blue-100 text-blue-800',
            completed: 'bg-green-100 text-green-800',
            cancelled: 'bg-red-100 text-red-800',
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
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

                // Open BBB meeting in a new tab
                window.open(data.videoCallUrl, '_blank');

                // Refresh appointments to show updated status
                fetchTodayAppointments();
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

    return (
        <DashboardLayout>
            <div className="p-8">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-3xl font-bold text-gray-800 mb-8">Doctor Dashboard</h1>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-gray-500 text-sm font-medium">Today's Appointments</h3>
                                <Calendar className="text-blue-500 w-6 h-6" />
                            </div>
                            <p className="text-3xl font-bold text-gray-800">{stats.today}</p>
                            <p className="text-sm text-gray-500 mt-2">Scheduled for today</p>
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-gray-500 text-sm font-medium">Pending</h3>
                                <Clock className="text-orange-500 w-6 h-6" />
                            </div>
                            <p className="text-3xl font-bold text-gray-800">{stats.pending}</p>
                            <p className="text-sm text-gray-500 mt-2">Awaiting confirmation</p>
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-gray-500 text-sm font-medium">Total Patients</h3>
                                <Users className="text-green-500 w-6 h-6" />
                            </div>
                            <p className="text-3xl font-bold text-gray-800">{stats.patients}</p>
                            <p className="text-sm text-gray-500 mt-2">Under your care</p>
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-gray-500 text-sm font-medium">Completed</h3>
                                <CheckCircle className="text-purple-500 w-6 h-6" />
                            </div>
                            <p className="text-3xl font-bold text-gray-800">{stats.completed}</p>
                            <p className="text-sm text-gray-500 mt-2">This month</p>
                        </div>
                    </div>

                    {/* Today's Schedule */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold text-gray-800">Today's Schedule</h2>
                            <Link to="/doctor/appointments" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                                View Calendar →
                            </Link>
                        </div>

                        {todayAppointments.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                                <p>No appointments scheduled for today</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {todayAppointments.map((appointment) => (
                                    <div key={appointment._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                                        <div className="flex items-center gap-4">
                                            <div className="text-center">
                                                <p className="text-2xl font-bold text-gray-800">{appointment.scheduledTime}</p>
                                                <p className="text-xs text-gray-500">{appointment.duration}min</p>
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-800">{appointment.patientId?.name || 'Unknown Patient'}</p>
                                                <div className="text-xs text-gray-500 mt-0.5 space-y-0.5">
                                                    {appointment.patientId?.email && (
                                                        <p className="flex items-center gap-1">
                                                            <span className="opacity-75">📧</span> {appointment.patientId.email}
                                                        </p>
                                                    )}
                                                    {appointment.patientId?.contact && (
                                                        <p className="flex items-center gap-1">
                                                            <span className="opacity-75">📞</span> {appointment.patientId.contact}
                                                        </p>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-600 mt-1 font-medium">{appointment.type} - {appointment.reason}</p>
                                            </div>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(appointment.status)}`}>
                                            {appointment.status}
                                        </span>
                                        {appointment.isTelemedicine && appointment.status !== 'completed' && appointment.status !== 'cancelled' && (
                                            <button
                                                onClick={() => startConsultation(appointment._id)}
                                                className="ml-4 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 flex items-center gap-2 transition"
                                            >
                                                <Video size={16} />
                                                Start
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Quick Actions */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Link to="/doctor/patients" className="block group">
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition duration-200">
                                <Users className="text-blue-600 w-8 h-8 mb-4" />
                                <h3 className="text-xl font-semibold text-gray-800 mb-2 group-hover:text-blue-600">
                                    My Patients
                                </h3>
                                <p className="text-gray-500">View and manage patient records</p>
                            </div>
                        </Link>

                        <Link to="/doctor/appointments" className="block group">
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition duration-200">
                                <Calendar className="text-green-600 w-8 h-8 mb-4" />
                                <h3 className="text-xl font-semibold text-gray-800 mb-2 group-hover:text-green-600">
                                    Appointments
                                </h3>
                                <p className="text-gray-500">Manage your appointment schedule</p>
                            </div>
                        </Link>

                        <Link to="/doctor/prescriptions" className="block group">
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition duration-200">
                                <FileText className="text-purple-600 w-8 h-8 mb-4" />
                                <h3 className="text-xl font-semibold text-gray-800 mb-2 group-hover:text-purple-600">
                                    Prescriptions
                                </h3>
                                <p className="text-gray-500">Create and manage prescriptions</p>
                            </div>
                        </Link>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default DoctorDashboard;

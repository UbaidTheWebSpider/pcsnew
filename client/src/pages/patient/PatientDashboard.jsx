import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosConfig';
import { Calendar, FileText, DollarSign, User, Clock, CheckCircle, AlertCircle, Activity, Video } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import Swal from 'sweetalert2';
import socketService from '../../utils/socket';

const PatientDashboard = () => {
    const navigate = useNavigate();
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();

        // Get user ID from localStorage
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const userId = user._id || user.id;

        if (userId) {
            // Connect to Socket.io and join user room
            socketService.connect(userId);
            socketService.joinUserRoom(userId);

            // Listen for meeting started events
            socketService.onMeetingStarted((data) => {
                console.log('🎥 Meeting started event received:', data);

                // Show notification
                Swal.fire({
                    icon: 'info',
                    title: 'Meeting Started!',
                    text: data.message || 'Doctor has started the video consultation.',
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 5000,
                    timerProgressBar: true
                });

                // Refresh dashboard data
                fetchDashboardData();
            });

            // Listen for appointment updates
            socketService.onAppointmentUpdated(() => {
                fetchDashboardData();
            });
        }

        return () => {
            // Cleanup socket listeners on unmount
            socketService.removeAllListeners();
        };
    }, []);

    const fetchDashboardData = async () => {
        try {
            const token = localStorage.getItem('token');
            const { data } = await axiosInstance.get('/api/patient/dashboard', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setDashboardData(data.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching dashboard:', error);
            setLoading(false);
        }
    };

    const joinConsultation = async (appointment) => {
        try {
            Swal.fire({
                title: 'Joining Video Room...',
                text: 'Please wait',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            const token = localStorage.getItem('token');
            const { data } = await axiosInstance.post('/api/patient/appointments/join-consultation', {
                appointmentId: appointment._id
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (data.success && data.videoCallUrl) {
                Swal.close();
                window.open(data.videoCallUrl, '_blank');
            }
        } catch (error) {
            console.error('Error joining consultation:', error);
            Swal.fire({
                icon: 'error',
                title: 'Unable to Join',
                text: error.response?.data?.message || 'Failed to join video room',
                confirmButtonText: 'OK'
            });
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="p-8">
                    <div className="text-center py-12">
                        <p className="text-gray-500">Loading dashboard...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    const nextAppointment = dashboardData?.upcomingAppointments[0];
    const recentPrescription = dashboardData?.recentPrescriptions[0];

    return (
        <DashboardLayout>
            <div className="p-8">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome Back!</h1>
                    <p className="text-gray-600 mb-8">Here's your health overview</p>

                    {/* Overview Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-medium opacity-90">Next Appointment</h3>
                                <Calendar className="w-6 h-6 opacity-80" />
                            </div>
                            {nextAppointment ? (
                                <>
                                    <p className="text-2xl font-bold">{new Date(nextAppointment.scheduledDate).toLocaleDateString()}</p>
                                    <p className="text-sm opacity-90 mt-1">{nextAppointment.scheduledTime} - {nextAppointment.doctorId?.name}</p>
                                </>
                            ) : (
                                <p className="text-lg">No upcoming appointments</p>
                            )}
                        </div>

                        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl shadow-lg">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-medium opacity-90">Recent Prescription</h3>
                                <FileText className="w-6 h-6 opacity-80" />
                            </div>
                            {recentPrescription ? (
                                <>
                                    <p className="text-2xl font-bold">{recentPrescription.medicines?.length || 0} Medicines</p>
                                    <p className="text-sm opacity-90 mt-1">{new Date(recentPrescription.createdAt).toLocaleDateString()}</p>
                                </>
                            ) : (
                                <p className="text-lg">No prescriptions yet</p>
                            )}
                        </div>

                        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-xl shadow-lg">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-medium opacity-90">Total Appointments</h3>
                                <Activity className="w-6 h-6 opacity-80" />
                            </div>
                            <p className="text-2xl font-bold">{dashboardData?.stats.totalAppointments || 0}</p>
                            <p className="text-sm opacity-90 mt-1">{dashboardData?.stats.completedAppointments || 0} Completed</p>
                        </div>

                        <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 rounded-xl shadow-lg">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-medium opacity-90">Prescriptions</h3>
                                <CheckCircle className="w-6 h-6 opacity-80" />
                            </div>
                            <p className="text-2xl font-bold">{dashboardData?.stats.prescriptionsCount || 0}</p>
                            <p className="text-sm opacity-90 mt-1">Total received</p>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <Link to="/patient/book-appointment" className="flex flex-col items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition">
                                <Calendar className="w-8 h-8 text-blue-600 mb-2" />
                                <span className="text-sm font-medium text-gray-800">Book Appointment</span>
                            </Link>

                            <Link to="/patient/doctors" className="flex flex-col items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition">
                                <User className="w-8 h-8 text-green-600 mb-2" />
                                <span className="text-sm font-medium text-gray-800">Find Doctors</span>
                            </Link>

                            <Link to="/patient/prescriptions" className="flex flex-col items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition">
                                <FileText className="w-8 h-8 text-purple-600 mb-2" />
                                <span className="text-sm font-medium text-gray-800">My Prescriptions</span>
                            </Link>

                            <Link to="/patient/invoices" className="flex flex-col items-center p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition">
                                <DollarSign className="w-8 h-8 text-orange-600 mb-2" />
                                <span className="text-sm font-medium text-gray-800">Invoices</span>
                            </Link>
                        </div>
                    </div>

                    {/* Upcoming Appointments */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold text-gray-800">Upcoming Appointments</h2>
                            <Link to="/patient/appointments" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                                View All →
                            </Link>
                        </div>

                        {dashboardData?.upcomingAppointments.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                                <p>No upcoming appointments</p>
                                <Link to="/patient/book-appointment" className="text-blue-600 hover:text-blue-700 text-sm mt-2 inline-block">
                                    Book your first appointment
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {dashboardData?.upcomingAppointments.map((appointment) => (
                                    <div key={appointment._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                                        <div className="flex items-center gap-4">
                                            <div className="text-center bg-blue-100 rounded-lg p-3">
                                                <p className="text-lg font-bold text-blue-600">
                                                    {new Date(appointment.scheduledDate).getDate()}
                                                </p>
                                                <p className="text-xs text-blue-600">
                                                    {new Date(appointment.scheduledDate).toLocaleDateString('en-US', { month: 'short' })}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-800">{appointment.doctorId?.name}</p>
                                                <p className="text-sm text-gray-600">{appointment.doctorId?.specialization}</p>
                                                <p className="text-sm text-gray-500">{appointment.scheduledTime} • {appointment.type}</p>
                                            </div>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-sm ${appointment.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            {appointment.status}
                                        </span>
                                        {appointment.isTelemedicine && appointment.status !== 'completed' && appointment.status !== 'cancelled' && (
                                            appointment.bbbMeetingId && appointment.meetingStatus === 'in_progress' ? (
                                                <button
                                                    onClick={() => joinConsultation(appointment)}
                                                    className="ml-4 px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 flex items-center gap-2 transition"
                                                >
                                                    <Video size={16} />
                                                    Join
                                                </button>
                                            ) : (
                                                <span className="ml-4 px-4 py-2 bg-gray-100 text-gray-500 text-sm rounded-lg flex items-center gap-2 border border-gray-200">
                                                    <Clock size={16} />
                                                    Waiting for Doctor
                                                </span>
                                            )
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Recent Prescriptions */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold text-gray-800">Recent Prescriptions</h2>
                            <Link to="/patient/prescriptions" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                                View All →
                            </Link>
                        </div>

                        {dashboardData?.recentPrescriptions.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                                <p>No prescriptions yet</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {dashboardData?.recentPrescriptions.map((prescription) => (
                                    <div key={prescription._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                                        <div>
                                            <p className="font-medium text-gray-800">Dr. {prescription.doctorId?.name}</p>
                                            <p className="text-sm text-gray-600">{prescription.medicines?.length} medicines prescribed</p>
                                            <p className="text-sm text-gray-500">{new Date(prescription.createdAt).toLocaleDateString()}</p>
                                        </div>
                                        <Link to={`/patient/prescriptions/${prescription._id}`} className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                                            View →
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default PatientDashboard;

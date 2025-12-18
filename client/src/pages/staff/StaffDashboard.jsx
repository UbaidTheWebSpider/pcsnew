import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../../api/axiosConfig';
import { Users, UserPlus, Calendar, Activity, ClipboardList, ArrowRight } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';

const StaffDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchDashboardStats = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            const { data } = await axiosInstance.get('/api/staff/dashboard', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStats(data.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching dashboard:', error);
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDashboardStats();
    }, [fetchDashboardStats]);

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



    return (
        <DashboardLayout>
            <div className="p-8 bg-gray-50">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">Hospital Staff Dashboard</h1>
                    <p className="text-gray-600 mb-8">Patient Registration & Management Center</p>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-medium opacity-90">Today's Registrations</h3>
                                <UserPlus className="w-6 h-6 opacity-80" />
                            </div>
                            <p className="text-3xl font-bold">{stats?.todayRegistrations || 0}</p>
                            <p className="text-sm opacity-90 mt-2">New patients registered</p>
                        </div>

                        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl shadow-lg">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-medium opacity-90">Total Patients</h3>
                                <Users className="w-6 h-6 opacity-80" />
                            </div>
                            <p className="text-3xl font-bold">{stats?.totalPatients || 0}</p>
                            <p className="text-sm opacity-90 mt-2">In hospital database</p>
                        </div>

                        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-xl shadow-lg">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-medium opacity-90">Active Queue</h3>
                                <Activity className="w-6 h-6 opacity-80" />
                            </div>
                            <p className="text-3xl font-bold">{stats?.activeQueue || 0}</p>
                            <p className="text-sm opacity-90 mt-2">Patients waiting</p>
                        </div>

                        <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 rounded-xl shadow-lg">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-medium opacity-90">Today's Appointments</h3>
                                <Calendar className="w-6 h-6 opacity-80" />
                            </div>
                            <p className="text-3xl font-bold">{stats?.todayAppointments || 0}</p>
                            <p className="text-sm opacity-90 mt-2">Scheduled today</p>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Link
                                to="/staff/register-patient"
                                className="flex items-center justify-between p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                                        <UserPlus className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-800">Register Patient</p>
                                        <p className="text-sm text-gray-600">Add new patient</p>
                                    </div>
                                </div>
                                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition" />
                            </Link>

                            <Link
                                to="/staff/patients"
                                className="flex items-center justify-between p-4 bg-green-50 rounded-lg hover:bg-green-100 transition group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                                        <Users className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-800">Patient List</p>
                                        <p className="text-sm text-gray-600">View all patients</p>
                                    </div>
                                </div>
                                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-green-600 transition" />
                            </Link>

                            <Link
                                to="/staff/checkin"
                                className="flex items-center justify-between p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                                        <ClipboardList className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-800">Check-In</p>
                                        <p className="text-sm text-gray-600">Patient check-in</p>
                                    </div>
                                </div>
                                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition" />
                            </Link>

                            <Link
                                to="/staff/health-cards"
                                className="flex items-center justify-between p-4 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center">
                                        <ClipboardList className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-800">Health Cards</p>
                                        <p className="text-sm text-gray-600">Digital IDs</p>
                                    </div>
                                </div>
                                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 transition" />
                            </Link>
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Activity</h2>
                        <div className="text-center py-8 text-gray-500">
                            <Activity className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                            <p>No recent activity</p>
                            <p className="text-sm mt-1">Patient registrations and check-ins will appear here</p>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default StaffDashboard;

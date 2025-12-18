import { Link } from 'react-router-dom';
import { Users, Building2, FileText, Activity, Calendar, DollarSign, UserCheck, TrendingUp } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import StatCard from '../../components/StatCard';
import { PatientFlowLineChart, DepartmentBarChart, AdmissionStackedChart } from '../../components/charts';

const AdminDashboard = () => {
    // Mock data - in production, fetch from API
    const stats = {
        totalDoctors: 12,
        totalPharmacies: 3,
        appointmentsToday: 45,
        totalPatients: 234,
        activeConsultations: 8,
        monthlyRevenue: 45600,
        pendingInvoices: 8,
        completedAppointments: 156
    };

    return (
        <DashboardLayout>
            <div className="p-8">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                            Hospital Admin Dashboard
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            Welcome back! Here's what's happening today.
                        </p>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <StatCard
                            title="Total Doctors"
                            value={stats.totalDoctors}
                            icon={Users}
                            color="blue"
                            trend="up"
                            trendValue="+2 this month"
                        />
                        <StatCard
                            title="Total Patients"
                            value={stats.totalPatients}
                            icon={UserCheck}
                            color="green"
                            trend="up"
                            trendValue="+18 this week"
                        />
                        <StatCard
                            title="Appointments Today"
                            value={stats.appointmentsToday}
                            icon={Calendar}
                            color="purple"
                        />
                        <StatCard
                            title="Active Consultations"
                            value={stats.activeConsultations}
                            icon={Activity}
                            color="orange"
                        />
                    </div>

                    {/* Revenue & Performance */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                        <StatCard
                            title="Monthly Revenue"
                            value={`$${stats.monthlyRevenue.toLocaleString()}`}
                            icon={DollarSign}
                            color="green"
                            trend="up"
                            trendValue="+12.5%"
                        />
                        <StatCard
                            title="Completed Appointments"
                            value={stats.completedAppointments}
                            icon={TrendingUp}
                            color="blue"
                            trend="up"
                            trendValue="+8% vs last month"
                        />
                        <StatCard
                            title="Pending Invoices"
                            value={stats.pendingInvoices}
                            icon={FileText}
                            color="red"
                            trend="down"
                            trendValue="-3 from yesterday"
                        />
                    </div>

                    {/* Analytics Charts Section */}
                    <div className="mb-8">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                            Analytics Overview
                        </h2>

                        {/* Charts Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                            {/* Patient Flow Line Chart */}
                            <PatientFlowLineChart />

                            {/* Department Bar Chart */}
                            <DepartmentBarChart />
                        </div>

                        {/* Admission Stacked Chart - Full Width */}
                        <div className="w-full">
                            <AdmissionStackedChart />
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="mb-6">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                            Quick Actions
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <Link to="/admin/doctors" className="block group">
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md hover:border-blue-500 dark:hover:border-blue-400 transition-all duration-200">
                                <div className="flex items-center gap-4 mb-3">
                                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                        <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                        Manage Clinics
                                    </h3>
                                </div>
                                <p className="text-gray-600 dark:text-gray-400 text-sm">
                                    Add, edit, or remove doctors from the hospital staff.
                                </p>
                            </div>
                        </Link>

                        <Link to="/admin/pharmacies" className="block group">
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md hover:border-green-500 dark:hover:border-green-400 transition-all duration-200">
                                <div className="flex items-center gap-4 mb-3">
                                    <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                        <Building2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                                        Manage Pharmacies
                                    </h3>
                                </div>
                                <p className="text-gray-600 dark:text-gray-400 text-sm">
                                    Register new pharmacies and monitor their status.
                                </p>
                            </div>
                        </Link>

                        <Link to="/admin/patients" className="block group">
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md hover:border-purple-500 dark:hover:border-purple-400 transition-all duration-200">
                                <div className="flex items-center gap-4 mb-3">
                                    <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                        <UserCheck className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                                        Patient Console
                                    </h3>
                                </div>
                                <p className="text-gray-600 dark:text-gray-400 text-sm">
                                    Register and manage patient records.
                                </p>
                            </div>
                        </Link>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default AdminDashboard;

import { Link } from 'react-router-dom';
import { Users, Building2, FileText, Activity } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';

const AdminDashboard = () => {
    return (
        <DashboardLayout>
            <div className="p-8">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-3xl font-bold text-gray-800 mb-8">Hospital Admin Dashboard</h1>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-gray-500 text-sm font-medium">Total Doctors</h3>
                                <Users className="text-blue-500 w-6 h-6" />
                            </div>
                            <p className="text-3xl font-bold text-gray-800">12</p>
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-gray-500 text-sm font-medium">Pharmacies</h3>
                                <Building2 className="text-green-500 w-6 h-6" />
                            </div>
                            <p className="text-3xl font-bold text-gray-800">3</p>
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-gray-500 text-sm font-medium">Appointments Today</h3>
                                <Activity className="text-purple-500 w-6 h-6" />
                            </div>
                            <p className="text-3xl font-bold text-gray-800">45</p>
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-gray-500 text-sm font-medium">Pending Invoices</h3>
                                <FileText className="text-orange-500 w-6 h-6" />
                            </div>
                            <p className="text-3xl font-bold text-gray-800">8</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <Link to="/admin/doctors" className="block group">
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition duration-200">
                                <h3 className="text-xl font-semibold text-gray-800 mb-2 group-hover:text-blue-600">Manage Doctors</h3>
                                <p className="text-gray-500">Add, edit, or remove doctors from the hospital staff.</p>
                            </div>
                        </Link>

                        <Link to="/admin/pharmacies" className="block group">
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition duration-200">
                                <h3 className="text-xl font-semibold text-gray-800 mb-2 group-hover:text-green-600">Manage Pharmacies</h3>
                                <p className="text-gray-500">Register new pharmacies and monitor their status.</p>
                            </div>
                        </Link>

                        <Link to="/admin/patients" className="block group">
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition duration-200">
                                <h3 className="text-xl font-semibold text-gray-800 mb-2 group-hover:text-purple-600">Patient Entry Console</h3>
                                <p className="text-gray-500">Register and manage patient records.</p>
                            </div>
                        </Link>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default AdminDashboard;

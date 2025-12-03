import { Link } from 'react-router-dom';
import { Package, FileText, AlertTriangle, TrendingUp, Clock } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';

const PharmacyDashboard = () => {
    return (
        <DashboardLayout>
            <div className="p-8 max-w-7xl mx-auto space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Pharmacy Dashboard</h1>
                        <p className="text-slate-500 mt-1">Welcome back, manage your inventory and prescriptions.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm">
                            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </span>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 card-hover group">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center group-hover:bg-orange-100 transition-colors">
                                <Clock className="text-orange-500 w-6 h-6" />
                            </div>
                            <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded-full">Pending</span>
                        </div>
                        <p className="text-3xl font-bold text-slate-800">8</p>
                        <p className="text-sm text-slate-500 mt-1">Prescriptions waiting</p>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 card-hover group">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center group-hover:bg-red-100 transition-colors">
                                <AlertTriangle className="text-red-500 w-6 h-6" />
                            </div>
                            <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-full">Alert</span>
                        </div>
                        <p className="text-3xl font-bold text-slate-800">12</p>
                        <p className="text-sm text-slate-500 mt-1">Low stock items</p>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 card-hover group">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                                <Package className="text-blue-500 w-6 h-6" />
                            </div>
                            <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">Inventory</span>
                        </div>
                        <p className="text-3xl font-bold text-slate-800">245</p>
                        <p className="text-sm text-slate-500 mt-1">Total medicines</p>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 card-hover group">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                                <TrendingUp className="text-emerald-500 w-6 h-6" />
                            </div>
                            <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">+12%</span>
                        </div>
                        <p className="text-3xl font-bold text-slate-800">₹15,420</p>
                        <p className="text-sm text-slate-500 mt-1">Today's sales</p>
                    </div>
                </div>

                {/* Quick Actions */}
                <div>
                    <h2 className="text-lg font-semibold text-slate-800 mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <Link to="/pharmacy/prescriptions" className="block group">
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all duration-300 h-full">
                                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                                    <FileText className="text-blue-600 w-7 h-7" />
                                </div>
                                <h3 className="text-lg font-semibold text-slate-800 mb-2 group-hover:text-blue-600 transition-colors">
                                    Prescription Queue
                                </h3>
                                <p className="text-slate-500 text-sm leading-relaxed">
                                    View and process incoming digital prescriptions from doctors.
                                </p>
                            </div>
                        </Link>

                        <Link to="/pharmacy/inventory" className="block group">
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:border-emerald-200 hover:shadow-md transition-all duration-300 h-full">
                                <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                                    <Package className="text-emerald-600 w-7 h-7" />
                                </div>
                                <h3 className="text-lg font-semibold text-slate-800 mb-2 group-hover:text-emerald-600 transition-colors">
                                    Medicine Inventory
                                </h3>
                                <p className="text-slate-500 text-sm leading-relaxed">
                                    Manage stock levels, add new batches, and update pricing.
                                </p>
                            </div>
                        </Link>

                        <Link to="/pharmacy/alerts" className="block group">
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:border-red-200 hover:shadow-md transition-all duration-300 h-full">
                                <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                                    <AlertTriangle className="text-red-600 w-7 h-7" />
                                </div>
                                <h3 className="text-lg font-semibold text-slate-800 mb-2 group-hover:text-red-600 transition-colors">
                                    Stock Alerts
                                </h3>
                                <p className="text-slate-500 text-sm leading-relaxed">
                                    Monitor low stock items and expiring medicines.
                                </p>
                            </div>
                        </Link>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default PharmacyDashboard;

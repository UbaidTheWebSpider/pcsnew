import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Building2, Calendar, Package, FileText, AlertTriangle, CreditCard, ShoppingCart } from 'lucide-react';
import { useContext } from 'react';
import AuthContext from '../context/AuthContext';

const Sidebar = () => {
    const location = useLocation();
    const { user } = useContext(AuthContext);

    const getMenuItems = () => {
        switch (user?.role) {
            case 'hospital_admin':
                return [
                    { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
                    { path: '/admin/doctors', label: 'Manage Clinics', icon: Users },
                    { path: '/admin/pharmacies', label: 'Manage Pharmacies', icon: Building2 },
                    { path: '/admin/pharmacists', label: 'Manage Pharmacists', icon: Users },
                    { path: '/admin/patients', label: 'Manage Patients', icon: Users },
                    { path: '/staff/health-cards', label: 'Health Cards', icon: CreditCard },
                    { path: '/staff/health-id', label: 'Health ID', icon: CreditCard },
                ];
            case 'doctor':
                return [
                    { path: '/doctor', label: 'Dashboard', icon: LayoutDashboard },
                    { path: '/doctor/patients', label: 'My Patients', icon: Users },
                    { path: '/doctor/appointments', label: 'Appointments', icon: Calendar },
                    { path: '/doctor/prescriptions', label: 'Prescriptions', icon: FileText },
                ];
            case 'patient':
                return [
                    { path: '/patient', label: 'Dashboard', icon: LayoutDashboard },
                    { path: '/patient/doctors', label: 'Find Doctors', icon: Users },
                    { path: '/patient/appointments', label: 'My Appointments', icon: Calendar },
                    { path: '/patient/prescriptions', label: 'Prescriptions', icon: FileText },
                ];
            case 'hospital_staff':
                return [
                    { path: '/staff', label: 'Dashboard', icon: LayoutDashboard },
                    { path: '/staff/register-patient', label: 'Register Patient', icon: Users },
                    { path: '/staff/patients', label: 'Patient List', icon: Users },
                    { path: '/staff/checkin', label: 'Check-In', icon: Calendar },
                    { path: '/staff/health-cards', label: 'Digital Health Cards', icon: CreditCard },
                    { path: '/staff/health-id', label: 'Health ID', icon: CreditCard },
                ];
            case 'pharmacy':
                return [
                    { path: '/pharmacy', label: 'Dashboard', icon: LayoutDashboard },
                    { path: '/pharmacy/prescriptions', label: 'Prescriptions', icon: FileText },
                    { path: '/pharmacy/inventory', label: 'Inventory', icon: Package },
                    { path: '/pharmacy/alerts', label: 'Stock Alerts', icon: AlertTriangle },
                    { path: '/pharmacy/pos', label: 'Point of Sale', icon: ShoppingCart },
                ];
            default:
                return [];
        }
    };

    const menuItems = getMenuItems();

    return (
        <aside className="w-72 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 min-h-screen flex flex-col shadow-sm z-10 transition-colors duration-200">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-600 dark:bg-blue-500 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-lg">P</span>
                    </div>
                    <span className="text-xl font-bold text-gray-800 dark:text-white tracking-tight">Pharmacy</span>
                </div>
            </div>

            <div className="p-4 flex-1 overflow-y-auto">
                <nav className="space-y-1">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 group ${isActive
                                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium shadow-sm'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-200'
                                    }`}
                            >
                                <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300'}`} />
                                <span className="text-sm">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>
            </div>

            <div className="p-4 border-t border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xs">
                        {user?.name?.charAt(0) || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{user?.name || 'User'}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate capitalize">{user?.role?.replace('_', ' ') || 'Role'}</p>
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;

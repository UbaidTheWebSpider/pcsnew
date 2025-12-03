import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Building2, Calendar, Package, FileText, AlertTriangle } from 'lucide-react';
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
                    { path: '/admin/doctors', label: 'Manage Doctors', icon: Users },
                    { path: '/admin/pharmacies', label: 'Manage Pharmacies', icon: Building2 },
                    { path: '/admin/patients', label: 'Manage Patients', icon: Users },
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
                    { path: '/staff/check-in', label: 'Check-In', icon: Calendar },
                ];
            case 'pharmacy':
                return [
                    { path: '/pharmacy', label: 'Dashboard', icon: LayoutDashboard },
                    { path: '/pharmacy/prescriptions', label: 'Prescriptions', icon: FileText },
                    { path: '/pharmacy/inventory', label: 'Inventory', icon: Package },
                    { path: '/pharmacy/alerts', label: 'Stock Alerts', icon: AlertTriangle },
                ];
            default:
                return [];
        }
    };

    const menuItems = getMenuItems();

    return (
        <aside className="w-72 bg-white border-r border-slate-200 min-h-screen flex flex-col shadow-sm z-10">
            <div className="p-6 border-b border-slate-100">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-lg">P</span>
                    </div>
                    <span className="text-xl font-bold text-slate-800 tracking-tight">Pharmacy</span>
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
                                    ? 'bg-blue-50 text-blue-600 font-medium shadow-sm'
                                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                    }`}
                            >
                                <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                                <span className="text-sm">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>
            </div>

            <div className="p-4 border-t border-slate-100">
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                        {user?.name?.charAt(0) || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{user?.name || 'User'}</p>
                        <p className="text-xs text-slate-500 truncate capitalize">{user?.role?.replace('_', ' ') || 'Role'}</p>
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;

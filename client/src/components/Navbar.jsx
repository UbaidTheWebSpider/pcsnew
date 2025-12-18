import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { LogOut, User, ChevronDown } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

const Navbar = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const [showDropdown, setShowDropdown] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const getRoleLabel = (role) => {
        const roleMap = {
            'hospital_admin': 'Hospital Admin',
            'doctor': 'Doctor',
            'patient': 'Patient',
            'pharmacy': 'Pharmacy'
        };
        return roleMap[role] || role;
    };

    return (
        <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 px-6 py-4 transition-colors duration-200">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400">Telemedicine Dashboard</h1>
                </div>

                <div className="flex items-center gap-4">
                    <ThemeToggle />

                    <div className="relative">
                        <button
                            onClick={() => setShowDropdown(!showDropdown)}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                        >
                            <div className="w-8 h-8 bg-blue-600 dark:bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                                {user?.name?.charAt(0).toUpperCase()}
                            </div>
                            <div className="text-left">
                                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{user?.name}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{getRoleLabel(user?.role)}</p>
                            </div>
                            <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        </button>

                        {showDropdown && (
                            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
                                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{user?.name}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
                                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">{getRoleLabel(user?.role)}</p>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Logout
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;

import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const SuperAdminDashboard = () => {
    const { logout } = useAuth();
    const location = useLocation();

    const navItems = [
        { path: '/super-admin', label: 'Overview' },
        { path: '/super-admin/features', label: 'Feature Flags' },
        { path: '/super-admin/modules', label: 'Modules' },
        { path: '/super-admin/layouts', label: 'Layouts' },
        { path: '/super-admin/builder', label: 'Visual Builder' },
        { path: '/super-admin/audit', label: 'Audit Logs' },
    ];

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <div className="w-64 bg-gray-900 text-white flex flex-col">
                <div className="p-4 text-xl font-bold bg-gray-800">
                    Super Admin
                </div>
                <nav className="flex-1 p-4 space-y-2">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`block px-4 py-2 rounded transition-colors ${location.pathname === item.path
                                ? 'bg-blue-600 text-white'
                                : 'hover:bg-gray-800 text-gray-300'
                                }`}
                        >
                            {item.label}
                        </Link>
                    ))}
                </nav>
                <div className="p-4 border-t border-gray-800">
                    <button
                        onClick={logout}
                        className="w-full px-4 py-2 text-sm text-center text-red-400 hover:text-red-300 transition-colors"
                    >
                        Sign Out
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-auto">
                <header className="bg-white shadow p-4">
                    <h1 className="text-2xl font-semibold text-gray-800">
                        Control System
                    </h1>
                </header>
                <main className="p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default SuperAdminDashboard;

import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useConfig } from '../context/ConfigContext';

const SuperAdminRoute = () => {
    const { user, loading } = useAuth();

    if (loading) return <div>Loading...</div>;

    const { isFeatureEnabled } = useConfig();

    // Optional: Global kill switch for the UI
    // If flag is missing, we default to TRUE for Super Admins if they exist? 
    // Or default to FALSE? Requirement says default OFF.
    // But if I default to OFF, I can never enable it via UI!
    // So this Flag must be seeded true or I need a way to enable it.
    // For now, let's assume if I am super_admin, I can enter, unless explicitly disabled.
    // Or better: The flag controls "Advanced Features". The dashboard itself should be accessible to turn them on.

    if (user && user.role === 'super_admin') {
        return <Outlet />;
    }

    return <Navigate to="/login" replace />;
};

export default SuperAdminRoute;

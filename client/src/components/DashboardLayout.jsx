import Navbar from './Navbar';
import Sidebar from './Sidebar';

const DashboardLayout = ({ children }) => {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
            <Navbar />
            <div className="flex">
                <Sidebar />
                <main className="flex-1">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;

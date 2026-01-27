import Navbar from './Navbar';
import Sidebar from './Sidebar';

const DashboardLayout = ({ children }) => {
    return (
        <div className="relative min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200 overflow-hidden">
            {/* Ambient Glowing Corners */}
            <div className="glow-corner-tl" />
            <div className="glow-corner-br" />

            <div className="relative z-10">
                <Navbar />
                <div className="flex">
                    <Sidebar />
                    <main className="flex-1">
                        {children}
                    </main>
                </div>
            </div>
        </div>
    );
};

export default DashboardLayout;

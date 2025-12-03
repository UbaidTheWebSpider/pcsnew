import { useLocation, useNavigate } from 'react-router-dom';
import { X, Maximize2, Minimize2 } from 'lucide-react';
import { useState } from 'react';

const TelemedicineRoom = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [isFullscreen, setIsFullscreen] = useState(false);

    const { videoUrl, roomId, userName } = location.state || {};

    if (!videoUrl) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">No Video Room</h2>
                    <p className="text-gray-600 mb-4">Please start or join a consultation from your dashboard</p>
                    <button
                        onClick={() => navigate(-1)}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    const handleExit = () => {
        if (window.confirm('Are you sure you want to leave the consultation?')) {
            navigate(-1);
        }
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    // Build Jitsi URL with user configuration
    const jitsiUrl = `${videoUrl}#config.prejoinPageEnabled=false&userInfo.displayName=${encodeURIComponent(userName)}`;

    return (
        <div className="min-h-screen bg-gray-900 flex flex-col">
            {/* Header */}
            <div className="bg-gray-800 px-6 py-4 flex justify-between items-center">
                <div>
                    <h1 className="text-xl font-bold text-white">Telemedicine Consultation</h1>
                    <p className="text-sm text-gray-400">Room ID: {roomId}</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={toggleFullscreen}
                        className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 flex items-center gap-2"
                    >
                        {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                        {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                    </button>
                    <button
                        onClick={handleExit}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
                    >
                        <X size={18} />
                        Leave Call
                    </button>
                </div>
            </div>

            {/* Video Frame */}
            <div className="flex-1 relative">
                <iframe
                    src={jitsiUrl}
                    allow="camera; microphone; fullscreen; display-capture; autoplay"
                    className="w-full h-full border-0"
                    title="Video Consultation"
                />
            </div>
        </div>
    );
};

export default TelemedicineRoom;

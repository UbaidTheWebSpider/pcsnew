import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import {
    Search, User, CreditCard, Activity, Phone, MapPin,
    Camera, CameraOff, AlertCircle, CheckCircle, XCircle, Loader2
} from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import axiosInstance from '../../api/axiosConfig';
import Swal from 'sweetalert2';
import { extractHealthId, isValidHealthId } from '../../utils/healthIdValidator';

const HealthIdScanner = () => {
    // State Management
    const [scanResult, setScanResult] = useState(null);
    const [manualId, setManualId] = useState('');
    const [loading, setLoading] = useState(false);
    const [patient, setPatient] = useState(null);
    const [isScanning, setIsScanning] = useState(false);
    const [cameraPermission, setCameraPermission] = useState('prompt'); // 'granted', 'denied', 'prompt'
    const [cameras, setCameras] = useState([]);
    const [selectedCamera, setSelectedCamera] = useState(null);
    const [scannerError, setScannerError] = useState(null);

    const scannerRef = useRef(null);
    const lastScanTime = useRef(0);
    const readerElementId = 'qr-reader';

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopScanning();
        };
    }, []);

    // Get available cameras
    useEffect(() => {
        const getCameras = async () => {
            try {
                const devices = await Html5Qrcode.getCameras();
                setCameras(devices);
                if (devices.length > 0) {
                    setSelectedCamera(devices[0].id);
                }
            } catch (error) {
                setScannerError('Unable to access cameras');
            }
        };
        getCameras();
    }, []);

    const stopScanning = async () => {
        if (scannerRef.current && scannerRef.current.isScanning) {
            try {
                await scannerRef.current.stop();
                scannerRef.current.clear();
            } catch (error) {
                // Scanner already stopped
            }
        }
        setIsScanning(false);
        setScannerError(null);
    };

    const fetchPatientData = async (queryId) => {
        if (!queryId) return;

        // Prevent duplicate scans within 15 seconds
        const now = Date.now();
        if (now - lastScanTime.current < 15000) {
            return;
        }
        lastScanTime.current = now;

        try {
            setLoading(true);
            setPatient(null);
            const token = localStorage.getItem('token');

            const { data } = await axiosInstance.get('/api/staff/patients', {
                params: { search: queryId, limit: 1 },
                headers: { Authorization: `Bearer ${token}` }
            });

            if (data.success && data.data) {
                const patients = data.data.patients || data.data;
                const foundPatient = Array.isArray(patients) ? patients[0] : null;

                if (foundPatient) {
                    setPatient(foundPatient);

                    // Audio feedback
                    playSuccessSound();

                    // Vibration feedback (if supported)
                    if (navigator.vibrate) {
                        navigator.vibrate(200);
                    }

                    Swal.fire({
                        icon: 'success',
                        title: 'Patient Found',
                        text: `Found ${foundPatient.name || foundPatient.personalInfo?.fullName}`,
                        timer: 1500,
                        showConfirmButton: false
                    });

                    // Stop scanning after success
                    await stopScanning();
                } else {
                    Swal.fire('Not Found', 'No patient found with this Health ID', 'warning');
                }
            }
        } catch (error) {
            if (error.response?.status === 404) {
                Swal.fire('Not Found', 'Patient not found in system', 'warning');
            } else if (error.code === 'ERR_NETWORK') {
                Swal.fire('Network Error', 'Please check your connection and try again', 'error');
            } else {
                Swal.fire('Error', 'Failed to fetch patient data', 'error');
            }
        } finally {
            setLoading(false);
        }
    };

    const playSuccessSound = () => {
        try {
            const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUKXh8LJnHgU2jdXwyHkpBSl+zPLaizsKGGS56+mnUhELTKXh8bllHAU7k9n0xnMoBSh+zPDajDwLGGS56+mnUhELTKXh8bllHAU7k9n0xnMoBSh+zPDajDwLGGS56+mnUhELTKXh8bllHAU7k9n0xnMoBSh+zPDajDwL');
            audio.volume = 0.3;
            audio.play().catch(() => { });
        } catch (e) {
            // Audio not supported
        }
    };

    const startScanning = async () => {
        if (isScanning) return;

        setScannerError(null);
        setIsScanning(true);

        // Wait for DOM to be ready
        setTimeout(async () => {
            try {
                // Check if element exists
                const element = document.getElementById(readerElementId);
                if (!element) {
                    throw new Error('Scanner element not found. Please try again.');
                }

                const scanner = new Html5Qrcode(readerElementId);
                scannerRef.current = scanner;

                const config = {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1.0,
                    formatsToSupport: [
                        0, // QR_CODE
                        8, // CODE_128
                        13, // EAN_13
                        2  // CODE_39
                    ]
                };

                // Start scanner directly - it will request permissions
                await scanner.start(
                    selectedCamera || { facingMode: 'environment' },
                    config,
                    (decodedText) => {
                        // Success callback
                        setScanResult(decodedText);
                        setCameraPermission('granted');

                        // Extract and validate ID
                        const healthId = extractHealthId(decodedText);

                        if (healthId && isValidHealthId(healthId)) {
                            fetchPatientData(healthId);
                        } else {
                            Swal.fire('Invalid Format', 'The scanned code does not contain a valid Health ID', 'warning');
                        }
                    },
                    (errorMessage) => {
                        // Error callback (scanning in progress, ignore)
                    }
                );

                setCameraPermission('granted');

            } catch (error) {
                console.error('Camera start error:', error);
                setIsScanning(false);

                if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
                    setCameraPermission('denied');
                    setScannerError('Camera permission denied. Please allow camera access in your browser settings.');
                } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
                    setScannerError('No camera found on this device.');
                } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
                    setScannerError('Camera is already in use by another application. Please close other apps using the camera.');
                } else if (error.name === 'OverconstrainedError') {
                    setScannerError('Camera does not support the required settings. Trying alternative configuration...');
                    // Retry with simpler config
                    retryWithFallbackConfig();
                } else {
                    setScannerError(`Camera error: ${error.message || 'Unknown error'}. Please refresh the page and try again.`);
                }
            }
        }, 100); // 100ms delay for DOM to render
    };

    const retryWithFallbackConfig = async () => {
        try {
            const scanner = new Html5Qrcode(readerElementId);
            scannerRef.current = scanner;

            // Simpler configuration
            const fallbackConfig = {
                fps: 5,
                qrbox: 200
            };

            await scanner.start(
                { facingMode: 'user' }, // Try front camera
                fallbackConfig,
                (decodedText) => {
                    setScanResult(decodedText);
                    const healthId = extractHealthId(decodedText);
                    if (healthId && isValidHealthId(healthId)) {
                        fetchPatientData(healthId);
                    }
                },
                () => { }
            );

            setIsScanning(true);
            setScannerError(null);
            setCameraPermission('granted');
        } catch (retryError) {
            console.error('Fallback config failed:', retryError);
            setScannerError('Unable to initialize camera with any configuration. Please check browser permissions.');
            setIsScanning(false);
        }
    };

    const handleManualSearch = (e) => {
        e.preventDefault();
        if (manualId.trim()) {
            const healthId = extractHealthId(manualId);
            if (healthId && isValidHealthId(healthId)) {
                fetchPatientData(healthId);
            } else {
                Swal.fire('Invalid Format', 'Please enter a valid Health ID', 'warning');
            }
        }
    };

    const handleClearPatient = () => {
        setPatient(null);
        setScanResult(null);
        setManualId('');
    };

    return (
        <DashboardLayout>
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                            <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-lg">
                                <CreditCard className="text-white" size={28} />
                            </div>
                            Health ID Scanner
                        </h1>
                        <p className="text-gray-600 mt-2">Scan QR code or barcode for instant patient identification</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Scanner Section */}
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                    <Activity className="text-emerald-500" size={20} />
                                    Camera Scanner
                                </h2>
                                {cameras.length > 1 && (
                                    <select
                                        value={selectedCamera || ''}
                                        onChange={(e) => setSelectedCamera(e.target.value)}
                                        className="text-sm px-3 py-1.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                                        disabled={isScanning}
                                    >
                                        {cameras.map((camera, idx) => (
                                            <option key={camera.id} value={camera.id}>
                                                Camera {idx + 1}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            {/* Scanner Area */}
                            <div className="relative bg-gray-900 rounded-xl overflow-hidden min-h-[400px] flex items-center justify-center">
                                {isScanning ? (
                                    <div id={readerElementId} className="w-full h-full"></div>
                                ) : cameraPermission === 'denied' ? (
                                    <div className="text-center p-8">
                                        <XCircle className="text-red-400 mx-auto mb-4" size={64} />
                                        <h3 className="text-white font-semibold mb-2">Camera Access Denied</h3>
                                        <p className="text-gray-400 text-sm mb-4">Please enable camera permissions in your browser settings</p>
                                        <button
                                            onClick={() => window.location.reload()}
                                            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                                        >
                                            Retry
                                        </button>
                                    </div>
                                ) : scannerError ? (
                                    <div className="text-center p-8">
                                        <AlertCircle className="text-yellow-400 mx-auto mb-4" size={64} />
                                        <p className="text-white text-sm">{scannerError}</p>
                                    </div>
                                ) : (
                                    <div className="text-center p-8">
                                        <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm border-2 border-emerald-500/30">
                                            <Camera className="text-emerald-400" size={48} />
                                        </div>
                                        <p className="text-gray-300 mb-6">Position the Health ID within the frame</p>
                                        <button
                                            onClick={startScanning}
                                            className="px-8 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all shadow-lg flex items-center gap-2 mx-auto"
                                        >
                                            <Camera size={20} />
                                            Start Scanning
                                        </button>
                                    </div>
                                )}

                                {/* Scan Overlay */}
                                {isScanning && (
                                    <div className="absolute inset-0 pointer-events-none">
                                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-4 border-emerald-500 rounded-2xl">
                                            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-xl"></div>
                                            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-xl"></div>
                                            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-xl"></div>
                                            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-xl"></div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Controls */}
                            <div className="mt-4 flex gap-2">
                                {isScanning && (
                                    <button
                                        onClick={stopScanning}
                                        className="flex-1 px-4 py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <CameraOff size={20} />
                                        Stop Camera
                                    </button>
                                )}
                            </div>

                            {/* Manual Entry */}
                            <div className="mt-8">
                                <div className="text-center text-sm text-gray-400 mb-4 font-medium uppercase tracking-wider">Or enter manually</div>
                                <form onSubmit={handleManualSearch} className="flex gap-2">
                                    <input
                                        type="text"
                                        value={manualId}
                                        onChange={(e) => setManualId(e.target.value)}
                                        placeholder="Enter Health ID (e.g., HID-2024-001)"
                                        className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                                    />
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="px-6 py-3 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {loading ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}
                                        {loading ? 'Searching...' : 'Search'}
                                    </button>
                                </form>
                            </div>
                        </div>

                        {/* Patient Information Section */}
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                <User className="text-blue-500" size={20} />
                                Patient Information
                            </h2>

                            {patient ? (
                                <div className="animate-fadeIn">
                                    <div className="flex flex-col items-center mb-8">
                                        <div className="w-28 h-28 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 mb-4 border-4 border-white shadow-xl overflow-hidden">
                                            {patient.photoUrl || patient.personalInfo?.photoUrl ? (
                                                <img
                                                    src={patient.photoUrl || patient.personalInfo?.photoUrl}
                                                    alt={patient.name || patient.personalInfo?.fullName}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-blue-600 text-3xl font-bold">
                                                    {(patient.name || patient.personalInfo?.fullName || 'P').charAt(0)}
                                                </div>
                                            )}
                                        </div>
                                        <h3 className="text-2xl font-bold text-gray-900">{patient.name || patient.personalInfo?.fullName}</h3>
                                        <div className="flex items-center gap-2 mt-2">
                                            <CheckCircle className="text-emerald-500" size={18} />
                                            <p className="text-emerald-600 font-mono font-medium bg-emerald-50 px-4 py-1.5 rounded-full">
                                                {patient.healthId || 'No Health ID'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                                            <div className="text-xs text-gray-500 uppercase tracking-wider mb-1 font-semibold">Patient ID</div>
                                            <div className="font-bold text-gray-800">{patient.patientId}</div>
                                        </div>
                                        <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                                            <div className="text-xs text-gray-500 uppercase tracking-wider mb-1 font-semibold">CNIC</div>
                                            <div className="font-bold text-gray-800">{patient.cnic || patient.personalInfo?.cnic || 'N/A'}</div>
                                        </div>
                                        <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                                            <div className="text-xs text-gray-500 uppercase tracking-wider mb-1 font-semibold">Phone</div>
                                            <div className="font-bold text-gray-800 flex items-center gap-2">
                                                <Phone size={14} className="text-gray-400" />
                                                {patient.contact?.phone || patient.contactInfo?.mobileNumber || 'N/A'}
                                            </div>
                                        </div>
                                        <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                                            <div className="text-xs text-gray-500 uppercase tracking-wider mb-1 font-semibold">Gender / Age</div>
                                            <div className="font-bold text-gray-800 capitalize">
                                                {patient.gender || patient.personalInfo?.gender || '-'} / {patient.age || 'N/A'}
                                            </div>
                                        </div>
                                        <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200 md:col-span-2">
                                            <div className="text-xs text-gray-500 uppercase tracking-wider mb-1 font-semibold">Address</div>
                                            <div className="font-bold text-gray-800 flex items-center gap-2">
                                                <MapPin size={14} className="text-gray-400" />
                                                {patient.contact?.address || patient.contactInfo?.address || 'N/A'}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="mt-8 flex gap-3">
                                        <button
                                            onClick={() => window.location.href = `/staff/checkin?patientId=${patient._id}`}
                                            className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg"
                                        >
                                            Process Check-In
                                        </button>
                                        <button
                                            onClick={handleClearPatient}
                                            className="px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors"
                                        >
                                            Clear
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center p-8 text-gray-400 min-h-[500px]">
                                    <div className="w-28 h-28 bg-gradient-to-br from-gray-50 to-gray-100 rounded-full flex items-center justify-center mb-6 border-4 border-gray-200">
                                        <User size={56} className="text-gray-300" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-gray-600 mb-2">No Patient Selected</h3>
                                    <p className="max-w-xs text-gray-500">Scan a Health ID or search manually to view patient details here</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default HealthIdScanner;

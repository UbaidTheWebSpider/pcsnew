import { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode';
import { Search, User, CreditCard, Activity, Phone, MapPin, Calendar, AlertCircle } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import axiosInstance from '../../api/axiosConfig';
import Swal from 'sweetalert2';

const HealthIdScanner = () => {
    const [scanResult, setScanResult] = useState(null);
    const [manualId, setManualId] = useState('');
    const [loading, setLoading] = useState(false);
    const [patient, setPatient] = useState(null);
    const [isScanning, setIsScanning] = useState(false);
    const scannerRef = useRef(null);

    useEffect(() => {
        // Cleanup on unmount
        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(error => {
                    console.error('Failed to clear html5-qrcode', error);
                });
            }
        };
    }, []);

    const fetchPatientData = async (queryId) => {
        if (!queryId) return;

        try {
            setLoading(true);
            setPatient(null);
            const token = localStorage.getItem('token');

            // Search by Health ID or Patient ID
            const { data } = await axiosInstance.get('/api/staff/patients', {
                params: { search: queryId, limit: 1 },
                headers: { Authorization: `Bearer ${token}` }
            });

            if (data.success && data.data) {
                const patients = data.data.patients || data.data;
                const foundPatient = Array.isArray(patients) ? patients[0] : null;

                if (foundPatient) {
                    setPatient(foundPatient);
                    Swal.fire({
                        icon: 'success',
                        title: 'Patient Found',
                        text: `Found ${foundPatient.name || foundPatient.personalInfo?.fullName}`,
                        timer: 1500,
                        showConfirmButton: false
                    });
                } else {
                    Swal.fire('Not Found', 'No patient found with this Health ID', 'warning');
                }
            }
        } catch (error) {
            console.error('Error fetching patient:', error);
            Swal.fire('Error', 'Failed to fetch patient data', 'error');
        } finally {
            setLoading(false);
        }
    };

    const startScanning = () => {
        if (isScanning) return;

        setIsScanning(true);
        // Small delay to ensure DOM is ready
        setTimeout(() => {
            const scanner = new Html5QrcodeScanner(
                "reader",
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1.0
                },
                /* verbose= */ false
            );

            scannerRef.current = scanner;

            scanner.render(
                (decodedText) => {
                    // Success callback
                    setScanResult(decodedText);
                    // Extract ID if it's a JSON string or just text
                    let searchQuery = decodedText;
                    try {
                        const parsed = JSON.parse(decodedText);
                        if (parsed.id) searchQuery = parsed.id;
                    } catch (e) {
                        // Not JSON, use raw text
                    }

                    fetchPatientData(searchQuery);

                    // Optional: Stop scanning after success
                    scanner.clear().then(() => {
                        setIsScanning(false);
                    }).catch((err) => {
                        console.error("Failed to clear scanner", err);
                    });
                },
                (errorMessage) => {
                    // Error callback (ignore for scanning in progress)
                    // console.log(errorMessage);
                }
            );
        }, 100);
    };

    const handleManualSearch = (e) => {
        e.preventDefault();
        fetchPatientData(manualId);
    };

    return (
        <DashboardLayout>
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                            <CreditCard className="text-emerald-600" />
                            Health ID Scanner
                        </h1>
                        <p className="text-gray-600">Scan QR code or RFID card for quick patient identification</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Scanner Section */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                <Activity className="text-emerald-500" size={20} />
                                Scan Health ID
                            </h2>

                            <div className="bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 min-h-[400px] flex flex-col items-center justify-center p-4 relative overflow-hidden">
                                {isScanning ? (
                                    <div id="reader" className="w-full h-full"></div>
                                ) : (
                                    <div className="text-center">
                                        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <CreditCard className="text-emerald-600" size={40} />
                                        </div>
                                        <p className="text-gray-500 mb-6">Position the QR code within the frame to scan</p>
                                        <button
                                            onClick={startScanning}
                                            className="px-6 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors flex items-center gap-2 mx-auto shadow-sm"
                                        >
                                            <Activity size={20} />
                                            Start Scanning
                                        </button>
                                    </div>
                                )}
                            </div>

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
                                        className="px-6 py-3 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50"
                                    >
                                        {loading ? 'Searching...' : 'Search'}
                                    </button>
                                </form>
                            </div>
                        </div>

                        {/* Patient Information Section */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                <User className="text-blue-500" size={20} />
                                Patient Information
                            </h2>

                            {patient ? (
                                <div className="animate-fadeIn">
                                    <div className="flex flex-col items-center mb-8">
                                        <div className="w-24 h-24 rounded-full bg-blue-100 mb-4 border-4 border-white shadow-lg overflow-hidden">
                                            {patient.photoUrl || patient.personalInfo?.photoUrl ? (
                                                <img
                                                    src={patient.photoUrl || patient.personalInfo?.photoUrl}
                                                    alt={patient.name || patient.personalInfo?.fullName}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-blue-500 text-2xl font-bold">
                                                    {(patient.name || patient.personalInfo?.fullName || 'P').charAt(0)}
                                                </div>
                                            )}
                                        </div>
                                        <h3 className="text-2xl font-bold text-gray-900">{patient.name || patient.personalInfo?.fullName}</h3>
                                        <p className="text-emerald-600 font-mono font-medium bg-emerald-50 px-3 py-1 rounded-full mt-2">
                                            {patient.healthId || 'No Health ID'}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="p-4 bg-gray-50 rounded-xl">
                                            <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Patient ID</div>
                                            <div className="font-semibold text-gray-800">{patient.patientId}</div>
                                        </div>
                                        <div className="p-4 bg-gray-50 rounded-xl">
                                            <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">CNIC</div>
                                            <div className="font-semibold text-gray-800">{patient.cnic || patient.personalInfo?.cnic || 'N/A'}</div>
                                        </div>
                                        <div className="p-4 bg-gray-50 rounded-xl">
                                            <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Phone</div>
                                            <div className="font-semibold text-gray-800 flex items-center gap-2">
                                                <Phone size={14} className="text-gray-400" />
                                                {patient.contact?.phone || patient.contactInfo?.mobileNumber || 'N/A'}
                                            </div>
                                        </div>
                                        <div className="p-4 bg-gray-50 rounded-xl">
                                            <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Gender / Age</div>
                                            <div className="font-semibold text-gray-800 capitalize">
                                                {patient.gender || patient.personalInfo?.gender || '-'} / {patient.age || 'N/A'}
                                            </div>
                                        </div>
                                        <div className="p-4 bg-gray-50 rounded-xl md:col-span-2">
                                            <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Address</div>
                                            <div className="font-semibold text-gray-800 flex items-center gap-2">
                                                <MapPin size={14} className="text-gray-400" />
                                                {patient.contact?.address || patient.contactInfo?.address || 'N/A'}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="mt-8 flex gap-3">
                                        <button onClick={() => window.location.href = `/staff/checkin?patientId=${patient._id}`} className="flex-1 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-sm">
                                            Process Check-In
                                        </button>
                                        <button onClick={() => setPatient(null)} className="px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors">
                                            Clear
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center p-8 text-gray-400 min-h-[400px]">
                                    <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                        <User size={48} className="text-gray-300" />
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-600 mb-2">No Patient Selected</h3>
                                    <p className="max-w-xs">Scan a Health ID or search manually to view patient details here</p>
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

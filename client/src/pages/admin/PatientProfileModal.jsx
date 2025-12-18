import { useEffect, useState } from 'react';
import { X, User, Activity, Shield, CreditCard, Loader, Sparkles, CheckCircle, Smartphone, MapPin, Mail } from 'lucide-react';
import axiosInstance from '../../api/axiosConfig';
import HealthCard from '../../components/HealthCard';
import ConsentManager from '../../components/ConsentManager';

const PatientProfileModal = ({ patientId, onClose }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [shouldRender, setShouldRender] = useState(false);

    useEffect(() => {
        if (patientId) {
            setShouldRender(true);
            setTimeout(() => setIsVisible(true), 10);
            document.body.style.overflow = 'hidden';
        } else {
            setIsVisible(false);
            const timer = setTimeout(() => setShouldRender(false), 300);
            document.body.style.overflow = 'unset';
            return () => clearTimeout(timer);
        }
    }, [patientId]);

    if (!shouldRender) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            {/* Backdrop with Blur */}
            <div
                className={`absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
                onClick={onClose}
            />

            {/* Modal Content */}
            <div
                className={`relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl transform transition-all duration-300 ${isVisible ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'} flex flex-col max-h-[90vh] overflow-hidden border border-white/20`}
            >
                {/* Header Gradient */}
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600"></div>

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 text-white rounded-full backdrop-blur-md transition-all z-20"
                >
                    <X size={20} />
                </button>

                {/* Modal Internal Layout */}
                <ProfileContent patientId={patientId} />
            </div>
        </div>
    );
};

const ProfileContent = ({ patientId }) => {
    const [patient, setPatient] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('healthId'); // Default to Health ID as requested focus
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchPatient = async () => {
            if (!patientId) return;
            try {
                setLoading(true);
                setError(null);
                const token = localStorage.getItem('token');

                const { data } = await axiosInstance.get(`/api/users/patients/${patientId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                try {
                    const entData = await axiosInstance.get(`/api/users/patients/${patientId}/entitlements`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setPatient({ ...data, entitlementDetails: entData.data });
                } catch (entError) {
                    console.warn("Could not fetch entitlements, using basic profile", entError);
                    setPatient(data); // Fallback if entitlements fail
                }

            } catch (error) {
                console.error('Error fetching patient:', error);
                setError("Failed to load patient profile.");
            } finally {
                setLoading(false);
            }
        };
        fetchPatient();
    }, [patientId]);

    const handleGenerateHealthId = async () => {
        try {
            const token = localStorage.getItem('token');
            const { data } = await axiosInstance.post(`/api/users/patients/${patientId}/generate-health-id`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPatient(prev => ({
                ...prev,
                healthId: data.healthId,
                healthCardQr: data.qrCode,
                healthCardIssueDate: new Date() // Optimistically update date
            }));
        } catch (error) {
            console.error('Error generating ID:', error);
            // In a real app, show a toast here
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-96 z-10 bg-white rounded-3xl">
            <Loader className="animate-spin text-blue-600 mb-4" size={40} />
            <p className="text-gray-500 font-medium">Loading Profile...</p>
        </div>
    );

    if (error) return (
        <div className="flex flex-col items-center justify-center h-96 z-10 bg-white rounded-3xl">
            <p className="text-red-500 font-bold mb-2">Error</p>
            <p className="text-gray-600">{error}</p>
        </div>
    );

    if (!patient) return null;

    return (
        <div className="flex flex-col h-full bg-gray-50 rounded-3xl overflow-hidden z-10">
            {/* Header Profile Section */}
            <div className="relative px-8 pt-8 pb-4 z-10">
                <div className="flex items-end gap-6">
                    {/* Avatar */}
                    <div className="relative">
                        <div className="w-24 h-24 rounded-2xl bg-white p-1 shadow-lg ring-4 ring-white/50">
                            {patient.photoUrl ? (
                                <img src={patient.photoUrl} className="w-full h-full object-cover rounded-xl" alt="Profile" />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center text-gray-400">
                                    <User size={40} />
                                </div>
                            )}
                        </div>
                        <div className="absolute -bottom-2 -right-2 bg-green-500 text-white p-1.5 rounded-full shadow-md border-2 border-white">
                            <CheckCircle size={14} />
                        </div>
                    </div>

                    {/* Info */}
                    <div className="mb-2 text-white shadow-black drop-shadow-md">
                        <h2 className="text-3xl font-bold tracking-tight">{patient.name}</h2>
                        <div className="flex items-center gap-4 text-blue-100 text-sm mt-1">
                            <span className="flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded-full backdrop-blur-sm"><User size={12} /> {patient.gender}</span>
                            <span className="flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded-full backdrop-blur-sm"><Activity size={12} /> {patient.age || 'N/A'} Years</span>
                            <span className="opacity-75">PID: {patient.patientId}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="px-8 mt-6 border-b border-gray-200 bg-white flex items-center gap-8 overflow-x-auto no-scrollbar">
                {[
                    { id: 'healthId', label: 'Digital Health Card', icon: CreditCard },
                    { id: 'overview', label: 'Overview', icon: User },
                    { id: 'entitlements', label: 'Entitlements', icon: Sparkles },
                    { id: 'consent', label: 'Consent & Privacy', icon: Shield },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 py-4 text-sm font-semibold transition-all relative ${activeTab === tab.id
                            ? 'text-blue-600'
                            : 'text-gray-500 hover:text-gray-800'
                            }`}
                    >
                        <tab.icon size={18} className={activeTab === tab.id ? 'text-blue-600' : 'text-gray-400'} />
                        {tab.label}
                        {activeTab === tab.id && (
                            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full shadow-[0_-2px_6px_rgba(37,99,235,0.3)]"></span>
                        )}
                    </button>
                ))}
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto p-8 bg-gray-50/50">
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Card 1 */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                            <h3 className="text-gray-900 font-semibold mb-6 flex items-center gap-2">
                                <span className="p-2 bg-blue-50 text-blue-600 rounded-lg"><User size={18} /></span> Contact Details
                            </h3>
                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <Smartphone className="text-gray-400 mt-1" size={18} />
                                    <div>
                                        <p className="text-xs text-gray-400 font-medium uppercase">Phone</p>
                                        <p className="text-gray-700 font-medium">{patient.contact?.phone || 'Not Provided'}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Mail className="text-gray-400 mt-1" size={18} />
                                    <div>
                                        <p className="text-xs text-gray-400 font-medium uppercase">Email</p>
                                        <p className="text-gray-700 font-medium">{patient.email || patient.contact?.email || 'Not Provided'}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <MapPin className="text-gray-400 mt-1" size={18} />
                                    <div>
                                        <p className="text-xs text-gray-400 font-medium uppercase">Address</p>
                                        <p className="text-gray-700 font-medium">{patient.contact?.address || 'Not Provided'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Card 2 */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                            <h3 className="text-gray-900 font-semibold mb-6 flex items-center gap-2">
                                <span className="p-2 bg-purple-50 text-purple-600 rounded-lg"><Shield size={18} /></span> Identity
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-xs text-gray-400 font-medium uppercase">CNIC / National ID</p>
                                    <p className="text-gray-700 font-mono text-lg">{patient.cnic || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 font-medium uppercase">Date of Birth</p>
                                    <p className="text-gray-700">{patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString(undefined, { dateStyle: 'long' }) : 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'healthId' && (
                    <div className="flex flex-col items-center animate-in scale-95 fade-in duration-300">
                        <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 max-w-2xl w-full flex flex-col items-center">
                            {patient.healthId ? (
                                <>
                                    <div className="mb-8 w-full flex justify-center">
                                        <HealthCard patient={patient} showButtons={true} />
                                    </div>
                                    <div className="bg-blue-50 text-blue-800 px-4 py-2 rounded-lg text-sm flex items-center gap-2">
                                        <CheckCircle size={16} />
                                        Active Digital Health ID: <span className="font-mono font-bold">{patient.healthId}</span>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-8">
                                    <div className="relative inline-block mb-6">
                                        <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-20"></div>
                                        <div className="bg-blue-50 p-6 rounded-full relative"><CreditCard size={64} className="text-blue-500" /></div>
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Issue Digital Health Card</h3>
                                    <p className="text-gray-500 mb-8 max-w-md mx-auto">Generate a secure, cryptographically verifiable Digital Health ID for this patient. This will generate a QR code and Barcode for instant hospital check-ins.</p>
                                    <button
                                        onClick={handleGenerateHealthId}
                                        className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-xl hover:shadow-lg hover:shadow-blue-500/30 transition-all font-medium flex items-center gap-2 mx-auto"
                                    >
                                        <Sparkles size={18} /> Generate Health ID Now
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'consent' && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-hidden">
                        <ConsentManager
                            patientId={patient._id}
                            currentConsent={patient.consentId}
                        />
                    </div>
                )}

                {activeTab === 'entitlements' && (
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">Current Coverage</h3>
                                <p className="text-gray-500">Active insurance plans and entitlements</p>
                            </div>
                            <span className="bg-green-100 text-green-700 px-4 py-1 rounded-full font-bold uppercase tracking-wide text-sm border border-green-200">
                                {patient.entitlementDetails?.plan || 'General'}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Stat 1 */}
                            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                <p className="text-gray-500 text-xs font-bold uppercase mb-1">Status</p>
                                <p className="text-lg font-semibold text-gray-900 capitalize">{patient.entitlementDetails?.status || 'Active'}</p>
                            </div>
                            {/* Stat 2 */}
                            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                <p className="text-gray-500 text-xs font-bold uppercase mb-1">Tier</p>
                                <p className="text-lg font-semibold text-gray-900">{patient.entitlementDetails?.coverage || 'Standard'}</p>
                            </div>
                            {/* Stat 3 */}
                            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                <p className="text-gray-500 text-xs font-bold uppercase mb-1">Dependents</p>
                                <p className="text-lg font-semibold text-gray-900">{patient.entitlementDetails?.dependents?.length || 0} Linked</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PatientProfileModal;

import { useEffect, useState } from 'react';
import { X, User, Activity, Shield, CreditCard, Loader } from 'lucide-react';
import axiosInstance from '../../api/axiosConfig';
import HealthCard from '../../components/HealthCard';
import ConsentManager from '../../components/ConsentManager';

// Actually, to avoid code duplication and styling conflicts, 
// I will create a dedicated "Drawer" wrapper that renders the PatientProfile content 
// but stripped of the DashboardLayout when inside the drawer.

// However, `PatientProfile` currently has `DashboardLayout` hardcoded.
// I should probably clone `PatientProfile` logic into a `PatientProfileContent` component first?
// Or I can just make a completely new Drawer component that uses the same logic. 
// Let's make a clean SlideOver component.

const PatientProfileDrawer = ({ patientId, onClose }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (patientId) {
            setIsVisible(true);
            document.body.style.overflow = 'hidden';
        } else {
            setIsVisible(false);
            document.body.style.overflow = 'unset';
        }
    }, [patientId]);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(onClose, 300); // Wait for animation
    };

    if (!patientId && !isVisible) return null;

    return (
        <div className={`fixed inset-0 z-50 flex justify-end ${isVisible ? 'pointer-events-auto' : 'pointer-events-none'}`}>
            {/* Backdrop */}
            <div
                className={`absolute inset-0 bg-black transition-opacity duration-300 ${isVisible ? 'bg-opacity-50' : 'bg-opacity-0'}`}
                onClick={handleClose}
            />

            {/* Drawer Panel */}
            <div
                className={`relative w-full max-w-4xl bg-white h-full shadow-2xl transform transition-transform duration-300 ease-in-out ${isVisible ? 'translate-x-0' : 'translate-x-full'}`}
            >
                {/* Close Button */}
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200 z-10"
                >
                    <X size={20} />
                </button>

                {/* Content Container - Scrollable */}
                <div className="h-full overflow-y-auto">
                    {/* We render the Profile Content here. 
                        Since PatientProfile expects a route param :id, we can't use it directly easily without refactoring.
                        A better approach: We create a `PatientProfileContent` component.
                        For now, I'll copy the logic from PatientProfile into here to ensure it works isolated.
                     */}
                    <ProfileContent patientId={patientId} />
                </div>
            </div>
        </div>
    );
};

// Internal component to handle fetching and displaying logic (copied/adapted from PatientProfile)
const ProfileContent = ({ patientId }) => {
    const [patient, setPatient] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        const fetchPatient = async () => {
            if (!patientId) return;
            try {
                setLoading(true);
                const token = localStorage.getItem('token');
                const { data } = await axiosInstance.get(`/api/users/patients/${patientId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const entData = await axiosInstance.get(`/api/users/patients/${patientId}/entitlements`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setPatient({ ...data, entitlementDetails: entData.data });
            } catch (error) {
                console.error('Error fetching patient:', error);
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
            setPatient(prev => ({ ...prev, healthId: data.healthId, healthCardQr: data.qrCode }));
        } catch (error) {
            console.error('Error generating ID:', error);
        }
    };

    if (loading) return <div className="p-12 flex justify-center"><Loader className="animate-spin text-blue-600" /></div>;
    if (!patient) return <div className="p-12 text-center text-red-500">Patient not found</div>;

    return (
        <div className="p-8">
            {/* Header */}
            <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-800">{patient.name}</h2>
                <div className="flex items-center gap-4 text-gray-500 mt-2 text-sm">
                    <span>PID: {patient.patientId}</span>
                    <span>•</span>
                    <span>{patient.age || 'N/A'} Years</span>
                    <span>•</span>
                    <span>{patient.gender}</span>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 border-b mb-8 overflow-x-auto">
                {[
                    { id: 'overview', label: 'Overview', icon: User },
                    { id: 'healthId', label: 'Digital Health Card', icon: CreditCard },
                    { id: 'entitlements', label: 'Entitlements', icon: Activity },
                    { id: 'consent', label: 'Consent & Privacy', icon: Shield },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-6 py-3 font-medium transition-all rounded-t-lg whitespace-nowrap ${activeTab === tab.id
                            ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        <tab.icon size={18} />
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="space-y-6">
                {activeTab === 'overview' && (
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
                        <div className="grid grid-cols-2 gap-y-6">
                            <div><label className="text-xs text-gray-400 uppercase font-bold">CNIC</label><p className="font-medium">{patient.cnic || 'N/A'}</p></div>
                            <div><label className="text-xs text-gray-400 uppercase font-bold">Phone</label><p className="font-medium">{patient.contact?.phone || 'N/A'}</p></div>
                            <div><label className="text-xs text-gray-400 uppercase font-bold">Address</label><p className="font-medium">{patient.contact?.address || 'N/A'}</p></div>
                            <div><label className="text-xs text-gray-400 uppercase font-bold">Email</label><p className="font-medium">{patient.contact?.email || patient.email || 'N/A'}</p></div>
                        </div>
                    </div>
                )}

                {activeTab === 'healthId' && (
                    <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-xl border border-gray-200 border-dashed">
                        {patient.healthId ? (
                            <HealthCard patient={patient} />
                        ) : (
                            <div className="text-center">
                                <div className="bg-gray-200 p-4 rounded-full inline-block mb-4"><CreditCard size={48} className="text-gray-400" /></div>
                                <h3 className="text-lg font-medium text-gray-900">No Digital ID Generated</h3>
                                <p className="text-gray-500 mb-6 max-w-md">Generate a secure Digital Health ID with QR code for instant check-ins and verification.</p>
                                <button
                                    onClick={handleGenerateHealthId}
                                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 shadow-md transition-all"
                                >
                                    Generate Health ID Now
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'consent' && (
                    <ConsentManager
                        patientId={patient._id}
                        currentConsent={patient.consentId}
                    />
                )}

                {activeTab === 'entitlements' && (
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Activity className="text-green-600" /> Current Plan: <span className="uppercase text-green-700 bg-green-50 px-2 py-1 rounded text-sm">{patient.entitlementDetails?.plan || 'General'}</span>
                        </h3>
                        <div className="p-4 border rounded-lg bg-gray-50 mb-4">
                            <h4 className="font-medium">Coverage Level</h4>
                            <p className="text-gray-600">{patient.entitlementDetails?.coverage || 'Standard Ops'}</p>
                        </div>
                        {patient.entitlementDetails?.dependents?.length > 0 && (
                            <div>
                                <h4 className="font-medium mb-2">Linked Dependents</h4>
                                <ul className="space-y-2">
                                    {patient.entitlementDetails.dependents.map((dep, i) => (
                                        <li key={i} className="flex justify-between p-3 bg-white border rounded shadow-sm">
                                            <span>{dep.name}</span>
                                            <span className="text-sm text-gray-500">{dep.relation}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PatientProfileDrawer;

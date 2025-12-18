import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axiosInstance from '../../api/axiosConfig';
import DashboardLayout from '../../components/DashboardLayout';
import HealthCard from '../../components/HealthCard';
import ConsentManager from '../../components/ConsentManager';
import { User, Activity, Shield, CreditCard, Loader } from 'lucide-react';

const PatientProfile = () => {
    const { id } = useParams();
    const [patient, setPatient] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

    const fetchPatient = async () => {
        try {
            const token = localStorage.getItem('token');
            const { data } = await axiosInstance.get(`/api/users/patients/${id}`, { // Assuming this endpoint exists or will be redirected
                headers: { Authorization: `Bearer ${token}` }
            });
            // Also fetch entitlements
            const entData = await axiosInstance.get(`/api/users/patients/${id}/entitlements`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPatient({ ...data, entitlementDetails: entData.data });
        } catch (error) {
            console.error('Error fetching patient profile:', error);
            // Fallback for demo if endpoint specific to generic user/patient id mapping is tricky
            // In real app, ensure /api/users/patients/:id returns full patient doc
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) fetchPatient();
    }, [id]);

    const handleGenerateHealthId = async () => {
        try {
            const token = localStorage.getItem('token');
            const { data } = await axiosInstance.post(`/api/users/patients/${id}/generate-health-id`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPatient(prev => ({ ...prev, healthId: data.healthId, healthCardQr: data.qrCode }));
        } catch (error) {
            console.error('Error generating ID:', error);
        }
    };

    if (loading) return <DashboardLayout><div className="p-8 flex justify-center"><Loader className="animate-spin text-blue-600" /></div></DashboardLayout>;
    if (!patient) return <DashboardLayout><div className="p-8">Patient not found</div></DashboardLayout>;

    return (
        <DashboardLayout>
            <div className="p-8 max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">{patient.name}</h1>
                    <div className="flex items-center gap-4 text-gray-500 mt-2">
                        <span>PID: {patient.patientId}</span>
                        <span>•</span>
                        <span>{patient.age || 'N/A'} Years</span>
                        <span>•</span>
                        <span>{patient.gender}</span>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 border-b mb-8">
                    {[
                        { id: 'overview', label: 'Overview', icon: User },
                        { id: 'healthId', label: 'Digital Health Card', icon: CreditCard },
                        { id: 'entitlements', label: 'Entitlements', icon: Activity },
                        { id: 'consent', label: 'Consent & Privacy', icon: Shield },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-6 py-3 font-medium transition-all rounded-t-lg ${activeTab === tab.id
                                    ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            <tab.icon size={18} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Main Content Area */}
                    <div className="md:col-span-2 space-y-6">
                        {activeTab === 'overview' && (
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                <h3 className="section-title mb-4">Personal Information</h3>
                                <div className="grid grid-cols-2 gap-y-4">
                                    <div><label className="text-xs text-gray-400 uppercase">CNIC</label><p>{patient.cnic || 'N/A'}</p></div>
                                    <div><label className="text-xs text-gray-400 uppercase">Phone</label><p>{patient.contact?.phone || 'N/A'}</p></div>
                                    <div><label className="text-xs text-gray-400 uppercase">Address</label><p>{patient.contact?.address || 'N/A'}</p></div>
                                    <div><label className="text-xs text-gray-400 uppercase">Total Visits</label><p>{patient.medicalHistory?.length || 0}</p></div>
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

                                <div className="space-y-4">
                                    <div className="p-4 border rounded-lg bg-gray-50">
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
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default PatientProfile;

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
                {/* The background is now handled within ProfileContent for better control over layering */}

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl backdrop-blur-xl transition-all z-30 border border-white/20 shadow-xl"
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
    const [activeTab, setActiveTab] = useState('overview'); // Default to Overview for clinical focus
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchPatient = async () => {
            if (!patientId) return;
            try {
                setLoading(true);
                setError(null);
                const token = localStorage.getItem('token');

                const { data } = await axiosInstance.get(`/api/admin/patients/${patientId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                try {
                    const entData = await axiosInstance.get(`/api/admin/patients/${patientId}/entitlements`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setPatient({ ...data, entitlementDetails: entData.data });
                } catch (entError) {
                    console.warn("Could not fetch entitlements, using basic profile", entError);
                    setPatient(data);
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
            const { data } = await axiosInstance.post(`/api/admin/patients/${patientId}/generate-health-id`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPatient(prev => ({
                ...prev,
                healthId: data.healthId,
                healthCardQr: data.qrCode,
                healthCardIssueDate: new Date()
            }));
        } catch (error) {
            console.error('Error generating ID:', error);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-96 z-10 bg-white rounded-3xl">
            <Loader className="animate-spin text-indigo-600 mb-4" size={40} />
            <p className="text-gray-500 font-medium">Assembling Profile...</p>
        </div>
    );

    if (error) return (
        <div className="flex flex-col items-center justify-center h-96 z-10 bg-white rounded-3xl">
            <div className="bg-red-50 p-4 rounded-2xl text-red-600 mb-4"><X size={32} /></div>
            <p className="text-gray-900 font-black">Connection Error</p>
            <p className="text-gray-500 text-sm mt-1">{error}</p>
        </div>
    );

    if (!patient) return null;

    return (
        <div className="flex flex-col h-full bg-slate-50 rounded-3xl overflow-hidden z-10">
            {/* Professional Dark Header - High End Design */}
            <div className="relative bg-slate-900 px-10 pt-12 pb-10 overflow-hidden shadow-2xl">
                {/* Subtle Decorative Elements */}
                <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-indigo-500/10 to-transparent pointer-events-none"></div>
                <div className="absolute -top-24 -left-24 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>

                <div className="relative flex items-center gap-8 z-10">
                    {/* Compact Avatar */}
                    <div className="relative group">
                        <div className="w-24 h-24 rounded-[2rem] bg-slate-800 p-1 shadow-2xl ring-4 ring-slate-700/50 group-hover:ring-indigo-500/40 transition-all duration-500 overflow-hidden">
                            {patient.photoUrl ? (
                                <img src={patient.photoUrl} className="w-full h-full object-cover rounded-[1.8rem]" alt="Profile" />
                            ) : (
                                <div className="w-full h-full bg-slate-800 rounded-[1.8rem] flex items-center justify-center text-slate-500">
                                    <User size={40} />
                                </div>
                            )}
                        </div>
                        <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-2 rounded-xl shadow-xl border-2 border-slate-900">
                            <Activity size={12} />
                        </div>
                    </div>

                    {/* Meta Info */}
                    <div className="flex-1 text-white">
                        <div className="flex items-center gap-4 mb-3">
                            <h2 className="text-4xl font-black tracking-tight leading-none text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-slate-400">{patient.name}</h2>
                            <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] border border-slate-700 bg-slate-800/50 backdrop-blur-md text-indigo-400`}>
                                {patient.patientType || 'OPD'}
                            </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-6 text-slate-400 text-[11px] font-black uppercase tracking-widest">
                            <span className="flex items-center gap-2"><Shield size={14} className="text-indigo-400" /> CNIC: <span className="text-slate-100 font-mono tracking-tighter">{patient.cnic || 'Unverified'}</span></span>
                            <span className="flex items-center gap-2"><Activity size={14} className="text-rose-400" /> Blood: <span className="text-slate-100">{patient.bloodGroup || 'O+'}</span></span>
                            <span className="px-3 py-1 bg-slate-800/80 rounded-full border border-slate-700 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                ID: <span className="text-slate-100 font-mono">{patient.patientId}</span>
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="px-10 border-b border-gray-200 bg-white flex items-center gap-10 overflow-x-auto no-scrollbar">
                {[
                    { id: 'overview', label: 'Clinical Overview', icon: User },
                    { id: 'healthId', label: 'Digital Health ID', icon: CreditCard },
                    { id: 'entitlements', label: 'Coverage & Benefits', icon: Sparkles },
                    { id: 'consent', label: 'Privacy Ledger', icon: Shield },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2.5 py-5 text-[11px] font-black uppercase tracking-widest transition-all relative ${activeTab === tab.id
                            ? 'text-indigo-600'
                            : 'text-gray-400 hover:text-gray-700'
                            }`}
                    >
                        <tab.icon size={16} className={activeTab === tab.id ? 'text-indigo-600' : 'text-gray-300'} />
                        {tab.label}
                        {activeTab === tab.id && (
                            <span className="absolute bottom-0 left-0 w-full h-1 bg-indigo-600 rounded-t-full"></span>
                        )}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-10 bg-slate-50/50">
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Demographics & Bio */}
                        <div className="lg:col-span-2 space-y-8">
                            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                                <h3 className="text-indigo-600 font-black text-xs uppercase tracking-[0.2em] mb-8 pb-4 border-b border-indigo-50 flex items-center gap-3">
                                    <User size={16} /> Demographics & Personal Details
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-y-10 gap-x-6">
                                    <div>
                                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1.5">Full Name</p>
                                        <p className="text-gray-900 font-black text-sm">{patient.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1.5">Father's Name</p>
                                        <p className="text-gray-900 font-black text-sm">{patient.fatherName || 'Not Provided'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1.5">Biological Sex</p>
                                        <p className="text-gray-900 font-black text-sm uppercase">{patient.gender || 'Unknown'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1.5">Date of Birth</p>
                                        <p className="text-gray-900 font-black text-sm">{patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString(undefined, { dateStyle: 'medium' }) : 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1.5">Calculated Age</p>
                                        <p className="text-gray-900 font-black text-sm">{patient.age || '?'} Years</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1.5">Blood Group</p>
                                        <p className="text-rose-600 font-black text-sm">{patient.bloodGroup || 'Not Tested'}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                                <h3 className="text-indigo-600 font-black text-xs uppercase tracking-[0.2em] mb-8 pb-4 border-b border-indigo-50 flex items-center gap-3">
                                    <MapPin size={16} /> Contact & Residential Data
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-4 group">
                                            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors"><Smartphone size={18} /></div>
                                            <div>
                                                <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">Primary Phone</p>
                                                <p className="text-gray-800 font-black text-sm">{patient.contact?.phone || patient.phone || 'N/A'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 group">
                                            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors"><Mail size={18} /></div>
                                            <div>
                                                <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">Email Address</p>
                                                <p className="text-gray-800 font-black text-sm">{patient.email || patient.contact?.email || 'No email registered'}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-5 bg-slate-50/50 rounded-2xl border border-slate-100">
                                        <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-2 flex items-center gap-1.5"><MapPin size={10} /> Street Address</p>
                                        <p className="text-gray-700 font-bold text-sm leading-relaxed">{patient.contact?.address || 'No residential address on file for this patient record.'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Side Panels */}
                        <div className="space-y-8">
                            {/* Emergency Contact */}
                            <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-8 rounded-3xl shadow-xl text-white relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-10"><Shield size={80} /></div>
                                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                    <Activity size={14} className="text-indigo-300" /> Emergency Link
                                </h3>
                                {patient.emergencyContact?.name ? (
                                    <div className="space-y-4 relative z-10">
                                        <div>
                                            <p className="text-indigo-300 text-[10px] font-black uppercase mb-1">Contact Person</p>
                                            <p className="text-xl font-black leading-none">{patient.emergencyContact.name}</p>
                                            <p className="text-indigo-200 text-xs font-bold mt-1 opacity-80">{patient.emergencyContact.relation || 'Relation not specified'}</p>
                                        </div>
                                        <div className="pt-4 border-t border-white/10">
                                            <p className="text-indigo-300 text-[10px] font-black uppercase mb-1">Direct Line</p>
                                            <p className="text-lg font-mono font-black">{patient.emergencyContact.phone}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="py-6 text-center opacity-70">
                                        <p className="text-xs font-bold italic">No emergency contact details provided.</p>
                                    </div>
                                )}
                            </div>

                            {/* Status Card */}
                            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                                <h4 className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-6">Patient Lifecycle</h4>
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-gray-600">Current Status</span>
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${patient.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                                            {patient.status || 'Active'}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-gray-600">Registration</span>
                                        <span className="text-xs font-black text-gray-900">{new Date(patient.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <div className="pt-4 border-t border-slate-50">
                                        <div className="flex items-center gap-2 text-[10px] font-black text-emerald-600 uppercase">
                                            <CheckCircle size={10} /> Account Verified
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'healthId' && (
                    <div className="flex flex-col items-center animate-in scale-95 fade-in duration-300">
                        <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl border border-indigo-50 max-w-2xl w-full flex flex-col items-center">
                            {patient.healthId ? (
                                <>
                                    <div className="mb-10 w-full flex justify-center scale-110">
                                        <HealthCard patient={patient} showButtons={true} />
                                    </div>
                                    <div className="bg-indigo-50 border border-indigo-100 text-indigo-700 px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center gap-3">
                                        <CheckCircle size={14} /> Registered Health ID: <span className="text-sm font-mono tracking-normal">{patient.healthId}</span>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-12">
                                    <div className="relative inline-block mb-8">
                                        <div className="absolute inset-0 bg-indigo-100 rounded-full animate-ping opacity-20"></div>
                                        <div className="bg-indigo-50 p-8 rounded-[2rem] relative shadow-inner"><CreditCard size={64} className="text-indigo-600 outline-none" /></div>
                                    </div>
                                    <h3 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">Issue Health ID</h3>
                                    <p className="text-slate-500 mb-10 max-w-sm mx-auto font-bold text-sm leading-relaxed">Activate cryptographic identity for instant hospital admission and digital record syncing across the network.</p>
                                    <button
                                        onClick={handleGenerateHealthId}
                                        className="bg-indigo-600 text-white px-10 py-4 rounded-2xl hover:shadow-2xl hover:shadow-indigo-500/40 transition-all font-black uppercase tracking-widest text-[11px] flex items-center gap-3 mx-auto active:scale-95"
                                    >
                                        <Sparkles size={18} /> Provision ID Now
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'consent' && (
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-hidden min-h-[400px]">
                        <ConsentManager
                            patientId={patient._id}
                            currentConsent={patient.consentId}
                        />
                    </div>
                )}

                {activeTab === 'entitlements' && (
                    <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-gray-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center justify-between mb-10 pb-6 border-b border-indigo-50">
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Coverage Intelligence</h3>
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Real-time insurance & benefit verification</p>
                            </div>
                            <span className="bg-emerald-50 text-emerald-700 px-6 py-2 rounded-xl font-black uppercase tracking-[0.2em] text-[10px] border border-emerald-100 shadow-sm">
                                {patient.entitlementDetails?.plan || 'Standard Care'}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-colors group">
                                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2 group-hover:text-indigo-600 transition-colors">Entitlement Status</p>
                                <p className="text-xl font-black text-slate-900 capitalize">{patient.entitlementDetails?.status || 'Active'}</p>
                            </div>
                            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-colors group">
                                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2 group-hover:text-indigo-600 transition-colors">Service Tier</p>
                                <p className="text-xl font-black text-slate-900">{patient.entitlementDetails?.coverage || 'Full Coverage'}</p>
                            </div>
                            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-colors group">
                                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2 group-hover:text-indigo-600 transition-colors">Linked Dependents</p>
                                <p className="text-xl font-black text-slate-900">{patient.entitlementDetails?.dependents?.length || 0} Records</p>
                            </div>
                        </div>

                        <div className="mt-10 p-6 bg-indigo-50/30 rounded-2xl border border-indigo-50">
                            <p className="text-indigo-600 text-[10px] font-black uppercase tracking-widest mb-2">Coverage Notes</p>
                            <p className="text-slate-600 text-sm font-bold italic">Patient is entitled to standard OPD and IPD services with no prior authorization required for primary care visits.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PatientProfileModal;

import { useState, useEffect } from 'react';
import { Search, User, Phone, Calendar, FileText, ChevronRight, Plus, Activity, Eye } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import PrescriptionModal from '../../components/prescription/PrescriptionModal';
import axiosInstance from '../../api/axiosConfig';
import Swal from 'sweetalert2';

const DoctorPatients = () => {
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedPatientId, setSelectedPatientId] = useState('');

    useEffect(() => {
        fetchPatients();
    }, []);

    const fetchPatients = async () => {
        try {
            const { data } = await axiosInstance.get('/api/doctor/patients');
            if (data.success) {
                setPatients(data.data.patients);
            }
            setLoading(false);
        } catch (error) {
            console.error('Error fetching patients:', error);
            setLoading(false);
        }
    };

    const handleCreatePrescription = (patientId) => {
        setSelectedPatientId(patientId);
        setIsModalOpen(true);
    };

    const filteredPatients = patients.filter(patient =>
        patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.patientId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.cnic?.includes(searchTerm)
    );

    return (
        <DashboardLayout>
            <div className="p-4 md:p-8 bg-slate-50/50 min-h-screen">
                <div className="max-w-7xl mx-auto">

                    {/* Header */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                        <div>
                            <h1 className="text-4xl font-black text-slate-900 tracking-tight">My Patients</h1>
                            <p className="text-slate-500 mt-2 flex items-center gap-2">
                                <Activity size={18} className="text-blue-500" />
                                Comprehensive list of assigned & consulted patients
                            </p>
                        </div>
                        <div className="relative group w-full md:w-80">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                            <input
                                type="text"
                                placeholder="Search by name, ID or CNIC..."
                                className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} className="bg-white rounded-3xl p-8 border border-slate-100 animate-pulse shadow-sm">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-14 h-14 bg-slate-100 rounded-2xl"></div>
                                        <div className="flex-1">
                                            <div className="h-5 w-3/4 bg-slate-100 rounded-full mb-2"></div>
                                            <div className="h-3 w-1/2 bg-slate-50 rounded-full"></div>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="h-4 w-full bg-slate-50 rounded-full"></div>
                                        <div className="h-4 w-5/6 bg-slate-50 rounded-full"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : filteredPatients.length === 0 ? (
                        <div className="bg-white rounded-[40px] border border-dashed border-slate-300 p-24 text-center shadow-sm">
                            <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <User className="w-12 h-12 text-blue-400" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-800">No Records Found</h3>
                            <p className="text-slate-500 mt-2">Try adjusting your filters or search keywords.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-12">
                            {filteredPatients.map((patient) => (
                                <div key={patient._id} className="bg-white rounded-[32px] border border-slate-100 p-8 hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] transition-all duration-500 group relative overflow-hidden flex flex-col h-full">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50/50 rounded-bl-[100px] -z-10 transition-transform group-hover:scale-110 duration-500"></div>

                                    <div className="flex items-start justify-between mb-8">
                                        <div className="flex items-center gap-5">
                                            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-blue-100 group-hover:rotate-3 transition-transform">
                                                {patient.name.charAt(0)}
                                            </div>
                                            <div>
                                                <h3 className="font-extrabold text-slate-800 text-lg group-hover:text-blue-600 transition-colors uppercase tracking-tight">{patient.name}</h3>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-black rounded-lg uppercase tracking-wider">
                                                        {patient.patientId || 'NEW-PT'}
                                                    </span>
                                                    {patient.gender && (
                                                        <span className="text-[10px] text-slate-400 font-bold">• {patient.gender}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-5 mb-10 flex-grow">
                                        <div className="flex items-center gap-4 text-sm font-semibold text-slate-600">
                                            <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                                                <Phone size={16} />
                                            </div>
                                            <span>{patient.contact || 'No Contact Data'}</span>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm font-semibold text-slate-600">
                                            <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                                                <Calendar size={16} />
                                            </div>
                                            <span>Age: {patient.age || 'N/A'} • CNIC: {patient.cnic || 'N/A'}</span>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm font-semibold text-slate-600">
                                            <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                                                <FileText size={16} />
                                            </div>
                                            <span className="italic">Last Interaction: {patient.updatedAt ? new Date(patient.updatedAt).toLocaleDateString() : 'N/A'}</span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-3 mt-auto">
                                        <button
                                            onClick={() => handleCreatePrescription(patient._id)}
                                            className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-3 active:scale-[0.98]"
                                        >
                                            <Plus size={18} />
                                            ISSUE PRESCRIPTION
                                        </button>
                                        <button className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 transition-all flex items-center justify-center gap-3 active:scale-[0.98]">
                                            <Eye size={18} />
                                            MEDICAL RECORDS
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <PrescriptionModal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setSelectedPatientId(''); }}
                preSelectedPatientId={selectedPatientId}
                onPrescriptionCreated={fetchPatients}
            />

            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
            `}} />
        </DashboardLayout>
    );
};

export default DoctorPatients;

import { useState, useEffect, useCallback } from 'react';
import { Search, CreditCard, Download, User, Filter, Sparkles, CheckCircle, XCircle, Loader, ChevronLeft, ChevronRight, Mail, Phone, Calendar, Hash } from 'lucide-react';
import axiosInstance from '../../api/axiosConfig';
import DashboardLayout from '../../components/DashboardLayout';
import HealthCardViewer from '../../components/HealthCardViewer';
import Swal from 'sweetalert2';
import { mapStaffPatientsToDisplay } from '../../utils/patientMapper';

const DigitalHealthCards = () => {
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filterStatus, setFilterStatus] = useState('all'); // all, with-id, without-id
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [viewerOpen, setViewerOpen] = useState(false);

    const fetchPatients = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const { data } = await axiosInstance.get('/api/staff/patients', {
                params: { page: currentPage, limit: 5, search: searchTerm },
                headers: { Authorization: `Bearer ${token}` }
            });

            if (data.success && data.data) {
                let patientsToMap = data.data;
                if (data.data.patients) patientsToMap = data.data.patients;

                const mappedPatients = mapStaffPatientsToDisplay(patientsToMap);
                setPatients(mappedPatients);
                setTotalPages(data.pagination?.totalPages || 1);
            } else {
                setPatients([]);
                setTotalPages(1);
            }
        } catch (error) {
            console.error('Error fetching patients:', error);
            Swal.fire('Error', 'Failed to load patients', 'error');
        } finally {
            setLoading(false);
        }
    };

    const getDisplayedPatients = () => {
        let displayed = patients;
        if (filterStatus === 'with-id') {
            displayed = displayed.filter(p => p.healthId);
        } else if (filterStatus === 'without-id') {
            displayed = displayed.filter(p => !p.healthId);
        }
        return displayed;
    };

    const filteredPatients = getDisplayedPatients();

    useEffect(() => {
        fetchPatients();
    }, [currentPage, searchTerm]);

    const handleGenerateHealthId = async (patientId) => {
        try {
            const token = localStorage.getItem('token');
            const { data } = await axiosInstance.post(`/api/staff/patients/${patientId}/generate-health-id`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            Swal.fire({
                icon: 'success',
                title: 'Success!',
                text: 'Health ID has been generated successfully',
                timer: 2000,
                showConfirmButton: false
            });

            fetchPatients();
        } catch (error) {
            console.error('Error generating health ID:', error);
            const errorMessage = error.response?.data?.message || 'Failed to generate Health ID';
            Swal.fire('Error', errorMessage, 'error');
        }
    };

    const openHealthCardViewer = (patient) => {
        setSelectedPatient(patient);
        setViewerOpen(false); // Small hack to reset viewer if needed
        setTimeout(() => setViewerOpen(true), 0);
    };

    return (
        <DashboardLayout>
            <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8">
                {/* Header Section */}
                <div className="max-w-7xl mx-auto mb-10">
                    <div className="relative overflow-hidden bg-white rounded-3xl shadow-sm border border-slate-200/60 p-8">
                        {/* Decorative Background Elements */}
                        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-50 pointer-events-none" />
                        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-64 h-64 bg-blue-50 rounded-full blur-3xl opacity-50 pointer-events-none" />

                        <div className="relative flex flex-col md:flex-row items-center justify-between gap-8">
                            <div className="flex items-center gap-6">
                                <div className="p-5 bg-gradient-to-br from-indigo-600 via-indigo-700 to-blue-800 rounded-2xl shadow-xl shadow-indigo-200 group transition-transform hover:scale-105 duration-300">
                                    <CreditCard className="text-white group-hover:rotate-12 transition-transform duration-300" size={36} />
                                </div>
                                <div>
                                    <h1 className="text-4xl font-bold text-slate-900 tracking-tight">DigitalHealthCards</h1>
                                    <p className="text-slate-500 font-medium mt-1.5 flex items-center gap-2">
                                        <Sparkles className="text-indigo-400" size={16} />
                                        Advanced Patient Identification Management
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 bg-slate-50/80 backdrop-blur-sm p-4 rounded-2xl border border-slate-100">
                                <div className="px-6 border-r border-slate-200 text-center">
                                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Total</p>
                                    <p className="text-2xl font-bold text-indigo-700 font-mono">{patients.length}</p>
                                </div>
                                <div className="px-6 text-center">
                                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Active IDs</p>
                                    <p className="text-2xl font-bold text-emerald-600 font-mono">
                                        {patients.filter(p => p.healthId).length}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Search and Advanced Filter Bar */}
                        <div className="mt-10 flex flex-col lg:flex-row gap-5">
                            <div className="flex-1 relative group">
                                <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={22} />
                                <input
                                    type="text"
                                    placeholder="Search by name, CNIC, or Health ID..."
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all outline-none text-slate-700 font-medium placeholder:text-slate-400"
                                />
                            </div>
                            <div className="flex gap-4">
                                <select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                    className="px-8 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 bg-white transition-all outline-none text-slate-700 font-semibold appearance-none cursor-pointer"
                                >
                                    <option value="all">All Status</option>
                                    <option value="with-id">Issued IDs</option>
                                    <option value="without-id">Pending IDs</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Patient Premium Grid */}
                <div className="max-w-7xl mx-auto">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-96 gap-4">
                            <div className="relative">
                                <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <CreditCard size={24} className="text-indigo-600 animate-pulse" />
                                </div>
                            </div>
                            <p className="text-slate-500 font-bold animate-pulse">Syncing patient data...</p>
                        </div>
                    ) : filteredPatients.length === 0 ? (
                        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-20 text-center">
                            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <User className="text-slate-200" size={48} />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-800 mb-2">No Records Found</h3>
                            <p className="text-slate-500 font-medium max-w-sm mx-auto">We couldn't find any patients matching your current search or status filter.</p>
                            <button
                                onClick={() => { setSearchTerm(''); setFilterStatus('all'); }}
                                className="mt-8 px-8 py-3 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-colors"
                            >
                                Reset Search
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                                {filteredPatients.map((patient) => (
                                    <PatientCard
                                        key={patient._id}
                                        patient={patient}
                                        onViewCard={() => openHealthCardViewer(patient)}
                                        onGenerateId={() => handleGenerateHealthId(patient._id)}
                                    />
                                ))}
                            </div>

                            {/* State-of-the-Art Pagination */}
                            {totalPages > 1 && (
                                <div className="mt-16 flex items-center justify-center gap-4">
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                        disabled={currentPage === 1}
                                        className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-indigo-500 hover:text-indigo-600 disabled:opacity-30 disabled:hover:border-slate-200 disabled:hover:text-inherit transition-all outline-none"
                                    >
                                        <ChevronLeft size={24} />
                                    </button>

                                    <div className="flex items-center gap-2 bg-white border border-slate-200 p-2 rounded-2xl shadow-sm">
                                        {[...Array(totalPages)].map((_, i) => {
                                            const pageNum = i + 1;
                                            // Show first, last, current, and pages around current
                                            if (
                                                pageNum === 1 ||
                                                pageNum === totalPages ||
                                                (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                                            ) {
                                                return (
                                                    <button
                                                        key={pageNum}
                                                        onClick={() => setCurrentPage(pageNum)}
                                                        className={`w-12 h-12 rounded-xl text-sm font-bold transition-all ${currentPage === pageNum
                                                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                                                            : 'text-slate-500 hover:bg-slate-50 hover:text-indigo-600'
                                                            }`}
                                                    >
                                                        {pageNum}
                                                    </button>
                                                );
                                            } else if (
                                                pageNum === currentPage - 2 ||
                                                pageNum === currentPage + 2
                                            ) {
                                                return <span key={pageNum} className="px-2 text-slate-300 font-bold">•••</span>;
                                            }
                                            return null;
                                        })}
                                    </div>

                                    <button
                                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                        disabled={currentPage === totalPages}
                                        className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-indigo-500 hover:text-indigo-600 disabled:opacity-30 disabled:hover:border-slate-200 disabled:hover:text-inherit transition-all outline-none"
                                    >
                                        <ChevronRight size={24} />
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Health Card Viewer Modal */}
                {viewerOpen && selectedPatient && (
                    <HealthCardViewer
                        patient={selectedPatient}
                        onClose={() => {
                            setViewerOpen(false);
                            setSelectedPatient(null);
                        }}
                    />
                )}
            </div>
        </DashboardLayout>
    );
};

// State-of-the-Art Patient Card Component
const PatientCard = ({ patient, onViewCard, onGenerateId }) => {
    const hasHealthId = Boolean(patient.healthId);

    return (
        <div className="group relative flex flex-col bg-white rounded-[2rem] shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 border border-slate-200/60 transition-all duration-500 overflow-hidden h-full">
            {/* Design Ornament */}
            <div className={`absolute top-0 right-0 w-24 h-24 blur-3xl opacity-10 transition-opacity duration-500 group-hover:opacity-20 ${hasHealthId ? 'bg-emerald-500' : 'bg-slate-400'}`} />

            {/* Card Content */}
            <div className="relative p-6 flex-1 flex flex-col">
                {/* Visual Header */}
                <div className="flex items-start justify-between mb-6">
                    <div className="relative">
                        <div className={`w-20 h-20 rounded-2xl overflow-hidden shadow-inner flex items-center justify-center ${hasHealthId ? 'bg-indigo-50' : 'bg-slate-50'}`}>
                            {patient.photoUrl ? (
                                <img src={patient.photoUrl} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                            ) : (
                                <User className={`transition-colors duration-500 ${hasHealthId ? 'text-indigo-200' : 'text-slate-200'}`} size={40} />
                            )}
                        </div>
                        {hasHealthId && (
                            <div className="absolute -top-2 -right-2 p-1.5 bg-white rounded-lg shadow-md border border-slate-100">
                                <div className="bg-emerald-500 rounded-md p-0.5">
                                    <CheckCircle size={14} className="text-white" />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${hasHealthId ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-50 text-slate-400 border border-slate-100'
                        }`}>
                        {hasHealthId ? 'Issued' : 'Pending'}
                    </div>
                </div>

                {/* Identity Information */}
                <div className="mb-6">
                    <h3 className="text-xl font-bold text-slate-800 tracking-tight leading-tight group-hover:text-indigo-600 transition-colors duration-300">
                        {patient.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[11px] font-semibold px-2 py-0.5 bg-slate-100 text-slate-500 rounded uppercase tracking-wider">{patient.gender || 'N/A'}</span>
                        <div className="w-1 h-1 bg-slate-300 rounded-full" />
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-tighter">{patient.age || '??'} Years</span>
                    </div>
                </div>

                {/* Data Points Section */}
                <div className="space-y-4 mb-8">
                    <div className="flex items-start gap-3">
                        <div className="mt-0.5 p-2 bg-slate-50 rounded-lg text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-400 transition-colors duration-300">
                            <Mail size={14} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-semibold text-slate-300 uppercase tracking-widest mb-0.5">Communication</p>
                            <p className="text-sm font-semibold text-slate-600 truncate">{patient.email || 'No email registered'}</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <div className="mt-0.5 p-2 bg-slate-50 rounded-lg text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-400 transition-colors duration-300">
                            <Hash size={14} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-semibold text-slate-300 uppercase tracking-widest mb-0.5">Government ID</p>
                            <p className="text-sm font-semibold font-mono text-slate-600">{patient.cnic || 'Pending Verification'}</p>
                        </div>
                    </div>

                    {hasHealthId ? (
                        <div className="p-4 bg-gradient-to-br from-indigo-600/5 to-blue-600/5 rounded-2xl border border-indigo-100/50">
                            <div className="flex items-center justify-between mb-1.5">
                                <p className="text-[10px] font-semibold text-indigo-400 uppercase tracking-widest">Health Network ID</p>
                                <Sparkles size={12} className="text-indigo-400" />
                            </div>
                            <p className="text-md font-bold text-indigo-600 font-mono tracking-tighter">{patient.healthId}</p>
                        </div>
                    ) : (
                        <div className="p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1">Queue Status</p>
                            <p className="text-xs font-semibold text-slate-400 italic">Eligibility check pending...</p>
                        </div>
                    )}
                </div>

                {/* Footer Action */}
                <div className="mt-auto pt-2">
                    {hasHealthId ? (
                        <button
                            onClick={onViewCard}
                            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-slate-900 border-2 border-slate-900 text-white rounded-2xl font-bold text-sm tracking-wide hover:bg-white hover:text-slate-900 transition-all duration-300 transform active:scale-[0.98]"
                        >
                            <Download size={20} className="transition-transform group-hover:-translate-y-0.5" />
                            Export Card
                        </button>
                    ) : (
                        <button
                            onClick={onGenerateId}
                            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white border-2 border-indigo-600 text-indigo-600 rounded-2xl font-bold text-sm tracking-wide hover:bg-indigo-600 hover:text-white transition-all duration-300 transform active:scale-[0.98] shadow-sm hover:shadow-xl hover:shadow-indigo-200"
                        >
                            <Sparkles size={20} className="transition-transform group-hover:rotate-12" />
                            Provision Identity
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DigitalHealthCards;

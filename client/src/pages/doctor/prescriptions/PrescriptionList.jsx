import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search, FileText, Plus, Eye, Printer, Calendar,
    ChevronRight, Activity, Clipboard, Info, Edit, Trash2
} from 'lucide-react';
import DashboardLayout from '../../../components/DashboardLayout';
import PrescriptionModal from '../../../components/prescription/PrescriptionModal';
import PrescriptionViewModal from '../../../components/prescription/PrescriptionViewModal';
import axiosInstance from '../../../api/axiosConfig';
import Swal from 'sweetalert2';

const PrescriptionList = () => {
    const navigate = useNavigate();
    const [prescriptions, setPrescriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPrescription, setEditingPrescription] = useState(null);
    const [viewingPrescription, setViewingPrescription] = useState(null);

    useEffect(() => {
        fetchPrescriptions();
    }, []);

    const fetchPrescriptions = async () => {
        try {
            const { data } = await axiosInstance.get('/api/prescriptions/doctor');
            if (data.success) {
                setPrescriptions(data.data);
            }
            setLoading(false);
        } catch (error) {
            console.error('Error fetching prescriptions:', error);
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            try {
                await axiosInstance.delete(`/api/prescriptions/${id}`);
                Swal.fire('Deleted!', 'Prescription has been deleted.', 'success');
                fetchPrescriptions();
            } catch (error) {
                Swal.fire('Error!', 'Failed to delete prescription.', 'error');
            }
        }
    };

    const handleEdit = (prescription) => {
        setEditingPrescription(prescription);
        setIsModalOpen(true);
    };

    const handleView = (prescription) => {
        setViewingPrescription(prescription);
    };

    const handlePrintOpen = (id) => {
        window.open(`/print/prescriptions/${id}`, '_blank');
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setEditingPrescription(null);
    };

    const filteredPrescriptions = prescriptions.filter(p => {
        const patientName = p.patientId?.name?.toLowerCase() || '';
        const prescriptionId = p.prescriptionId?.toLowerCase() || '';
        const search = searchTerm.toLowerCase();

        const matchesSearch = patientName.includes(search) || prescriptionId.includes(search);
        const matchesStatus = filterStatus === 'All' || p.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    return (
        <DashboardLayout>
            <div className="p-4 md:p-8 bg-slate-50/50 min-h-screen">
                <div className="max-w-7xl mx-auto">

                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                        <div>
                            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Prescriptions</h1>
                            <p className="text-slate-500 mt-2 flex items-center gap-2">
                                <Clipboard size={18} className="text-blue-500" />
                                Smart Prescription Management System
                            </p>
                        </div>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="bg-blue-600 text-white px-8 py-4 rounded-2xl flex items-center gap-3 hover:bg-blue-700 transition-all duration-300 shadow-xl shadow-blue-200 active:scale-95 group font-bold"
                        >
                            <div className="bg-white/20 p-1 rounded-lg group-hover:rotate-90 transition-transform">
                                <Plus size={20} />
                            </div>
                            Create New RX
                        </button>
                    </div>

                    <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 mb-10 flex flex-col lg:flex-row gap-6 items-center justify-between">
                        <div className="relative w-full lg:max-w-md group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                            <input
                                type="text"
                                placeholder="Search by patient name or RX ID..."
                                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex bg-slate-100 p-1.5 rounded-2xl w-full lg:w-auto overflow-x-auto no-scrollbar">
                            {['All', 'Active', 'Completed'].map((status) => (
                                <button
                                    key={status}
                                    onClick={() => setFilterStatus(status)}
                                    className={`px-8 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 whitespace-nowrap ${filterStatus === status
                                        ? 'bg-white text-blue-600 shadow-md transform scale-105'
                                        : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>
                    </div>

                    {loading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="bg-white rounded-3xl p-6 border border-slate-100 animate-pulse h-20"></div>
                            ))}
                        </div>
                    ) : filteredPrescriptions.length === 0 ? (
                        <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-24 text-center">
                            <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <FileText className="w-12 h-12 text-blue-400" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-800">No Prescriptions Found</h3>
                            <p className="text-slate-500 mt-2">Start by creating your first digital prescription.</p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden mb-12">
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[1000px]">
                                    <thead className="bg-slate-50 border-b border-slate-100">
                                        <tr>
                                            <th className="px-8 py-6 text-left text-xs font-black text-slate-400 uppercase tracking-widest">ID</th>
                                            <th className="px-8 py-6 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Patient</th>
                                            <th className="px-8 py-6 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Date / Diagnosis</th>
                                            <th className="px-8 py-6 text-left text-xs font-black text-slate-400 uppercase tracking-widest">Status</th>
                                            <th className="px-8 py-6 text-right text-xs font-black text-slate-400 uppercase tracking-widest">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {filteredPrescriptions.map((p) => (
                                            <tr key={p._id} className="hover:bg-blue-50/30 transition-colors group">
                                                <td className="px-8 py-6">
                                                    <span className="font-mono font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-lg text-sm">
                                                        {p.prescriptionId}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-md shadow-blue-200">
                                                            {p.patientId?.name?.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-slate-800">{p.patientId?.name}</p>
                                                            <p className="text-xs text-slate-400 font-bold tracking-wide">{p.patientId?.healthId || 'GHOST-user'}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
                                                            <Calendar size={14} />
                                                            {new Date(p.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                                                        </div>
                                                        <div className="flex items-center gap-2 text-slate-700 font-bold text-sm">
                                                            <Activity size={14} className="text-blue-500" />
                                                            {p.diagnosis || 'No Diagnosis'}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wide ${p.status === 'Active' ? 'bg-emerald-100 text-emerald-700' :
                                                        p.status === 'Completed' ? 'bg-blue-100 text-blue-700' :
                                                            'bg-slate-100 text-slate-600'
                                                        }`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${p.status === 'Active' ? 'bg-emerald-500' :
                                                            p.status === 'Completed' ? 'bg-blue-500' :
                                                                'bg-slate-500'
                                                            }`}></span>
                                                        {p.status}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => handleView(p)}
                                                            className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                                                            title="View Details"
                                                        >
                                                            <Eye size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => handlePrintOpen(p._id)}
                                                            className="p-2.5 text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
                                                            title="Print Prescription"
                                                        >
                                                            <Printer size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleEdit(p)}
                                                            className="p-2.5 text-amber-600 hover:bg-amber-50 rounded-xl transition-colors"
                                                            title="Edit"
                                                        >
                                                            <Edit size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(p._id)}
                                                            className="p-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                                                            title="Delete"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <PrescriptionModal
                isOpen={isModalOpen}
                onClose={handleModalClose}
                onPrescriptionCreated={fetchPrescriptions}
                initialData={editingPrescription}
            />

            <PrescriptionViewModal
                prescription={viewingPrescription}
                onClose={() => setViewingPrescription(null)}
            />

            <style dangerouslySetInnerHTML={{
                __html: `
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}} />
        </DashboardLayout>
    );
};

export default PrescriptionList;

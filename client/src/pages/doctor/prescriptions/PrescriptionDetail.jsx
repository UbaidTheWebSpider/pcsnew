import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Printer, ArrowLeft, Calendar, FileText, CheckCircle, Info, Download } from 'lucide-react';
import DashboardLayout from '../../../components/DashboardLayout';
import axiosInstance from '../../../api/axiosConfig';

const PrescriptionDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [prescription, setPrescription] = useState(null);
    const [loading, setLoading] = useState(true);
    const printRef = useRef();

    useEffect(() => {
        fetchPrescription();
    }, [id]);

    const fetchPrescription = async () => {
        try {
            const { data } = await axiosInstance.get(`/api/prescriptions/${id}`);
            setPrescription(data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching prescription:', error);
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            </DashboardLayout>
        );
    }

    if (!prescription) {
        return (
            <DashboardLayout>
                <div className="p-8 text-center bg-white rounded-xl border border-gray-100 max-w-2xl mx-auto mt-12">
                    <FileText className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-800">Prescription Not Found</h2>
                    <button onClick={() => navigate('/doctor/prescriptions')} className="mt-4 text-blue-600 hover:underline flex items-center gap-2 justify-center w-full">
                        <ArrowLeft size={16} /> Back to list
                    </button>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="p-8 pb-20 no-print">
                <div className="max-w-4xl mx-auto">
                    <div className="flex justify-between items-center mb-8">
                        <button
                            onClick={() => navigate('/doctor/prescriptions')}
                            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition font-medium"
                        >
                            <ArrowLeft size={20} />
                            Back to Prescriptions
                        </button>
                        <div className="flex gap-3">
                            {prescription.fileUrl && (
                                <a
                                    href={prescription.fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="bg-slate-100 text-slate-700 px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-slate-200 transition shadow-sm font-medium"
                                >
                                    <Download size={18} />
                                    Download PDF
                                </a>
                            )}
                            <button
                                onClick={handlePrint}
                                className="bg-blue-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition shadow-sm"
                            >
                                <Printer size={18} />
                                Print Prescription
                            </button>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
                        {/* Hospital Header Style */}
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h1 className="text-3xl font-bold tracking-tight">PRESCRIPTION</h1>
                                    <p className="mt-1 opacity-90 text-sm">Medical Certificate & Advice</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xl font-bold">HealthPulse Hospital</p>
                                    <p className="text-sm opacity-80">Sector 12, Smart City</p>
                                    <p className="text-xs opacity-70">Contact: +92 300 1234567</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-10">
                            {/* Patient Info Bar */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-6 border-b border-gray-100 mb-8">
                                <div>
                                    <label className="text-xs font-semibold text-gray-400 uppercase">Patient Name</label>
                                    <p className="text-gray-800 font-bold text-lg">{prescription.patientId?.name || 'N/A'}</p>
                                    <p className="text-sm text-gray-500">ID: {prescription.patientId?.healthId || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-400 uppercase">Date Issued</label>
                                    <p className="text-gray-800 font-medium">{new Date(prescription.createdAt).toLocaleDateString()}</p>
                                    <p className="text-sm text-gray-500">RX: {prescription.prescriptionId}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-400 uppercase">Diagnosis</label>
                                    <p className="text-blue-600 font-bold">{prescription.diagnosis || 'General Checkup'}</p>
                                </div>
                            </div>

                            {/* Medicines List */}
                            <div className="mb-10">
                                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    <span className="w-2 h-6 bg-blue-600 rounded-full"></span>
                                    Rx - Medicines
                                </h3>
                                <div className="space-y-4">
                                    {prescription.medicines?.map((med, idx) => (
                                        <div key={idx} className="bg-gray-50 rounded-xl p-4 border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div className="flex-1">
                                                <p className="font-bold text-gray-800 text-lg uppercase">{med.name}</p>
                                                <p className="text-sm text-gray-600 mt-1">
                                                    <span className="font-semibold text-blue-600">{med.dosage}</span> • {med.frequency} • {med.duration}
                                                </p>
                                            </div>
                                            <div className="md:text-right">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${med.instructionTime === 'Before Meal' ? 'bg-orange-50 text-orange-700' :
                                                    med.instructionTime === 'After Meal' ? 'bg-green-50 text-green-700' :
                                                        'bg-blue-50 text-blue-700'
                                                    }`}>
                                                    {med.instructionTime}
                                                </span>
                                                {med.instructions && (
                                                    <p className="text-xs text-gray-500 italic mt-2">{med.instructions}</p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Lab Tests */}
                            {prescription.labTests?.length > 0 && (
                                <div className="mb-10 p-6 bg-orange-50/30 rounded-2xl border border-orange-100">
                                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                        <Info size={20} className="text-orange-600" />
                                        Recommended Lab Tests
                                    </h3>
                                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {prescription.labTests.map((test, idx) => (
                                            <li key={idx} className="flex items-center gap-2 text-gray-700 font-medium">
                                                <CheckCircle size={14} className="text-orange-500" />
                                                {test}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Notes & Advice */}
                            {prescription.notes && (
                                <div className="mb-10">
                                    <h3 className="text-lg font-bold text-gray-800 mb-2">Advice & Notes</h3>
                                    <p className="text-gray-600 leading-relaxed whitespace-pre-wrap italic">
                                        "{prescription.notes}"
                                    </p>
                                </div>
                            )}

                            {/* Footer / Signature */}
                            <div className="mt-16 pt-10 border-t-2 border-dashed border-gray-100 flex flex-col md:flex-row justify-between items-end gap-10">
                                <div>
                                    {prescription.followUpDate && (
                                        <div className="bg-indigo-50 px-4 py-2 rounded-lg border border-indigo-100 flex items-center gap-3">
                                            <Calendar size={18} className="text-indigo-600" />
                                            <div>
                                                <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Follow up on</p>
                                                <p className="text-sm font-bold text-indigo-700">{new Date(prescription.followUpDate).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="text-center min-w-[200px]">
                                    {/* Mock Signature */}
                                    <div className="mb-2 h-16 flex items-end justify-center">
                                        <p className="font-[cursive] text-2xl text-blue-900 opacity-80">{prescription.doctorId?.name}</p>
                                    </div>
                                    <div className="w-full h-[2px] bg-gray-800 mb-1"></div>
                                    <p className="font-bold text-gray-800 uppercase text-xs tracking-widest leading-none">Registered Medical Practitioner</p>
                                    <p className="text-[10px] text-gray-500 mt-1">Reg No: {prescription.doctorId?.licenseNumber || 'DOC-2024-001'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Print Only Styles */}
            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    .no-print { display: none !important; }
                    body { background: white !important; margin: 0; padding: 0; }
                    .print-content { padding: 0 !important; margin: 0 !important; box-shadow: none !important; border: none !important; }
                    @page { margin: 1cm; }
                }
            `}} />
        </DashboardLayout>
    );
};

export default PrescriptionDetail;

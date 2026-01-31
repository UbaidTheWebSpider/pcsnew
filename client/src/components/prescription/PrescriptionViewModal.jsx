import React, { useRef, useEffect } from 'react';
import { X, Printer, Download, Calendar, User, Activity, FileText, Pill } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';

const PrescriptionViewModal = ({ prescription, onClose, autoPrint = false }) => {
    const printRef = useRef();

    const handlePrint = useReactToPrint({
        content: () => printRef.current,
        documentTitle: `Prescription-${prescription?.prescriptionId}`,
    });

    useEffect(() => {
        if (prescription && autoPrint) {
            // Wait for modal animation and rendering
            const timer = setTimeout(() => {
                if (printRef.current) {
                    handlePrint();
                }
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [prescription, autoPrint, handlePrint]);

    if (!prescription) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] shadow-2xl flex flex-col animate-fadeIn">

                {/* Modal Header */}
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-3xl">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                            <FileText size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">Prescription Details</h2>
                            <p className="text-sm text-slate-500 font-mono">#{prescription.prescriptionId}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {prescription.fileUrl && (
                            <a
                                href={prescription.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2.5 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                                title="Download PDF"
                            >
                                <Download size={20} />
                            </a>
                        )}
                        <button
                            onClick={handlePrint}
                            className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                            title="Print"
                        >
                            <Printer size={20} />
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Modal Content (Scrollable) */}
                <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-slate-50">

                    {/* Printable Area */}
                    <div ref={printRef} className="bg-white p-8 md:p-12 shadow-sm border border-slate-200 rounded-xl max-w-3xl mx-auto">

                        {/* Header / Hospital Info */}
                        <div className="flex justify-between items-start border-b-2 border-slate-100 pb-8 mb-8">
                            <div>
                                <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-1">Dr. {prescription.doctorId?.name || 'Unknown Doctor'}</h1>
                                <p className="text-slate-500 font-medium">{prescription.doctorId?.specialization || 'General Physician'}</p>
                                <p className="text-slate-400 text-sm mt-1">License: {prescription.doctorId?.licenseNumber || 'N/A'}</p>
                            </div>
                            <div className="text-right">
                                <div className="text-3xl font-black text-blue-600 mb-1">R<span className="text-slate-300">x</span></div>
                                <p className="text-slate-400 font-mono text-sm">#{prescription.prescriptionId}</p>
                                <p className="text-slate-400 text-sm mt-1">{new Date(prescription.createdAt).toLocaleDateString()}</p>
                            </div>
                        </div>

                        {/* Patient Info */}
                        <div className="bg-slate-50 rounded-2xl p-6 mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="flex items-start gap-3">
                                <User className="text-slate-400 mt-1" size={18} />
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Patient</p>
                                    <p className="font-bold text-slate-800">{prescription.patientId?.name}</p>
                                    <p className="text-sm text-slate-500">{prescription.patientId?.gender || 'N/A'}, {prescription.patientId?.age || 'N/A'} yrs</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Activity className="text-slate-400 mt-1" size={18} />
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Diagnosis</p>
                                    <p className="font-bold text-slate-800">{prescription.diagnosis}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Calendar className="text-slate-400 mt-1" size={18} />
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Follow Up</p>
                                    <p className="font-bold text-slate-800">
                                        {prescription.followUpDate ? new Date(prescription.followUpDate).toLocaleDateString() : 'No follow up'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Medicines */}
                        <div className="mb-10">
                            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <Pill className="text-blue-500" size={20} />
                                Prescribed Medicines
                            </h3>
                            <div className="border rounded-xl overflow-hidden shadow-sm">
                                <table className="w-full">
                                    <thead className="bg-slate-50 border-b border-slate-100">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Medicine</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Dosage</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Frequency</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Duration</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {prescription.medicines?.map((med, idx) => (
                                            <tr key={idx} className="bg-white">
                                                <td className="px-6 py-4">
                                                    <p className="font-bold text-slate-800">{med.name}</p>
                                                    {med.instructions && (
                                                        <p className="text-xs text-slate-500 mt-1 italic">{med.instructions}</p>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-slate-600 font-medium">{med.dosage}</td>
                                                <td className="px-6 py-4">
                                                    <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-xs font-bold">{med.frequency}</span>
                                                    <span className="text-xs text-slate-400 ml-2">{med.instructionTime}</span>
                                                </td>
                                                <td className="px-6 py-4 text-slate-600 font-medium">{med.duration}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Lab Tests & Notes */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                            {prescription.labTests?.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">Lab Tests</h3>
                                    <ul className="list-disc pl-5 space-y-1">
                                        {prescription.labTests.map((test, idx) => (
                                            <li key={idx} className="text-slate-700 font-medium">{test}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {prescription.notes && (
                                <div>
                                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">Doctor's Notes</h3>
                                    <p className="text-slate-600 bg-yellow-50 p-4 rounded-xl border border-yellow-100 text-sm leading-relaxed">
                                        {prescription.notes}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Footer Signature */}
                        <div className="flex justify-end mt-16 pt-8 border-t border-slate-100">
                            <div className="text-center">
                                <div className="font-hurricane text-4xl text-slate-800 mb-2">Dr. {prescription.doctorId?.name?.split(' ')[0]}</div>
                                <div className="w-48 h-px bg-slate-300 mb-2"></div>
                                <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">Doctor's Signature</p>
                            </div>
                        </div>

                    </div>

                    {/* Actions Footer within content area for mobile access */}
                    <div className="mt-8 flex justify-center gap-4">
                        <button
                            onClick={onClose}
                            className="px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-colors"
                        >
                            Close View
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default PrescriptionViewModal;

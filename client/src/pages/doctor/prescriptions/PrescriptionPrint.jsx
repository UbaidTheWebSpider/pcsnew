import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Download, Calendar, User, Activity, FileText, Pill, Printer } from 'lucide-react';
import axiosInstance from '../../../api/axiosConfig';
import { useReactToPrint } from 'react-to-print';

const PrescriptionPrint = () => {
    const { id } = useParams();
    const [prescription, setPrescription] = useState(null);
    const [loading, setLoading] = useState(true);
    const printRef = useRef();

    useEffect(() => {
        const fetchPrescription = async () => {
            try {
                const { data } = await axiosInstance.get(`/api/prescriptions/${id}`);
                setPrescription(data);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching prescription:", error);
                setLoading(false);
            }
        };

        if (id) fetchPrescription();
    }, [id]);

    const handlePrint = useReactToPrint({
        content: () => printRef.current,
        documentTitle: `Prescription-${prescription?.prescriptionId}`,
        onAfterPrint: () => window.close() // Optional: close tab after print? Maybe better to leave open.
    });

    useEffect(() => {
        if (!loading && prescription && printRef.current) {
            // Auto-trigger print after short delay
            setTimeout(() => {
                handlePrint();
            }, 1000);
        }
    }, [loading, prescription]);


    if (loading) return <div className="p-10 text-center">Loading prescription...</div>;
    if (!prescription) return <div className="p-10 text-center text-red-500">Prescription not found</div>;

    return (
        <div className="bg-slate-50 min-h-screen py-10 px-4 flex justify-center">
            {/* Printable Content Container */}
            <div ref={printRef} className="bg-white max-w-3xl w-full shadow-md rounded-xl overflow-hidden print:shadow-none print:rounded-none">
                {/* Header / Hospital Info - Matching Detail View */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white print:bg-white print:text-black">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-white print:text-black">PRESCRIPTION</h1>
                            <p className="mt-1 opacity-90 text-sm text-blue-100 print:text-gray-600">Medical Certificate & Advice</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xl font-bold text-white print:text-black">HealthPulse Hospital</p>
                            <p className="text-sm opacity-80 text-blue-100 print:text-gray-600">Sector 12, Smart City</p>
                            <p className="text-xs opacity-70 text-blue-200 print:text-gray-500">Contact: +92 300 1234567</p>
                        </div>
                    </div>
                </div>

                <div className="p-10">
                    {/* Doctor Info (Added below header for print context) */}
                    <div className="flex justify-between items-end border-b border-gray-100 pb-6 mb-8">
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Consultant</p>
                            <h2 className="text-xl font-bold text-gray-800">Dr. {prescription.doctorId?.name || 'Unknown Doctor'}</h2>
                            <p className="text-blue-600 font-medium text-sm">{prescription.doctorId?.specialization || 'General Physician'}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">License No.</p>
                            <p className="text-gray-600 font-mono font-medium">{prescription.doctorId?.licenseNumber || 'N/A'}</p>
                        </div>
                    </div>

                    {/* Patient Info Bar */}
                    <div className="grid grid-cols-3 gap-8 py-4 mb-8 bg-gray-50 rounded-xl p-6 border border-gray-100">
                        <div>
                            <label className="text-xs font-semibold text-gray-400 uppercase">Patient Name</label>
                            <p className="text-gray-800 font-bold text-lg">{prescription.patientId?.name}</p>
                            <p className="text-sm text-gray-500">{prescription.patientId?.gender || 'N/A'}, {prescription.patientId?.age || 'N/A'} yrs</p>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-400 uppercase">Date Issued</label>
                            <p className="text-gray-800 font-medium">{new Date(prescription.createdAt).toLocaleDateString()}</p>
                            <p className="text-sm text-gray-500">ID: {prescription.prescriptionId}</p>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-400 uppercase">Diagnosis</label>
                            <p className="text-blue-600 font-bold">{prescription.diagnosis}</p>
                        </div>
                    </div>

                    {/* Medicines */}
                    <div className="mb-10">
                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <span className="w-2 h-6 bg-blue-600 rounded-full"></span>
                            Rx - Medicines
                        </h3>
                        <div className="space-y-3">
                            {prescription.medicines?.map((med, idx) => (
                                <div key={idx} className="bg-white rounded-xl p-4 border border-gray-100 flex items-center justify-between gap-4 shadow-sm print:shadow-none print:border-gray-200">
                                    <div className="flex-1">
                                        <p className="font-bold text-gray-800 text-lg uppercase">{med.name}</p>
                                        <p className="text-sm text-gray-600 mt-1">
                                            <span className="font-semibold text-blue-600 print:text-black">{med.dosage}</span> • {med.frequency} • {med.duration}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${med.instructionTime === 'Before Meal' ? 'bg-orange-50 text-orange-700 print:bg-transparent print:text-black print:border print:border-gray-300' :
                                            med.instructionTime === 'After Meal' ? 'bg-green-50 text-green-700 print:bg-transparent print:text-black print:border print:border-gray-300' :
                                                'bg-blue-50 text-blue-700 print:bg-transparent print:text-black print:border print:border-gray-300'
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

                    {/* Lab Tests & Notes */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                        {prescription.labTests?.length > 0 && (
                            <div className="bg-orange-50/50 p-6 rounded-2xl border border-orange-100 print:bg-transparent print:border-gray-200">
                                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <Activity size={16} /> Recommended Lab Tests
                                </h3>
                                <ul className="space-y-2">
                                    {prescription.labTests.map((test, idx) => (
                                        <li key={idx} className="text-gray-800 font-medium flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-orange-400"></div>
                                            {test}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {prescription.notes && (
                            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 print:bg-transparent print:border-gray-200">
                                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <FileText size={16} /> Advice / Notes
                                </h3>
                                <p className="text-gray-700 text-sm leading-relaxed italic">
                                    "{prescription.notes}"
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Footer Signature */}
                    <div className="flex justify-between items-end mt-12 pt-8 border-t-2 border-dashed border-gray-100">
                        <div>
                            {prescription.followUpDate && (
                                <div className="flex items-center gap-3">
                                    <Calendar size={18} className="text-blue-600 print:text-black" />
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Follow up on</p>
                                        <p className="text-sm font-bold text-gray-800">{new Date(prescription.followUpDate).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="text-center">
                            {prescription.doctorId?.signatureUrl ? (
                                <img src={prescription.doctorId.signatureUrl} alt="Signature" className="h-12 mx-auto mb-2 opacity-80" />
                            ) : (
                                <div className="font-hurricane text-3xl text-blue-900 opacity-80 mb-1 print:text-black">Dr. {prescription.doctorId?.name?.split(' ')[0]}</div>
                            )}
                            <div className="w-48 h-px bg-gray-800 mb-1"></div>
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Authorized Signature</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Direct Print Button (for manual retry) */}
            <div className="fixed top-5 right-5 print:hidden">
                <button
                    onClick={handlePrint}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-bold shadow-lg hover:bg-blue-700 transition"
                >
                    <Printer size={18} /> Print Again
                </button>
            </div>
        </div>
    );
};

export default PrescriptionPrint;

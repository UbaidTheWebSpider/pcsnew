import { useRef, useEffect, useState } from 'react';
import { X, Download, Printer } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import Barcode from 'react-barcode';
import * as htmlToImage from 'html-to-image';
import { jsPDF } from 'jspdf';
import Swal from 'sweetalert2';

const HealthCardViewer = ({ patient, onClose }) => {
    const cardRef = useRef(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setTimeout(() => setIsVisible(true), 10);
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    if (!patient?.healthId) {
        return null;
    }

    const qrValue = patient.healthCardQr || JSON.stringify({
        hid: patient.healthId,
        pid: patient.patientId,
        uid: patient._id
    });

    const generateImage = async () => {
        if (!cardRef.current) return null;

        const container = document.createElement('div');
        container.style.position = 'fixed';
        container.style.top = '-9999px';
        container.style.left = '-9999px';
        document.body.appendChild(container);

        const clone = cardRef.current.cloneNode(true);
        clone.style.width = '600px';
        clone.style.height = '360px';
        clone.style.transform = 'none';
        container.appendChild(clone);

        const originalCanvases = cardRef.current.querySelectorAll('canvas');
        const clonedCanvases = clone.querySelectorAll('canvas');

        originalCanvases.forEach((original, index) => {
            const cloned = clonedCanvases[index];
            if (cloned) {
                const ctx = cloned.getContext('2d');
                ctx.drawImage(original, 0, 0);
            }
        });

        try {
            await new Promise(resolve => setTimeout(resolve, 500));
            const dataUrl = await htmlToImage.toPng(clone, {
                quality: 1.0,
                pixelRatio: 3,
                backgroundColor: '#ffffff'
            });
            document.body.removeChild(container);
            return dataUrl;
        } catch (error) {
            console.error('Export error:', error);
            if (document.body.contains(container)) document.body.removeChild(container);
            throw error;
        }
    };

    const handleDownloadPNG = async () => {
        try {
            const dataUrl = await generateImage();
            if (!dataUrl) throw new Error("Failed to generate image");

            const link = document.createElement('a');
            link.download = `HealthCard-${patient.healthId}.png`;
            link.href = dataUrl;
            link.click();

            Swal.fire({
                icon: 'success',
                title: 'Downloaded!',
                text: 'Health Card saved as PNG',
                timer: 2000,
                showConfirmButton: false
            });
        } catch (error) {
            Swal.fire('Error', 'Failed to export PNG', 'error');
        }
    };

    const handleDownloadPDF = async () => {
        try {
            const dataUrl = await generateImage();
            if (!dataUrl) throw new Error("Failed to generate image");

            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'px',
                format: [640, 400]
            });

            pdf.addImage(dataUrl, 'PNG', 20, 20, 600, 360);
            pdf.save(`HealthCard-${patient.healthId}.pdf`);

            Swal.fire({
                icon: 'success',
                title: 'Downloaded!',
                text: 'Health Card saved as PDF',
                timer: 2000,
                showConfirmButton: false
            });
        } catch (error) {
            Swal.fire('Error', 'Failed to export PDF', 'error');
        }
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            {/* Modal Container */}
            <div className={`relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl transform transition-all duration-300 ${isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-all z-10"
                >
                    <X size={24} />
                </button>

                {/* Modal Content */}
                <div className="p-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">Digital Health Card</h2>
                        <p className="text-gray-600">{patient.name}</p>
                    </div>

                    {/* EXPORT BUTTONS - HIGHLY VISIBLE */}
                    <div className="mb-8 p-6 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 rounded-2xl border-2 border-indigo-200">
                        <h3 className="text-center text-xl font-bold text-gray-800 mb-4 flex items-center justify-center gap-2">
                            <Download className="text-indigo-600" size={24} />
                            Export Options
                        </h3>
                        <div className="flex flex-wrap justify-center gap-4">
                            <button
                                onClick={handleDownloadPNG}
                                className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-bold text-lg hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                            >
                                <Download size={24} />
                                DOWNLOAD PNG
                            </button>
                            <button
                                onClick={handleDownloadPDF}
                                className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-bold text-lg hover:from-red-700 hover:to-red-800 shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                            >
                                <Download size={24} />
                                DOWNLOAD PDF
                            </button>
                            <button
                                onClick={handlePrint}
                                className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-xl font-bold text-lg hover:from-emerald-700 hover:to-teal-800 shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                            >
                                <Printer size={24} />
                                PRINT
                            </button>
                        </div>
                    </div>

                    {/* Health Card Display */}
                    <div className="flex justify-center">
                        <div ref={cardRef} className="w-[600px] h-[360px] rounded-2xl overflow-hidden shadow-2xl">
                            <div className="relative w-full h-full bg-gradient-to-br from-blue-700 via-indigo-800 to-purple-900">
                                {/* Decorative Elements */}
                                <div className="absolute top-[-50%] right-[-10%] w-[500px] h-[500px] rounded-full bg-white opacity-5"></div>
                                <div className="absolute bottom-[-30%] left-[-10%] w-[400px] h-[400px] rounded-full bg-teal-400 opacity-10 blur-3xl"></div>

                                {/* Card Content */}
                                <div className="relative z-10 p-8 flex flex-col h-full justify-between text-white">
                                    {/* Header */}
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-white/20 p-3 rounded-xl backdrop-blur-md border border-white/10">
                                                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-2xl tracking-wide">HEALTH PASS</h3>
                                                <p className="text-[11px] text-blue-200 uppercase tracking-[0.3em] font-semibold">Universal Digital ID</p>
                                            </div>
                                        </div>
                                        <div className="text-right text-xs">
                                            <p className="text-blue-200">Issued</p>
                                            <p className="font-semibold">{patient.healthCardIssueDate ? new Date(patient.healthCardIssueDate).toLocaleDateString() : 'N/A'}</p>
                                        </div>
                                    </div>

                                    {/* Main Content */}
                                    <div className="flex gap-8">
                                        <div className="flex-1">
                                            <div className="mb-6">
                                                <p className="text-[11px] text-blue-300 uppercase tracking-widest font-semibold mb-1">Patient Name</p>
                                                <p className="font-semibold text-3xl truncate">{patient.name}</p>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-[10px] text-blue-300 uppercase tracking-widest mb-1">Gender</p>
                                                    <p className="font-medium text-sm capitalize">{patient.gender || 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-blue-300 uppercase tracking-widest mb-1">Blood Group</p>
                                                    <p className="font-semibold text-sm">{patient.bloodGroup || 'N/A'}</p>
                                                </div>
                                                <div className="col-span-2">
                                                    <p className="text-[10px] text-blue-300 uppercase tracking-widest mb-1">CNIC</p>
                                                    <p className="font-mono text-sm opacity-90">{patient.cnic || 'N/A'}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* QR and Photo */}
                                        <div className="flex flex-col items-end gap-4">
                                            <div className="bg-white p-2 rounded-xl shadow-lg">
                                                <QRCodeCanvas value={qrValue} size={100} level="M" fgColor="#1e3a8a" />
                                            </div>
                                            <div className="w-16 h-16 rounded-full bg-white/10 border-2 border-blue-200/50 flex items-center justify-center overflow-hidden">
                                                {patient.photoUrl ? (
                                                    <img src={patient.photoUrl} crossOrigin="anonymous" alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <svg className="w-8 h-8 text-blue-200" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                                    </svg>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Footer */}
                                    <div className="pt-4 border-t border-white/10 flex justify-between items-end">
                                        <div>
                                            <p className="text-[10px] text-blue-300 uppercase tracking-widest mb-1">Health ID</p>
                                            <p className="font-mono text-2xl font-bold tracking-widest text-amber-300">{patient.healthId}</p>
                                        </div>
                                        <div className="bg-white/95 px-2 py-2 rounded-lg">
                                            <Barcode value={patient.healthId} width={1.5} height={30} format="CODE128" displayValue={false} background="transparent" margin={0} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer Note */}
                    <p className="text-center text-xs text-gray-400 mt-6">
                        Official Digital Document • Verifiable via QR Code • Issued by Hospital
                    </p>
                </div>
            </div>
        </div>
    );
};

export default HealthCardViewer;

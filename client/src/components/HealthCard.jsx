import React, { useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import Barcode from 'react-barcode';
import { ShieldCheck, User, Download, Droplet } from 'lucide-react';
import * as htmlToImage from 'html-to-image';
import { jsPDF } from 'jspdf';
import Swal from 'sweetalert2';

const HealthCard = ({ patient }) => {
    const cardRef = useRef(null);

    if (!patient?.healthId) {
        return (
            <div className="text-center p-8 bg-gray-50 rounded-xl">
                <p className="text-gray-600">No Health ID generated yet. Please generate one first.</p>
            </div>
        );
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
        clone.style.width = '500px';
        clone.style.height = '300px';
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
                format: [540, 340]
            });

            pdf.addImage(dataUrl, 'PNG', 20, 20, 500, 300);
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

    return (
        <div className="w-full max-w-3xl mx-auto">
            {/* EXPORT BUTTONS - ALWAYS VISIBLE AT TOP */}
            <div className="mb-6 p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl border-2 border-indigo-200">
                <h3 className="text-center text-xl font-bold text-gray-800 mb-4 flex items-center justify-center gap-2">
                    <Download className="text-indigo-600" size={24} />
                    Export Health Card
                </h3>
                <div className="flex flex-wrap justify-center gap-4">
                    <button
                        onClick={handleDownloadPNG}
                        className="flex items-center gap-3 px-8 py-4 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                    >
                        <Download size={24} />
                        DOWNLOAD PNG
                    </button>
                    <button
                        onClick={handleDownloadPDF}
                        className="flex items-center gap-3 px-8 py-4 bg-red-600 text-white rounded-xl font-bold text-lg hover:bg-red-700 shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                    >
                        <Download size={24} />
                        DOWNLOAD PDF
                    </button>
                </div>
            </div>

            {/* HEALTH CARD VISUAL */}
            <div ref={cardRef} className="relative w-[500px] h-[300px] mx-auto rounded-3xl overflow-hidden shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-700 to-indigo-900">
                    <div className="absolute top-[-50%] right-[-10%] w-[400px] h-[400px] rounded-full bg-white opacity-5"></div>
                    <div className="absolute bottom-[-30%] left-[-10%] w-[350px] h-[350px] rounded-full bg-teal-400 opacity-10 blur-3xl"></div>
                </div>

                <div className="relative z-10 p-7 flex flex-col h-full justify-between text-white">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                            <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-md border border-white/10">
                                <ShieldCheck size={28} />
                            </div>
                            <div>
                                <h3 className="font-bold text-2xl tracking-wide">HEALTH PASS</h3>
                                <p className="text-[10px] text-blue-200 uppercase tracking-[0.25em] font-semibold">Universal Digital ID</p>
                            </div>
                        </div>
                        <div className="text-right text-xs">
                            <p className="text-blue-200">Issued</p>
                            <p>{patient.healthCardIssueDate ? new Date(patient.healthCardIssueDate).toLocaleDateString() : 'N/A'}</p>
                        </div>
                    </div>

                    <div className="flex gap-6">
                        <div className="flex-1">
                            <div className="mb-5">
                                <p className="text-[10px] text-blue-300 uppercase tracking-widest font-semibold mb-1">Patient Name</p>
                                <p className="font-semibold text-2xl truncate">{patient.name}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-y-3 gap-x-1">
                                <div>
                                    <p className="text-[10px] text-blue-300 uppercase tracking-widest mb-0.5">Gender</p>
                                    <p className="font-medium text-sm capitalize">{patient.gender || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-blue-300 uppercase tracking-widest mb-0.5">Blood</p>
                                    <div className="flex items-center gap-1.5">
                                        <Droplet size={10} className="text-rose-400 fill-rose-400" />
                                        <p className="font-semibold text-sm">{patient.bloodGroup || 'N/A'}</p>
                                    </div>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-[10px] text-blue-300 uppercase tracking-widest mb-0.5">CNIC</p>
                                    <p className="font-mono text-sm opacity-90">{patient.cnic || 'N/A'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col items-end gap-3 w-32">
                            <div className="bg-white p-2 rounded-xl shadow-lg">
                                <QRCodeCanvas value={qrValue} size={84} level="M" fgColor="#1e3a8a" />
                            </div>
                            <div className="w-14 h-14 rounded-full bg-white/10 border-2 border-blue-200/50 flex items-center justify-center overflow-hidden">
                                {patient.photoUrl ? (
                                    <img src={patient.photoUrl} crossOrigin="anonymous" alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <User size={28} className="text-blue-200" />
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="pt-3 border-t border-white/10 flex justify-between items-end">
                        <div>
                            <p className="text-[9px] text-blue-300 uppercase tracking-widest mb-0.5">Health ID</p>
                            <p className="font-mono text-xl font-bold tracking-widest text-amber-300">{patient.healthId}</p>
                        </div>
                        <div className="bg-white/95 px-2 py-1.5 rounded-lg">
                            <Barcode value={patient.healthId} width={1.2} height={25} format="CODE128" displayValue={false} background="transparent" margin={0} />
                        </div>
                    </div>
                </div>
            </div>

            <p className="text-xs text-gray-400 mt-4 text-center">
                Official Digital Document • Verifiable via QR Code
            </p>
        </div>
    );
};

export default HealthCard;

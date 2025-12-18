import React, { useRef } from 'react';
import { Download } from 'lucide-react';
import * as htmlToImage from 'html-to-image';
import { jsPDF } from 'jspdf';
import Swal from 'sweetalert2';
import HealthCard from './HealthCard';

const HealthCardExporter = ({ patient }) => {
    const cardRef = useRef(null);

    if (!patient?.healthId) return null;

    const generateImage = async () => {
        if (!cardRef.current) {
            console.error('Card ref not available');
            return null;
        }

        const container = document.createElement('div');
        container.style.position = 'fixed';
        container.style.top = '-9999px';
        container.style.left = '-9999px';
        container.style.zIndex = '-1';
        document.body.appendChild(container);

        const clone = cardRef.current.cloneNode(true);
        clone.style.width = '500px';
        clone.style.height = '300px';
        clone.style.transform = 'none';
        container.appendChild(clone);

        // Copy canvas content (QR codes)
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
            console.error('Image generation error:', error);
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
                title: 'Success!',
                text: 'Health Card downloaded as PNG',
                timer: 2000,
                showConfirmButton: false
            });
        } catch (error) {
            console.error('PNG export error:', error);
            Swal.fire({
                icon: 'error',
                title: 'Export Failed',
                text: 'Could not export PNG. Please try again.'
            });
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
                title: 'Success!',
                text: 'Health Card downloaded as PDF',
                timer: 2000,
                showConfirmButton: false
            });
        } catch (error) {
            console.error('PDF export error:', error);
            Swal.fire({
                icon: 'error',
                title: 'Export Failed',
                text: 'Could not export PDF. Please try again.'
            });
        }
    };

    return (
        <div className="w-full flex flex-col items-center gap-6">
            {/* Export Buttons - Always Visible */}
            <div className="flex gap-4 mb-4">
                <button
                    onClick={handleDownloadPNG}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:shadow-lg hover:from-blue-700 hover:to-blue-800 transition-all transform hover:scale-105"
                >
                    <Download size={20} />
                    <span>Download PNG</span>
                </button>
                <button
                    onClick={handleDownloadPDF}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-semibold hover:shadow-lg hover:from-red-700 hover:to-red-800 transition-all transform hover:scale-105"
                >
                    <Download size={20} />
                    <span>Download PDF</span>
                </button>
            </div>

            {/* Card Display */}
            <div ref={cardRef}>
                <HealthCardDisplay patient={patient} />
            </div>
        </div>
    );
};

// Simplified card display without export buttons
const HealthCardDisplay = ({ patient }) => {
    const qrValue = patient.healthCardQr || JSON.stringify({
        hid: patient.healthId,
        pid: patient.patientId,
        uid: patient._id
    });

    return (
        <div
            className="relative w-[500px] h-[300px] rounded-3xl overflow-hidden shadow-2xl bg-white text-gray-800"
            style={{ fontFamily: "'Inter', sans-serif" }}
        >
            {/* Import the actual card JSX from HealthCard.jsx here */}
            {/* For now, this is a placeholder - we'll use the existing HealthCard component */}
            <div className="p-6 bg-gradient-to-br from-blue-700 to-indigo-900 text-white h-full flex flex-col justify-between">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-2xl font-bold">HEALTH PASS</h3>
                        <p className="text-xs text-blue-200 uppercase tracking-wider">Universal Digital ID</p>
                    </div>
                    <div className="text-right text-xs">
                        <p className="text-blue-200">Issue Date</p>
                        <p>{patient.healthCardIssueDate ? new Date(patient.healthCardIssueDate).toLocaleDateString() : 'N/A'}</p>
                    </div>
                </div>

                <div>
                    <p className="text-sm text-blue-200 uppercase">Patient Name</p>
                    <p className="text-xl font-bold">{patient.name}</p>
                </div>

                <div>
                    <p className="text-xs text-blue-200 uppercase">Health ID</p>
                    <p className="text-xl font-mono font-bold text-yellow-300">{patient.healthId}</p>
                </div>
            </div>
        </div>
    );
};

export default HealthCardExporter;

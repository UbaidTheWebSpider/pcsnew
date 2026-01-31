import { useState, useEffect } from 'react';
import {
    Plus, Save, X, Trash2, Activity, Info, AlertCircle, ShoppingBag
} from 'lucide-react';
import axiosInstance from '../../api/axiosConfig';
import Swal from 'sweetalert2';

const PrescriptionModal = ({ isOpen, onClose, onPrescriptionCreated, preSelectedPatientId = '', initialData = null }) => {
    const [modalLoading, setModalLoading] = useState(false);
    const [patients, setPatients] = useState([]);
    const [medicineResults, setMedicineResults] = useState([]);
    const [pharmacyMedicines, setPharmacyMedicines] = useState([]);
    const [showPharmacyOnly, setShowPharmacyOnly] = useState(false);
    const [activeMedicineIndex, setActiveMedicineIndex] = useState(null);

    const [formData, setFormData] = useState({
        patientId: preSelectedPatientId,
        diagnosis: '',
        notes: '',
        medicines: [
            { name: '', dosage: '', frequency: '', duration: '', instructionTime: 'None', instructions: '' }
        ],
        labTests: [''],
        followUpDate: ''
    });

    useEffect(() => {
        if (isOpen) {
            fetchPatients();
            fetchPharmacyMedicines();
            if (initialData) {
                setFormData({
                    patientId: initialData.patientId._id || initialData.patientId,
                    diagnosis: initialData.diagnosis || '',
                    notes: initialData.notes || '',
                    medicines: initialData.medicines.length > 0 ? initialData.medicines : [{ name: '', dosage: '', frequency: '', duration: '', instructionTime: 'None', instructions: '' }],
                    labTests: initialData.labTests.length > 0 ? initialData.labTests : [''],
                    followUpDate: initialData.followUpDate ? new Date(initialData.followUpDate).toISOString().split('T')[0] : ''
                });
            } else {
                setFormData({
                    patientId: preSelectedPatientId,
                    diagnosis: '',
                    notes: '',
                    medicines: [{ name: '', dosage: '', frequency: '', duration: '', instructionTime: 'None', instructions: '' }],
                    labTests: [''],
                    followUpDate: ''
                });
            }
        }
    }, [isOpen, preSelectedPatientId, initialData]);

    const fetchPatients = async () => {
        try {
            const { data } = await axiosInstance.get('/api/doctor/patients');
            if (data.success) {
                setPatients(data.data.patients);
            }
        } catch (error) {
            console.error('Error fetching patients:', error);
        }
    };

    const fetchPharmacyMedicines = async () => {
        try {
            const { data } = await axiosInstance.get('/api/prescriptions/meta/available-medicines');
            if (data.success) {
                setPharmacyMedicines(data.data);
            }
        } catch (error) {
            console.error('Error fetching pharmacy medicines:', error);
        }
    };

    const handleMedicineChange = (index, field, value) => {
        const newMedicines = [...formData.medicines];
        newMedicines[index][field] = value;
        setFormData({ ...formData, medicines: newMedicines });

        if (field === 'name' && value.length >= 2) {
            searchMedicines(value, index);
        } else if (field === 'name') {
            setMedicineResults([]);
        }
    };

    const searchMedicines = async (query, index) => {
        if (showPharmacyOnly) {
            const results = pharmacyMedicines.filter(m =>
                m.name.toLowerCase().includes(query.toLowerCase()) ||
                m.genericName.toLowerCase().includes(query.toLowerCase())
            );
            setMedicineResults(results);
            setActiveMedicineIndex(index);
        } else {
            try {
                const { data } = await axiosInstance.get(`/api/master-medicines/search?q=${query}&limit=5`);
                if (data.success) {
                    setMedicineResults(data.data);
                    setActiveMedicineIndex(index);
                }
            } catch (error) {
                console.error('Error searching medicines:', error);
            }
        }
    };

    const selectMedicine = (index, medicine) => {
        const newMedicines = [...formData.medicines];
        newMedicines[index].name = medicine.name;
        if (medicine.strength) newMedicines[index].dosage = medicine.strength;

        setFormData({ ...formData, medicines: newMedicines });
        setMedicineResults([]);
        setActiveMedicineIndex(null);
    };

    const addMedicineRow = () => {
        setFormData({
            ...formData,
            medicines: [...formData.medicines, { name: '', dosage: '', frequency: '', duration: '', instructionTime: 'None', instructions: '' }]
        });
    };

    const removeMedicineRow = (index) => {
        if (formData.medicines.length > 1) {
            const newMedicines = formData.medicines.filter((_, i) => i !== index);
            setFormData({ ...formData, medicines: newMedicines });
        }
    };

    const handleLabTestChange = (index, value) => {
        const newLabTests = [...formData.labTests];
        newLabTests[index] = value;
        setFormData({ ...formData, labTests: newLabTests });
    };

    const addLabTestRow = () => {
        setFormData({ ...formData, labTests: [...formData.labTests, ''] });
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();

        // Comprehensive Client-side validation
        if (!formData.patientId) {
            return Swal.fire('Error', 'Please select a patient', 'error');
        }

        const invalidMedicines = formData.medicines.some(m => !m.name?.trim() || !m.dosage?.trim() || !m.frequency?.trim() || !m.duration?.trim());
        if (invalidMedicines) {
            return Swal.fire('Error', 'Please fill all required medicine fields (Name, Dosage, Frequency, Duration)', 'error');
        }

        setModalLoading(true);
        try {
            const finalData = {
                ...formData,
                labTests: formData.labTests.filter(t => t.trim() !== '')
            };

            let response;
            if (initialData) {
                response = await axiosInstance.put(`/api/prescriptions/${initialData._id}`, finalData);
            } else {
                response = await axiosInstance.post('/api/prescriptions', finalData);
            }

            Swal.fire({
                icon: 'success',
                title: initialData ? 'Updated!' : 'Created!',
                text: initialData ? 'Prescription updated successfully.' : 'Prescription has been issued.',
                timer: 1500,
                showConfirmButton: false
            });

            onPrescriptionCreated();
            onClose();
        } catch (error) {
            console.error('Error:', error);
            Swal.fire('Error', error.response?.data?.message || 'Failed to save', 'error');
        } finally {
            setModalLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

            <div className="relative bg-white w-full max-w-5xl max-h-[90vh] rounded-[40px] shadow-[0_0_100px_-20px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300">

                {/* Modal Header */}
                <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-white sticky top-0 z-10">
                    <div>
                        <h2 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white">
                                <Plus size={24} />
                            </div>
                            {initialData ? 'Edit Prescription' : 'Interactive RX Creator'}
                        </h2>
                        <p className="text-slate-400 mt-1 font-medium italic">
                            {initialData ? 'Modifying existing medical record...' : 'Generating secure digital medical record...'}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-3 h-12 w-12 bg-slate-100 text-slate-400 rounded-2xl hover:bg-red-50 hover:text-red-500 transition-all active:scale-90 flex items-center justify-center">
                        <X size={24} />
                    </button>
                </div>

                {/* Modal Content */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-slate-50/30">
                    <form onSubmit={handleSubmit} className="space-y-10">

                        {/* Section: Patient */}
                        <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-2 h-6 bg-blue-500 rounded-full"></div>
                                <h3 className="text-xl font-extrabold text-slate-800">1. Patient Metadata</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3 block">TARGET PATIENT</label>
                                    <select
                                        className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition-all font-bold text-slate-700 disabled:opacity-50"
                                        value={formData.patientId}
                                        onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                                        disabled={!!preSelectedPatientId}
                                        required
                                    >
                                        <option value="">Search & Select Patient...</option>
                                        {patients.map(p => (
                                            <option key={p._id} value={p._id}>{p.name} — {p.healthId || 'NO-ID'}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3 block">PRIMARY DIAGNOSIS</label>
                                    <input
                                        type="text"
                                        className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition-all font-bold text-slate-700 placeholder:text-slate-300"
                                        placeholder="Enter clinical diagnosis summary..."
                                        value={formData.diagnosis}
                                        onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section: Medicines */}
                        <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100">
                            <div className="flex justify-between items-center mb-8">
                                <div className="flex items-center gap-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-6 bg-emerald-500 rounded-full"></div>
                                        <h3 className="text-xl font-extrabold text-slate-800">2. pharmacological Intervention</h3>
                                    </div>

                                    <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
                                        <button
                                            type="button"
                                            onClick={() => { setShowPharmacyOnly(false); setMedicineResults([]); }}
                                            className={`px-3 py-1 text-[10px] font-black rounded-lg transition-all ${!showPharmacyOnly ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}
                                        >
                                            GLOBAL
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => { setShowPharmacyOnly(true); setMedicineResults([]); }}
                                            className={`px-3 py-1 text-[10px] font-black rounded-lg transition-all ${showPharmacyOnly ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-400'}`}
                                        >
                                            IN PHARMACY
                                        </button>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={addMedicineRow}
                                    className="px-6 py-3 bg-emerald-50 text-emerald-600 rounded-xl text-sm font-black hover:bg-emerald-100 transition-colors flex items-center gap-2"
                                >
                                    <Plus size={16} /> ADD LINE
                                </button>
                            </div>

                            <div className="space-y-6">
                                {formData.medicines.map((med, index) => (
                                    <div key={index} className="p-6 bg-slate-50 rounded-3xl relative border border-slate-100 ring-4 ring-transparent hover:ring-blue-500/10 transition-all">
                                        {showPharmacyOnly && med.name === '' && (
                                            <div className="absolute top-2 right-4 flex items-center gap-1 text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                                                <ShoppingBag size={10} /> Searching In-Stock Only
                                            </div>
                                        )}
                                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                                            <div className="md:col-span-5 relative">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Medicine & Salts</label>
                                                <input
                                                    type="text"
                                                    className={`w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-4 outline-none font-bold text-sm ${showPharmacyOnly ? 'focus:ring-emerald-500/10 focus:border-emerald-500' : 'focus:ring-blue-500/10 focus:border-blue-500'}`}
                                                    placeholder={showPharmacyOnly ? "Search pharmacy inventory..." : "Search global registry..."}
                                                    value={med.name}
                                                    onChange={(e) => handleMedicineChange(index, 'name', e.target.value)}
                                                    required
                                                />
                                                {activeMedicineIndex === index && medicineResults.length > 0 && (
                                                    <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-top-2">
                                                        {medicineResults.map((m) => (
                                                            <button
                                                                key={m._id}
                                                                type="button"
                                                                className="w-full text-left px-5 py-3 hover:bg-blue-50 transition-colors border-b border-slate-50 last:border-0"
                                                                onClick={() => selectMedicine(index, m)}
                                                            >
                                                                <div className="flex justify-between items-center">
                                                                    <div>
                                                                        <p className="font-black text-slate-800 text-sm">{m.name}</p>
                                                                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">{m.genericName} • {m.strength}</p>
                                                                    </div>
                                                                    {showPharmacyOnly && (
                                                                        <div className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                                                                            Stock: {m.totalQuantity}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Dosage</label>
                                                <input
                                                    type="text"
                                                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none font-bold text-sm"
                                                    placeholder="500mg"
                                                    value={med.dosage}
                                                    onChange={(e) => handleMedicineChange(index, 'dosage', e.target.value)}
                                                    required
                                                />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Frequency</label>
                                                <input
                                                    type="text"
                                                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none font-bold text-sm"
                                                    placeholder="1-0-1"
                                                    value={med.frequency}
                                                    onChange={(e) => handleMedicineChange(index, 'frequency', e.target.value)}
                                                    required
                                                />
                                            </div>
                                            <div className="md:col-span-3">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Timing Protocol</label>
                                                <select
                                                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none font-black text-xs text-slate-600"
                                                    value={med.instructionTime}
                                                    onChange={(e) => handleMedicineChange(index, 'instructionTime', e.target.value)}
                                                >
                                                    <option value="None">Direct Intake</option>
                                                    <option value="Before Meal">Before Meal</option>
                                                    <option value="After Meal">After Meal</option>
                                                    <option value="With Meal">With Meal</option>
                                                    <option value="Empty Stomach">Empty Stomach</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="mt-4 flex flex-col md:flex-row items-end gap-4">
                                            <div className="flex-1 w-full">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Instructions (Optional)</label>
                                                <input
                                                    type="text"
                                                    className="w-full px-4 py-3 bg-slate-100 border border-transparent rounded-xl focus:bg-white focus:border-slate-200 outline-none text-xs text-slate-600 font-medium placeholder:italic"
                                                    placeholder="Special instructions (e.g. swallow whole, avoid dairy)..."
                                                    value={med.instructions}
                                                    onChange={(e) => handleMedicineChange(index, 'instructions', e.target.value)}
                                                />
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="flex flex-col">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Duration</label>
                                                    <input
                                                        type="text"
                                                        placeholder="5 Days"
                                                        className="w-32 bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500 font-bold text-sm p-3"
                                                        value={med.duration}
                                                        onChange={(e) => handleMedicineChange(index, 'duration', e.target.value)}
                                                        required
                                                    />
                                                </div>
                                                {formData.medicines.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => removeMedicineRow(index)}
                                                        className="text-slate-300 hover:text-red-500 p-3 rounded-2xl transition-colors active:scale-90 bg-white border border-slate-100 shadow-sm"
                                                    >
                                                        <Trash2 size={20} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Section: Footer Extras */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
                                        <ShoppingBag size={20} className="text-amber-500" />
                                        3. Lab Orders
                                    </h3>
                                    <button type="button" onClick={addLabTestRow} className="text-xs font-black text-blue-600 hover:underline">+ ORDER MORE</button>
                                </div>
                                <div className="space-y-4">
                                    {formData.labTests.map((test, idx) => (
                                        <div key={idx} className="relative group">
                                            <input
                                                type="text"
                                                className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-amber-500 focus:bg-white outline-none transition-all font-bold text-sm text-slate-700"
                                                placeholder="Laboratory test code or name..."
                                                value={test}
                                                onChange={(e) => handleLabTestChange(idx, e.target.value)}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100">
                                <h3 className="text-xl font-extrabold text-slate-800 mb-6 flex items-center gap-2">
                                    <AlertCircle size={20} className="text-indigo-500" />
                                    4. Final Protocols
                                </h3>
                                <div className="space-y-6">
                                    <div>
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">FOLLOW-UP APPOINTMENT</label>
                                        <input
                                            type="date"
                                            className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-indigo-500 focus:bg-white outline-none font-bold text-slate-700"
                                            value={formData.followUpDate}
                                            onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">DISCHARGE SUMMARY / NOTES</label>
                                        <textarea
                                            className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-indigo-500 focus:bg-white outline-none font-bold text-slate-700 min-h-[120px] resize-none"
                                            placeholder="General dietary advice, precautions, and next steps..."
                                            value={formData.notes}
                                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        ></textarea>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>

                {/* Modal Footer */}
                <div className="p-8 border-t border-slate-50 bg-white flex justify-end gap-6 sticky bottom-0 z-10">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-10 py-4 bg-slate-100 text-slate-500 font-black rounded-2xl hover:bg-slate-200 transition-all duration-300"
                    >
                        DISCARD
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={modalLoading}
                        className="px-12 py-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 transition-all duration-300 shadow-2xl shadow-blue-200 disabled:opacity-50 flex items-center gap-3"
                    >
                        {modalLoading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : <Save size={20} />}
                        VALIDATE & SIGN RX
                    </button>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
            `}} />
        </div>
    );
};

export default PrescriptionModal;

import { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../../api/axiosConfig';
import { Plus, Package, Search } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { showSuccess, showError } from '../../utils/sweetalert';

const MedicineInventory = () => {
    const [medicines, setMedicines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddForm, setShowAddForm] = useState(false);
    const [showBatchModal, setShowBatchModal] = useState(false);
    const [selectedMedicine, setSelectedMedicine] = useState(null);
    const [batchFormData, setBatchFormData] = useState({
        batchNo: '',
        quantity: '',
        mfgDate: '',
        expDate: '',
        supplierCost: '',
        status: 'Available',
    });
    const [formData, setFormData] = useState({
        name: '',
        genericName: '',
        manufacturer: '',
        category: '',
        strength: '',
        form: '',
        price: '',
        reorderLevel: 10,
        barcode: '',
    });

    const fetchMedicines = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            const { data } = await axiosInstance.get('/api/medicines', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMedicines(data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching medicines:', error);
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMedicines();
    }, [fetchMedicines]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axiosInstance.post('/api/medicines', formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setShowAddForm(false);
            setFormData({
                name: '',
                genericName: '',
                manufacturer: '',
                category: '',
                strength: '',
                form: '',
                price: '',
                reorderLevel: 10,
                barcode: '',
            });
            fetchMedicines();
            showSuccess('Medicine added successfully');
        } catch (error) {
            console.error('Error adding medicine:', error);
            showError('Failed to add medicine');
        }
    };

    const handleAddBatch = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axiosInstance.post(`/api/medicines/${selectedMedicine._id}/batches`, batchFormData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setShowBatchModal(false);
            setBatchFormData({
                batchNo: '',
                quantity: '',
                mfgDate: '',
                expDate: '',
                supplierCost: '',
                status: 'Available',
            });
            fetchMedicines();
            showSuccess('Batch added successfully');
        } catch (error) {
            console.error('Error adding batch:', error);
            showError('Failed to add batch');
        }
    };

    const filteredMedicines = medicines.filter(med =>
        med.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        med.genericName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getTotalStock = (batches) => {
        return batches?.reduce((sum, batch) => sum + batch.quantity, 0) || 0;
    };

    return (
        <DashboardLayout>
            <div className="p-8 max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Medicine Inventory</h1>
                        <p className="text-slate-500 mt-1">Manage your pharmacy stock and medicine database.</p>
                    </div>
                    <button
                        onClick={() => setShowAddForm(!showAddForm)}
                        className="btn-primary flex items-center gap-2"
                    >
                        <Plus size={20} />
                        <span>Add Medicine</span>
                    </button>
                </div>

                {showAddForm && (
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 mb-8 animate-fade-in">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-slate-800">Add New Medicine</h2>
                            <button onClick={() => setShowAddForm(false)} className="text-slate-400 hover:text-slate-600">
                                <span className="sr-only">Close</span>
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Medicine Name <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    placeholder="e.g. Paracetamol"
                                    className="input-field"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Generic Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Acetaminophen"
                                    className="input-field"
                                    value={formData.genericName}
                                    onChange={(e) => setFormData({ ...formData, genericName: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Manufacturer</label>
                                <input
                                    type="text"
                                    placeholder="e.g. GSK"
                                    className="input-field"
                                    value={formData.manufacturer}
                                    onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Category</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Analgesic"
                                    className="input-field"
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Strength</label>
                                <input
                                    type="text"
                                    placeholder="e.g. 500mg"
                                    className="input-field"
                                    value={formData.strength}
                                    onChange={(e) => setFormData({ ...formData, strength: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Form</label>
                                <select
                                    className="input-field"
                                    value={formData.form}
                                    onChange={(e) => setFormData({ ...formData, form: e.target.value })}
                                >
                                    <option value="">Select Form</option>
                                    <option value="tablet">Tablet</option>
                                    <option value="capsule">Capsule</option>
                                    <option value="syrup">Syrup</option>
                                    <option value="injection">Injection</option>
                                    <option value="cream">Cream</option>
                                    <option value="drops">Drops</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Price (₹) <span className="text-red-500">*</span></label>
                                <input
                                    type="number"
                                    placeholder="0.00"
                                    className="input-field"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Reorder Level</label>
                                <input
                                    type="number"
                                    placeholder="10"
                                    className="input-field"
                                    value={formData.reorderLevel}
                                    onChange={(e) => setFormData({ ...formData, reorderLevel: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Barcode</label>
                                <input
                                    type="text"
                                    placeholder="Scan or type..."
                                    className="input-field"
                                    value={formData.barcode}
                                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                                />
                            </div>
                            <div className="md:col-span-2 lg:col-span-3 flex gap-3 pt-4 border-t border-slate-100 mt-2">
                                <button type="submit" className="btn-primary px-8">
                                    Save Medicine
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowAddForm(false)}
                                    className="btn-secondary"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search medicines by name or generic..."
                                className="input-field pl-10"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="text-sm text-slate-500">
                            Showing <span className="font-bold text-slate-800">{filteredMedicines.length}</span> medicines
                        </div>
                    </div>

                    {loading ? (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                            <p className="text-slate-500">Loading inventory...</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b border-slate-100">
                                    <tr>
                                        <th className="p-4 font-semibold text-slate-600 text-sm">Medicine Details</th>
                                        <th className="p-4 font-semibold text-slate-600 text-sm">Category</th>
                                        <th className="p-4 font-semibold text-slate-600 text-sm">Spec</th>
                                        <th className="p-4 font-semibold text-slate-600 text-sm">Stock Status</th>
                                        <th className="p-4 font-semibold text-slate-600 text-sm">Price</th>
                                        <th className="p-4 font-semibold text-slate-600 text-sm text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredMedicines.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="p-12 text-center text-slate-500">
                                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                                    <Package className="w-8 h-8 text-slate-300" />
                                                </div>
                                                <p>No medicines found matching your search.</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredMedicines.map((medicine) => {
                                            const totalStock = getTotalStock(medicine.batches);
                                            const isLowStock = totalStock <= medicine.reorderLevel;
                                            return (
                                                <tr key={medicine._id} className="hover:bg-slate-50 transition-colors duration-150 group">
                                                    <td className="p-4">
                                                        <p className="font-bold text-slate-800">{medicine.name}</p>
                                                        {medicine.genericName && (
                                                            <p className="text-xs text-slate-500 mt-0.5">{medicine.genericName}</p>
                                                        )}
                                                    </td>
                                                    <td className="p-4">
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                                                            {medicine.category || 'Uncategorized'}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-sm text-slate-600">
                                                        {medicine.strength && <span className="block">{medicine.strength}</span>}
                                                        {medicine.form && <span className="block text-xs text-slate-400 capitalize">{medicine.form}</span>}
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-2">
                                                            <span className={`font-bold text-lg ${isLowStock ? 'text-red-600' : 'text-slate-700'}`}>
                                                                {totalStock}
                                                            </span>
                                                            {isLowStock && (
                                                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-600 border border-red-100">
                                                                    Low
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="p-4 font-medium text-slate-800">₹{medicine.price}</td>
                                                    <td className="p-4 text-right">
                                                        <button
                                                            onClick={() => {
                                                                setSelectedMedicine(medicine);
                                                                setShowBatchModal(true);
                                                            }}
                                                            className="text-blue-600 hover:text-blue-800 text-sm font-medium hover:underline decoration-2 underline-offset-2"
                                                        >
                                                            Add Batch
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {showBatchModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full animate-scale-in">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">Add Batch</h2>
                                <p className="text-sm text-slate-500 mt-1">For {selectedMedicine?.name}</p>
                            </div>
                            <button onClick={() => setShowBatchModal(false)} className="text-slate-400 hover:text-slate-600">
                                <span className="sr-only">Close</span>
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <form onSubmit={handleAddBatch} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Batch Number <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    className="input-field"
                                    value={batchFormData.batchNo}
                                    onChange={(e) => setBatchFormData({ ...batchFormData, batchNo: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Quantity <span className="text-red-500">*</span></label>
                                <input
                                    type="number"
                                    className="input-field"
                                    value={batchFormData.quantity}
                                    onChange={(e) => setBatchFormData({ ...batchFormData, quantity: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Mfg Date</label>
                                    <input
                                        type="date"
                                        className="input-field"
                                        value={batchFormData.mfgDate}
                                        onChange={(e) => setBatchFormData({ ...batchFormData, mfgDate: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Exp Date</label>
                                    <input
                                        type="date"
                                        className="input-field"
                                        value={batchFormData.expDate}
                                        onChange={(e) => setBatchFormData({ ...batchFormData, expDate: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Supplier Cost</label>
                                <input
                                    type="number"
                                    className="input-field"
                                    value={batchFormData.supplierCost}
                                    onChange={(e) => setBatchFormData({ ...batchFormData, supplierCost: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Status</label>
                                <select
                                    className="input-field"
                                    value={batchFormData.status}
                                    onChange={(e) => setBatchFormData({ ...batchFormData, status: e.target.value })}
                                >
                                    <option value="Available">Available</option>
                                    <option value="Not for Sale">Not for Sale</option>
                                    <option value="Expired">Expired</option>
                                    <option value="Sold Out">Sold Out</option>
                                </select>
                            </div>
                            <div className="flex gap-3 pt-4 mt-2">
                                <button
                                    type="submit"
                                    className="flex-1 btn-primary"
                                >
                                    Add Batch
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowBatchModal(false)}
                                    className="flex-1 btn-secondary"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
};

export default MedicineInventory;

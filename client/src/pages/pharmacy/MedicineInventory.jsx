import { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../../api/axiosConfig';
import { Plus, Package, Search, Eye, Pencil, Trash2, PlusCircle, X, Beaker, Factory, Tag, DollarSign, Calendar, Info } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { showSuccess, showError } from '../../utils/sweetalert';

const MedicineInventory = () => {
    const [medicines, setMedicines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalRecords: 0,
        hasNextPage: false,
        hasPrevPage: false
    });
    const [filters, setFilters] = useState({
        manufacturer: '',
        genericName: '',
        category: ''
    });
    const [filterOptions, setFilterOptions] = useState({
        manufacturers: [],
        categories: [],
        genericNames: []
    });
    const [showAddForm, setShowAddForm] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
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

    const fetchFilterOptions = useCallback(async () => {
        try {
            const { data } = await axiosInstance.get('/api/master-medicines/filters');
            if (data.success) {
                setFilterOptions(data.data);
            }
        } catch (error) {
            console.error('Error fetching filters:', error);
        }
    }, []);

    const fetchMedicines = useCallback(async (page = 1) => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const params = {
                page,
                limit: 5, // Exactly 5 per page as per requirement
                search: searchTerm,
                manufacturer: filters.manufacturer,
                genericName: filters.genericName,
                category: filters.category
            };

            const { data } = await axiosInstance.get('/api/master-medicines', {
                params,
                headers: { Authorization: `Bearer ${token}` }
            });

            if (data.success) {
                setMedicines(data.data);
                setPagination(data.pagination);
            }
            setLoading(false);
        } catch (error) {
            console.error('Error fetching medicines:', error);
            setLoading(false);
            showError('Failed to fetch medicine catalog');
        }
    }, [searchTerm, filters]);

    useEffect(() => {
        fetchFilterOptions();
    }, [fetchFilterOptions]);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchMedicines(1);
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, filters, fetchMedicines]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const response = await axiosInstance.post('/api/medicines', formData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                setShowAddForm(false);
                resetForm();
                fetchMedicines();
                showSuccess('Medicine added successfully');
            }
        } catch (error) {
            console.error('Error adding medicine:', error);
            showError(error.response?.data?.message || 'Failed to add medicine');
        }
    };

    const handleEdit = (medicine) => {
        setSelectedMedicine(medicine);
        setFormData({
            name: medicine.name,
            genericName: medicine.genericName || '',
            manufacturer: medicine.manufacturer || '',
            category: medicine.category || '',
            strength: medicine.strength || '',
            form: medicine.form || '',
            price: medicine.price,
            reorderLevel: medicine.reorderLevel || 10,
            barcode: medicine.barcode || '',
        });
        setShowEditModal(true);
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const response = await axiosInstance.put(`/api/medicines/${selectedMedicine._id}`, formData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                setShowEditModal(false);
                resetForm();
                setSelectedMedicine(null);
                fetchMedicines();
                showSuccess('Medicine updated successfully');
            }
        } catch (error) {
            console.error('Error updating medicine:', error);
            showError(error.response?.data?.message || 'Failed to update medicine');
        }
    };

    const handleView = async (medicine) => {
        setSelectedMedicine(medicine);
        setShowViewModal(true);

        try {
            const token = localStorage.getItem('token');
            const { data } = await axiosInstance.get(`/api/master-medicines/${medicine._id}/batches`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (data.success) {
                setSelectedMedicine(prev => ({ ...prev, batches: data.data }));
            }
        } catch (error) {
            console.error('Error fetching batches for view:', error);
        }
    };

    const handleDelete = async (medicineId, medicineName) => {
        if (!window.confirm(`Are you sure you want to delete ${medicineName}?`)) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await axiosInstance.delete(`/api/medicines/${medicineId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                fetchMedicines();
                showSuccess('Medicine deleted successfully');
            }
        } catch (error) {
            console.error('Error deleting medicine:', error);
            showError(error.response?.data?.message || 'Failed to delete medicine');
        }
    };

    const resetForm = () => {
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
    };

    const handleAddBatch = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            // Using the new Master Medicine Batch API
            const payload = {
                masterMedicineId: selectedMedicine._id,
                batchNumber: batchFormData.batchNo,
                quantity: parseInt(batchFormData.quantity),
                manufacturingDate: batchFormData.mfgDate,
                expiryDate: batchFormData.expDate,
                purchasePrice: parseFloat(batchFormData.supplierCost) || 0,
                mrp: selectedMedicine.unitPrice || 0,
                status: batchFormData.status.toLowerCase().replace(' ', '_'),
                // Default values as required by model
                supplierId: "60d0fe4f5311236168a109ca" // Dummy supplier ID if none selected
            };

            await axiosInstance.post('/api/pharmacy/master-inventory/batches', payload, {
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
            fetchMedicines(pagination.currentPage);
            showSuccess('Batch added to inventory successfully');
        } catch (error) {
            console.error('Error adding batch:', error);
            showError(error.response?.data?.message || 'Failed to add batch');
        }
    };

    const getTotalStock = (medicineId) => {
        // In a real production system, this mapping would be handled by the backend
        // For now, we return 0 if not pre-populated
        return 0;
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
                                <label className="text-sm font-medium text-slate-700">Price (PKR) <span className="text-red-500">*</span></label>
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
                    <div className="p-6 border-b border-slate-100 flex flex-col gap-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="relative flex-1 max-w-md">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                                <input
                                    type="text"
                                    placeholder="Search National Master List..."
                                    className="input-field pl-10"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="text-sm text-slate-500 font-medium">
                                Showing <span className="text-blue-600">{medicines.length}</span> of {pagination.totalRecords} Master Medicines
                            </div>
                        </div>

                        {/* Advanced Filters */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="relative">
                                <Factory className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                                <select
                                    className="input-field pl-10 text-sm"
                                    value={filters.manufacturer}
                                    onChange={(e) => setFilters({ ...filters, manufacturer: e.target.value })}
                                >
                                    <option value="">All Manufacturers</option>
                                    {filterOptions.manufacturers.map(m => (
                                        <option key={m} value={m}>{m}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="relative">
                                <Beaker className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                                <select
                                    className="input-field pl-10 text-sm"
                                    value={filters.genericName}
                                    onChange={(e) => setFilters({ ...filters, genericName: e.target.value })}
                                >
                                    <option value="">All Generics</option>
                                    {filterOptions.genericNames.map(g => (
                                        <option key={g} value={g}>{g}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="relative">
                                <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                                <select
                                    className="input-field pl-10 text-sm"
                                    value={filters.category}
                                    onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                                >
                                    <option value="">All Categories</option>
                                    {filterOptions.categories.map(c => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            </div>
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
                                    {medicines.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="p-12 text-center text-slate-500">
                                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                                    <Package className="w-8 h-8 text-slate-300" />
                                                </div>
                                                <p>No master medicines found matching your criteria.</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        medicines.map((medicine) => {
                                            const totalStock = getTotalStock(medicine._id);
                                            const isLowStock = totalStock <= (medicine.reorderLevel || 10);
                                            return (
                                                <tr key={medicine._id} className="hover:bg-slate-50 transition-colors duration-150 group">
                                                    <td className="p-4">
                                                        <div className="flex flex-col">
                                                            <span className="font-semibold text-slate-800">{medicine.name}</span>
                                                            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mt-0.5">
                                                                {medicine.manufacturer}
                                                            </span>
                                                        </div>
                                                        {medicine.genericName && (
                                                            <p className="text-xs text-slate-500 mt-1 italic">{medicine.genericName}</p>
                                                        )}
                                                    </td>
                                                    <td className="p-4">
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                                            {medicine.category || 'Uncategorized'}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-sm text-slate-600">
                                                        {medicine.strength && <span className="font-medium text-slate-700">{medicine.strength}</span>}
                                                        {medicine.dosageForm && <span className="block text-[11px] text-slate-400 font-medium capitalize">{medicine.dosageForm}</span>}
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-2">
                                                            <span className={`font-bold text-lg ${totalStock === 0 ? 'text-slate-300' : isLowStock ? 'text-orange-600' : 'text-green-600'}`}>
                                                                {totalStock}
                                                            </span>
                                                            {totalStock > 0 && isLowStock && (
                                                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-orange-50 text-orange-600 border border-orange-100 uppercase">
                                                                    Low
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="text-sm font-bold text-slate-800">
                                                            Rs. {medicine.unitPrice || '0.00'}
                                                        </div>
                                                        <div className="text-[10px] text-slate-400">Per Unit</div>
                                                    </td>
                                                    <td className="p-4 text-right">
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            <button
                                                                onClick={() => handleView(medicine)}
                                                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                                                title="View Details"
                                                            >
                                                                <Eye size={18} />
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedMedicine(medicine);
                                                                    setShowBatchModal(true);
                                                                }}
                                                                className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all"
                                                                title="Add Batch to Inventory"
                                                            >
                                                                <PlusCircle size={18} />
                                                            </button>
                                                            {/* Edit/Delete disabled for Master List by Pharmacy */}
                                                            <div className="w-[1px] h-4 bg-slate-100 mx-1"></div>
                                                            <button
                                                                className="p-2 text-slate-200 cursor-not-allowed"
                                                                disabled
                                                                title="Master Data - Read Only"
                                                            >
                                                                <Pencil size={18} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination Controls */}
                    {!loading && medicines.length > 0 && (
                        <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="text-sm text-slate-500">
                                Page <span className="font-bold text-slate-700">{pagination.currentPage}</span> of <span className="font-bold text-slate-700">{pagination.totalPages}</span>
                                <span className="mx-2">•</span>
                                <span className="font-medium">{pagination.totalRecords} medicines available</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => fetchMedicines(pagination.currentPage - 1)}
                                    disabled={!pagination.hasPrevPage}
                                    className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => fetchMedicines(pagination.currentPage + 1)}
                                    disabled={!pagination.hasNextPage}
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                                >
                                    Next
                                </button>
                            </div>
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

            {showEditModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-8 rounded-2xl shadow-xl max-w-2xl w-full animate-scale-in max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-slate-800">Edit Medicine</h2>
                            <button onClick={() => { setShowEditModal(false); resetForm(); setSelectedMedicine(null); }} className="text-slate-400 hover:text-slate-600">
                                <span className="sr-only">Close</span>
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Medicine Name <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
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
                                    className="input-field"
                                    value={formData.genericName}
                                    onChange={(e) => setFormData({ ...formData, genericName: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Manufacturer</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    value={formData.manufacturer}
                                    onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Category</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Strength</label>
                                <input
                                    type="text"
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
                                    className="input-field"
                                    value={formData.reorderLevel}
                                    onChange={(e) => setFormData({ ...formData, reorderLevel: e.target.value })}
                                />
                            </div>
                            <div className="md:col-span-2 flex gap-3 pt-4 border-t border-slate-100 mt-2">
                                <button type="submit" className="btn-primary px-8">
                                    Update Medicine
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setShowEditModal(false); resetForm(); setSelectedMedicine(null); }}
                                    className="btn-secondary"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {showViewModal && selectedMedicine && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full animate-scale-in overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Modal Header */}
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6 flex justify-between items-start shrink-0">
                            <div className="text-white">
                                <h2 className="text-2xl font-bold">{selectedMedicine.name}</h2>
                                <p className="text-blue-100 mt-1 flex items-center gap-2">
                                    <span className="bg-white/20 px-2 py-0.5 rounded text-sm">{selectedMedicine.genericName || 'No Generic Name'}</span>
                                    <span>•</span>
                                    <span className="text-sm opacity-90">{selectedMedicine.category}</span>
                                </p>
                            </div>
                            <button
                                onClick={() => setShowViewModal(false)}
                                className="text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-8 overflow-y-auto custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                {/* Left Column: Key Details */}
                                <div className="space-y-6">
                                    <div className="bg-slate-50 p-5 rounded-xl border border-slate-100">
                                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                            <Info size={16} /> Basic Info
                                        </h3>
                                        <div className="space-y-4">
                                            <div>
                                                <p className="text-xs text-slate-500 mb-1">Manufacturer</p>
                                                <p className="font-semibold text-slate-800 flex items-center gap-2">
                                                    <Factory size={16} className="text-slate-400" />
                                                    {selectedMedicine.manufacturer || 'N/A'}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500 mb-1">Strength & Form</p>
                                                <p className="font-semibold text-slate-800 flex items-center gap-2">
                                                    <Beaker size={16} className="text-slate-400" />
                                                    {selectedMedicine.strength} - <span className="capitalize">{selectedMedicine.dosageForm || selectedMedicine.form}</span>
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500 mb-1">Barcode</p>
                                                <p className="font-mono text-sm bg-slate-200 px-2 py-1 rounded inline-block text-slate-700">
                                                    {selectedMedicine.barcode || 'N/A'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-blue-50 p-5 rounded-xl border border-blue-100">
                                        <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                            <DollarSign size={16} /> Pricing
                                        </h3>
                                        <div>
                                            <p className="text-xs text-blue-500 mb-1">Unit Price</p>
                                            <p className="text-3xl font-bold text-blue-700">Rs. {selectedMedicine.unitPrice || selectedMedicine.price}</p>
                                            <p className="text-xs text-blue-400 mt-1">Per unit</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: Batches & Stock */}
                                <div className="md:col-span-2 space-y-6">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                            <Package className="text-blue-600" /> Batch Inventory
                                        </h3>
                                        <div className="flex gap-4 text-sm">
                                            <div className="bg-green-50 text-green-700 px-3 py-1 rounded-full font-medium border border-green-100">
                                                Total Stock: {selectedMedicine.batches?.reduce((acc, b) => acc + b.quantity, 0) || 0}
                                            </div>
                                            <div className="bg-orange-50 text-orange-700 px-3 py-1 rounded-full font-medium border border-orange-100">
                                                Reorder Level: {selectedMedicine.reorderLevel}
                                            </div>
                                        </div>
                                    </div>

                                    {selectedMedicine.batches && selectedMedicine.batches.length > 0 ? (
                                        <div className="border border-slate-200 rounded-xl overflow-hidden">
                                            <table className="w-full text-left text-sm">
                                                <thead className="bg-slate-50 border-b border-slate-200">
                                                    <tr>
                                                        <th className="px-4 py-3 font-semibold text-slate-600">Batch No</th>
                                                        <th className="px-4 py-3 font-semibold text-slate-600">Expiry</th>
                                                        <th className="px-4 py-3 font-semibold text-slate-600">Status</th>
                                                        <th className="px-4 py-3 font-semibold text-slate-600 text-right">Quantity</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {selectedMedicine.batches.map((batch, index) => (
                                                        <tr key={index} className="hover:bg-slate-50 transition-colors">
                                                            <td className="px-4 py-3 font-medium text-slate-800">{batch.batchNo}</td>
                                                            <td className="px-4 py-3 text-slate-600">
                                                                {batch.expDate ? new Date(batch.expDate).toLocaleDateString() : 'N/A'}
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${batch.status === 'Available' ? 'bg-green-100 text-green-700' :
                                                                    batch.status === 'Expired' ? 'bg-red-100 text-red-700' :
                                                                        'bg-slate-100 text-slate-600'
                                                                    }`}>
                                                                    {batch.status}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3 text-right font-bold text-slate-700">{batch.quantity}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                            <Package className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                                            <p className="text-slate-500 font-medium">No batches available</p>
                                            <p className="text-xs text-slate-400 mt-1">Add a batch to increase stock</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
                            <button
                                onClick={() => setShowViewModal(false)}
                                className="btn-secondary"
                            >
                                Close
                            </button>
                            <button
                                onClick={() => {
                                    setShowViewModal(false);
                                    handleEdit(selectedMedicine);
                                }}
                                className="btn-primary flex items-center gap-2"
                            >
                                <Pencil size={16} /> Edit Medicine (Admin)
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
};

export default MedicineInventory;

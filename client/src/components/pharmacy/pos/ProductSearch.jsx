import React, { useState, useEffect, useRef } from 'react';
import axiosInstance from '../../../api/axiosConfig';
import { Search, Package, AlertCircle, Barcode } from 'lucide-react';

const ProductSearch = ({ onAddToCart }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const searchTimeout = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        // Auto-focus search on mount
        if (inputRef.current) {
            inputRef.current.focus();
        }
        // Initial fetch of medicines (top items)
        searchProducts();
    }, []);

    // Debounced search
    useEffect(() => {
        if (searchTimeout.current) {
            clearTimeout(searchTimeout.current);
        }

        if (searchTerm.trim().length > 0) { // Start searching immediately
            setLoading(true);
            searchProducts();
        } else {
            setResults([]);
            setLoading(false);
        }

        return () => {
            if (searchTimeout.current) {
                clearTimeout(searchTimeout.current);
            }
        };
    }, [searchTerm]);

    const searchProducts = async () => {
        try {
            const token = localStorage.getItem('token');
            // Using the new Enterprise Inventory API that returns standalone MedicineBatch docs
            const { data } = await axiosInstance.get(`/api/pharmacy/inventory/batches?search=${searchTerm}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const rawBatches = data.data || [];

            // Transform standalone batches into the format expected by the cart
            const transformed = rawBatches.map(batch => ({
                ...batch,
                batchId: batch._id,
                medicineId: batch.medicineId?._id || batch.medicineId,
                medicineName: batch.medicineId?.name || 'Unknown',
                genericName: batch.medicineId?.genericName,
                strength: batch.medicineId?.strength,
                form: batch.medicineId?.form,
                price: batch.medicineId?.price || batch.mrp, // Use medicine price or fallback to batch MRP
                taxRate: batch.medicineId?.taxRate || 0, // Tax rate from medicine model
                stockQuantity: batch.quantity,
                batchNo: batch.batchNumber // Map legacy batchNo to new batchNumber
            }));

            setResults(transformed);

            // Auto-select if exact barcode match
            if (transformed.length === 1 && (transformed[0].barcode === searchTerm)) {
                onAddToCart(transformed[0]);
                setSearchTerm('');
            }

        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && results.length > 0) {
            // If only one result, add it
            if (results.length === 1) {
                onAddToCart(results[0]);
                setSearchTerm('');
            }
        }
    };

    return (
        <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Scan barcode or search medicine..."
                        className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-lg font-medium"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={handleKeyDown}
                        autoComplete="off"
                    />
                    {searchTerm && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-slate-400 font-mono border border-slate-200 px-1.5 py-0.5 rounded">
                            ENTER
                        </div>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {loading ? (
                    <div className="flex justify-center items-center h-40">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : results.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {results.map((item, index) => (
                            <button
                                key={`${item.batchNo}-${index}`}
                                onClick={() => {
                                    onAddToCart(item);
                                    setSearchTerm('');
                                    inputRef.current?.focus();
                                }}
                                className="text-left p-3 border border-slate-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group flex flex-col h-full"
                            >
                                <div className="flex justify-between items-start w-full mb-1">
                                    <h3 className="font-bold text-slate-800 group-hover:text-blue-700 text-sm line-clamp-1">
                                        {item.medicineName}
                                    </h3>
                                    <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">
                                        Rs. {item.price}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 mb-2 text-xs text-slate-500">
                                    <span className="bg-slate-100 px-1.5 py-0.5 rounded uppercase">{item.form}</span>
                                    <span>{item.strength}</span>
                                </div>
                                <div className="mt-auto flex justify-between items-center w-full text-xs">
                                    <div className="flex items-center gap-1 text-slate-500">
                                        <Package size={12} />
                                        <span>Batch: {item.batchNo}</span>
                                    </div>
                                    <div className={`font-medium ${item.quantity < 10 ? 'text-orange-600' : 'text-green-600'}`}>
                                        Qty: {item.quantity}
                                    </div>
                                </div>
                                {item.expDate && (
                                    <div className="w-full text-right mt-1 text-[10px] text-slate-400">
                                        Exp: {new Date(item.expDate).toLocaleDateString()}
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                ) : searchTerm.length > 1 ? (
                    <div className="text-center py-12 text-slate-400">
                        <AlertCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        <p>No medicines found</p>
                    </div>
                ) : (
                    <div className="text-center py-12 text-slate-400">
                        <Barcode className="w-12 h-12 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">Scan barcode or type to search</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductSearch;

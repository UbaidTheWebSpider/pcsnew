import { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../../api/axiosConfig';
import { AlertTriangle, Clock } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';

const StockAlerts = () => {
    const [lowStock, setLowStock] = useState([]);
    const [expiring, setExpiring] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expiryDays, setExpiryDays] = useState(30);

    const fetchAlerts = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');

            const [lowStockRes, expiringRes] = await Promise.all([
                axiosInstance.get('/api/medicines/alerts/low-stock', {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axiosInstance.get(`/api/medicines/alerts/expiring?days=${expiryDays}`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);

            setLowStock(lowStockRes.data);
            setExpiring(expiringRes.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching alerts:', error);
            setLoading(false);
        }
    }, [expiryDays]);

    useEffect(() => {
        fetchAlerts();
    }, [fetchAlerts]);

    const getTotalStock = (batches) => {
        return batches?.reduce((sum, batch) => sum + batch.quantity, 0) || 0;
    };

    const getDaysUntilExpiry = (expDate) => {
        const today = new Date();
        const exp = new Date(expDate);
        const diffTime = exp - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    return (
        <DashboardLayout>
            <div className="p-8">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-3xl font-bold text-gray-800 mb-8">Stock Alerts</h1>

                    {/* Low Stock Section */}
                    <div className="mb-8">
                        <div className="flex items-center gap-2 mb-4">
                            <AlertTriangle className="text-red-600 w-6 h-6" />
                            <h2 className="text-2xl font-semibold text-gray-800">Low Stock Items ({lowStock.length})</h2>
                        </div>

                        {loading ? (
                            <div className="text-center py-12">
                                <p className="text-gray-500">Loading alerts...</p>
                            </div>
                        ) : lowStock.length === 0 ? (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
                                <p className="text-gray-500">No low stock items</p>
                            </div>
                        ) : (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="p-4 font-semibold text-gray-600">Medicine</th>
                                            <th className="p-4 font-semibold text-gray-600">Category</th>
                                            <th className="p-4 font-semibold text-gray-600">Current Stock</th>
                                            <th className="p-4 font-semibold text-gray-600">Reorder Level</th>
                                            <th className="p-4 font-semibold text-gray-600">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {lowStock.map((medicine) => {
                                            const totalStock = getTotalStock(medicine.batches);
                                            return (
                                                <tr key={medicine._id} className="border-t border-gray-100 hover:bg-gray-50">
                                                    <td className="p-4">
                                                        <p className="font-medium text-gray-800">{medicine.name}</p>
                                                        {medicine.genericName && (
                                                            <p className="text-sm text-gray-500">{medicine.genericName}</p>
                                                        )}
                                                    </td>
                                                    <td className="p-4 text-gray-600">{medicine.category || '-'}</td>
                                                    <td className="p-4 text-red-600 font-semibold">{totalStock}</td>
                                                    <td className="p-4 text-gray-600">{medicine.reorderLevel}</td>
                                                    <td className="p-4">
                                                        <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                                                            Reorder Required
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Expiring Soon Section */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Clock className="text-orange-600 w-6 h-6" />
                                <h2 className="text-2xl font-semibold text-gray-800">Expiring Soon ({expiring.length})</h2>
                            </div>
                            <select
                                className="p-2 border rounded-lg"
                                value={expiryDays}
                                onChange={(e) => setExpiryDays(e.target.value)}
                            >
                                <option value="30">Next 30 days</option>
                                <option value="60">Next 60 days</option>
                                <option value="90">Next 90 days</option>
                            </select>
                        </div>

                        {loading ? (
                            <div className="text-center py-12">
                                <p className="text-gray-500">Loading alerts...</p>
                            </div>
                        ) : expiring.length === 0 ? (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
                                <p className="text-gray-500">No medicines expiring in the next {expiryDays} days</p>
                            </div>
                        ) : (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="p-4 font-semibold text-gray-600">Medicine</th>
                                            <th className="p-4 font-semibold text-gray-600">Batch No</th>
                                            <th className="p-4 font-semibold text-gray-600">Quantity</th>
                                            <th className="p-4 font-semibold text-gray-600">Expiry Date</th>
                                            <th className="p-4 font-semibold text-gray-600">Days Left</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {expiring.map((medicine) =>
                                            medicine.batches
                                                ?.filter(batch => {
                                                    const daysLeft = getDaysUntilExpiry(batch.expDate);
                                                    return daysLeft <= expiryDays && daysLeft >= 0;
                                                })
                                                .map((batch, index) => {
                                                    const daysLeft = getDaysUntilExpiry(batch.expDate);
                                                    const isUrgent = daysLeft <= 30;
                                                    return (
                                                        <tr key={`${medicine._id}-${index}`} className="border-t border-gray-100 hover:bg-gray-50">
                                                            <td className="p-4">
                                                                <p className="font-medium text-gray-800">{medicine.name}</p>
                                                                {medicine.genericName && (
                                                                    <p className="text-sm text-gray-500">{medicine.genericName}</p>
                                                                )}
                                                            </td>
                                                            <td className="p-4 text-gray-600">{batch.batchNo || '-'}</td>
                                                            <td className="p-4 text-gray-600">{batch.quantity}</td>
                                                            <td className="p-4 text-gray-600">
                                                                {new Date(batch.expDate).toLocaleDateString()}
                                                            </td>
                                                            <td className="p-4">
                                                                <span className={`px-3 py-1 rounded-full text-sm ${isUrgent
                                                                    ? 'bg-red-100 text-red-800'
                                                                    : 'bg-orange-100 text-orange-800'
                                                                    }`}>
                                                                    {daysLeft} days
                                                                </span>
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
            </div>
        </DashboardLayout>
    );
};

export default StockAlerts;

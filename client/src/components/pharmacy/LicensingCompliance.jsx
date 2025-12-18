import { useState, useEffect } from 'react';
import { AlertTriangle, Calendar, Info } from 'lucide-react';

const LicensingCompliance = ({ data, updateData, updateCompletion }) => {
    const [expiryWarning, setExpiryWarning] = useState(false);

    // Validate form completion
    useEffect(() => {
        const isComplete =
            data.licenseNumber?.trim() !== '' &&
            data.licenseType !== '' &&
            data.licenseExpiry !== '';

        updateCompletion(isComplete);
    }, [data, updateCompletion]);

    // Check license expiry
    useEffect(() => {
        if (data.licenseExpiry) {
            const expiryDate = new Date(data.licenseExpiry);
            const today = new Date();
            const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
            setExpiryWarning(daysUntilExpiry <= 90 && daysUntilExpiry > 0);
        }
    }, [data.licenseExpiry]);

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Licensing & Compliance</h2>
                <p className="text-gray-500">Hospital-level verification of legal permission</p>
            </div>

            {/* License Number */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Drug Sale License Number <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    value={data.licenseNumber}
                    onChange={(e) => updateData({ licenseNumber: e.target.value })}
                    className="input-field"
                    placeholder="Enter license number"
                    required
                />
            </div>

            {/* License Type */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    License Type <span className="text-red-500">*</span>
                </label>
                <select
                    value={data.licenseType}
                    onChange={(e) => updateData({ licenseType: e.target.value })}
                    className="input-field"
                >
                    <option value="Hospital Pharmacy">Hospital Pharmacy</option>
                    <option value="Retail Pharmacy">Retail Pharmacy</option>
                    <option value="Wholesale Pharmacy">Wholesale Pharmacy</option>
                    <option value="Compounding Pharmacy">Compounding Pharmacy</option>
                </select>
            </div>

            {/* License Expiry Date */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    License Expiry Date <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                    <input
                        type="date"
                        value={data.licenseExpiry}
                        onChange={(e) => updateData({ licenseExpiry: e.target.value })}
                        className="input-field"
                        required
                    />
                    <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
                </div>
                {expiryWarning && (
                    <div className="flex items-start gap-2 mt-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                        <AlertTriangle size={18} className="text-orange-600 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-orange-800">
                            <strong>Warning:</strong> License expires within 90 days. Please renew soon.
                        </div>
                    </div>
                )}
            </div>

            {/* Inspection Status */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Inspection Status <span className="text-red-500">*</span>
                </label>
                <select
                    value={data.inspectionStatus}
                    onChange={(e) => updateData({ inspectionStatus: e.target.value })}
                    className="input-field"
                >
                    <option value="Pending">Pending</option>
                    <option value="Verified">Verified</option>
                </select>
                <div className="flex items-start gap-2 mt-2 text-sm text-gray-500">
                    <Info size={16} className="mt-0.5 flex-shrink-0" />
                    <span>Inspection status will be updated by regulatory authorities</span>
                </div>
            </div>
        </div>
    );
};

export default LicensingCompliance;


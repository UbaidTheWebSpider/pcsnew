import { useState, useEffect } from 'react';
import { Settings, CheckCircle, Info } from 'lucide-react';

const SystemConfiguration = ({ data, updateData, updateCompletion }) => {
    // Validate form completion
    useEffect(() => {
        const isComplete = data.prescriptionIntegration && data.prescriptionIntegration.length > 0;
        updateCompletion(isComplete);
    }, [data, updateCompletion]);

    const togglePrescriptionIntegration = (type) => {
        const current = data.prescriptionIntegration || [];
        const updated = current.includes(type)
            ? current.filter(t => t !== type)
            : [...current, type];
        updateData({ prescriptionIntegration: updated });
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">System Configuration</h2>
                <p className="text-gray-500">Enable digital operations and integrations</p>
            </div>

            {/* Inventory Module Access */}
            <div className="border border-gray-200 rounded-xl p-5">
                <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                        <label className="text-base font-semibold text-gray-800 flex items-center gap-2">
                            <Settings size={18} className="text-blue-600" />
                            Inventory Module Access
                        </label>
                        <p className="text-sm text-gray-500 mt-1">
                            Enable stock management, tracking, and reorder functionality
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => updateData({ inventoryModuleAccess: !data.inventoryModuleAccess })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${data.inventoryModuleAccess ? 'bg-green-600' : 'bg-gray-300'
                            }`}
                    >
                        <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${data.inventoryModuleAccess ? 'translate-x-6' : 'translate-x-1'
                                }`}
                        />
                    </button>
                </div>
                {data.inventoryModuleAccess && (
                    <div className="mt-3 flex items-center gap-2 text-sm text-green-700">
                        <CheckCircle size={16} />
                        <span>Inventory module enabled</span>
                    </div>
                )}
            </div>

            {/* Prescription Integration */}
            <div>
                <label className="block text-base font-semibold text-gray-800 mb-3">
                    Prescription Integration <span className="text-red-500">*</span>
                </label>
                <p className="text-sm text-gray-500 mb-4">
                    Select which departments can send prescriptions to this pharmacy
                </p>
                <div className="space-y-3">
                    {['OPD', 'IPD', 'ER'].map((type) => (
                        <label
                            key={type}
                            className="flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all hover:bg-gray-50"
                            style={{
                                borderColor: data.prescriptionIntegration?.includes(type) ? '#3b82f6' : '#e5e7eb',
                                backgroundColor: data.prescriptionIntegration?.includes(type) ? '#eff6ff' : 'white'
                            }}
                        >
                            <input
                                type="checkbox"
                                checked={data.prescriptionIntegration?.includes(type) || false}
                                onChange={() => togglePrescriptionIntegration(type)}
                                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <div className="flex-1">
                                <div className="font-medium text-gray-900">
                                    {type === 'OPD' && 'Outpatient Department (OPD)'}
                                    {type === 'IPD' && 'Inpatient Department (IPD)'}
                                    {type === 'ER' && 'Emergency Room (ER)'}
                                </div>
                                <div className="text-sm text-gray-500">
                                    {type === 'OPD' && 'Receive prescriptions from outpatient consultations'}
                                    {type === 'IPD' && 'Receive prescriptions from admitted patients'}
                                    {type === 'ER' && 'Receive urgent prescriptions from emergency cases'}
                                </div>
                            </div>
                            {data.prescriptionIntegration?.includes(type) && (
                                <CheckCircle className="text-blue-600" size={20} />
                            )}
                        </label>
                    ))}
                </div>
            </div>

            {/* Billing & POS Integration */}
            <div className="border border-gray-200 rounded-xl p-5">
                <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                        <label className="text-base font-semibold text-gray-800">
                            Billing & POS Integration
                        </label>
                        <p className="text-sm text-gray-500 mt-1">
                            Enable point-of-sale and billing system integration
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => updateData({ billingPOSIntegration: !data.billingPOSIntegration })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${data.billingPOSIntegration ? 'bg-green-600' : 'bg-gray-300'
                            }`}
                    >
                        <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${data.billingPOSIntegration ? 'translate-x-6' : 'translate-x-1'
                                }`}
                        />
                    </button>
                </div>
            </div>

            {/* Insurance Panel Access */}
            <div className="border border-gray-200 rounded-xl p-5">
                <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                        <label className="text-base font-semibold text-gray-800">
                            Insurance Panel Access
                        </label>
                        <p className="text-sm text-gray-500 mt-1">
                            Enable insurance claim processing and panel verification
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => updateData({ insurancePanelAccess: !data.insurancePanelAccess })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${data.insurancePanelAccess ? 'bg-green-600' : 'bg-gray-300'
                            }`}
                        disabled={!data.billingPOSIntegration}
                    >
                        <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${data.insurancePanelAccess ? 'translate-x-6' : 'translate-x-1'
                                }`}
                        />
                    </button>
                </div>
                {!data.billingPOSIntegration && (
                    <div className="flex items-start gap-2 mt-2 text-sm text-gray-500">
                        <Info size={16} className="mt-0.5 flex-shrink-0" />
                        <span>Requires billing integration to be enabled</span>
                    </div>
                )}
            </div>

            {/* Barcode / QR Scanning */}
            <div className="border border-gray-200 rounded-xl p-5">
                <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                        <label className="text-base font-semibold text-gray-800">
                            Barcode / QR Code Scanning
                        </label>
                        <p className="text-sm text-gray-500 mt-1">
                            Enable barcode scanning for medication verification and dispensing
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => updateData({ barcodeScanningEnabled: !data.barcodeScanningEnabled })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${data.barcodeScanningEnabled ? 'bg-green-600' : 'bg-gray-300'
                            }`}
                        disabled={!data.inventoryModuleAccess}
                    >
                        <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${data.barcodeScanningEnabled ? 'translate-x-6' : 'translate-x-1'
                                }`}
                        />
                    </button>
                </div>
                {!data.inventoryModuleAccess && (
                    <div className="flex items-start gap-2 mt-2 text-sm text-gray-500">
                        <Info size={16} className="mt-0.5 flex-shrink-0" />
                        <span>Requires inventory module to be enabled</span>
                    </div>
                )}
            </div>

            {/* System Capability Summary */}
            {data.inventoryModuleAccess && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <h4 className="font-semibold text-blue-900 mb-2">Enabled Capabilities</h4>
                    <div className="flex flex-wrap gap-2">
                        {data.inventoryModuleAccess && (
                            <span className="badge bg-blue-100 text-blue-700">Inventory Management</span>
                        )}
                        {data.billingPOSIntegration && (
                            <span className="badge bg-green-100 text-green-700">Billing & POS</span>
                        )}
                        {data.insurancePanelAccess && (
                            <span className="badge bg-purple-100 text-purple-700">Insurance Claims</span>
                        )}
                        {data.barcodeScanningEnabled && (
                            <span className="badge bg-orange-100 text-orange-700">Barcode Scanning</span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SystemConfiguration;

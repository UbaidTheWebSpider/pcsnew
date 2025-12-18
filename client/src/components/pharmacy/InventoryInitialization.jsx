import { useState, useEffect } from 'react';
import { Package, Info } from 'lucide-react';

const InventoryInitialization = ({ data, updateData, updateCompletion }) => {
    const drugCategories = [
        'Antibiotics',
        'Analgesics',
        'Cardiovascular',
        'Diabetes Management',
        'Respiratory',
        'Gastrointestinal',
        'Dermatological',
        'Vitamins & Supplements',
        'Emergency Medications',
        'Controlled Substances'
    ];

    // This tab is optional, so always mark as complete
    useEffect(() => {
        updateCompletion(true);
    }, [updateCompletion]);

    const toggleCategory = (category) => {
        const current = data.defaultDrugCategories || [];
        const updated = current.includes(category)
            ? current.filter(c => c !== category)
            : [...current, category];
        updateData({ defaultDrugCategories: updated });
    };

    return (
        <div className="space-y-6">
            <div>
                <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold text-gray-800">Inventory Initialization</h2>
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
                        Optional
                    </span>
                </div>
                <p className="text-gray-500">Preconfigure inventory behavior and settings</p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start gap-2">
                    <Info size={18} className="text-blue-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-blue-800">
                        This tab is optional. You can skip it and configure inventory settings later from the pharmacy dashboard.
                    </p>
                </div>
            </div>

            {/* Default Drug Categories */}
            <div>
                <label className="block text-base font-semibold text-gray-800 mb-3">
                    Default Drug Categories
                </label>
                <p className="text-sm text-gray-500 mb-4">
                    Select categories to pre-populate in inventory system
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {drugCategories.map((category) => (
                        <label
                            key={category}
                            className="flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all hover:bg-gray-50"
                            style={{
                                borderColor: data.defaultDrugCategories?.includes(category) ? '#3b82f6' : '#e5e7eb',
                                backgroundColor: data.defaultDrugCategories?.includes(category) ? '#eff6ff' : 'white'
                            }}
                        >
                            <input
                                type="checkbox"
                                checked={data.defaultDrugCategories?.includes(category) || false}
                                onChange={() => toggleCategory(category)}
                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <span className="font-medium text-gray-900">{category}</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Reorder Threshold Rule */}
            <div>
                <label className="block text-base font-semibold text-gray-800 mb-2">
                    Reorder Threshold Rule
                </label>
                <p className="text-sm text-gray-500 mb-3">
                    Minimum stock level before reorder alert is triggered
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs text-gray-600 mb-1">Threshold Value</label>
                        <input
                            type="number"
                            value={data.reorderThreshold || 10}
                            onChange={(e) => updateData({ reorderThreshold: parseInt(e.target.value) || 10 })}
                            className="input-field"
                            min="1"
                            max="100"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-600 mb-1">Quick Presets</label>
                        <div className="flex gap-2">
                            {[5, 10, 20, 50].map((preset) => (
                                <button
                                    key={preset}
                                    type="button"
                                    onClick={() => updateData({ reorderThreshold: preset })}
                                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${data.reorderThreshold === preset
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    {preset}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Controlled Drug Tracking */}
            <div className="border border-gray-200 rounded-xl p-5">
                <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                        <label className="text-base font-semibold text-gray-800">
                            Controlled Drug Tracking
                        </label>
                        <p className="text-sm text-gray-500 mt-1">
                            Enable enhanced tracking for Schedule II-V controlled substances
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => updateData({ controlledDrugTracking: !data.controlledDrugTracking })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${data.controlledDrugTracking ? 'bg-orange-600' : 'bg-gray-300'
                            }`}
                    >
                        <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${data.controlledDrugTracking ? 'translate-x-6' : 'translate-x-1'
                                }`}
                        />
                    </button>
                </div>
                {data.controlledDrugTracking && (
                    <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                        <p className="text-xs text-orange-800">
                            <strong>Note:</strong> Requires additional compliance documentation and dual-pharmacist verification for dispensing
                        </p>
                    </div>
                )}
            </div>

            {/* Expiry Alert Rules */}
            <div>
                <label className="block text-base font-semibold text-gray-800 mb-2">
                    Expiry Alert Rules
                </label>
                <p className="text-sm text-gray-500 mb-3">
                    Days before expiry to trigger alert notifications
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs text-gray-600 mb-1">Alert Days</label>
                        <input
                            type="number"
                            value={data.expiryAlertDays || 30}
                            onChange={(e) => updateData({ expiryAlertDays: parseInt(e.target.value) || 30 })}
                            className="input-field"
                            min="7"
                            max="365"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-600 mb-1">Quick Presets</label>
                        <div className="flex gap-2">
                            {[30, 60, 90].map((preset) => (
                                <button
                                    key={preset}
                                    type="button"
                                    onClick={() => updateData({ expiryAlertDays: preset })}
                                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${data.expiryAlertDays === preset
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    {preset}d
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InventoryInitialization;

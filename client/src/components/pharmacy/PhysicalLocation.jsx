import { useState, useEffect } from 'react';
import { MapPin, Plus, X, Info } from 'lucide-react';

const PhysicalLocation = ({ data, updateData, updateCompletion }) => {
    const [newCounter, setNewCounter] = useState('');
    const floors = ['Ground Floor', 'First Floor', 'Second Floor', 'Third Floor', 'Basement'];
    const [wings, setWings] = useState({
        'Ground Floor': ['Main Wing', 'East Wing', 'West Wing'],
        'First Floor': ['North Wing', 'South Wing', 'Central Wing'],
        'Second Floor': ['Pediatric Wing', 'Surgical Wing'],
        'Third Floor': ['ICU Wing', 'Emergency Wing'],
        'Basement': ['Storage Wing', 'Utility Wing']
    });

    // Validate form completion
    useEffect(() => {
        const isComplete =
            data.floor !== '' &&
            data.wing !== '';

        updateCompletion(isComplete);
    }, [data, updateCompletion]);

    const addCounter = () => {
        if (newCounter.trim()) {
            updateData({
                counterNumbers: [...(data.counterNumbers || []), newCounter.trim()]
            });
            setNewCounter('');
        }
    };

    const removeCounter = (index) => {
        const updated = data.counterNumbers.filter((_, i) => i !== index);
        updateData({ counterNumbers: updated });
    };

    const handleFloorChange = (floor) => {
        updateData({ floor, wing: '' }); // Reset wing when floor changes
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Physical Location</h2>
                <p className="text-gray-500">Define in-hospital operational placement</p>
            </div>

            {/* Floor */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Floor <span className="text-red-500">*</span>
                </label>
                <select
                    value={data.floor}
                    onChange={(e) => handleFloorChange(e.target.value)}
                    className="input-field"
                    required
                >
                    <option value="">Select floor</option>
                    {floors.map((floor) => (
                        <option key={floor} value={floor}>{floor}</option>
                    ))}
                </select>
            </div>

            {/* Wing / Department */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Wing / Department <span className="text-red-500">*</span>
                </label>
                <select
                    value={data.wing}
                    onChange={(e) => updateData({ wing: e.target.value })}
                    className="input-field"
                    required
                    disabled={!data.floor}
                >
                    <option value="">Select wing</option>
                    {data.floor && wings[data.floor]?.map((wing) => (
                        <option key={wing} value={wing}>{wing}</option>
                    ))}
                </select>
            </div>

            {/* Counter Numbers */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Counter Number(s)
                </label>
                <div className="flex gap-2 mb-3">
                    <input
                        type="text"
                        value={newCounter}
                        onChange={(e) => setNewCounter(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCounter())}
                        className="input-field flex-1"
                        placeholder="Enter counter number"
                    />
                    <button
                        type="button"
                        onClick={addCounter}
                        className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                        <Plus size={18} />
                        Add
                    </button>
                </div>
                {data.counterNumbers && data.counterNumbers.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {data.counterNumbers.map((counter, index) => (
                            <div
                                key={index}
                                className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg"
                            >
                                <span className="font-medium">Counter {counter}</span>
                                <button
                                    type="button"
                                    onClick={() => removeCounter(index)}
                                    className="text-blue-600 hover:text-blue-800"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Storage Room ID */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Storage Room ID
                </label>
                <input
                    type="text"
                    value={data.storageRoomId || ''}
                    onChange={(e) => updateData({ storageRoomId: e.target.value })}
                    className="input-field"
                    placeholder="e.g., SR-101"
                />
            </div>

            {/* Controlled Drugs Cabinet */}
            <div className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                        <label className="text-sm font-medium text-gray-700">
                            Controlled Drugs Cabinet
                        </label>
                        <p className="text-xs text-gray-500 mt-1">
                            Secure storage for Schedule II-V controlled substances
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => updateData({ controlledDrugsCabinet: !data.controlledDrugsCabinet })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${data.controlledDrugsCabinet ? 'bg-green-600' : 'bg-gray-300'
                            }`}
                    >
                        <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${data.controlledDrugsCabinet ? 'translate-x-6' : 'translate-x-1'
                                }`}
                        />
                    </button>
                </div>
                {data.controlledDrugsCabinet && (
                    <div className="flex items-start gap-2 mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                        <Info size={16} className="text-orange-600 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-orange-800">
                            Additional compliance requirements apply for controlled substances storage and tracking
                        </p>
                    </div>
                )}
            </div>

            {/* Cold Storage Available */}
            <div className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <label className="text-sm font-medium text-gray-700">
                            Cold Storage Available
                        </label>
                        <p className="text-xs text-gray-500 mt-1">
                            Refrigeration for temperature-sensitive medications (2-8°C)
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => updateData({ coldStorageAvailable: !data.coldStorageAvailable })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${data.coldStorageAvailable ? 'bg-blue-600' : 'bg-gray-300'
                            }`}
                    >
                        <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${data.coldStorageAvailable ? 'translate-x-6' : 'translate-x-1'
                                }`}
                        />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PhysicalLocation;

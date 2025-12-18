import { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosConfig';
import { Info, CheckCircle, XCircle } from 'lucide-react';

const BasicPharmacyProfile = ({ data, updateData, updateCompletion }) => {
    const [nameChecking, setNameChecking] = useState(false);
    const [nameUnique, setNameUnique] = useState(true);
    const [branches, setBranches] = useState(['Main Hospital', 'North Wing', 'South Wing', 'Emergency Block']);

    // Validate form completion
    useEffect(() => {
        const isComplete =
            data.pharmacyName?.trim() !== '' &&
            data.pharmacyType !== '' &&
            data.hospitalBranch !== '' &&
            data.pharmacyCode !== '' &&
            nameUnique;

        updateCompletion(isComplete);
    }, [data, nameUnique, updateCompletion]);

    // Generate pharmacy code when name is entered
    useEffect(() => {
        if (data.pharmacyName && !data.pharmacyCode) {
            generatePharmacyCode();
        }
    }, [data.pharmacyName]);

    // Check pharmacy name uniqueness
    const checkNameUniqueness = async (name) => {
        if (!name.trim()) return;

        setNameChecking(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axiosInstance.get(`/api/pharmacies/check-name?name=${encodeURIComponent(name)}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNameUnique(response.data.isUnique);
        } catch (error) {
            console.error('Error checking name:', error);
        } finally {
            setNameChecking(false);
        }
    };

    // Generate unique pharmacy code
    const generatePharmacyCode = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axiosInstance.get('/api/pharmacies/generate-code', {
                headers: { Authorization: `Bearer ${token}` }
            });
            updateData({ pharmacyCode: response.data.code });
        } catch (error) {
            console.error('Error generating code:', error);
            // Fallback: Generate code locally if API fails
            const prefix = 'PH';
            const timestamp = Date.now().toString().slice(-6);
            const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
            const fallbackCode = `${prefix}${timestamp}${random}`;
            updateData({ pharmacyCode: fallbackCode });
        }
    };

    const handleNameChange = (e) => {
        const name = e.target.value;
        updateData({ pharmacyName: name });
    };

    // Debounced name uniqueness check
    useEffect(() => {
        if (!data.pharmacyName) {
            setNameUnique(true);
            return;
        }

        const timeoutId = setTimeout(() => {
            checkNameUniqueness(data.pharmacyName);
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [data.pharmacyName]);

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Basic Pharmacy Profile</h2>
                <p className="text-gray-500">Identify the pharmacy within the hospital system</p>
            </div>

            {/* Pharmacy Name */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pharmacy Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                    <input
                        type="text"
                        value={data.pharmacyName}
                        onChange={handleNameChange}
                        className="input-field"
                        placeholder="Enter pharmacy name"
                        required
                    />
                    {nameChecking && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                        </div>
                    )}
                    {!nameChecking && data.pharmacyName && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            {nameUnique ? (
                                <CheckCircle size={20} className="text-green-500" />
                            ) : (
                                <XCircle size={20} className="text-red-500" />
                            )}
                        </div>
                    )}
                </div>
                {!nameUnique && (
                    <p className="text-red-500 text-sm mt-1">This pharmacy name already exists</p>
                )}
                <div className="flex items-start gap-2 mt-2 text-sm text-gray-500">
                    <Info size={16} className="mt-0.5 flex-shrink-0" />
                    <span>Used internally for hospital operations and identification</span>
                </div>
            </div>

            {/* Pharmacy Type */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                    Pharmacy Type <span className="text-red-500">*</span>
                </label>
                <div className="space-y-3">
                    {['OPD Pharmacy', 'Inpatient Pharmacy', 'Emergency Pharmacy'].map((type) => (
                        <label
                            key={type}
                            className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors"
                        >
                            <input
                                type="radio"
                                name="pharmacyType"
                                value={type}
                                checked={data.pharmacyType === type}
                                onChange={(e) => updateData({ pharmacyType: e.target.value })}
                                className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                            />
                            <div>
                                <div className="font-medium text-gray-900">{type}</div>
                                <div className="text-sm text-gray-500">
                                    {type === 'OPD Pharmacy' && 'Serves outpatient department patients'}
                                    {type === 'Inpatient Pharmacy' && 'Serves admitted patients and wards'}
                                    {type === 'Emergency Pharmacy' && 'Serves emergency department 24/7'}
                                </div>
                            </div>
                        </label>
                    ))}
                </div>
            </div>

            {/* Hospital Branch */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hospital Branch / Unit <span className="text-red-500">*</span>
                </label>
                <select
                    value={data.hospitalBranch}
                    onChange={(e) => updateData({ hospitalBranch: e.target.value })}
                    className="input-field"
                    required
                >
                    <option value="">Select branch</option>
                    {branches.map((branch) => (
                        <option key={branch} value={branch}>{branch}</option>
                    ))}
                </select>
            </div>

            {/* Pharmacy Code (Auto-generated, Read-only) */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Internal Pharmacy Code / ID
                </label>
                <input
                    type="text"
                    value={data.pharmacyCode}
                    readOnly
                    className="input-field bg-gray-50 cursor-not-allowed"
                    placeholder="Auto-generated"
                />
                <div className="flex items-start gap-2 mt-2 text-sm text-gray-500">
                    <Info size={16} className="mt-0.5 flex-shrink-0" />
                    <span>Automatically generated unique identifier for this pharmacy</span>
                </div>
            </div>

            {/* Operational Status */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                    Operational Status
                </label>
                <div className="flex items-center gap-4">
                    <button
                        type="button"
                        onClick={() => updateData({ operationalStatus: 'Active' })}
                        className={`px-6 py-3 rounded-xl font-medium transition-all ${data.operationalStatus === 'Active'
                            ? 'bg-green-100 text-green-700 border-2 border-green-500'
                            : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:border-gray-300'
                            }`}
                    >
                        Active
                    </button>
                    <button
                        type="button"
                        onClick={() => updateData({ operationalStatus: 'Inactive' })}
                        className={`px-6 py-3 rounded-xl font-medium transition-all ${data.operationalStatus === 'Inactive'
                            ? 'bg-red-100 text-red-700 border-2 border-red-500'
                            : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:border-gray-300'
                            }`}
                    >
                        Inactive
                    </button>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                    Status will be set to Active upon final approval
                </p>
            </div>
        </div>
    );
};

export default BasicPharmacyProfile;

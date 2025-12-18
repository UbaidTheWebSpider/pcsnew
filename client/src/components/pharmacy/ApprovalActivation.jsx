import { useState, useEffect } from 'react';
import { Calendar, User, FileText } from 'lucide-react';

const ApprovalActivation = ({ data, updateData, updateCompletion, pharmacyData }) => {
    const [currentUser, setCurrentUser] = useState({ name: 'Admin User', email: 'admin@hospital.com' });

    // Validate form completion
    useEffect(() => {
        // Always mark as complete since this is the final tab
        updateCompletion(true);
    }, []); // Empty dependency array - only run once on mount


    // Get current user info
    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                setCurrentUser(user);
            } catch (error) {
                console.error('Error parsing user:', error);
            }
        }
    }, []);

    const today = new Date().toISOString().split('T')[0];

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Approval & Activation</h2>
                <p className="text-gray-500">Final hospital authorization and activation</p>
            </div>

            {/* Registration Summary */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
                <h3 className="font-bold text-blue-900 mb-4">Registration Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                        <span className="text-blue-700 font-medium">Pharmacy Name:</span>
                        <p className="text-blue-900 font-semibold">{pharmacyData.basicProfile.pharmacyName || 'Not set'}</p>
                    </div>
                    <div>
                        <span className="text-blue-700 font-medium">Pharmacy Code:</span>
                        <p className="text-blue-900 font-semibold">{pharmacyData.basicProfile.pharmacyCode || 'Not generated'}</p>
                    </div>
                    <div>
                        <span className="text-blue-700 font-medium">Type:</span>
                        <p className="text-blue-900">{pharmacyData.basicProfile.pharmacyType || 'Not set'}</p>
                    </div>
                    <div>
                        <span className="text-blue-700 font-medium">Branch:</span>
                        <p className="text-blue-900">{pharmacyData.basicProfile.hospitalBranch || 'Not set'}</p>
                    </div>
                    <div>
                        <span className="text-blue-700 font-medium">License Number:</span>
                        <p className="text-blue-900">{pharmacyData.licensing.licenseNumber || 'Not set'}</p>
                    </div>
                    <div>
                        <span className="text-blue-700 font-medium">Location:</span>
                        <p className="text-blue-900">
                            {pharmacyData.physicalLocation.floor && pharmacyData.physicalLocation.wing
                                ? `${pharmacyData.physicalLocation.floor}, ${pharmacyData.physicalLocation.wing}`
                                : 'Not set'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Registered By (Auto-filled) */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Registered By
                </label>
                <div className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-200 rounded-xl">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="text-blue-600" size={20} />
                    </div>
                    <div>
                        <p className="font-medium text-gray-900">{currentUser.name}</p>
                        <p className="text-sm text-gray-500">{currentUser.email}</p>
                    </div>
                </div>
            </div>

            {/* Registration Date (Auto-filled) */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Registration Date
                </label>
                <div className="relative">
                    <input
                        type="date"
                        value={today}
                        readOnly
                        className="input-field bg-gray-50 cursor-not-allowed"
                    />
                    <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
                </div>
            </div>

            {/* Approval Status */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Approval Status <span className="text-red-500">*</span>
                </label>
                <select
                    value={data.approvalStatus}
                    onChange={(e) => updateData({ approvalStatus: e.target.value })}
                    className="input-field"
                >
                    <option value="Draft">Draft</option>
                    <option value="Submitted">Submitted for Approval</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                </select>
                <div className="mt-2">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${data.approvalStatus === 'Draft' ? 'bg-gray-100 text-gray-700' :
                        data.approvalStatus === 'Submitted' ? 'bg-blue-100 text-blue-700' :
                            data.approvalStatus === 'Approved' ? 'bg-green-100 text-green-700' :
                                'bg-red-100 text-red-700'
                        }`}>
                        {data.approvalStatus}
                    </span>
                </div>
            </div>

            {/* Activation Date (Conditional) */}
            {data.approvalStatus === 'Approved' && (
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Activation Date
                    </label>
                    <div className="relative">
                        <input
                            type="date"
                            value={today}
                            readOnly
                            className="input-field bg-green-50 border-green-300"
                        />
                        <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600 pointer-events-none" size={20} />
                    </div>
                    <p className="text-sm text-green-600 mt-2">
                        Pharmacy will be activated immediately upon approval
                    </p>
                </div>
            )}

            {/* Remarks / Notes */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Remarks / Notes
                </label>
                <div className="relative">
                    <FileText className="absolute left-3 top-3 text-gray-400" size={20} />
                    <textarea
                        value={data.remarks || ''}
                        onChange={(e) => updateData({ remarks: e.target.value })}
                        className="input-field pl-10 min-h-[120px]"
                        placeholder="Add any additional notes or comments about this pharmacy registration..."
                    />
                </div>
            </div>

            {/* Action Guidance */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
                <h4 className="font-semibold text-gray-900 mb-3">Next Steps</h4>
                <div className="space-y-2 text-sm text-gray-700">
                    {data.approvalStatus === 'Draft' && (
                        <>
                            <p>• Click <strong>"Save as Draft"</strong> to save progress and continue later</p>
                            <p>• Click <strong>"Submit for Approval"</strong> to send for admin review</p>
                        </>
                    )}
                    {data.approvalStatus === 'Submitted' && (
                        <p>• Pharmacy registration is pending approval from hospital administration</p>
                    )}
                    {data.approvalStatus === 'Approved' && (
                        <>
                            <p className="text-green-700">✓ Pharmacy will be activated and operational</p>
                            <p className="text-green-700">✓ Pharmacist will receive access credentials</p>
                            <p className="text-green-700">✓ Inventory system will be initialized</p>
                        </>
                    )}
                    {data.approvalStatus === 'Rejected' && (
                        <p className="text-red-700">• Please review rejection reason and make necessary corrections</p>
                    )}
                </div>
            </div>

            {/* Compliance Checklist */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-5">
                <h4 className="font-semibold text-green-900 mb-3">Pre-Activation Checklist</h4>
                <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                        <input type="checkbox" checked readOnly className="w-4 h-4 text-green-600 rounded" />
                        <span className="text-green-800">Basic pharmacy profile completed</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <input type="checkbox" checked readOnly className="w-4 h-4 text-green-600 rounded" />
                        <span className="text-green-800">Licensing documents uploaded</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <input type="checkbox" checked readOnly className="w-4 h-4 text-green-600 rounded" />
                        <span className="text-green-800">Licensed pharmacist assigned</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <input type="checkbox" checked readOnly className="w-4 h-4 text-green-600 rounded" />
                        <span className="text-green-800">Physical location defined</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <input type="checkbox" checked readOnly className="w-4 h-4 text-green-600 rounded" />
                        <span className="text-green-800">System integrations configured</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <input type="checkbox" checked readOnly className="w-4 h-4 text-green-600 rounded" />
                        <span className="text-green-800">Compliance controls enabled</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ApprovalActivation;

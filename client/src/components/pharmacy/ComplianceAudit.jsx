import { useEffect } from 'react';
import { Shield, CheckCircle, Info } from 'lucide-react';

const ComplianceAudit = ({ data, updateData, updateCompletion }) => {
    // Validate form completion - all defaults are set, so always complete
    useEffect(() => {
        updateCompletion(true);
    }, [updateCompletion]);

    const allComplianceEnabled =
        data.auditLoggingEnabled &&
        data.pharmacistApprovalRequired &&
        data.prescriptionMandatory &&
        data.expiredDrugLock;

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Compliance & Audit Controls</h2>
                <p className="text-gray-500">Ensure traceability, governance, and regulatory compliance</p>
            </div>

            {/* Compliance Badge */}
            {allComplianceEnabled && (
                <div className="bg-green-50 border-2 border-green-500 rounded-xl p-4 flex items-center gap-3">
                    <Shield className="text-green-600" size={24} />
                    <div>
                        <h4 className="font-bold text-green-900">Full Compliance Enabled</h4>
                        <p className="text-sm text-green-700">All recommended compliance controls are active</p>
                    </div>
                </div>
            )}

            {/* Audit Logging */}
            <div className="border-2 border-blue-200 bg-blue-50 rounded-xl p-5">
                <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                        <label className="text-base font-bold text-gray-900 flex items-center gap-2">
                            <Shield size={18} className="text-blue-600" />
                            Audit Logging Enabled
                            <span className="text-red-500">*</span>
                        </label>
                        <p className="text-sm text-gray-700 mt-1">
                            Track all pharmacy operations, dispensing, and inventory changes
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => updateData({ auditLoggingEnabled: !data.auditLoggingEnabled })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${data.auditLoggingEnabled ? 'bg-green-600' : 'bg-gray-400'
                            }`}
                    >
                        <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${data.auditLoggingEnabled ? 'translate-x-6' : 'translate-x-1'
                                }`}
                        />
                    </button>
                </div>
                <div className="flex items-start gap-2 mt-3 p-3 bg-white border border-blue-200 rounded-lg">
                    <Info size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-blue-900">
                        <strong>Mandatory:</strong> Required by hospital policy and regulatory standards. Cannot be disabled after activation.
                    </p>
                </div>
            </div>

            {/* Pharmacist Approval Required */}
            <div className="border border-gray-200 rounded-xl p-5">
                <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                        <label className="text-base font-semibold text-gray-800">
                            Pharmacist Approval Required for Dispensing
                        </label>
                        <p className="text-sm text-gray-500 mt-1">
                            All medication dispensing requires pharmacist verification and approval
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => updateData({ pharmacistApprovalRequired: !data.pharmacistApprovalRequired })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${data.pharmacistApprovalRequired ? 'bg-green-600' : 'bg-gray-300'
                            }`}
                    >
                        <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${data.pharmacistApprovalRequired ? 'translate-x-6' : 'translate-x-1'
                                }`}
                        />
                    </button>
                </div>
                {data.pharmacistApprovalRequired && (
                    <div className="mt-3 flex items-center gap-2 text-sm text-green-700">
                        <CheckCircle size={16} />
                        <span>Enhanced patient safety enabled</span>
                    </div>
                )}
                <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <p className="text-xs text-gray-600">
                        <strong>Impact:</strong> Prevents unauthorized dispensing and ensures professional oversight
                    </p>
                </div>
            </div>

            {/* Prescription Mandatory */}
            <div className="border border-gray-200 rounded-xl p-5">
                <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                        <label className="text-base font-semibold text-gray-800">
                            Prescription Mandatory
                        </label>
                        <p className="text-sm text-gray-500 mt-1">
                            Valid prescription required for all medication dispensing
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => updateData({ prescriptionMandatory: !data.prescriptionMandatory })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${data.prescriptionMandatory ? 'bg-green-600' : 'bg-gray-300'
                            }`}
                    >
                        <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${data.prescriptionMandatory ? 'translate-x-6' : 'translate-x-1'
                                }`}
                        />
                    </button>
                </div>
                {data.prescriptionMandatory && (
                    <div className="mt-3 flex items-center gap-2 text-sm text-green-700">
                        <CheckCircle size={16} />
                        <span>Regulatory compliance enabled</span>
                    </div>
                )}
                <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <p className="text-xs text-gray-600">
                        <strong>Impact:</strong> Ensures legal compliance and prevents unauthorized medication access
                    </p>
                </div>
            </div>

            {/* Expired Drug Lock */}
            <div className="border border-gray-200 rounded-xl p-5">
                <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                        <label className="text-base font-semibold text-gray-800">
                            Expired Drug Lock
                        </label>
                        <p className="text-sm text-gray-500 mt-1">
                            Automatically prevent dispensing of expired medications
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => updateData({ expiredDrugLock: !data.expiredDrugLock })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${data.expiredDrugLock ? 'bg-green-600' : 'bg-gray-300'
                            }`}
                    >
                        <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${data.expiredDrugLock ? 'translate-x-6' : 'translate-x-1'
                                }`}
                        />
                    </button>
                </div>
                {data.expiredDrugLock && (
                    <div className="mt-3 flex items-center gap-2 text-sm text-green-700">
                        <CheckCircle size={16} />
                        <span>Patient safety protection active</span>
                    </div>
                )}
                <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <p className="text-xs text-gray-600">
                        <strong>Impact:</strong> System will block selection and dispensing of any medication past expiry date
                    </p>
                </div>
            </div>

            {/* Compliance Summary */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
                <h4 className="font-semibold text-gray-900 mb-3">Active Compliance Controls</h4>
                <div className="space-y-2">
                    {data.auditLoggingEnabled && (
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                            <CheckCircle size={16} className="text-green-600" />
                            <span>Complete audit trail for all operations</span>
                        </div>
                    )}
                    {data.pharmacistApprovalRequired && (
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                            <CheckCircle size={16} className="text-green-600" />
                            <span>Mandatory pharmacist verification</span>
                        </div>
                    )}
                    {data.prescriptionMandatory && (
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                            <CheckCircle size={16} className="text-green-600" />
                            <span>Prescription-based dispensing only</span>
                        </div>
                    )}
                    {data.expiredDrugLock && (
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                            <CheckCircle size={16} className="text-green-600" />
                            <span>Automatic expired medication blocking</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ComplianceAudit;

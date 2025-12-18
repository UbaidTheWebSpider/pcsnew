import React, { useState } from 'react';
import axiosInstance from '../api/axiosConfig';
import { Shield, Check, X, Clock, AlertTriangle } from 'lucide-react';
import { showSuccess, showError } from '../utils/sweetalert';

const ConsentManager = ({ patientId, currentConsent, onUpdate }) => {
    const [loading, setLoading] = useState(false);

    const handleConsent = async (scope, action) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axiosInstance.post(`/api/users/patients/${patientId}/consent`,
                { action, scope, details: `User triggered ${action} for ${scope}` },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            showSuccess(`Consent ${action === 'GRANT' ? 'granted' : 'revoked'} successfully`);
            if (onUpdate) onUpdate();
        } catch (error) {
            console.error('Consent Error:', error);
            showError('Failed to update consent settings');
        } finally {
            setLoading(false);
        }
    };

    const ConsentToggle = ({ title, scope, description, isGranted }) => (
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 mb-3">
            <div className="flex-1">
                <h4 className="font-medium text-gray-900 flex items-center gap-2">
                    {title}
                    {isGranted ?
                        <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full flex items-center gap-1"><Check size={10} /> Active</span> :
                        <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full flex items-center gap-1"><X size={10} /> Revoked</span>
                    }
                </h4>
                <p className="text-sm text-gray-500 mt-1">{description}</p>
            </div>
            <button
                onClick={() => handleConsent(scope, isGranted ? 'REVOKE' : 'GRANT')}
                disabled={loading}
                className={`ml-4 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isGranted
                        ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
            >
                {loading ? 'Processing...' : (isGranted ? 'Revoke' : 'Grant')}
            </button>
        </div>
    );

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <Shield size={24} />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-gray-800">Consent & Privacy Ledger</h3>
                    <p className="text-sm text-gray-500">Manage data sharing and authorization permissions</p>
                </div>
            </div>

            <div className="space-y-4">
                <ConsentToggle
                    title="Data Sharing"
                    scope="DATA_SHARING"
                    description="Allow sharing of health records with other departments (Lab, Pharmacy)"
                    isGranted={true} // In real app, check against fetched consent logs
                />
                <ConsentToggle
                    title="Telemedicine Access"
                    scope="TELEMEDICINE"
                    description="Authorize remote consultations and video sessions"
                    isGranted={false} // Placeholder
                />
                <ConsentToggle
                    title="Research Participation"
                    scope="RESEARCH"
                    description="Allow anonymized data to be used for medical research"
                    isGranted={false}
                />
            </div>

            <div className="mt-6 pt-4 border-t flex items-center justify-between text-xs text-gray-400">
                <div className="flex items-center gap-1">
                    <Clock size={12} />
                    <span>Last Updated: Today</span>
                </div>
                <div className="flex items-center gap-1">
                    <AlertTriangle size={12} />
                    <span>Immutable Ledger Active</span>
                </div>
            </div>
        </div>
    );
};

export default ConsentManager;

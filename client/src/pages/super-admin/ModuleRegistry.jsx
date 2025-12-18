import React, { useState } from 'react';
import { useConfig } from '../../context/ConfigContext';
import axios from 'axios';

const ModuleRegistry = () => {
    const { modules, refreshConfig } = useConfig(); // Note: ConfigContext fetches modules on load
    const [loading, setLoading] = useState(false);

    const handleToggle = async (moduleKey, currentStatus) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:5000/api/super-admin/modules/toggle', {
                moduleKey,
                enabled: !currentStatus
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            await refreshConfig();
        } catch (error) {
            console.error('Failed to toggle module', error);
            alert('Error updating module');
        }
        setLoading(false);
    };

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-6">Module Registry</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(modules || []).map((mod) => (
                    <div key={mod._id} className={`border rounded-lg p-4 flex flex-col justify-between ${mod.enabled ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="font-semibold text-lg">{mod.name || mod.moduleKey}</h3>
                                <span className={`px-2 py-1 text-xs rounded-full ${mod.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                    {mod.enabled ? 'Active' : 'Disabled'}
                                </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-4">{mod.description || 'No description provided'}</p>
                            <div className="text-xs text-gray-500 mb-4">
                                Visible to: {(mod.visibleToRoles || []).join(', ')}
                            </div>
                        </div>
                        <button
                            onClick={() => handleToggle(mod.moduleKey, mod.enabled)}
                            disabled={loading}
                            className={`w-full py-2 rounded font-medium transition-colors ${mod.enabled
                                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                                }`}
                        >
                            {mod.enabled ? 'Disable Module' : 'Enable Module'}
                        </button>
                    </div>
                ))}

                {(!modules || modules.length === 0) && (
                    <div className="col-span-full text-center py-8 text-gray-500">
                        No modules registered yet.
                    </div>
                )}
            </div>
        </div>
    );
};

export default ModuleRegistry;

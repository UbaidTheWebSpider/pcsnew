import React, { useState } from 'react';
import { useConfig } from '../../context/ConfigContext';
import axios from 'axios';

const FeatureToggles = () => {
    const { settings, refreshConfig, isFeatureEnabled } = useConfig();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const localSettings = settings ? Object.keys(settings).map(key => ({
        key,
        value: settings[key],
        description: 'Feature Flag',
        category: 'feature_flag'
    })) : [];

    const handleToggle = async (key, currentValue) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:5000/api/super-admin/settings', {
                key,
                value: !currentValue,
                category: 'feature_flag'
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            await refreshConfig();
            setMessage(`Updated ${key} successfully`);
        } catch (error) {
            console.error(error);
            setMessage('Failed to update setting');
        }
        setLoading(false);
    };

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Feature Flags</h2>
            {message && <div className="mb-4 p-2 bg-blue-100 text-blue-700 rounded">{message}</div>}

            <div className="space-y-4">
                {localSettings.length === 0 && <p className="text-gray-500">No settings found. Add one or seed the DB.</p>}

                {localSettings.map((setting) => (
                    <div key={setting.key} className="flex items-center justify-between p-4 border rounded hover:bg-gray-50">
                        <div>
                            <div className="font-medium text-gray-900">{setting.key}</div>
                            <div className="text-sm text-gray-500">{setting.description}</div>
                        </div>
                        <button
                            onClick={() => handleToggle(setting.key, setting.value)}
                            disabled={loading}
                            className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none ${setting.value ? 'bg-blue-600' : 'bg-gray-200'
                                }`}
                        >
                            <span
                                className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${setting.value ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                    </div>
                ))}
            </div>

            {/* Quick Add for Demo */}
            <div className="mt-8 pt-4 border-t">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Add New Flag</h3>
                <NewFlagForm onAdd={() => { refreshConfig(); }} />
            </div>
        </div>
    );
};

const NewFlagForm = ({ onAdd }) => {
    const [key, setKey] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!key) return;
        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:5000/api/super-admin/settings', {
                key,
                value: false,
                category: 'feature_flag',
                description: 'Manually added flag'
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setKey('');
            onAdd();
        } catch (error) {
            alert('Failed to add flag');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex gap-2">
            <input
                type="text"
                value={key}
                onChange={e => setKey(e.target.value)}
                placeholder="FLAG_NAME"
                className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
            />
            <button type="submit" className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">
                Add
            </button>
        </form>
    );
};

export default FeatureToggles;

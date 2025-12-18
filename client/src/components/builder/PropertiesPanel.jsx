import React from 'react';
import { getComponentByType } from './ComponentRegistry';

const PropertiesPanel = ({ selectedBlock, onUpdate, onDelete }) => {
    if (!selectedBlock) {
        return (
            <div className="w-80 bg-white border-l border-gray-300 p-6 flex items-center justify-center text-gray-400 text-sm">
                Select a component to edit properties
            </div>
        );
    }

    const componentDef = getComponentByType(selectedBlock.type);
    if (!componentDef) return null;

    const handleChange = (field, value) => {
        onUpdate(selectedBlock.id, {
            ...selectedBlock.props,
            [field]: value
        });
    };

    const handleVisibilityChange = (role) => {
        const currentVisibility = selectedBlock.visibleTo || [];
        const newVisibility = currentVisibility.includes(role)
            ? currentVisibility.filter(r => r !== role)
            : [...currentVisibility, role];

        // Use a special update handler for root-level props if needed, 
        // but typically we might just merge them. 
        // For simplicity, let's assume onUpdate handles the WHOLE block update 
        // OR we pass a specific prop. 
        // For now, let's stick to props updating.
        // Wait, visibility is a root property, not inside `props`.
        // I need to change the onUpdate signature or call usage.
    };

    // Changing approach: onUpdate accepts (id, newData) where newData can touch props or root fields.
    const handleRootChange = (field, value) => {
        onUpdate(selectedBlock.id, { [field]: value });
    };

    return (
        <div className="w-80 bg-white border-l border-gray-300 flex flex-col h-full overflow-y-auto">
            <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                <span className="font-bold text-sm uppercase text-gray-700">{componentDef.label}</span>
                <button
                    onClick={() => onDelete(selectedBlock.id)}
                    className="text-red-500 hover:text-red-700 text-xs font-semibold"
                >
                    Delete
                </button>
            </div>

            <div className="p-4 space-y-6">
                {/* Properties Fields */}
                <div className="space-y-4">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase">Configuration</h3>
                    {componentDef.fields.map(field => (
                        <div key={field.name}>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                            {field.type === 'text' && (
                                <input
                                    type="text"
                                    className="w-full border rounded p-2 text-sm"
                                    value={selectedBlock.props[field.name] || ''}
                                    onChange={e => handleChange(field.name, e.target.value)}
                                />
                            )}
                            {field.type === 'textarea' && (
                                <textarea
                                    className="w-full border rounded p-2 text-sm h-24"
                                    value={selectedBlock.props[field.name] || ''}
                                    onChange={e => handleChange(field.name, e.target.value)}
                                />
                            )}
                            {field.type === 'select' && (
                                <select
                                    className="w-full border rounded p-2 text-sm"
                                    value={selectedBlock.props[field.name] || ''}
                                    onChange={e => handleChange(field.name, e.target.value)}
                                >
                                    {field.options.map(opt => (
                                        <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                </select>
                            )}
                        </div>
                    ))}
                </div>

                {/* Visibility Settings */}
                <div className="pt-4 border-t border-gray-200">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Visibility</h3>
                    <div className="space-y-2">
                        {['patient', 'doctor', 'hospital_admin', 'pharmacy', 'guest'].map(role => (
                            <label key={role} className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    checked={(selectedBlock.visibleTo || []).includes(role)}
                                    onChange={(e) => {
                                        const current = selectedBlock.visibleTo || [];
                                        const next = e.target.checked
                                            ? [...current, role]
                                            : current.filter(r => r !== role);
                                        handleRootChange('visibleTo', next);
                                    }}
                                    className="rounded text-blue-600"
                                />
                                <span className="text-sm text-gray-700 capitalize">{role.replace('_', ' ')}</span>
                            </label>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PropertiesPanel;

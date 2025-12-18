import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const LayoutEditor = () => {
    const [layouts, setLayouts] = useState([]);
    const [editingLayout, setEditingLayout] = useState(null);

    const fetchLayouts = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/super-admin/layouts', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setLayouts(res.data);
        } catch (error) {
            console.error(error);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchLayouts();
    }, [fetchLayouts]);

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');

            // Allow basic JSON editing
            let structureParsed;
            try {
                structureParsed = JSON.parse(editingLayout.structureStr);
            } catch {
                alert('Invalid JSON structure');
                return;
            }

            await axios.post('http://localhost:5000/api/super-admin/layouts', {
                ...editingLayout,
                structure: structureParsed
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setEditingLayout(null);
            fetchLayouts();
            alert('Layout saved successfully');
        } catch (error) {
            console.error(error);
            alert('Failed to save layout');
        }
    };

    if (editingLayout) {
        return (
            <div className="bg-white p-6 rounded shadow">
                <div className="flex justify-between mb-4">
                    <h2 className="text-xl font-bold">Edit Layout</h2>
                    <button onClick={() => setEditingLayout(null)} className="text-gray-500">Cancel</button>
                </div>
                <form onSubmit={handleSave}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Name</label>
                        <input
                            className="w-full border p-2 rounded"
                            value={editingLayout.name}
                            onChange={e => setEditingLayout({ ...editingLayout, name: e.target.value })}
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Type</label>
                        <select
                            className="w-full border p-2 rounded"
                            value={editingLayout.type}
                            onChange={e => setEditingLayout({ ...editingLayout, type: e.target.value })}
                        >
                            <option value="custom">Custom</option>
                            <option value="dashboard">Dashboard</option>
                            <option value="landing">Landing</option>
                        </select>
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Structure (JSON)</label>
                        <textarea
                            className="w-full border p-2 rounded font-mono text-sm h-64"
                            value={editingLayout.structureStr}
                            onChange={e => setEditingLayout({ ...editingLayout, structureStr: e.target.value })}
                        />
                    </div>
                    <div className="mb-4">
                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                checked={editingLayout.isDefault}
                                onChange={e => setEditingLayout({ ...editingLayout, isDefault: e.target.checked })}
                                className="mr-2"
                            />
                            Set as Default for Type
                        </label>
                    </div>
                    <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Save Layout</button>
                </form>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Layout Templates</h2>
                <button
                    onClick={() => setEditingLayout({ name: 'New Layout', type: 'custom', structureStr: '{}', isDefault: false })}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                    Create New
                </button>
            </div>

            <div className="space-y-4">
                {layouts.map(layout => (
                    <div key={layout._id} className="border p-4 rounded flex justify-between items-center hover:bg-gray-50">
                        <div>
                            <div className="font-medium">{layout.name}</div>
                            <div className="text-sm text-gray-500">{layout.type} {layout.isDefault && <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded ml-2">Default</span>}</div>
                        </div>
                        <button
                            onClick={() => setEditingLayout({ ...layout, structureStr: JSON.stringify(layout.structure, null, 2) })}
                            className="text-blue-600 hover:text-blue-800"
                        >
                            Edit
                        </button>
                    </div>
                ))}
                {layouts.length === 0 && <p className="text-center text-gray-500 py-4">No layouts found.</p>}
            </div>
        </div>
    );
};

export default LayoutEditor;

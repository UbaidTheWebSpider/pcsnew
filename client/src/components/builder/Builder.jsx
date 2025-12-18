import React, { useState } from 'react';
import { DndContext, DragOverlay, closestCorners, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { v4 as uuidv4 } from 'uuid'; // Need to install uuid or use simple random for ID
import ComponentLibrary from './ComponentLibrary';
import LayoutCanvas from './LayoutCanvas';
import PropertiesPanel from './PropertiesPanel';
import { ComponentRegistry } from './ComponentRegistry';

import axiosInstance from '../../api/axiosConfig';

// Simple ID generator if uuid not available
const generateId = () => Math.random().toString(36).substr(2, 9);

const Builder = () => {
    // Layout State
    const [templateName, setTemplateName] = useState('My Custom Layout');
    const [blocks, setBlocks] = useState([]);
    const [selectedBlockId, setSelectedBlockId] = useState(null);
    const [activeDragId, setActiveDragId] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5, // Prevent accidental drags
            },
        })
    );

    const handleDragStart = (event) => {
        const { active } = event;
        setActiveDragId(active.id);
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;

        setActiveDragId(null); // Clear overlay

        if (!over) return;

        // Case 1: Dragging from Library to Canvas
        if (active.data.current?.isNew) {
            const type = active.data.current.type;
            const newBlock = {
                id: generateId(),
                type: type,
                props: { ...ComponentRegistry[type].defaultProps },
                visibleTo: ['patient', 'doctor', 'hospital_admin', 'pharmacy', 'guest'] // Default visible to all
            };

            setBlocks((items) => [...items, newBlock]);
            return;
        }

        // Case 2: Reordering within Canvas
        if (active.id !== over.id) {
            setBlocks((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id);
                const newIndex = items.findIndex((item) => item.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const handleSelectBlock = (block) => {
        setSelectedBlockId(block ? block.id : null);
    };

    const handleUpdateBlock = (id, updates) => { // updates can be props or root fields
        setBlocks(items => items.map(item => {
            if (item.id === id) {
                const newItem = { ...item };
                if (updates.props) newItem.props = updates.props;
                if (updates.visibleTo) newItem.visibleTo = updates.visibleTo;
                return { ...newItem, ...updates };
            }
            return item;
        }));
    };

    const handleDeleteBlock = (id) => {
        setBlocks(items => items.filter(i => i.id !== id));
        if (selectedBlockId === id) setSelectedBlockId(null);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const layoutConfig = { blocks };
            const payload = {
                name: templateName,
                structure: layoutConfig,
                isDefault: false
            };

            await axiosInstance.post('/api/super-admin/layouts', payload);
            alert("Layout saved successfully!");
        } catch (error) {
            console.error("Failed to save layout:", error);
            alert("Failed to save layout. See console.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="flex h-full bg-white">
                {/* Left: Library */}
                <ComponentLibrary />

                {/* Center: Canvas */}
                <div className="flex-1 flex flex-col h-full overflow-hidden relative">
                    <div className="bg-white border-b p-2 flex justify-between items-center shadow-sm z-10">
                        <div className="flex items-center space-x-2">
                            <h2 className="font-bold px-4 text-gray-700">Layout Builder</h2>
                            <input
                                type="text"
                                value={templateName}
                                onChange={(e) => setTemplateName(e.target.value)}
                                className="border rounded px-2 py-1 text-sm w-64"
                            />
                        </div>
                        <div className="space-x-2">
                            <button className="px-3 py-1 text-sm border rounded hover:bg-gray-100">Preview</button>
                            <button onClick={handleSave} disabled={isSaving} className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>

                    <LayoutCanvas
                        blocks={blocks}
                        onSelectBlock={handleSelectBlock}
                        selectedBlockId={selectedBlockId}
                    />
                </div>

                {/* Right: Properties */}
                <PropertiesPanel
                    selectedBlock={blocks.find(b => b.id === selectedBlockId)}
                    onUpdate={handleUpdateBlock}
                    onDelete={handleDeleteBlock}
                />

                {/* Drag Overlay (Ghost) */}
                <DragOverlay>
                    {activeDragId ? (
                        <div className="bg-blue-500 text-white p-2 rounded shadow opacity-80 width-40">
                            Dragging...
                        </div>
                    ) : null}
                </DragOverlay>
            </div>
        </DndContext>
    );
};

export default Builder;

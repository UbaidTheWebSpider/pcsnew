import React from 'react';
import { ComponentRegistry } from './ComponentRegistry';
import { useDraggable } from '@dnd-kit/core';

// Draggable Item Wrapper
const DraggableItem = ({ type, label }) => {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: `lib-${type}`,
        data: { type, isNew: true } // Identify as a new item from library
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    } : undefined;

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className="p-3 mb-2 bg-white border border-gray-200 rounded shadow-sm cursor-move hover:bg-gray-50 flex items-center"
        >
            <span className="w-4 h-4 bg-gray-400 rounded-full mr-3 text-xs flex items-center justify-center text-white">+</span>
            <span className="text-sm font-medium">{label}</span>
        </div>
    );
}

const ComponentLibrary = () => {
    return (
        <div className="w-64 bg-gray-100 border-r border-gray-300 flex flex-col h-full">
            <div className="p-4 font-bold text-gray-700 uppercase text-xs tracking-wider border-b border-gray-200">
                Components
            </div>
            <div className="p-4 flex-1 overflow-y-auto">
                {Object.keys(ComponentRegistry).map(type => (
                    <DraggableItem
                        key={type}
                        type={type}
                        label={ComponentRegistry[type].label}
                    />
                ))}
            </div>
        </div>
    );
};

export default ComponentLibrary;

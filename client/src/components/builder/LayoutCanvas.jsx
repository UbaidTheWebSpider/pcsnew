import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { getComponentByType } from './ComponentRegistry';

// Sortable Block Wrapper
const SortableBlock = ({ block, onSelect, isSelected }) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
        id: block.id
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const ComponentEntry = getComponentByType(block.type);
    const Component = ComponentEntry ? ComponentEntry.component : () => <div>Unknown</div>;

    return (
        <div
            ref={setNodeRef}
            style={style}
            onClick={(e) => { e.stopPropagation(); onSelect(block); }}
            className={`relative mb-4 group ring-2 ring-transparent transition-all ${isSelected ? '!ring-blue-500' : 'hover:ring-blue-200'}`}
        >
            {/* Drag Handle Overlay - Only show on hover or select */}
            <div {...attributes} {...listeners} className="absolute top-0 right-0 p-1 cursor-grab opacity-0 group-hover:opacity-100 bg-blue-500 text-white rounded-bl z-10">
                :::
            </div>

            <div className="bg-white border rounded">
                <div className="pointer-events-none p-4"> {/* Disable interaction inside preview */}
                    <Component {...block.props} />
                </div>
            </div>
        </div>
    );
};

const LayoutCanvas = ({ blocks, onSelectBlock, selectedBlockId }) => {
    const { setNodeRef } = useDroppable({
        id: 'canvas',
    });

    return (
        <div className="flex-1 bg-gray-50 p-8 overflow-y-auto h-full" onClick={() => onSelectBlock(null)}>
            <div ref={setNodeRef} className="max-w-4xl mx-auto min-h-[500px] border-2 border-dashed border-gray-300 rounded-lg p-4 transition-colors">
                <SortableContext
                    items={blocks.map(b => b.id)}
                    strategy={verticalListSortingStrategy}
                >
                    {blocks.map(block => (
                        <SortableBlock
                            key={block.id}
                            block={block}
                            onSelect={onSelectBlock}
                            isSelected={selectedBlockId === block.id}
                        />
                    ))}
                    {blocks.length === 0 && (
                        <div className="h-full flex items-center justify-center text-gray-400">
                            Drag components here
                        </div>
                    )}
                </SortableContext>
            </div>
        </div>
    );
};

export default LayoutCanvas;

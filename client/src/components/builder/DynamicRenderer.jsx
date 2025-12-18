import React from 'react';
import { getComponentByType } from './ComponentRegistry';
import { useAuth } from '../../context/AuthContext';

const DynamicRenderer = ({ config }) => {
    const { user } = useAuth();

    if (!config || !config.blocks || config.blocks.length === 0) {
        return <div className="p-4 text-center text-gray-500">Empty Layout</div>;
    }

    return (
        <div className="dynamic-layout">
            {config.blocks.map((block) => {
                // Role-based visibility check
                if (block.visibleTo && block.visibleTo.length > 0) {
                    const userRole = user ? user.role : 'guest';
                    if (!block.visibleTo.includes(userRole)) {
                        return null; // Hide block
                    }
                }

                const ComponentEntry = getComponentByType(block.type);
                if (!ComponentEntry) {
                    return <div key={block.id} className="text-red-500 p-2">Unknown Component Type: {block.type}</div>;
                }

                const Component = ComponentEntry.component;
                return (
                    <div key={block.id} className="component-wrapper mb-4">
                        <Component {...block.props} />
                    </div>
                );
            })}
        </div>
    );
};

export default DynamicRenderer;

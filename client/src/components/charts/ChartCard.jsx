import React from 'react';

/**
 * ChartCard - Reusable wrapper component for charts
 * Provides consistent styling, shadows, and responsive layout
 */
const ChartCard = ({ title, description, children, className = '' }) => {
    return (
        <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 hover:shadow-md transition-shadow duration-300 ${className}`}>
            {/* Card Header */}
            <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {title}
                </h3>
                {description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {description}
                    </p>
                )}
            </div>

            {/* Chart Container */}
            <div className="relative w-full h-full">
                {children}
            </div>
        </div>
    );
};

export default ChartCard;

// This file maps JSON "type" strings to actual React components
import React from 'react';

// Block Components (We will create these next)
// For now, using placeholders
const HeroBlock = ({ title, subtitle, bg }) => (
    <div className={`p-12 text-center rounded ${bg === 'blue' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
        <h1 className="text-4xl font-bold mb-4">{title || 'Hero Title'}</h1>
        <p className="text-xl">{subtitle || 'Subtitle goes here'}</p>
    </div>
);

const TextBlock = ({ content, align }) => (
    <div className={`p-6 ${align === 'center' ? 'text-center' : 'text-left'}`}>
        <p>{content || 'Sample text content...'}</p>
    </div>
);

const NavbarItemBlock = ({ label, link }) => (
    <div className="p-2 border rounded bg-white shadow-sm inline-block mr-2">
        <span className="font-bold text-blue-600">{label}</span> &rarr; {link}
    </div>
);

// Registry Object
export const ComponentRegistry = {
    'hero': {
        component: HeroBlock,
        label: 'Hero Section',
        defaultProps: { title: 'Welcome', subtitle: 'Start here', bg: 'blue' },
        fields: [
            { name: 'title', type: 'text', label: 'Title' },
            { name: 'subtitle', type: 'text', label: 'Subtitle' },
            { name: 'bg', type: 'select', label: 'Background', options: ['blue', 'gray', 'white'] }
        ]
    },
    'text': {
        component: TextBlock,
        label: 'Text Block',
        defaultProps: { content: 'Enter text...', align: 'left' },
        fields: [
            { name: 'content', type: 'textarea', label: 'Content' },
            { name: 'align', type: 'select', label: 'Align', options: ['left', 'center', 'right'] }
        ]
    },
    'navbarItem': {
        component: NavbarItemBlock,
        label: 'Navbar Item',
        defaultProps: { label: 'Link', link: '#' },
        fields: [
            { name: 'label', type: 'text', label: 'Label' },
            { name: 'link', type: 'text', label: 'Link URL' }
        ]
    }
    // Add more blocks here: Table, Card, etc.
};

export const getComponentByType = (type) => {
    return ComponentRegistry[type] || null;
};

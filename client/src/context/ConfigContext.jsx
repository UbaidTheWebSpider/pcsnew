import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const ConfigContext = createContext();

export const useConfig = () => useContext(ConfigContext);

export const ConfigProvider = ({ children }) => {
    const { user } = useAuth();
    const [settings, setSettings] = useState({});
    const [modules, setModules] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchConfig = async () => {
        // Only try to fetch if user is super_admin, otherwise defaults
        if (user && user.role === 'super_admin') {
            try {
                const token = localStorage.getItem('token');
                const config = {
                    headers: { Authorization: `Bearer ${token}` }
                };

                const [settingsRes, modulesRes] = await Promise.all([
                    axios.get('http://localhost:5001/api/super-admin/settings', config).catch(e => ({ data: [] })),
                    axios.get('http://localhost:5001/api/super-admin/modules', config).catch(e => ({ data: [] }))
                ]);

                // Convert array to object for easier lookup
                const settingsMap = (settingsRes.data || []).reduce((acc, curr) => {
                    acc[curr.key] = curr.value;
                    return acc;
                }, {});

                setSettings(settingsMap);
                setModules(modulesRes.data || []);
            } catch (error) {
                console.error("Failed to load super admin config", error);
            }
        } else {
            setSettings({});
            setModules([]);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchConfig();
    }, [user]);

    // Helper to check feature flag
    const isFeatureEnabled = (key) => !!settings[key];

    // Helper to check module
    const isModuleEnabled = (key) => {
        const mod = modules.find(m => m.moduleKey === key);
        return mod ? mod.enabled : false; // Default to false if not found in registry (safe default)
        // OR: if module not in registry, is it existing? 
        // For non-destructive legacy behavior, if it's NOT in registry, we should probably assume it's a legacy module and return TRUE?
        // But the requirement says "Toggle module enable/disable (adds module_registry entry)".
        // Meaning if it's NOT there, it's not managed? 
        // For now, let's assume this helper is for NEW modules or modules explicitly added to registry.
    };

    return (
        <ConfigContext.Provider value={{ settings, modules, isFeatureEnabled, isModuleEnabled, refreshConfig: fetchConfig, loading }}>
            {children}
        </ConfigContext.Provider>
    );
};

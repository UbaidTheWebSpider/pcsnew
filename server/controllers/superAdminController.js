const SystemSetting = require('../models/SystemSetting');
const ModuleRegistry = require('../models/ModuleRegistry');
const AuditLog = require('../models/AuditLog');
const LayoutTemplate = require('../models/LayoutTemplate');

// Helper to log actions
const logAction = async (actorId, action, targetModel, targetId, details, req) => {
    try {
        await AuditLog.create({
            action,
            actor: actorId,
            targetModel,
            targetId,
            details,
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
        });
    } catch (err) {
        console.error('Failed to create audit log:', err);
    }
};

// --- Settings & Feature Flags ---
exports.getSettings = async (req, res) => {
    try {
        const settings = await SystemSetting.find({});
        res.json(settings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateSetting = async (req, res) => {
    try {
        const { key, value, description, category } = req.body;

        let setting = await SystemSetting.findOne({ key });
        const originalValue = setting ? setting.value : null;

        if (setting) {
            setting.value = value;
            if (description) setting.description = description;
            setting.updatedBy = req.user._id;
            setting.lastUpdated = Date.now();
            await setting.save();
        } else {
            setting = await SystemSetting.create({
                key,
                value,
                description,
                category,
                updatedBy: req.user._id
            });
        }

        // Log it
        await logAction(req.user._id, 'UPDATE_SETTING', 'SystemSetting', setting._id, { key, from: originalValue, to: value }, req);

        res.json(setting);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --- Modules ---
exports.getModules = async (req, res) => {
    try {
        const modules = await ModuleRegistry.find({});
        res.json(modules);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.toggleModule = async (req, res) => {
    try {
        const { moduleKey, enabled } = req.body;
        const moduleItem = await ModuleRegistry.findOneAndUpdate(
            { moduleKey },
            { enabled },
            { new: true, upsert: true } // Upsert to allow clean initialization
        );

        await logAction(req.user._id, 'TOGGLE_MODULE', 'ModuleRegistry', moduleItem._id, { moduleKey, enabled }, req);

        res.json(moduleItem);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --- Layouts ---
exports.getLayouts = async (req, res) => {
    try {
        const layouts = await LayoutTemplate.find({});
        res.json(layouts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.saveLayout = async (req, res) => {
    try {
        const { name, type, structure, isDefault } = req.body;

        // If setting as default, unset others of same type
        if (isDefault) {
            await LayoutTemplate.updateMany({ type }, { isDefault: false });
        }

        const layout = await LayoutTemplate.create({
            name,
            type,
            structure,
            isDefault,
            createdBy: req.user._id
        });

        await logAction(req.user._id, 'CREATE_LAYOUT', 'LayoutTemplate', layout._id, { name, type }, req);

        res.status(201).json(layout);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --- Audit Logs ---
exports.getAuditLogs = async (req, res) => {
    try {
        const { limit = 50, page = 1 } = req.query;
        const logs = await AuditLog.find({})
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .populate('actor', 'name email role');

        const count = await AuditLog.countDocuments();

        res.json({
            logs,
            totalPages: Math.ceil(count / limit),
            currentPage: page
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const PharmacyAuditLog = require('../models/PharmacyAuditLog');

// Middleware to create audit log for requests
exports.auditLog = (action, entity) => {
    return async (req, res, next) => {
        // Store original send function
        const originalSend = res.send;

        // Override send function to capture response
        res.send = function (data) {
            // Only log successful operations (2xx status codes)
            if (res.statusCode >= 200 && res.statusCode < 300) {
                // Create audit log asynchronously (don't wait)
                createAuditLog(req, action, entity).catch(err => {
                    console.error('Audit log creation error:', err);
                });
            }

            // Call original send
            originalSend.call(this, data);
        };

        next();
    };
};

// Helper function to create audit log
async function createAuditLog(req, action, entity) {
    try {
        if (!req.pharmacyId || !req.user) {
            return;
        }

        const logData = {
            pharmacyId: req.pharmacyId,
            userId: req.user._id,
            userName: req.user.name,
            action,
            entity,
            entityId: req.params.id || req.body._id,
            metadata: {
                ipAddress: req.ip,
                userAgent: req.get('user-agent'),
                deviceInfo: req.body.deviceId || req.headers['x-device-id']
            }
        };

        // Add changes for update operations
        if (action === 'update' && req.body) {
            logData.changes = {
                after: req.body
            };
        }

        // Add description
        logData.description = generateDescription(action, entity, req);

        await PharmacyAuditLog.createLog(logData);
    } catch (error) {
        console.error('Create audit log error:', error);
    }
}

// Generate human-readable description
function generateDescription(action, entity, req) {
    const actionMap = {
        create: 'Created',
        update: 'Updated',
        delete: 'Deleted',
        dispense: 'Dispensed',
        refund: 'Refunded',
        adjust_stock: 'Adjusted stock for',
        validate: 'Validated',
        reconcile: 'Reconciled'
    };

    const entityMap = {
        medicine: 'medicine',
        batch: 'batch',
        prescription: 'prescription',
        transaction: 'transaction',
        inventory: 'inventory',
        shift: 'shift',
        fulfillment: 'prescription fulfillment'
    };

    const actionText = actionMap[action] || action;
    const entityText = entityMap[entity] || entity;

    return `${actionText} ${entityText}`;
}

// Manual audit log creation
exports.createManualLog = async (pharmacyId, userId, userName, action, entity, entityId, description, metadata = {}) => {
    try {
        await PharmacyAuditLog.createLog({
            pharmacyId,
            userId,
            userName,
            action,
            entity,
            entityId,
            description,
            metadata
        });
    } catch (error) {
        console.error('Manual audit log error:', error);
    }
};

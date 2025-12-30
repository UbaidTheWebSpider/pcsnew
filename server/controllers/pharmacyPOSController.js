const POSTransaction = require('../models/POSTransaction');
const CashierShift = require('../models/CashierShift');
const MedicineBatch = require('../models/MedicineBatch');
const PharmacyAuditLog = require('../models/PharmacyAuditLog');

// @desc    Create POS transaction
// @route   POST /api/pharmacy/pos/transactions
// @access  Private (Cashier, Pharmacy Admin)
exports.createTransaction = async (req, res) => {
    try {
        const {
            items,
            paymentMethod,
            paymentDetails,
            prescriptionId,
            customerName,
            customerPhone,
            customerCNIC,
            notes
        } = req.body;

        // Get current shift
        const currentShift = await CashierShift.getCurrentShift(req.user._id);
        if (!currentShift) {
            return res.status(400).json({
                success: false,
                message: 'No active shift found. Please open a shift first.'
            });
        }

        // Calculate totals
        let subtotal = 0;
        let taxTotal = 0;
        let discountTotal = 0;

        const processedItems = [];

        // Process each item and deduct stock
        for (const item of items) {
            // Robust check for batchId
            const bId = item.batchId || item.batch_id || (item.batchId?._id ? item.batchId._id : null);

            if (!bId) {
                return res.status(400).json({
                    success: false,
                    message: 'Missing batch ID for item: ' + (item.medicineName || 'Unknown')
                });
            }

            const batch = await MedicineBatch.findById(bId);
            if (!batch) {
                return res.status(404).json({
                    success: false,
                    message: `Batch not found: ${bId}`
                });
            }

            if (batch.quantity < item.quantity) {
                return res.status(400).json({
                    success: false,
                    message: `Insufficient stock for ${batch.medicineName}`
                });
            }

            // Calculate item totals with defensive validation
            const itemDiscountRate = Number(item.discount) || 0;
            const itemTaxRate = Number(item.taxRate) || 0; // Default to 0 if missing

            // Validate numeric values
            if (isNaN(itemDiscountRate) || isNaN(itemTaxRate)) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid discount or tax rate for item: ${item.medicineName}`
                });
            }

            const itemSubtotal = (Number(item.unitPrice) || 0) * (Number(item.quantity) || 0);
            const itemDiscount = itemSubtotal * (itemDiscountRate / 100);
            const itemTaxable = itemSubtotal - itemDiscount;
            const itemTax = itemTaxable * (itemTaxRate / 100);
            const itemTotal = itemTaxable + itemTax;

            subtotal += itemSubtotal;
            discountTotal += itemDiscount;
            taxTotal += itemTax;

            processedItems.push({
                ...item,
                taxRate: itemTaxRate, // Ensure taxRate is stored
                taxAmount: itemTax,
                totalAmount: itemTotal
            });

            // Deduct stock
            await batch.deductStock(item.quantity);
        }

        const grandTotal = subtotal - discountTotal + taxTotal;

        if (isNaN(grandTotal)) {
            console.error('NaN detected in transaction calculation:', {
                subtotal, discountTotal, taxTotal, grandTotal
            });
            return res.status(400).json({
                success: false,
                message: 'Invalid numeric data detected in transaction calculation. Please check item prices.'
            });
        }

        // Create transaction
        const transaction = await POSTransaction.create({
            pharmacyId: req.pharmacyId,
            cashierId: req.user._id,
            prescriptionId,
            items: processedItems,
            paymentMethod,
            paymentDetails: {
                cash: Number(paymentDetails?.cash) || 0,
                card: Number(paymentDetails?.card) || 0,
                insurance: Number(paymentDetails?.insurance) || 0,
                wallet: Number(paymentDetails?.wallet) || (Number(paymentDetails?.hospital_wallet) || 0)
            },
            subtotal,
            taxTotal,
            discountTotal,
            grandTotal,
            shiftId: currentShift._id,
            customerName,
            customerPhone,
            customerCNIC,
            notes
        });

        // Update shift totals
        await currentShift.updateSales(transaction);

        // Create audit log
        await PharmacyAuditLog.createLog({
            pharmacyId: req.pharmacyId,
            userId: req.user._id,
            userName: req.user.name,
            action: 'create',
            entity: 'transaction',
            entityId: transaction._id,
            description: `POS transaction ${transaction.transactionId} - Rs. ${grandTotal}`,
            metadata: {
                ipAddress: req.ip,
                userAgent: req.get('user-agent')
            }
        });

        res.status(201).json({
            success: true,
            message: 'Transaction created successfully',
            data: transaction
        });
    } catch (error) {
        console.error('Create transaction error:', error);
        res.status(500).json({
            success: false,
            message: `Error creating transaction: ${error.message}`,
            error: error.message
        });
    }
};

// @desc    Get transactions
// @route   GET /api/pharmacy/pos/transactions
// @access  Private
exports.getTransactions = async (req, res) => {
    try {
        const { startDate, endDate, cashierId, limit = 50 } = req.query;

        const query = {
            pharmacyId: req.pharmacyId,
            isDeleted: false
        };

        if (cashierId) query.cashierId = cashierId;

        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        const transactions = await POSTransaction.find(query)
            .populate('cashierId', 'name email')
            .populate('prescriptionId', 'prescriptionId')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit));

        res.json({
            success: true,
            count: transactions.length,
            data: transactions
        });
    } catch (error) {
        console.error('Get transactions error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching transactions'
        });
    }
};

// @desc    Process refund
// @route   POST /api/pharmacy/pos/transactions/:id/refund
// @access  Private (Pharmacy Admin)
exports.processRefund = async (req, res) => {
    try {
        const { id } = req.params;
        const { amount, reason } = req.body;

        const transaction = await POSTransaction.findById(id);
        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: 'Transaction not found'
            });
        }

        // Process refund
        await transaction.processRefund(amount, reason, req.user._id);

        // Return stock
        for (const item of transaction.items) {
            const batch = await MedicineBatch.findById(item.batchId);
            if (batch) {
                await batch.addStock(item.quantity);
            }
        }

        // Create audit log
        await PharmacyAuditLog.createLog({
            pharmacyId: req.pharmacyId,
            userId: req.user._id,
            userName: req.user.name,
            action: 'refund',
            entity: 'transaction',
            entityId: transaction._id,
            description: `Refund processed: Rs. ${amount}. Reason: ${reason}`,
            metadata: {
                ipAddress: req.ip,
                userAgent: req.get('user-agent')
            }
        });

        res.json({
            success: true,
            message: 'Refund processed successfully',
            data: transaction
        });
    } catch (error) {
        console.error('Process refund error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error processing refund'
        });
    }
};

// @desc    Open cashier shift
// @route   POST /api/pharmacy/pos/shifts/open
// @access  Private (Cashier, Pharmacy Admin)
exports.openShift = async (req, res) => {
    try {
        const { openingBalance } = req.body;

        // Check if cashier already has an open shift
        const hasOpenShift = await CashierShift.hasOpenShift(req.user._id);
        if (hasOpenShift) {
            return res.status(400).json({
                success: false,
                message: 'You already have an open shift'
            });
        }

        const shift = await CashierShift.create({
            cashierId: req.user._id,
            pharmacyId: req.pharmacyId,
            openingBalance: openingBalance || 0
        });

        // Create audit log
        await PharmacyAuditLog.createLog({
            pharmacyId: req.pharmacyId,
            userId: req.user._id,
            userName: req.user.name,
            action: 'create',
            entity: 'shift',
            entityId: shift._id,
            description: `Shift opened with balance: Rs. ${openingBalance || 0}`,
            metadata: {
                ipAddress: req.ip,
                userAgent: req.get('user-agent')
            }
        });

        res.status(201).json({
            success: true,
            message: 'Shift opened successfully',
            data: shift
        });
    } catch (error) {
        console.error('Open shift error:', error);
        res.status(500).json({
            success: false,
            message: 'Error opening shift',
            error: error.message
        });
    }
};

// @desc    Close cashier shift
// @route   POST /api/pharmacy/pos/shifts/close
// @access  Private (Cashier, Pharmacy Admin)
exports.closeShift = async (req, res) => {
    try {
        const { closingBalance, notes } = req.body;

        const shift = await CashierShift.getCurrentShift(req.user._id);
        if (!shift) {
            return res.status(404).json({
                success: false,
                message: 'No open shift found'
            });
        }

        await shift.closeShift(closingBalance);
        if (notes) {
            shift.notes = notes;
            await shift.save();
        }

        // Create audit log
        await PharmacyAuditLog.createLog({
            pharmacyId: req.pharmacyId,
            userId: req.user._id,
            userName: req.user.name,
            action: 'update',
            entity: 'shift',
            entityId: shift._id,
            description: `Shift closed. Variance: Rs. ${shift.variance}`,
            metadata: {
                ipAddress: req.ip,
                userAgent: req.get('user-agent')
            }
        });

        res.json({
            success: true,
            message: 'Shift closed successfully',
            data: shift
        });
    } catch (error) {
        console.error('Close shift error:', error);
        res.status(500).json({
            success: false,
            message: 'Error closing shift',
            error: error.message
        });
    }
};

// @desc    Get current shift
// @route   GET /api/pharmacy/pos/shifts/current
// @access  Private
exports.getCurrentShift = async (req, res) => {
    try {
        const shift = await CashierShift.getCurrentShift(req.user._id);

        if (!shift) {
            return res.status(404).json({
                success: false,
                message: 'No active shift found'
            });
        }

        res.json({
            success: true,
            data: shift
        });
    } catch (error) {
        console.error('Get current shift error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching current shift'
        });
    }
};

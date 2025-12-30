const POSTransaction = require('../models/POSTransaction');
const MedicineBatch = require('../models/MedicineBatch');
const PrescriptionFulfillment = require('../models/PrescriptionFulfillment');
const CashierShift = require('../models/CashierShift');

// @desc    Get dashboard KPIs
// @route   GET /api/pharmacy/dashboard/kpis
// @access  Private
exports.getDashboardKPIs = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Today's sales
        const todayTransactions = await POSTransaction.find({
            pharmacyId: req.pharmacyId,
            createdAt: { $gte: today, $lt: tomorrow },
            isDeleted: false
        });

        const todaysSales = todayTransactions.reduce((sum, t) => sum + t.grandTotal, 0);

        // Prescriptions fulfilled today
        const prescriptionsFulfilled = await PrescriptionFulfillment.countDocuments({
            pharmacyId: req.pharmacyId,
            dispensedAt: { $gte: today, $lt: tomorrow }
        });

        // Pending prescriptions
        const pendingPrescriptions = await PrescriptionFulfillment.countDocuments({
            pharmacyId: req.pharmacyId,
            status: { $in: ['pending', 'in_progress'] }
        });

        // Low stock medicines
        const allBatches = await MedicineBatch.find({
            pharmacyId: req.pharmacyId,
            isDeleted: false,
            status: { $in: ['available', 'low_stock'] }
        });
        const lowStockCount = allBatches.filter(b => b.isLowStock).length;

        // Expired/near expiry drugs
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

        const expiringBatches = await MedicineBatch.countDocuments({
            pharmacyId: req.pharmacyId,
            expiryDate: { $lte: thirtyDaysFromNow, $gt: new Date() },
            isDeleted: false
        });

        // Insurance vs Cash sales (today)
        const insuranceSales = todayTransactions
            .filter(t => t.paymentMethod === 'insurance' || t.paymentDetails?.insurance > 0)
            .reduce((sum, t) => sum + (t.paymentDetails?.insurance || t.grandTotal), 0);

        const cashSales = todayTransactions
            .filter(t => t.paymentMethod === 'cash' || t.paymentDetails?.cash > 0)
            .reduce((sum, t) => sum + (t.paymentDetails?.cash || t.grandTotal), 0);

        res.json({
            success: true,
            data: {
                todaysSales: Math.round(todaysSales * 100) / 100,
                prescriptionsFulfilled,
                pendingPrescriptions,
                lowStockMedicines: lowStockCount,
                expiringMedicines: expiringBatches,
                insuranceSales: Math.round(insuranceSales * 100) / 100,
                cashSales: Math.round(cashSales * 100) / 100
            }
        });
    } catch (error) {
        console.error('Get KPIs error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching KPIs'
        });
    }
};

// @desc    Get sales analytics
// @route   GET /api/pharmacy/dashboard/analytics
// @access  Private
exports.getSalesAnalytics = async (req, res) => {
    try {
        const { period = 'week' } = req.query; // week, month, year

        let startDate = new Date();
        if (period === 'week') {
            startDate.setDate(startDate.getDate() - 7);
        } else if (period === 'month') {
            startDate.setMonth(startDate.getMonth() - 1);
        } else if (period === 'year') {
            startDate.setFullYear(startDate.getFullYear() - 1);
        }

        // Daily sales trend
        const transactions = await POSTransaction.find({
            pharmacyId: req.pharmacyId,
            createdAt: { $gte: startDate },
            isDeleted: false
        });

        // Group by date
        const salesByDate = {};
        transactions.forEach(t => {
            const date = t.createdAt.toISOString().split('T')[0];
            if (!salesByDate[date]) {
                salesByDate[date] = 0;
            }
            salesByDate[date] += t.grandTotal;
        });

        const salesChart = Object.keys(salesByDate).map(date => ({
            date,
            sales: Math.round(salesByDate[date] * 100) / 100
        }));

        // Category-wise sales
        const categoryStats = {};
        for (const transaction of transactions) {
            for (const item of transaction.items) {
                const batch = await MedicineBatch.findById(item.batchId).populate('medicineId');
                if (batch && batch.medicineId) {
                    const category = batch.medicineId.category || 'Uncategorized';
                    if (!categoryStats[category]) {
                        categoryStats[category] = 0;
                    }
                    categoryStats[category] += item.totalAmount;
                }
            }
        }

        const categoryChart = Object.keys(categoryStats).map(category => ({
            category,
            sales: Math.round(categoryStats[category] * 100) / 100
        }));

        res.json({
            success: true,
            data: {
                salesChart,
                categoryChart
            }
        });
    } catch (error) {
        console.error('Get analytics error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching analytics'
        });
    }
};

// @desc    Get operational alerts
// @route   GET /api/pharmacy/dashboard/alerts
// @access  Private
exports.getAlerts = async (req, res) => {
    try {
        const alerts = [];

        // Low stock alerts
        const allBatches = await MedicineBatch.find({
            pharmacyId: req.pharmacyId,
            isDeleted: false,
            status: { $in: ['available', 'low_stock'] }
        }).populate('medicineId', 'name');

        const lowStockBatches = allBatches.filter(b => b.isLowStock);
        lowStockBatches.forEach(batch => {
            alerts.push({
                type: 'low_stock',
                severity: 'warning',
                message: `${batch.medicineId?.name} is low on stock (${batch.quantity} remaining)`,
                batchId: batch._id
            });
        });

        // Expiry alerts
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

        const expiringBatches = await MedicineBatch.find({
            pharmacyId: req.pharmacyId,
            expiryDate: { $lte: thirtyDaysFromNow, $gt: new Date() },
            isDeleted: false
        }).populate('medicineId', 'name');

        expiringBatches.forEach(batch => {
            alerts.push({
                type: 'expiry',
                severity: batch.daysUntilExpiry <= 7 ? 'critical' : 'warning',
                message: `${batch.medicineId?.name} expires in ${batch.daysUntilExpiry} days`,
                batchId: batch._id,
                expiryDate: batch.expiryDate
            });
        });

        // Pending prescriptions alert
        const pendingCount = await PrescriptionFulfillment.countDocuments({
            pharmacyId: req.pharmacyId,
            status: 'pending'
        });

        if (pendingCount > 0) {
            alerts.push({
                type: 'pending_prescriptions',
                severity: 'info',
                message: `${pendingCount} prescription(s) pending fulfillment`,
                count: pendingCount
            });
        }

        res.json({
            success: true,
            count: alerts.length,
            data: alerts
        });
    } catch (error) {
        console.error('Get alerts error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching alerts'
        });
    }
};

// @desc    Get prescription queue
// @route   GET /api/pharmacy/dashboard/queue
// @access  Private
exports.getPrescriptionQueue = async (req, res) => {
    try {
        const queue = await PrescriptionFulfillment.find({
            pharmacyId: req.pharmacyId,
            status: { $in: ['pending', 'in_progress'] }
        })
            .populate({
                path: 'prescriptionId',
                populate: [
                    { path: 'doctorId', select: 'name specialization' },
                    { path: 'patientId', select: 'name contact' }
                ]
            })
            .sort({ createdAt: 1 })
            .limit(10);

        res.json({
            success: true,
            count: queue.length,
            data: queue
        });
    } catch (error) {
        console.error('Get queue error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching prescription queue'
        });
    }
};

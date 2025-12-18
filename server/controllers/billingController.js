const Invoice = require('../models/Invoice');

// @desc    Get all invoices
// @route   GET /api/billing
// @access  Private
const getInvoices = async (req, res) => {
    try {
        const query = {};
        if (req.user.role === 'patient') {
            query.patientId = req.user._id;
        }
        // Doctors/Admins might see all or filtered

        const invoices = await Invoice.find(query)
            .populate('patientId', 'name')
            .populate('appointmentId')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: invoices,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single invoice
// @route   GET /api/billing/:id
// @access  Private
const getInvoiceById = async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id)
            .populate('patientId', 'name contact')
            .populate('appointmentId');

        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }

        if (req.user.role === 'patient' && invoice.patientId._id.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        res.json({
            success: true,
            data: invoice,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create invoice
// @route   POST /api/billing
// @access  Private (Admin/System)
const createInvoice = async (req, res) => {
    try {
        const { patientId, appointmentId, items, tax, paymentGateway, status } = req.body;

        // Calculate totals
        const totalAmount = items.reduce((acc, item) => acc + item.amount, 0);
        const finalAmount = totalAmount + (tax || 0);

        const invoice = await Invoice.create({
            patientId,
            appointmentId,
            items,
            totalAmount,
            tax,
            finalAmount,
            paymentGateway,
            status: status || 'Unpaid',
        });

        res.status(201).json({
            success: true,
            data: invoice,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Process Payment (Mock)
// @route   POST /api/billing/:id/pay
// @access  Private
const payInvoice = async (req, res) => {
    try {
        const { paymentGateway, paymentToken } = req.body;
        const invoice = await Invoice.findById(req.params.id);

        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }

        if (invoice.status === 'Paid') {
            return res.status(400).json({ message: 'Invoice already paid' });
        }

        // Mock Payment Processing
        // In real world, use Stripe/etc here with paymentToken

        invoice.status = 'Paid';
        invoice.paymentGateway = paymentGateway || 'Stripe';
        invoice.paymentTransactionId = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        invoice.paidAt = Date.now();

        await invoice.save();

        res.json({
            success: true,
            message: 'Payment successful',
            data: invoice,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getInvoices,
    getInvoiceById,
    createInvoice,
    payInvoice,
};

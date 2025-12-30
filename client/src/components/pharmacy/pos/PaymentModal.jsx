import React, { useState } from 'react';
import { CreditCard, Banknote, Wallet, ShieldCheck, X, CheckCircle, Printer } from 'lucide-react';

const PaymentModal = ({ totalAmount, onClose, onComplete }) => {
    const [method, setMethod] = useState('cash');
    const [amountTendered, setAmountTendered] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [completed, setCompleted] = useState(false);
    const [transactionData, setTransactionData] = useState(null);

    const handlePrint = () => {
        if (!transactionData) return;

        const printWindow = window.open('', '_blank');
        const invoiceContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Invoice #${transactionData.invoiceNumber || 'NEW'}</title>
                <style>
                    body { font-family: 'Courier New', Courier, monospace; padding: 20px; max-width: 80mm; margin: 0 auto; }
                    .header { text-align: center; margin-bottom: 20px; border-bottom: 1px dashed #000; padding-bottom: 10px; }
                    .h1 { font-size: 18px; font-weight: bold; margin: 0; }
                    .p { margin: 2px 0; font-size: 12px; }
                    .divider { border-top: 1px dashed #000; margin: 10px 0; }
                    .table { width: 100%; font-size: 12px; margin-bottom: 10px; }
                    .th { text-align: left; border-bottom: 1px dashed #000; }
                    .right { text-align: right; }
                    .totals { font-size: 12px; margin-top: 10px; }
                    .row { display: flex; justify-content: space-between; margin-bottom: 2px; }
                    .bold { font-weight: bold; }
                    .footer { text-align: center; margin-top: 20px; font-size: 10px; }
                    @media print {
                        @page { margin: 0; size: 80mm auto; }
                        body { margin: 10px; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="h1">HOSPITAL PHARMACY</div>
                    <div class="p">Main Campus, Blue Area</div>
                    <div class="p">Islamabad, Tel: 051-1234567</div>
                    <div class="p">NTN: 1234567-8</div>
                </div>

                <div class="p"><strong>Invoice:</strong> ${transactionData.invoiceNumber || 'PENDING'}</div>
                <div class="p"><strong>Date:</strong> ${new Date().toLocaleString()}</div>
                <div class="p"><strong>Customer:</strong> ${transactionData.customerName || 'Walk-in'}</div>
                <div class="divider"></div>

                <table class="table" cellspacing="0">
                    <thead>
                        <tr>
                            <th class="th">Item</th>
                            <th class="th right">Qty</th>
                            <th class="th right">Price</th>
                            <th class="th right">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${transactionData.items.map(item => `
                            <tr>
                                <td>
                                    ${item.medicineName}
                                    <br/><span style="font-size: 10px; color: #666;">Tax: ${item.taxRate}%</span>
                                </td>
                                <td class="right" valign="top">${item.quantity}</td>
                                <td class="right" valign="top">${item.unitPrice}</td>
                                <td class="right" valign="top">${(item.unitPrice * item.quantity).toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                <div class="divider"></div>

                <div class="totals">
                    <div class="row">
                        <span>Subtotal:</span>
                        <span>${transactionData.subtotal.toFixed(2)}</span>
                    </div>
                    <div class="row">
                        <span>Tax Total:</span>
                        <span>${transactionData.taxTotal.toFixed(2)}</span>
                    </div>
                     ${transactionData.discountTotal > 0 ? `
                        <div class="row">
                            <span>Discount:</span>
                            <span>-${transactionData.discountTotal.toFixed(2)}</span>
                        </div>
                    ` : ''}
                    <div class="divider"></div>
                    <div class="row bold" style="font-size: 14px;">
                        <span>GRAND TOTAL:</span>
                        <span>${transactionData.grandTotal.toFixed(2)}</span>
                    </div>
                    <div class="row">
                        <span>Paid (${method}):</span>
                        <span>${transactionData.grandTotal.toFixed(2)}</span>
                    </div>
                    ${method === 'cash' && transactionData.paymentDetails?.cash > transactionData.grandTotal ? `
                        <div class="row">
                            <span>Change Due:</span>
                            <span>${(transactionData.paymentDetails.cash - transactionData.grandTotal).toFixed(2)}</span>
                        </div>
                    ` : ''}
                </div>

                <div class="divider"></div>
                <div class="footer">
                    <p>Thank you for your visit!</p>
                    <p>Computer generated invoice</p>
                    <p>No signature required</p>
                </div>
            </body>
            </html>
        `;

        printWindow.document.write(invoiceContent);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 500); // Allow styles to load
    };

    const handlePayment = async (e) => {
        e.preventDefault();
        setIsProcessing(true);

        // Simulate minor delay
        await new Promise(r => setTimeout(r, 800));

        const details = {};
        if (method === 'cash') details.cash = parseFloat(amountTendered) || totalAmount;
        if (method === 'card') details.card = totalAmount;

        // Pass back to parent to call API
        try {
            const data = await onComplete({
                method,
                details
            });
            setTransactionData(data); // Capture transaction data
            setCompleted(true); // Show success state
        } catch (err) {
            setIsProcessing(false);
        }
    };

    if (completed) {
        return (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-sm w-full text-center animate-scale-in">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                        <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Payment Successful!</h2>

                    {/* Method Specific Details */}
                    {method === 'cash' && (
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6">
                            <p className="text-sm text-slate-500 mb-1">Change Returned</p>
                            <p className="text-3xl font-bold text-green-600">
                                Rs. {(parseFloat(amountTendered) - totalAmount).toFixed(2)}
                            </p>
                            <div className="mt-2 text-xs text-slate-400">
                                Paid via Cash
                            </div>
                        </div>
                    )}

                    {method === 'card' && (
                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-6">
                            <div className="flex items-center justify-center gap-2 text-blue-800 font-bold mb-2">
                                <CreditCard size={20} /> Card Payment
                            </div>
                            <p className="text-sm text-blue-600">Transaction ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
                        </div>
                    )}

                    {method === 'hospital_wallet' && (
                        <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 mb-6">
                            <div className="flex items-center justify-center gap-2 text-purple-800 font-bold mb-2">
                                <Wallet size={20} /> Wallet Deducted
                            </div>
                            <p className="text-sm text-purple-600">Balance Updated Successfully</p>
                        </div>
                    )}

                    {method === 'insurance' && (
                        <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 mb-6">
                            <div className="flex items-center justify-center gap-2 text-orange-800 font-bold mb-2">
                                <ShieldCheck size={20} /> Insurance Claim
                            </div>
                            <p className="text-sm text-orange-600">Claim ID: CLM-{Math.floor(Math.random() * 10000)}</p>
                        </div>
                    )}

                    <div className="flex flex-col gap-3">
                        <button onClick={handlePrint} className="btn-secondary flex items-center justify-center gap-2 w-full py-3 bg-slate-100 hover:bg-slate-200 rounded-xl font-medium transition-colors">
                            <Printer size={18} /> Print Invoice
                        </button>
                        <button onClick={onClose} className="btn-primary w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-200 transition-all">
                            New Sale
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const change = method === 'cash' && amountTendered ? (parseFloat(amountTendered) - totalAmount).toFixed(2) : 0;
    const canSubmit = method !== 'cash' || (parseFloat(amountTendered || 0) >= totalAmount);

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full flex overflow-hidden animate-scale-in max-h-[90vh]">
                {/* Left: Methods */}
                <div className="w-1/3 bg-slate-50 p-6 border-r border-slate-100">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Payment Method</h3>
                    <div className="space-y-3">
                        <button
                            onClick={() => setMethod('cash')}
                            className={`w-full flex items-center gap-3 p-4 rounded-xl transition-all text-left ${method === 'cash' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
                                }`}
                        >
                            <Banknote size={20} />
                            <span className="font-bold">Cash</span>
                        </button>
                        <button
                            onClick={() => setMethod('card')}
                            className={`w-full flex items-center gap-3 p-4 rounded-xl transition-all text-left ${method === 'card' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
                                }`}
                        >
                            <CreditCard size={20} />
                            <span className="font-bold">Card</span>
                        </button>
                        <button
                            onClick={() => setMethod('hospital_wallet')}
                            className={`w-full flex items-center gap-3 p-4 rounded-xl transition-all text-left ${method === 'hospital_wallet' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
                                }`}
                        >
                            <Wallet size={20} />
                            <span className="font-bold">H ospital Wallet</span>
                        </button>
                        <button
                            onClick={() => setMethod('insurance')}
                            className={`w-full flex items-center gap-3 p-4 rounded-xl transition-all text-left ${method === 'insurance' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
                                }`}
                        >
                            <ShieldCheck size={20} />
                            <span className="font-bold">Insurance</span>
                        </button>
                    </div>
                </div>

                {/* Right: Details */}
                <div className="w-2/3 p-8 flex flex-col">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800">Checkout</h2>
                            <p className="text-slate-500">Complete the transaction</p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                            <X size={24} />
                        </button>
                    </div>

                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 mb-6 text-center">
                        <p className="text-sm text-slate-500 mb-1">Total Amount Payable</p>
                        <p className="text-4xl font-bold text-slate-800">Rs. {totalAmount.toFixed(2)}</p>
                    </div>

                    <form onSubmit={handlePayment} className="flex-1 flex flex-col">
                        {method === 'cash' && (
                            <div className="space-y-4 mb-auto">
                                <label className="text-sm font-medium text-slate-700">Amount Tendered</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 font-bold">Rs.</span>
                                    <input
                                        type="number"
                                        autoFocus
                                        required
                                        min={totalAmount}
                                        step="0.01"
                                        value={amountTendered}
                                        onChange={(e) => setAmountTendered(e.target.value)}
                                        className="w-full pl-10 pr-4 py-4 bg-white border-2 border-slate-200 rounded-xl text-2xl font-bold text-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all"
                                        placeholder={totalAmount.toFixed(2)}
                                    />
                                </div>
                                <div className="flex justify-between items-center p-4 bg-green-50 rounded-xl border border-green-100">
                                    <span className="text-green-800 font-medium">Change Due</span>
                                    <span className="text-xl font-bold text-green-700">Rs. {parseFloat(change).toFixed(2)}</span>
                                </div>
                                {/* Quick Cash Buttons */}
                                <div className="flex gap-2">
                                    {[10, 20, 50, 100, 500, 2000].map(amt => (
                                        <button
                                            key={amt}
                                            type="button"
                                            onClick={() => setAmountTendered(amt.toString())}
                                            className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50"
                                        >
                                            Rs. {amt}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {method !== 'cash' && (
                            <div className="mb-auto text-center py-8 text-slate-500">
                                <p>Process payment via {method.replace('_', ' ')} terminal.</p>
                                <p className="text-xs mt-2">Click "Complete Payment" once verified.</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={!canSubmit || isProcessing}
                            className={`w-full py-4 rounded-xl text-lg font-bold text-white shadow-lg transform active:scale-[0.98] transition-all flex items-center justify-center gap-2 ${!canSubmit || isProcessing ? 'bg-slate-300 cursor-not-allowed shadow-none' : 'bg-blue-600 hover:bg-blue-700 hover:shadow-blue-200'
                                }`}
                        >
                            {isProcessing ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Processing...
                                </>
                            ) : (
                                <>
                                    Complete Payment <CheckCircle size={20} />
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default PaymentModal;

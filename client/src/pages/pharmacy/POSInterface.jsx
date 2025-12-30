import React, { useState, useCallback, useEffect } from 'react';
import axiosInstance from '../../api/axiosConfig';
import DashboardLayout from '../../components/DashboardLayout';
import ShiftManager from '../../components/pharmacy/pos/ShiftManager';
import ProductSearch from '../../components/pharmacy/pos/ProductSearch';
import POSCart from '../../components/pharmacy/pos/POSCart';
import PaymentModal from '../../components/pharmacy/pos/PaymentModal';
import { showError, showSuccess } from '../../utils/sweetalert';
import { ShoppingCart, User, AlertCircle } from 'lucide-react';

const POSInterface = () => {
    const [shift, setShift] = useState(null);
    const [cartItems, setCartItems] = useState([]);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [customerDetails, setCustomerDetails] = useState({
        name: 'Walk-in Customer',
        phone: '',
        cnic: ''
    });

    // Load cart from local storage on mount (persistence)
    useEffect(() => {
        const savedCart = localStorage.getItem('pos_cart');
        if (savedCart) {
            try {
                setCartItems(JSON.parse(savedCart));
            } catch (e) {
                console.error('Failed to load cart', e);
            }
        }
    }, []);

    // Save cart to local storage whenever it changes
    useEffect(() => {
        localStorage.setItem('pos_cart', JSON.stringify(cartItems));
    }, [cartItems]);

    const handleShiftValidated = useCallback((shiftData) => {
        setShift(shiftData);
    }, []);

    const addToCart = (batchItem) => {
        setCartItems(prev => {
            const existingIndex = prev.findIndex(item => item.batchNo === batchItem.batchNo);
            if (existingIndex >= 0) {
                const newItems = [...prev];
                // Check stock limit
                if (newItems[existingIndex].quantity < batchItem.quantity) {
                    newItems[existingIndex].quantity += 1;
                } else {
                    showError(`Max stock reached for ${batchItem.medicineName}`);
                }
                return newItems;
            } else {
                return [...prev, { ...batchItem, quantity: 1, stockQuantity: batchItem.quantity, discount: 0 }];
            }
        });
    };

    const updateQuantity = (index, newQty) => {
        if (newQty < 1) return;
        setCartItems(prev => {
            const newItems = [...prev];
            // Check stock
            if (newQty <= newItems[index].stockQuantity) {
                newItems[index].quantity = newQty;
            } else {
                showError(`Insufficient stock. Max available: ${newItems[index].stockQuantity}`);
            }
            return newItems;
        });
    };

    const removeItem = (index) => {
        setCartItems(prev => prev.filter((_, i) => i !== index));
    };

    const handleTransactionComplete = async (paymentData) => {
        // Validate items before sending
        // Validate items before sending
        const invalidItems = cartItems.filter(item => !item.batchId || !item.medicineId);
        if (invalidItems.length > 0) {
            showError(`Found ${invalidItems.length} invalid items items (missing ID). Clearing cart...`);
            setCartItems([]);
            localStorage.removeItem('pos_cart');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const transactionData = {
                items: cartItems.map(item => ({
                    medicineId: item.medicineId,
                    batchId: item.batchId,
                    batchNumber: item.batchNo,
                    medicineName: item.medicineName,
                    quantity: item.quantity,
                    unitPrice: item.price,
                    discount: item.discount || 0,
                    taxRate: item.taxRate || 0
                })),
                paymentMethod: paymentData.method,
                paymentDetails: paymentData.details,
                customerName: customerDetails.name,
                customerPhone: customerDetails.phone,
                customerCNIC: customerDetails.cnic
            };

            const { data } = await axiosInstance.post('/api/pharmacy/pos/transactions', transactionData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (data.success) {
                // Clear cart
                setCartItems([]);
                localStorage.removeItem('pos_cart');
                // Don't close modal here - let PaymentModal show success state
                // setShowPaymentModal(false); 

                // Ideally show invoice or print option here, creating an "Invoice Modal" or similar
                // For now, Success Alert handles it
                return data.data; // PaymentModal handles success UI
            }
        } catch (error) {
            console.error('Transaction error:', error);
            const msg = error.response?.data?.message || 'Transaction failed';

            // Auto-clear cart if stale data detected (CastError or 404)
            if (msg.includes('Cast to ObjectId failed') || msg.includes('Batch not found') || error.response?.status === 500) {
                setCartItems([]);
                localStorage.removeItem('pos_cart');
                setShowPaymentModal(false);
                showError('Stale data detected. Cart has been cleared. Please search for items again.');
            } else {
                showError(msg);
            }
            throw error;
        }
    };

    const cartTotal = cartItems.reduce((acc, item) => {
        const sub = item.price * item.quantity;
        return acc + (sub - (sub * (item.discount / 100)));
    }, 0);

    return (
        <DashboardLayout>
            <div className="h-[calc(100vh-64px)] flex flex-col bg-slate-100 p-4 gap-4 overflow-hidden">
                {/* Header / Shift Manager */}
                <div className="flex justify-between items-start shrink-0">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                            <ShoppingCart className="text-blue-600" /> Point of Sale
                        </h1>
                        <p className="text-sm text-slate-500">Sales Terminal 01</p>
                    </div>
                    <div className="w-1/2">
                        <ShiftManager onShiftValidated={handleShiftValidated} />
                    </div>
                </div>

                {/* Main Content - Disabled if no shift */}
                {!shift ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                        <AlertCircle className="w-16 h-16 mb-4 opacity-30" />
                        <h2 className="text-xl font-semibold">Shift Not Active</h2>
                        <p>Open a shift to start processing transactions.</p>
                    </div>
                ) : (
                    <div className="flex-1 flex gap-4 overflow-hidden h-full">
                        {/* LEFT: Cart (40%) */}
                        <div className="w-[40%] flex flex-col gap-4 h-full">
                            {/* Customer Info (Simplified) */}
                            <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-200 shrink-0">
                                <div className="flex items-center gap-2 mb-2 text-sm font-bold text-slate-700">
                                    <User size={16} /> Customer Details
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <input
                                        type="text"
                                        placeholder="Name"
                                        className="input-field text-sm py-1.5"
                                        value={customerDetails.name}
                                        onChange={e => setCustomerDetails({ ...customerDetails, name: e.target.value })}
                                    />
                                    <input
                                        type="text"
                                        placeholder="Phone"
                                        className="input-field text-sm py-1.5"
                                        value={customerDetails.phone}
                                        onChange={e => setCustomerDetails({ ...customerDetails, phone: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Cart Component */}
                            <div className="flex-1 min-h-0">
                                <POSCart
                                    items={cartItems}
                                    updateQuantity={updateQuantity}
                                    removeItem={removeItem}
                                />
                            </div>

                            {/* Checkout Button */}
                            <button
                                onClick={() => cartItems.length > 0 && setShowPaymentModal(true)}
                                disabled={cartItems.length === 0}
                                className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white py-4 rounded-xl font-bold text-xl shadow-lg hover:shadow-blue-200 transition-all shrink-0"
                            >
                                Pay Rs. {cartTotal.toFixed(2)}
                            </button>
                        </div>

                        {/* RIGHT: Product Search (60%) */}
                        <div className="w-[60%] h-full">
                            <ProductSearch onAddToCart={addToCart} />
                        </div>
                    </div>
                )}

                {/* Modals */}
                {showPaymentModal && (
                    <PaymentModal
                        totalAmount={cartTotal}
                        onClose={() => setShowPaymentModal(false)}
                        onComplete={handleTransactionComplete}
                    />
                )}
            </div>
        </DashboardLayout>
    );
};

export default POSInterface;

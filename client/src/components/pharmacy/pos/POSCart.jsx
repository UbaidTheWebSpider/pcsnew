import React from 'react';
import { Trash2, Plus, Minus, Tag, AlertCircle } from 'lucide-react';

const POSCart = ({ items, updateQuantity, removeItem, discountItem }) => {
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

    return (
        <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <h2 className="font-bold text-slate-800 flex items-center gap-2">
                    Current Order <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs">{totalItems} items</span>
                </h2>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
                {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8 text-center">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                            <Trash2 className="w-8 h-8 opacity-20" />
                        </div>
                        <p className="font-medium">Cart is empty</p>
                        <p className="text-sm mt-1">Scan items to start billing</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {items.map((item, index) => (
                            <div key={`${item.batchNo}-${index}`} className="p-4 hover:bg-slate-50 transition-colors">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h3 className="font-bold text-slate-800 text-sm">{item.medicineName}</h3>
                                        <p className="text-xs text-slate-500">{item.strength} • {item.form}</p>
                                        <div className="text-[10px] text-slate-400 mt-0.5">Batch: {item.batchNo}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold text-slate-800">Rs. {(item.price * item.quantity).toFixed(2)}</div>
                                        {item.discount > 0 && (
                                            <div className="text-xs text-green-600">-Rs. {((item.price * item.quantity) * (item.discount / 100)).toFixed(2)}</div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between mt-3">
                                    <div className="flex items-center gap-2"> {/* Quantity Controls */}
                                        <button
                                            onClick={() => updateQuantity(index, item.quantity - 1)}
                                            className="w-7 h-7 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-50"
                                            disabled={item.quantity <= 1}
                                        >
                                            <Minus size={14} />
                                        </button>
                                        <span className="w-8 text-center font-bold text-slate-800">{item.quantity}</span>
                                        <button
                                            onClick={() => updateQuantity(index, item.quantity + 1)}
                                            className="w-7 h-7 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200"
                                            disabled={item.quantity >= item.stockQuantity} // Check max stock
                                        >
                                            <Plus size={14} />
                                        </button>
                                    </div>

                                    <div className="flex items-center gap-2"> {/* Actions */}
                                        <div className="relative group">
                                            <button className="text-slate-400 hover:text-blue-600 p-1.5 rounded-lg hover:bg-blue-50 transition-colors">
                                                <Tag size={16} />
                                            </button>
                                            {/* Simple Discount Input Popover could go here, for now using prompt or simplified handler */}
                                        </div>
                                        <button
                                            onClick={() => removeItem(index)}
                                            className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                                {item.quantity >= item.stockQuantity && (
                                    <div className="mt-2 flex items-center gap-1 text-[10px] text-orange-600 font-medium">
                                        <AlertCircle size={10} /> Max stock reached ({item.stockQuantity})
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Bill Summary Footer inside Cart */}
            {items.length > 0 && (
                <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-2">
                    <div className="flex justify-between text-sm text-slate-600">
                        <span>Subtotal</span>
                        <span>Rs. {items.reduce((acc, i) => acc + (i.price * i.quantity), 0).toFixed(2)}</span>
                    </div>
                    {/* Placeholder tax calc - ideally server logic or passed prop */}
                    <div className="flex justify-between text-sm text-slate-600">
                        <span>Tax (0%)</span>
                        <span>Rs. 0.00</span>
                    </div>
                    <div className="flex justify-between text-sm text-green-600 font-medium">
                        <span>Discount</span>
                        <span>-Rs. {items.reduce((acc, i) => acc + ((i.price * i.quantity) * (i.discount / 100)), 0).toFixed(2)}</span>
                    </div>
                    <div className="border-t border-slate-200 pt-3 mt-1">
                        <div className="flex justify-between items-center">
                            <span className="font-bold text-slate-800 text-lg">Total</span>
                            <span className="font-bold text-blue-700 text-xl">
                                Rs. {items.reduce((acc, i) => {
                                    const sub = i.price * i.quantity;
                                    const disc = sub * (i.discount / 100);
                                    return acc + (sub - disc);
                                }, 0).toFixed(2)}
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default POSCart;

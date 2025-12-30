import React, { useState, useEffect } from 'react';
import axiosInstance from '../../../api/axiosConfig';
import { showError, showSuccess } from '../../../utils/sweetalert';
import { Clock, DollarSign, LogOut } from 'lucide-react';

const ShiftManager = ({ onShiftValidated }) => {
    const [currentShift, setCurrentShift] = useState(null);
    const [loading, setLoading] = useState(true);
    const [openingBalance, setOpeningBalance] = useState('');
    const [closingBalance, setClosingBalance] = useState('');
    const [notes, setNotes] = useState('');
    const [showCloseModal, setShowCloseModal] = useState(false);

    useEffect(() => {
        checkCurrentShift();
    }, []);

    const checkCurrentShift = async () => {
        try {
            const token = localStorage.getItem('token');
            const { data } = await axiosInstance.get('/api/pharmacy/pos/shifts/current', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (data.success) {
                setCurrentShift(data.data);
                onShiftValidated(data.data);
            }
        } catch (error) {
            // 404 means no active shift, which is fine
            if (error.response?.status !== 404) {
                console.error('Error checking shift:', error);
            }
            setCurrentShift(null);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenShift = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const { data } = await axiosInstance.post('/api/pharmacy/pos/shifts/open',
                { openingBalance: parseFloat(openingBalance) },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (data.success) {
                showSuccess('Shift opened successfully');
                setCurrentShift(data.data);
                onShiftValidated(data.data);
            }
        } catch (error) {
            console.error('Error opening shift:', error);
            showError(error.response?.data?.message || 'Failed to open shift');
        }
    };

    const handleCloseShift = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const { data } = await axiosInstance.post('/api/pharmacy/pos/shifts/close',
                {
                    closingBalance: parseFloat(closingBalance),
                    notes
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (data.success) {
                showSuccess('Shift closed successfully');
                setCurrentShift(null);
                setShowCloseModal(false);
                onShiftValidated(null);
                // Optionally redirect or refresh
            }
        } catch (error) {
            console.error('Error closing shift:', error);
            showError(error.response?.data?.message || 'Failed to close shift');
        }
    };

    if (loading) {
        return <div className="animate-pulse bg-slate-100 h-16 rounded-lg w-full"></div>;
    }

    // If no shift is open, force user to open one
    if (!currentShift) {
        return (
            <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full animate-scale-in">
                    <div className="flex items-center gap-4 mb-6 text-slate-800">
                        <div className="bg-blue-100 p-3 rounded-full">
                            <Clock className="w-8 h-8 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">Open Your Shift</h2>
                            <p className="text-slate-500 text-sm">You must open a shift to start POS.</p>
                        </div>
                    </div>

                    <form onSubmit={handleOpenShift} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                <DollarSign size={16} /> Opening Cash Balance
                            </label>
                            <input
                                type="number"
                                required
                                min="0"
                                step="0.01"
                                value={openingBalance}
                                onChange={(e) => setOpeningBalance(e.target.value)}
                                className="input-field text-lg"
                                placeholder="0.00"
                                autoFocus
                            />
                            <p className="text-xs text-slate-400">Enter the amount of cash currently in the drawer.</p>
                        </div>
                        <button type="submit" className="btn-primary w-full py-3 text-lg">
                            Start Shift
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="bg-white border border-slate-200 rounded-lg p-3 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="bg-green-100 text-green-700 p-2 rounded-lg">
                        <Clock size={20} />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Shift Active</p>
                        <p className="text-sm font-bold text-slate-800">
                            Started: {new Date(currentShift.shiftStart).toLocaleTimeString()}
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => setShowCloseModal(true)}
                    className="flex items-center gap-2 text-slate-500 hover:text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium"
                >
                    <LogOut size={16} />
                    Close
                </button>
            </div>

            {showCloseModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full animate-scale-in">
                        <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <LogOut className="text-red-500" /> Close Shift
                        </h2>
                        <form onSubmit={handleCloseShift} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Closing Cash Balance</label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    step="0.01"
                                    value={closingBalance}
                                    onChange={(e) => setClosingBalance(e.target.value)}
                                    className="input-field"
                                    placeholder="0.00"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Notes (Optional)</label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    className="input-field h-24"
                                    placeholder="Any discrepancies or comments..."
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowCloseModal(false)}
                                    className="btn-secondary flex-1"
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary bg-red-600 hover:bg-red-700 flex-1">
                                    Close Shift
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default ShiftManager;

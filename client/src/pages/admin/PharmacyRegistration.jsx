import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosConfig';
import Swal from 'sweetalert2';
import {
    CheckCircle,
    AlertCircle,
    ArrowLeft,
    ArrowRight,
    Save,
    Send,
    Check
} from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';

// Import tab components
import BasicPharmacyProfile from '../../components/pharmacy/BasicPharmacyProfile';
import LicensingCompliance from '../../components/pharmacy/LicensingCompliance';
import AssignedPharmacist from '../../components/pharmacy/AssignedPharmacist';
import PhysicalLocation from '../../components/pharmacy/PhysicalLocation';
import SystemConfiguration from '../../components/pharmacy/SystemConfiguration';
import InventoryInitialization from '../../components/pharmacy/InventoryInitialization';
import ComplianceAudit from '../../components/pharmacy/ComplianceAudit';
import ApprovalActivation from '../../components/pharmacy/ApprovalActivation';

const PharmacyRegistration = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form data state
    const [formData, setFormData] = useState({
        basicProfile: {
            pharmacyName: '',
            pharmacyType: '',
            hospitalBranch: '',
            pharmacyCode: '',
            operationalStatus: 'Inactive'
        },
        licensing: {
            licenseNumber: '',
            licenseType: 'Hospital Pharmacy',
            licenseExpiry: '',
            inspectionStatus: 'Pending'
        },
        assignedPharmacist: {
            chiefPharmacist: '',
            registrationNumber: '',
            qualification: '',
            dutySchedule: {
                shift: '',
                startTime: '',
                endTime: ''
            },
            backupPharmacist: ''
        },
        physicalLocation: {
            floor: '',
            wing: '',
            counterNumbers: [],
            storageRoomId: '',
            controlledDrugsCabinet: false,
            coldStorageAvailable: false
        },
        systemConfiguration: {
            inventoryModuleAccess: true,
            prescriptionIntegration: [],
            billingPOSIntegration: true,
            insurancePanelAccess: false,
            barcodeScanningEnabled: false
        },
        inventorySettings: {
            defaultDrugCategories: [],
            reorderThreshold: 10,
            controlledDrugTracking: false,
            expiryAlertDays: 30
        },
        complianceControls: {
            auditLoggingEnabled: true,
            pharmacistApprovalRequired: true,
            prescriptionMandatory: true,
            expiredDrugLock: true
        },
        approvalWorkflow: {
            approvalStatus: 'Draft',
            remarks: ''
        }
    });

    // Tab completion status
    const [tabCompletion, setTabCompletion] = useState({
        0: false, // Basic Profile
        1: false, // Licensing
        2: false, // Pharmacist
        3: false, // Location
        4: false, // System Config
        5: true,  // Inventory (optional)
        6: true,  // Compliance (defaults set)
        7: false  // Approval
    });

    const tabs = [
        { id: 0, name: 'Basic Profile', required: true },
        { id: 1, name: 'Licensing', required: true },
        { id: 2, name: 'Pharmacist', required: true },
        { id: 3, name: 'Location', required: true },
        { id: 4, name: 'System Config', required: true },
        { id: 5, name: 'Inventory', required: false },
        { id: 6, name: 'Compliance', required: true },
        { id: 7, name: 'Approval', required: true }
    ];

    // Update form data
    const updateFormData = useCallback((section, data) => {
        setFormData(prev => ({
            ...prev,
            [section]: { ...prev[section], ...data }
        }));
    }, []);

    // Update tab completion
    const updateTabCompletion = useCallback((tabId, isComplete) => {
        setTabCompletion(prev => ({
            ...prev,
            [tabId]: isComplete
        }));
    }, []);

    // Check if can proceed to next tab
    const canProceed = () => {
        return tabCompletion[activeTab] || !tabs[activeTab].required;
    };

    // Check if can submit
    const canSubmit = () => {
        return tabs.every((tab, index) =>
            !tab.required || tabCompletion[index]
        );
    };

    // Handle save as draft
    const handleSaveDraft = async () => {
        try {
            setIsSubmitting(true);
            const token = localStorage.getItem('token');

            const response = await axiosInstance.post('/api/pharmacies', formData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            Swal.fire({
                icon: 'success',
                title: 'Draft Saved',
                text: 'Pharmacy registration saved as draft successfully',
                confirmButtonColor: '#3b82f6'
            });

            navigate('/admin/pharmacies');
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.response?.data?.message || 'Failed to save draft',
                confirmButtonColor: '#ef4444'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle submit for approval
    const handleSubmit = async () => {
        if (!canSubmit()) {
            Swal.fire({
                icon: 'warning',
                title: 'Incomplete Form',
                text: 'Please complete all required tabs before submitting',
                confirmButtonColor: '#f59e0b'
            });
            return;
        }

        try {
            setIsSubmitting(true);
            const token = localStorage.getItem('token');

            // Clean data before submission
            const submitData = {
                ...formData,
                approvalWorkflow: {
                    ...formData.approvalWorkflow,
                    approvalStatus: 'Submitted'
                }
            };

            // Handle optional ObjectId fields: remove if empty string
            if (submitData.assignedPharmacist) {
                if (!submitData.assignedPharmacist.backupPharmacist) {
                    delete submitData.assignedPharmacist.backupPharmacist;
                } else if (submitData.assignedPharmacist.backupPharmacist === '') {
                    delete submitData.assignedPharmacist.backupPharmacist;
                }
            }
            // Add other optional fields cleanup if necessary

            const response = await axiosInstance.post('/api/pharmacies', submitData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            Swal.fire({
                icon: 'success',
                title: 'Submitted Successfully',
                html: `
          <p>Pharmacy registration submitted for approval</p>
          <p class="font-bold mt-2">Pharmacy Code: ${response.data.pharmacy.basicProfile.pharmacyCode}</p>
        `,
                confirmButtonColor: '#10b981'
            });

            navigate('/admin/pharmacies');
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Submission Failed',
                text: error.response?.data?.message || 'Failed to submit pharmacy registration',
                confirmButtonColor: '#ef4444'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Render active tab content
    const renderTabContent = () => {
        switch (activeTab) {
            case 0:
                return (
                    <BasicPharmacyProfile
                        data={formData.basicProfile}
                        updateData={(data) => updateFormData('basicProfile', data)}
                        updateCompletion={(isComplete) => updateTabCompletion(0, isComplete)}
                    />
                );
            case 1:
                return (
                    <LicensingCompliance
                        data={formData.licensing}
                        updateData={(data) => updateFormData('licensing', data)}
                        updateCompletion={(isComplete) => updateTabCompletion(1, isComplete)}
                    />
                );
            case 2:
                return (
                    <AssignedPharmacist
                        data={formData.assignedPharmacist}
                        updateData={(data) => updateFormData('assignedPharmacist', data)}
                        updateCompletion={(isComplete) => updateTabCompletion(2, isComplete)}
                    />
                );
            case 3:
                return (
                    <PhysicalLocation
                        data={formData.physicalLocation}
                        updateData={(data) => updateFormData('physicalLocation', data)}
                        updateCompletion={(isComplete) => updateTabCompletion(3, isComplete)}
                    />
                );
            case 4:
                return (
                    <SystemConfiguration
                        data={formData.systemConfiguration}
                        updateData={(data) => updateFormData('systemConfiguration', data)}
                        updateCompletion={(isComplete) => updateTabCompletion(4, isComplete)}
                    />
                );
            case 5:
                return (
                    <InventoryInitialization
                        data={formData.inventorySettings}
                        updateData={(data) => updateFormData('inventorySettings', data)}
                        updateCompletion={(isComplete) => updateTabCompletion(5, isComplete)}
                    />
                );
            case 6:
                return (
                    <ComplianceAudit
                        data={formData.complianceControls}
                        updateData={(data) => updateFormData('complianceControls', data)}
                        updateCompletion={(isComplete) => updateTabCompletion(6, isComplete)}
                    />
                );
            case 7:
                return (
                    <ApprovalActivation
                        data={formData.approvalWorkflow}
                        updateData={(data) => updateFormData('approvalWorkflow', data)}
                        updateCompletion={(isComplete) => updateTabCompletion(7, isComplete)}
                        pharmacyData={formData}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <DashboardLayout>
            <div className="p-8">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <button
                            onClick={() => navigate('/admin/pharmacies')}
                            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
                        >
                            <ArrowLeft size={20} />
                            Back to Pharmacies
                        </button>
                        <h1 className="text-3xl font-bold text-gray-800">Register New Pharmacy</h1>
                        <p className="text-gray-500 mt-1">Complete all required tabs to register a pharmacy in the hospital system</p>
                    </div>

                    {/* Tab Navigation */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6 overflow-x-auto">
                        <div className="flex">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex-1 min-w-[140px] px-4 py-4 font-medium text-sm transition-all relative ${activeTab === tab.id
                                        ? 'text-blue-600 bg-blue-50 border-b-2 border-blue-600'
                                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                        }`}
                                >
                                    <div className="flex items-center justify-center gap-2">
                                        <span>{tab.name}</span>
                                        {!tab.required && (
                                            <span className="text-xs text-gray-400">(Optional)</span>
                                        )}
                                        {tabCompletion[tab.id] && (
                                            <CheckCircle size={16} className="text-green-500" />
                                        )}
                                        {!tabCompletion[tab.id] && tab.required && activeTab !== tab.id && (
                                            <AlertCircle size={16} className="text-orange-400" />
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Tab Content */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-6 min-h-[500px]">
                        {renderTabContent()}
                    </div>

                    {/* Navigation Buttons */}
                    <div className="flex justify-between items-center">
                        <button
                            onClick={() => setActiveTab(Math.max(0, activeTab - 1))}
                            disabled={activeTab === 0}
                            className="flex items-center gap-2 px-6 py-3 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ArrowLeft size={20} />
                            Previous
                        </button>

                        <div className="flex gap-3">
                            <button
                                onClick={handleSaveDraft}
                                disabled={isSubmitting}
                                className="flex items-center gap-2 px-6 py-3 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                            >
                                <Save size={20} />
                                Save as Draft
                            </button>

                            {activeTab === tabs.length - 1 ? (
                                <button
                                    onClick={handleSubmit}
                                    disabled={!canSubmit() || isSubmitting}
                                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <Send size={20} />
                                    Submit for Approval
                                </button>
                            ) : (
                                <button
                                    onClick={() => setActiveTab(Math.min(tabs.length - 1, activeTab + 1))}
                                    disabled={!canProceed()}
                                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Next
                                    <ArrowRight size={20} />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Progress Indicator */}
                    <div className="mt-6 text-center text-sm text-gray-500">
                        Tab {activeTab + 1} of {tabs.length} •
                        {tabs.filter((_, idx) => tabCompletion[idx]).length} of {tabs.filter(t => t.required).length} required tabs completed
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default PharmacyRegistration;

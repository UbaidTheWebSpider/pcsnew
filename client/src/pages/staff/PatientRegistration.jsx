import React, { useState, useEffect } from "react";
import { User, Calendar, Phone, Activity, FileText, CheckCircle, Search, Trash2, Edit, X } from "lucide-react";
import Swal from "sweetalert2";
import DashboardLayout from "../../components/DashboardLayout";
import { registerPatient, getAllPatients, deletePatient, updatePatient, getPatientById } from "../../services/staffPatientService";

// --- Tab Components ---
const TabButton = ({ active, onClick, icon: Icon, label }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors duration-200 font-medium ${active
            ? "border-blue-600 text-blue-600"
            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
    >
        <Icon className="w-4 h-4" />
        {label}
    </button>
);

const InputField = ({ label, name, value, onChange, type = "text", required = false, options = null }) => (
    <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        {options ? (
            <select
                name={name}
                value={value}
                onChange={onChange}
                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
                <option value="">Select {label}</option>
                {options.map((opt) => (
                    <option key={opt} value={opt}>
                        {opt}
                    </option>
                ))}
            </select>
        ) : (
            <input
                type={type}
                name={name}
                value={value}
                onChange={onChange}
                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
        )}
    </div>
);

// --- Main Component ---
const PatientRegistration = () => {
    const [activeTab, setActiveTab] = useState(0);
    const [loading, setLoading] = useState(false);
    const [patients, setPatients] = useState([]);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingPatient, setEditingPatient] = useState(null);
    const [formData, setFormData] = useState({
        personalInfo: {
            fullName: "",
            cnic: "",
            gender: "",
            dateOfBirth: "",
            bloodGroup: "",
        },
        contactInfo: {
            mobileNumber: "",
            email: "",
            address: "",
            city: "",
            province: "",
            emergencyContact: { name: "", phone: "", relation: "" },
        },
        admissionDetails: {
            patientType: "OPD",
            department: "",
            visitReason: "",
            admissionDate: new Date().toISOString().split("T")[0],
        },
        medicalBackground: {
            allergies: "",
            chronicDiseases: "",
            currentMedications: "",
            notes: "",
        },
    });

    // Fetch Patients on Load
    useEffect(() => {
        fetchPatients();
    }, []);

    const fetchPatients = async () => {
        try {
            const { data } = await getAllPatients();
            setPatients(data || []);
        } catch (error) {
            console.error("Failed to fetch patients", error);
        }
    };

    const handleInputChange = (section, field, value) => {
        setFormData((prev) => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: value,
            },
        }));
    };

    const handleNestedChange = (section, parentField, field, value) => {
        setFormData((prev) => ({
            ...prev,
            [section]: {
                ...prev[section],
                [parentField]: {
                    ...prev[section][parentField],
                    [field]: value,
                },
            },
        }));
    };

    const validateTab = (tabIndex) => {
        const { personalInfo, contactInfo, admissionDetails } = formData;
        if (tabIndex === 0) {
            if (!personalInfo.fullName || !personalInfo.gender || !personalInfo.dateOfBirth) {
                Swal.fire("Error", "Please fill required Personal Info fields", "error");
                return false;
            }
        }
        if (tabIndex === 1) {
            if (!contactInfo.mobileNumber || !contactInfo.address) {
                Swal.fire("Error", "Please fill required Contact Info fields", "error");
                return false;
            }
        }
        if (tabIndex === 2) {
            if (!admissionDetails.department || !admissionDetails.patientType) {
                Swal.fire("Error", "Please fill required Admission Details", "error");
                return false;
            }
        }
        return true;
    };

    const handleNext = () => {
        if (validateTab(activeTab)) setActiveTab((prev) => Math.min(prev + 1, 4));
    };

    const handlePrev = () => setActiveTab((prev) => Math.max(prev - 1, 0));

    const handleSubmit = async () => {
        setLoading(true);
        try {
            // Process arrays from comma-separated strings
            const payload = {
                ...formData,
                medicalBackground: {
                    ...formData.medicalBackground,
                    allergies: formData.medicalBackground.allergies.split(",").map((s) => s.trim()).filter(Boolean),
                    chronicDiseases: formData.medicalBackground.chronicDiseases.split(",").map((s) => s.trim()).filter(Boolean),
                    currentMedications: formData.medicalBackground.currentMedications.split(",").map((s) => s.trim()).filter(Boolean),
                },
            };

            await registerPatient(payload);
            Swal.fire("Success", "Patient Registered Successfully", "success");

            // Reset Form
            setFormData({
                personalInfo: { fullName: "", cnic: "", gender: "", dateOfBirth: "", bloodGroup: "" },
                contactInfo: { mobileNumber: "", email: "", address: "", city: "", province: "", emergencyContact: { name: "", phone: "", relation: "" } },
                admissionDetails: { patientType: "OPD", department: "", visitReason: "", admissionDate: new Date().toISOString().split("T")[0] },
                medicalBackground: { allergies: "", chronicDiseases: "", currentMedications: "", notes: "" },
            });
            setActiveTab(0);
            fetchPatients();

        } catch (error) {
            Swal.fire("Error", error.response?.data?.message || "Registration Failed", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "This will effectively remove the patient from active lists.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            try {
                await deletePatient(id);
                Swal.fire('Deleted!', 'Patient has been deleted.', 'success');
                fetchPatients();
            } catch (error) {
                Swal.fire('Error', 'Failed to delete patient', 'error');
            }
        }
    };

    const handleEdit = async (patient) => {
        setEditingPatient(patient);
        // Convert arrays back to comma-separated strings for editing
        setFormData({
            personalInfo: patient.personalInfo,
            contactInfo: patient.contactInfo,
            admissionDetails: patient.admissionDetails,
            medicalBackground: {
                allergies: patient.medicalBackground.allergies?.join(', ') || '',
                chronicDiseases: patient.medicalBackground.chronicDiseases?.join(', ') || '',
                currentMedications: patient.medicalBackground.currentMedications?.join(', ') || '',
                notes: patient.medicalBackground.notes || ''
            }
        });
        setEditModalOpen(true);
        setActiveTab(0);
    };

    const handleUpdate = async () => {
        setLoading(true);
        try {
            const payload = {
                ...formData,
                medicalBackground: {
                    ...formData.medicalBackground,
                    allergies: formData.medicalBackground.allergies.split(",").map((s) => s.trim()).filter(Boolean),
                    chronicDiseases: formData.medicalBackground.chronicDiseases.split(",").map((s) => s.trim()).filter(Boolean),
                    currentMedications: formData.medicalBackground.currentMedications.split(",").map((s) => s.trim()).filter(Boolean),
                },
            };

            await updatePatient(editingPatient._id, payload);
            Swal.fire("Success", "Patient Updated Successfully", "success");

            setEditModalOpen(false);
            setEditingPatient(null);
            setFormData({
                personalInfo: { fullName: "", cnic: "", gender: "", dateOfBirth: "", bloodGroup: "" },
                contactInfo: { mobileNumber: "", email: "", address: "", city: "", province: "", emergencyContact: { name: "", phone: "", relation: "" } },
                admissionDetails: { patientType: "OPD", department: "", visitReason: "", admissionDate: new Date().toISOString().split("T")[0] },
                medicalBackground: { allergies: "", chronicDiseases: "", currentMedications: "", notes: "" },
            });
            setActiveTab(0);
            fetchPatients();

        } catch (error) {
            Swal.fire("Error", error.response?.data?.message || "Update Failed", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="p-6 max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-800 mb-6">Patient Registration</h1>

                {/* --- FORM SECTION --- */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden mb-8">
                    {/* Tabs Header */}
                    <div className="flex border-b overflow-x-auto bg-gray-50">
                        <TabButton active={activeTab === 0} onClick={() => setActiveTab(0)} icon={User} label="Personal ID" />
                        <TabButton active={activeTab === 1} onClick={() => setActiveTab(1)} icon={Phone} label="Contact Info" />
                        <TabButton active={activeTab === 2} onClick={() => setActiveTab(2)} icon={Activity} label="Admission" />
                        <TabButton active={activeTab === 3} onClick={() => setActiveTab(3)} icon={FileText} label="Medical History" />
                        <TabButton active={activeTab === 4} onClick={() => setActiveTab(4)} icon={CheckCircle} label="Review & Submit" />
                    </div>

                    {/* Form Content */}
                    <div className="p-6 min-h-[400px]">
                        {activeTab === 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
                                <InputField label="Full Name" value={formData.personalInfo.fullName} onChange={(e) => handleInputChange("personalInfo", "fullName", e.target.value)} required />
                                <InputField label="CNIC / National ID" value={formData.personalInfo.cnic} onChange={(e) => handleInputChange("personalInfo", "cnic", e.target.value)} />
                                <InputField label="Date of Birth" type="date" value={formData.personalInfo.dateOfBirth ? new Date(formData.personalInfo.dateOfBirth).toISOString().split('T')[0] : ''} onChange={(e) => handleInputChange("personalInfo", "dateOfBirth", e.target.value)} required />
                                <InputField label="Gender" value={formData.personalInfo.gender} onChange={(e) => handleInputChange("personalInfo", "gender", e.target.value)} required options={["Male", "Female", "Other"]} />
                                <InputField label="Blood Group" value={formData.personalInfo.bloodGroup} onChange={(e) => handleInputChange("personalInfo", "bloodGroup", e.target.value)} options={["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]} />
                            </div>
                        )}

                        {activeTab === 1 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
                                <InputField label="Mobile Number" value={formData.contactInfo.mobileNumber} onChange={(e) => handleInputChange("contactInfo", "mobileNumber", e.target.value)} required />
                                <InputField label="Email Address" type="email" value={formData.contactInfo.email} onChange={(e) => handleInputChange("contactInfo", "email", e.target.value)} />
                                <div className="md:col-span-2">
                                    <InputField label="Full Address" value={formData.contactInfo.address} onChange={(e) => handleInputChange("contactInfo", "address", e.target.value)} required />
                                </div>
                                <InputField label="City" value={formData.contactInfo.city} onChange={(e) => handleInputChange("contactInfo", "city", e.target.value)} />
                                <InputField label="Province" value={formData.contactInfo.province} onChange={(e) => handleInputChange("contactInfo", "province", e.target.value)} />

                                <h3 className="md:col-span-2 font-semibold text-gray-700 mt-4 border-b pb-2">Emergency Contact</h3>
                                <InputField label="Contact Name" value={formData.contactInfo.emergencyContact.name} onChange={(e) => handleNestedChange("contactInfo", "emergencyContact", "name", e.target.value)} />
                                <InputField label="Contact Phone" value={formData.contactInfo.emergencyContact.phone} onChange={(e) => handleNestedChange("contactInfo", "emergencyContact", "phone", e.target.value)} />
                                <InputField label="Relation" value={formData.contactInfo.emergencyContact.relation} onChange={(e) => handleNestedChange("contactInfo", "emergencyContact", "relation", e.target.value)} />
                            </div>
                        )}

                        {activeTab === 2 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
                                <InputField label="Patient Type" value={formData.admissionDetails.patientType} onChange={(e) => handleInputChange("admissionDetails", "patientType", e.target.value)} required options={["OPD", "IPD", "ER"]} />
                                <InputField label="Department" value={formData.admissionDetails.department} onChange={(e) => handleInputChange("admissionDetails", "department", e.target.value)} required options={["General", "Cardiology", "Neurology", "Orthopedics", "Pediatrics", "Gynecology"]} />
                                <InputField label="Admission Date" type="date" value={formData.admissionDetails.admissionDate} onChange={(e) => handleInputChange("admissionDetails", "admissionDate", e.target.value)} />
                                <div className="md:col-span-2">
                                    <InputField label="Reason for Visit" value={formData.admissionDetails.visitReason} onChange={(e) => handleInputChange("admissionDetails", "visitReason", e.target.value)} />
                                </div>
                            </div>
                        )}

                        {activeTab === 3 && (
                            <div className="space-y-4 animate-fadeIn">
                                <InputField label="Allergies (comma separated)" value={formData.medicalBackground.allergies} onChange={(e) => handleInputChange("medicalBackground", "allergies", e.target.value)} />
                                <InputField label="Chronic Diseases (comma separated)" value={formData.medicalBackground.chronicDiseases} onChange={(e) => handleInputChange("medicalBackground", "chronicDiseases", e.target.value)} />
                                <InputField label="Current Medications (comma separated)" value={formData.medicalBackground.currentMedications} onChange={(e) => handleInputChange("medicalBackground", "currentMedications", e.target.value)} />
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Medical Notes</label>
                                    <textarea
                                        className="w-full border border-gray-300 rounded-lg p-2 h-32 focus:ring-2 focus:ring-blue-500"
                                        value={formData.medicalBackground.notes}
                                        onChange={(e) => handleInputChange("medicalBackground", "notes", e.target.value)}
                                    ></textarea>
                                </div>
                            </div>
                        )}

                        {activeTab === 4 && (
                            <div className="animate-fadeIn">
                                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                                    <h3 className="text-xl font-bold text-gray-800 mb-4">Confirm Registration Details</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                        <div className="p-3 bg-white rounded border">
                                            <span className="block text-gray-500 text-xs uppercase">Full Name</span>
                                            <span className="font-semibold">{formData.personalInfo.fullName}</span>
                                        </div>
                                        <div className="p-3 bg-white rounded border">
                                            <span className="block text-gray-500 text-xs uppercase">CNIC</span>
                                            <span className="font-semibold">{formData.personalInfo.cnic || 'N/A'}</span>
                                        </div>
                                        <div className="p-3 bg-white rounded border">
                                            <span className="block text-gray-500 text-xs uppercase">Type</span>
                                            <span className="font-semibold text-blue-600">{formData.admissionDetails.patientType}</span>
                                        </div>
                                        <div className="p-3 bg-white rounded border">
                                            <span className="block text-gray-500 text-xs uppercase">Department</span>
                                            <span className="font-semibold">{formData.admissionDetails.department}</span>
                                        </div>
                                        <div className="p-3 bg-white rounded border md:col-span-2">
                                            <span className="block text-gray-500 text-xs uppercase">Address</span>
                                            <span className="font-semibold">{formData.contactInfo.address}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer Actions */}
                    <div className="bg-gray-50 p-4 border-t flex justify-between items-center">
                        <button
                            onClick={handlePrev}
                            disabled={activeTab === 0}
                            className={`px-6 py-2 rounded-lg font-medium transition ${activeTab === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-200'}`}
                        >
                            Back
                        </button>

                        {activeTab < 4 ? (
                            <button
                                onClick={handleNext}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2 rounded-lg font-medium shadow-sm transition"
                            >
                                Next Step
                            </button>
                        ) : (
                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="bg-green-600 hover:bg-green-700 text-white px-8 py-2 rounded-lg font-medium shadow-sm transition flex items-center gap-2"
                            >
                                {loading ? 'Registering...' : 'Confirm Registration'}
                                {!loading && <CheckCircle className="w-5 h-5" />}
                            </button>
                        )}
                    </div>
                </div>

                {/* --- EDIT MODAL --- */}
                {editModalOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                            {/* Modal Header */}
                            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                                <h2 className="text-2xl font-bold text-gray-800">Edit Patient - {editingPatient?.patientId}</h2>
                                <button
                                    onClick={() => {
                                        setEditModalOpen(false);
                                        setEditingPatient(null);
                                        setActiveTab(0);
                                    }}
                                    className="text-gray-500 hover:text-gray-700 p-2"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            {/* Modal Content - Reuse Form */}
                            <div className="p-6">
                                {/* Tabs Header */}
                                <div className="flex border-b overflow-x-auto bg-gray-50 rounded-t-lg mb-6">
                                    <TabButton active={activeTab === 0} onClick={() => setActiveTab(0)} icon={User} label="Personal ID" />
                                    <TabButton active={activeTab === 1} onClick={() => setActiveTab(1)} icon={Phone} label="Contact Info" />
                                    <TabButton active={activeTab === 2} onClick={() => setActiveTab(2)} icon={Activity} label="Admission" />
                                    <TabButton active={activeTab === 3} onClick={() => setActiveTab(3)} icon={FileText} label="Medical History" />
                                    <TabButton active={activeTab === 4} onClick={() => setActiveTab(4)} icon={CheckCircle} label="Review" />
                                </div>

                                {/* Form Content */}
                                <div className="min-h-[300px]">
                                    {activeTab === 0 && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
                                            <InputField label="Full Name" value={formData.personalInfo.fullName} onChange={(e) => handleInputChange("personalInfo", "fullName", e.target.value)} required />
                                            <InputField label="CNIC / National ID" value={formData.personalInfo.cnic} onChange={(e) => handleInputChange("personalInfo", "cnic", e.target.value)} />
                                            <InputField label="Date of Birth" type="date" value={formData.personalInfo.dateOfBirth ? new Date(formData.personalInfo.dateOfBirth).toISOString().split('T')[0] : ''} onChange={(e) => handleInputChange("personalInfo", "dateOfBirth", e.target.value)} required />
                                            <InputField label="Gender" value={formData.personalInfo.gender} onChange={(e) => handleInputChange("personalInfo", "gender", e.target.value)} required options={["Male", "Female", "Other"]} />
                                            <InputField label="Blood Group" value={formData.personalInfo.bloodGroup} onChange={(e) => handleInputChange("personalInfo", "bloodGroup", e.target.value)} options={["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]} />
                                        </div>
                                    )}

                                    {activeTab === 1 && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
                                            <InputField label="Mobile Number" value={formData.contactInfo.mobileNumber} onChange={(e) => handleInputChange("contactInfo", "mobileNumber", e.target.value)} required />
                                            <InputField label="Email Address" type="email" value={formData.contactInfo.email} onChange={(e) => handleInputChange("contactInfo", "email", e.target.value)} />
                                            <div className="md:col-span-2">
                                                <InputField label="Full Address" value={formData.contactInfo.address} onChange={(e) => handleInputChange("contactInfo", "address", e.target.value)} required />
                                            </div>
                                            <InputField label="City" value={formData.contactInfo.city} onChange={(e) => handleInputChange("contactInfo", "city", e.target.value)} />
                                            <InputField label="Province" value={formData.contactInfo.province} onChange={(e) => handleInputChange("contactInfo", "province", e.target.value)} />

                                            <h3 className="md:col-span-2 font-semibold text-gray-700 mt-4 border-b pb-2">Emergency Contact</h3>
                                            <InputField label="Contact Name" value={formData.contactInfo.emergencyContact.name} onChange={(e) => handleNestedChange("contactInfo", "emergencyContact", "name", e.target.value)} />
                                            <InputField label="Contact Phone" value={formData.contactInfo.emergencyContact.phone} onChange={(e) => handleNestedChange("contactInfo", "emergencyContact", "phone", e.target.value)} />
                                            <InputField label="Relation" value={formData.contactInfo.emergencyContact.relation} onChange={(e) => handleNestedChange("contactInfo", "emergencyContact", "relation", e.target.value)} />
                                        </div>
                                    )}

                                    {activeTab === 2 && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
                                            <InputField label="Patient Type" value={formData.admissionDetails.patientType} onChange={(e) => handleInputChange("admissionDetails", "patientType", e.target.value)} required options={["OPD", "IPD", "ER"]} />
                                            <InputField label="Department" value={formData.admissionDetails.department} onChange={(e) => handleInputChange("admissionDetails", "department", e.target.value)} required options={["General", "Cardiology", "Neurology", "Orthopedics", "Pediatrics", "Gynecology"]} />
                                            <InputField label="Admission Date" type="date" value={formData.admissionDetails.admissionDate} onChange={(e) => handleInputChange("admissionDetails", "admissionDate", e.target.value)} />
                                            <div className="md:col-span-2">
                                                <InputField label="Reason for Visit" value={formData.admissionDetails.visitReason} onChange={(e) => handleInputChange("admissionDetails", "visitReason", e.target.value)} />
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === 3 && (
                                        <div className="space-y-4 animate-fadeIn">
                                            <InputField label="Allergies (comma separated)" value={formData.medicalBackground.allergies} onChange={(e) => handleInputChange("medicalBackground", "allergies", e.target.value)} />
                                            <InputField label="Chronic Diseases (comma separated)" value={formData.medicalBackground.chronicDiseases} onChange={(e) => handleInputChange("medicalBackground", "chronicDiseases", e.target.value)} />
                                            <InputField label="Current Medications (comma separated)" value={formData.medicalBackground.currentMedications} onChange={(e) => handleInputChange("medicalBackground", "currentMedications", e.target.value)} />
                                            <div className="mb-4">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Medical Notes</label>
                                                <textarea
                                                    className="w-full border border-gray-300 rounded-lg p-2 h-32 focus:ring-2 focus:ring-blue-500"
                                                    value={formData.medicalBackground.notes}
                                                    onChange={(e) => handleInputChange("medicalBackground", "notes", e.target.value)}
                                                ></textarea>
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === 4 && (
                                        <div className="animate-fadeIn">
                                            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                                                <h3 className="text-xl font-bold text-gray-800 mb-4">Confirm Update Details</h3>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                                    <div className="p-3 bg-white rounded border">
                                                        <span className="block text-gray-500 text-xs uppercase">Full Name</span>
                                                        <span className="font-semibold">{formData.personalInfo.fullName}</span>
                                                    </div>
                                                    <div className="p-3 bg-white rounded border">
                                                        <span className="block text-gray-500 text-xs uppercase">CNIC</span>
                                                        <span className="font-semibold">{formData.personalInfo.cnic || 'N/A'}</span>
                                                    </div>
                                                    <div className="p-3 bg-white rounded border">
                                                        <span className="block text-gray-500 text-xs uppercase">Type</span>
                                                        <span className="font-semibold text-blue-600">{formData.admissionDetails.patientType}</span>
                                                    </div>
                                                    <div className="p-3 bg-white rounded border">
                                                        <span className="block text-gray-500 text-xs uppercase">Department</span>
                                                        <span className="font-semibold">{formData.admissionDetails.department}</span>
                                                    </div>
                                                    <div className="p-3 bg-white rounded border md:col-span-2">
                                                        <span className="block text-gray-500 text-xs uppercase">Address</span>
                                                        <span className="font-semibold">{formData.contactInfo.address}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Modal Footer */}
                                <div className="flex justify-between items-center mt-6 pt-4 border-t">
                                    <button
                                        onClick={handlePrev}
                                        disabled={activeTab === 0}
                                        className={`px-6 py-2 rounded-lg font-medium transition ${activeTab === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-200'}`}
                                    >
                                        Back
                                    </button>

                                    {activeTab < 4 ? (
                                        <button
                                            onClick={handleNext}
                                            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2 rounded-lg font-medium shadow-sm transition"
                                        >
                                            Next Step
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleUpdate}
                                            disabled={loading}
                                            className="bg-green-600 hover:bg-green-700 text-white px-8 py-2 rounded-lg font-medium shadow-sm transition flex items-center gap-2"
                                        >
                                            {loading ? 'Updating...' : 'Update Patient'}
                                            {!loading && <CheckCircle className="w-5 h-5" />}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- TABLE SECTION --- */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b flex justify-between items-center">
                        <h2 className="text-xl font-bold text-gray-800">Recent Registrations</h2>
                        <div className="relative">
                            <Search className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search patients..."
                                className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none w-64"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-gray-600 font-semibold text-sm uppercase">
                                <tr>
                                    <th className="p-4">Patient ID</th>
                                    <th className="p-4">Name / CNIC</th>
                                    <th className="p-4">Contact</th>
                                    <th className="p-4">Admission</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {patients.length > 0 ? patients.map((patient) => (
                                    <tr key={patient._id} className="hover:bg-gray-50 transition">
                                        <td className="p-4 font-mono text-sm font-medium text-blue-600">{patient.patientId}</td>
                                        <td className="p-4">
                                            <div className="font-semibold text-gray-800">{patient.personalInfo.fullName}</div>
                                            <div className="text-xs text-gray-500">{patient.personalInfo.cnic || 'No CNIC'}</div>
                                        </td>
                                        <td className="p-4 text-sm text-gray-600">
                                            <div>{patient.contactInfo.mobileNumber}</div>
                                            <div className="text-xs text-gray-400 truncate w-32">{patient.contactInfo.address}</div>
                                        </td>
                                        <td className="p-4">
                                            <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium mb-1">
                                                {patient.admissionDetails.patientType}
                                            </span>
                                            <div className="text-xs text-gray-500">{patient.admissionDetails.department}</div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${patient.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {patient.isActive ? 'Active' : 'Archived'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <button onClick={() => handleEdit(patient)} className="text-blue-500 hover:text-blue-700 p-2"><Edit className="w-4 h-4" /></button>
                                            <button onClick={() => handleDelete(patient._id)} className="text-red-500 hover:text-red-700 p-2"><Trash2 className="w-4 h-4" /></button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="6" className="p-8 text-center text-gray-500">No patients found. Register your first patient above.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default PatientRegistration;

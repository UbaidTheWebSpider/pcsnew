import { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../../api/axiosConfig';
import DashboardLayout from '../../components/DashboardLayout';
import {
    UserPlus, Save, RefreshCw, AlertCircle, CheckCircle, User, FileText, Phone, Activity,
    Search, Trash2, Edit, ChevronLeft, ChevronRight, Filter, X, Calendar
} from 'lucide-react';
import Swal from 'sweetalert2';
import { mapStaffPatientsToDisplay } from '../../utils/patientMapper';

const PatientAdmission = () => {
    // Admission Form State
    const [loading, setLoading] = useState(false);
    const [doctors, setDoctors] = useState([]);
    const [activeSection, setActiveSection] = useState(1);

    // Grid & CRUD State
    const [patients, setPatients] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
    const [searchTerm, setSearchTerm] = useState('');
    const [tableLoading, setTableLoading] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingPatient, setEditingPatient] = useState(null);

    const initialFormState = {
        firstName: '', lastName: '', fatherName: '', gender: 'male',
        dateOfBirth: '', cnic: '', phone: '', address: '',
        admissionDateTime: new Date().toLocaleString(),
        admissionType: 'Emergency', admissionReason: '', department: 'General',
        ward: 'General Ward', assignedDoctorId: '', bedNumber: 'Auto-Assign',
        emergencyContactName: '', emergencyContactRelation: '', emergencyContactPhone: '',
        primaryDiagnosis: '', allergies: '', bloodGroup: 'O+'
    };

    const [formData, setFormData] = useState(initialFormState);
    const [errors, setErrors] = useState({});

    // Debounce Search
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchPatients(1);
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [fetchPatients]);

    // Initial Data Fetch
    useEffect(() => {
        fetchDoctors();
    }, [fetchDoctors]);

    // Clock Interval
    useEffect(() => {
        const timer = setInterval(() => {
            setFormData(prev => ({ ...prev, admissionDateTime: new Date().toLocaleString() }));
        }, 60000);
        return () => clearInterval(timer);
    }, []);

    const fetchDoctors = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            const { data } = await axiosInstance.get('/api/patient/doctors', { headers: { Authorization: `Bearer ${token}` } });
            setDoctors(data.data.doctors || []);
        } catch (error) {
            console.error('Error fetching doctors:', error);
        }
    }, []);

    const fetchPatients = useCallback(async (page = 1) => {
        setTableLoading(true);
        try {
            const token = localStorage.getItem('token');
            const { data } = await axiosInstance.get(`/api/staff/patients`, {
                params: { page, limit: 5, search: searchTerm },
                headers: { Authorization: `Bearer ${token}` }
            });

            if (data.success && data.data) {
                // Map StaffPatient model to display format
                const mappedPatients = mapStaffPatientsToDisplay(data.data);
                setPatients(mappedPatients);
                setPagination({
                    page: data.pagination?.page || 1,
                    totalPages: data.pagination?.totalPages || 1,
                    total: data.pagination?.total || 0
                });
            }
        } catch (error) {
            console.error('Error fetching patients:', error);
        } finally {
            setTableLoading(false);
        }
    }, [searchTerm]);

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            try {
                const token = localStorage.getItem('token');
                await axiosInstance.delete(`/api/staff/patients/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                Swal.fire('Deleted!', 'Patient has been deleted.', 'success');
                fetchPatients(pagination.page);
            } catch {
                Swal.fire('Error', 'Failed to delete patient', 'error');
            }
        }
    };

    const handleEditClick = (patient) => {
        setEditingPatient({ ...patient });
        setShowEditModal(true);
    };

    const handleUpdatePatient = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            // Clean up data for update
            const updatePayload = {
                name: editingPatient.name,
                contact: editingPatient.contact,
                emergencyContact: editingPatient.emergencyContact,
                medicalInfo: editingPatient.medicalInfo
            };

            await axiosInstance.put(`/api/staff/patients/${editingPatient._id}`, updatePayload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setShowEditModal(false);
            setEditingPatient(null);
            Swal.fire('Success', 'Patient updated successfully', 'success');
            fetchPatients(pagination.page);
        } catch (error) {
            Swal.fire('Error', error.response?.data?.message || 'Update failed', 'error');
        }
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.firstName) newErrors.firstName = 'First Name is required';
        if (!formData.lastName) newErrors.lastName = 'Last Name is required';
        if (!formData.cnic || !/^\d{13}$/.test(formData.cnic)) newErrors.cnic = 'CNIC must be 13 digits';
        if (!formData.phone) newErrors.phone = 'Phone is required';
        if (!formData.assignedDoctorId) newErrors.assignedDoctorId = 'Please assign a doctor';
        if (!formData.emergencyContactName) newErrors.emergencyContactName = 'Emergency Contact Name required';
        if (!formData.emergencyContactPhone) newErrors.emergencyContactPhone = 'Emergency Contact Phone required';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const hasError = (fields) => fields.some(field => errors[field]);

    const isSectionComplete = (section) => {
        switch (section) {
            case 1: return formData.firstName && formData.lastName && formData.cnic && formData.phone;
            case 2: return formData.admissionType && formData.assignedDoctorId;
            case 3: return formData.emergencyContactName && formData.emergencyContactPhone;
            case 4: return formData.primaryDiagnosis && formData.bloodGroup;
            default: return false;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) {
            Swal.fire({ icon: 'error', title: 'Validation Error', text: 'Please check the highlighted tabs for errors.' });
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const { data } = await axiosInstance.post('/api/staff/admissions', formData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            Swal.fire({
                icon: 'success',
                title: 'Success!',
                text: `Patient admitted successfully to ${data.data.assignedBed}`,
                confirmButtonColor: '#2563EB'
            });
            handleReset();
            fetchPatients(1); // Refresh grid
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Admission Failed', text: error.response?.data?.message || 'Server Error' });
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setFormData(initialFormState);
        setErrors({});
        setActiveSection(1);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    };

    const TabHeader = ({ number, title, icon: Icon, isActive, onClick, hasError, isComplete }) => (
        <div
            onClick={onClick}
            className={`flex-1 flex items-center justify-center gap-2 py-4 px-2 border-b-2 cursor-pointer transition-all ${isActive
                ? 'border-blue-600 text-blue-700 bg-blue-50'
                : isComplete
                    ? 'border-green-500 text-green-700 bg-green-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
        >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border transition-colors ${isActive
                ? 'bg-blue-600 text-white border-blue-600'
                : hasError
                    ? 'bg-red-100 text-red-600 border-red-200'
                    : isComplete
                        ? 'bg-green-100 text-green-600 border-green-200'
                        : 'bg-white text-gray-500 border-gray-200'
                }`}>
                {isComplete && !hasError && !isActive ? <CheckCircle size={14} /> : number}
            </div>
            <div className="flex flex-col items-start lg:items-center">
                <span className={`text-xs font-semibold uppercase tracking-wider mb-0.5 flex items-center gap-1 ${isActive ? 'text-blue-700' : isComplete ? 'text-green-700' : 'text-gray-500'}`}>
                    {Icon && <Icon size={12} />} {title}
                </span>
            </div>
        </div>
    );

    return (
        <DashboardLayout>
            <div className="p-8 bg-gray-50 min-h-screen">
                <div className="max-w-6xl mx-auto space-y-8">

                    {/* Admission Form Section */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                                    <UserPlus className="text-blue-600" />
                                    Patient Admission
                                </h1>
                                <p className="text-gray-600 mt-1">Register new patient and assign ward/bed</p>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={handleReset} type="button" className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 shadow-sm transition-all hover:shadow">
                                    <RefreshCw size={18} /> Reset
                                </button>
                                <button onClick={handleSubmit} disabled={loading} className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-sm disabled:opacity-50 transition-all hover:shadow-md">
                                    {loading ? 'Saving...' : <><Save size={18} /> Save Admission</>}
                                </button>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            {/* Horizontal Tabs */}
                            <div className="flex border-b border-gray-200 overflow-x-auto">
                                <TabHeader number="1" title="Personal" icon={User} isActive={activeSection === 1} onClick={() => setActiveSection(1)} hasError={hasError(['firstName', 'lastName', 'cnic', 'phone'])} isComplete={isSectionComplete(1)} />
                                <TabHeader number="2" title="Admission" icon={FileText} isActive={activeSection === 2} onClick={() => setActiveSection(2)} hasError={hasError(['assignedDoctorId', 'admissionType'])} isComplete={isSectionComplete(2)} />
                                <TabHeader number="3" title="Contact" icon={Phone} isActive={activeSection === 3} onClick={() => setActiveSection(3)} hasError={hasError(['emergencyContactName', 'emergencyContactPhone'])} isComplete={isSectionComplete(3)} />
                                <TabHeader number="4" title="Medical" icon={Activity} isActive={activeSection === 4} onClick={() => setActiveSection(4)} hasError={false} isComplete={isSectionComplete(4)} />
                            </div>

                            {/* Tab Content */}
                            <form className="p-8 min-h-[400px]">
                                {activeSection === 1 && (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fadeIn">
                                        <div>
                                            <label className="text-sm font-medium text-gray-700 block mb-1">First Name *</label>
                                            <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} className={`w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-100 outline-none transition-colors ${errors.firstName ? 'border-red-500 focus:ring-red-100' : 'border-gray-300'}`} />
                                            {errors.firstName && <p className="text-xs text-red-500 mt-1">{errors.firstName}</p>}
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-700 block mb-1">Last Name *</label>
                                            <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} className={`w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-100 outline-none transition-colors ${errors.lastName ? 'border-red-500 focus:ring-red-100' : 'border-gray-300'}`} />
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-700 block mb-1">Father Name</label>
                                            <input type="text" name="fatherName" value={formData.fatherName} onChange={handleChange} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none" />
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-700 block mb-1">CNIC (13 digits) *</label>
                                            <input type="text" name="cnic" maxLength="13" value={formData.cnic} onChange={handleChange} placeholder="3520212345678" className={`w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-100 outline-none transition-colors ${errors.cnic ? 'border-red-500 focus:ring-red-100' : 'border-gray-300'}`} />
                                            {errors.cnic && <p className="text-xs text-red-500 mt-1">{errors.cnic}</p>}
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-700 block mb-1">Date of Birth</label>
                                            <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none" />
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-700 block mb-1">Gender</label>
                                            <select name="gender" value={formData.gender} onChange={handleChange} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none">
                                                <option value="male">Male</option>
                                                <option value="female">Female</option>
                                                <option value="other">Other</option>
                                            </select>
                                        </div>
                                        <div className="md:col-span-1">
                                            <label className="text-sm font-medium text-gray-700 block mb-1">Phone *</label>
                                            <input type="text" name="phone" value={formData.phone} onChange={handleChange} className={`w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-100 outline-none transition-colors ${errors.phone ? 'border-red-500 focus:ring-red-100' : 'border-gray-300'}`} />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="text-sm font-medium text-gray-700 block mb-1">Address</label>
                                            <input type="text" name="address" value={formData.address} onChange={handleChange} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none" />
                                        </div>
                                    </div>
                                )}
                                {activeSection === 2 && (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fadeIn">
                                        <div>
                                            <label className="text-sm font-medium text-gray-500 block mb-1">Admission Date (Auto)</label>
                                            <input type="text" disabled value={formData.admissionDateTime} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-500 cursor-not-allowed" />
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-700 block mb-1">Type *</label>
                                            <select name="admissionType" value={formData.admissionType} onChange={handleChange} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none">
                                                <option value="Emergency">Emergency</option>
                                                <option value="OPD">OPD - IPD</option>
                                                <option value="Referral">Referral</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-700 block mb-1">Assigned Doctor *</label>
                                            <select name="assignedDoctorId" value={formData.assignedDoctorId} onChange={handleChange} className={`w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-100 outline-none transition-colors ${errors.assignedDoctorId ? 'border-red-500' : 'border-gray-300'}`}>
                                                <option value="">Select Doctor</option>
                                                {doctors.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-700 block mb-1">Department</label>
                                            <select name="department" value={formData.department} onChange={handleChange} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none">
                                                <option value="General">General</option>
                                                <option value="Cardiology">Cardiology</option>
                                                <option value="Orthopedics">Orthopedics</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-700 block mb-1">Ward</label>
                                            <select name="ward" value={formData.ward} onChange={handleChange} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none">
                                                <option value="General Ward">General Ward</option>
                                                <option value="ICU">ICU</option>
                                                <option value="Private Room">Private Room</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-700 block mb-1">Bed Number</label>
                                            <input type="text" disabled value={formData.bedNumber} className="w-full p-2.5 bg-blue-50 border border-blue-100 text-blue-800 rounded-lg font-medium cursor-not-allowed" />
                                            <p className="text-xs text-blue-500 mt-1">Auto-assigned upon save</p>
                                        </div>
                                        <div className="md:col-span-3">
                                            <label className="text-sm font-medium text-gray-700 block mb-1">Reason for Admission</label>
                                            <textarea name="admissionReason" value={formData.admissionReason} onChange={handleChange} rows="3" className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none"></textarea>
                                        </div>
                                    </div>
                                )}
                                {activeSection === 3 && (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fadeIn">
                                        <div>
                                            <label className="text-sm font-medium text-gray-700 block mb-1">Contact Name *</label>
                                            <input type="text" name="emergencyContactName" value={formData.emergencyContactName} onChange={handleChange} className={`w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-100 outline-none transition-colors ${errors.emergencyContactName ? 'border-red-500 focus:ring-red-100' : 'border-gray-300'}`} />
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-700 block mb-1">Relation</label>
                                            <input type="text" name="emergencyContactRelation" value={formData.emergencyContactRelation} onChange={handleChange} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none" />
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-700 block mb-1">Phone *</label>
                                            <input type="text" name="emergencyContactPhone" value={formData.emergencyContactPhone} onChange={handleChange} className={`w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-100 outline-none transition-colors ${errors.emergencyContactPhone ? 'border-red-500 focus:ring-red-100' : 'border-gray-300'}`} />
                                        </div>
                                    </div>
                                )}
                                {activeSection === 4 && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
                                        <div>
                                            <label className="text-sm font-medium text-gray-700 block mb-1">Primary Diagnosis</label>
                                            <input type="text" name="primaryDiagnosis" value={formData.primaryDiagnosis} onChange={handleChange} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none" />
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-700 block mb-1">Blood Group</label>
                                            <select name="bloodGroup" value={formData.bloodGroup} onChange={handleChange} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none">
                                                <option value="O+">O+</option>
                                                <option value="O-">O-</option>
                                                <option value="A+">A+</option>
                                                <option value="A-">A-</option>
                                                <option value="B+">B+</option>
                                                <option value="B-">B-</option>
                                                <option value="AB+">AB+</option>
                                                <option value="AB-">AB-</option>
                                            </select>
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="text-sm font-medium text-gray-700 block mb-1">Allergies (comma separated)</label>
                                            <input type="text" name="allergies" value={formData.allergies} onChange={handleChange} placeholder="e.g. Penicillin, Pollen" className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none" />
                                        </div>
                                    </div>
                                )}

                                <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-100">
                                    <button
                                        type="button"
                                        onClick={() => setActiveSection(Math.max(1, activeSection - 1))}
                                        disabled={activeSection === 1}
                                        className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Previous
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setActiveSection(Math.min(4, activeSection + 1))}
                                        disabled={activeSection === 4}
                                        className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Next Step
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Patient Database Grid */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-6 border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h2 className="text-lg font-bold text-gray-800">Patient Database</h2>
                                <p className="text-sm text-gray-500">Manage registered patients</p>
                            </div>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="text"
                                    placeholder="Search by name, CNIC or ID..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 w-full md:w-64 outline-none"
                                />
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-200">
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Patient ID</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Patient Info</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Demographics</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {tableLoading ? (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-8 text-center text-gray-500">Loading patients...</td>
                                        </tr>
                                    ) : patients.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-8 text-center text-gray-500">No patients found.</td>
                                        </tr>
                                    ) : (
                                        patients.map((patient) => (
                                            <tr key={patient._id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 font-medium text-blue-600">{patient.patientId || 'N/A'}</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold text-gray-800">{patient.name}</span>
                                                        <span className="text-xs text-gray-500">CNIC: {patient.cnic || 'N/A'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col text-sm text-gray-600">
                                                        <span className="flex items-center gap-1"><Phone size={12} /> {patient.contact?.phone || 'N/A'}</span>
                                                        <span className="opacity-75 text-xs">{patient.contact?.address || 'No address'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600">
                                                    {patient.age ? `${patient.age} Yrs` : 'N/A'} / <span className="capitalize">{patient.gender}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => handleEditClick(patient)}
                                                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                            title="Edit"
                                                        >
                                                            <Edit size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(patient._id)}
                                                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Delete"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                            <button
                                onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                                disabled={pagination.page === 1}
                                className="px-3 py-1.5 flex items-center gap-1 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                            >
                                <ChevronLeft size={16} /> Previous
                            </button>
                            <span className="text-sm text-gray-600">
                                Page <span className="font-semibold text-gray-900">{pagination.page}</span> of <span className="font-semibold">{pagination.totalPages}</span>
                            </span>
                            <button
                                onClick={() => setPagination(prev => ({ ...prev, page: Math.min(pagination.totalPages, prev.page + 1) }))}
                                disabled={pagination.page >= pagination.totalPages}
                                className="px-3 py-1.5 flex items-center gap-1 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                            >
                                Next <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Edit Modal */}
                    {showEditModal && editingPatient && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
                            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                                    <h3 className="text-xl font-bold text-gray-800">Edit Patient Details</h3>
                                    <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                        <X size={24} />
                                    </button>
                                </div>
                                <form onSubmit={handleUpdatePatient} className="p-6 space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="text-sm font-medium text-gray-700 block mb-1">Full Name</label>
                                            <input
                                                type="text"
                                                value={editingPatient.name}
                                                onChange={(e) => setEditingPatient({ ...editingPatient, name: e.target.value })}
                                                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-700 block mb-1">Phone</label>
                                            <input
                                                type="text"
                                                value={editingPatient.contact?.phone || ''}
                                                onChange={(e) => setEditingPatient({
                                                    ...editingPatient,
                                                    contact: { ...editingPatient.contact, phone: e.target.value }
                                                })}
                                                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none"
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="text-sm font-medium text-gray-700 block mb-1">Address</label>
                                            <input
                                                type="text"
                                                value={editingPatient.contact?.address || ''}
                                                onChange={(e) => setEditingPatient({
                                                    ...editingPatient,
                                                    contact: { ...editingPatient.contact, address: e.target.value }
                                                })}
                                                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-700 block mb-1">Emerg. Contact Name</label>
                                            <input
                                                type="text"
                                                value={editingPatient.emergencyContact?.name || ''}
                                                onChange={(e) => setEditingPatient({
                                                    ...editingPatient,
                                                    emergencyContact: { ...editingPatient.emergencyContact, name: e.target.value }
                                                })}
                                                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-700 block mb-1">Emerg. Contact Phone</label>
                                            <input
                                                type="text"
                                                value={editingPatient.emergencyContact?.phone || ''}
                                                onChange={(e) => setEditingPatient({
                                                    ...editingPatient,
                                                    emergencyContact: { ...editingPatient.emergencyContact, phone: e.target.value }
                                                })}
                                                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-3 pt-4">
                                        <button
                                            type="button"
                                            onClick={() => setShowEditModal(false)}
                                            className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                                        >
                                            Update Changes
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default PatientAdmission;

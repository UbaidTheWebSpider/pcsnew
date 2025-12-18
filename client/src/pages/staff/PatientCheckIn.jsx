import { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosConfig';
import DashboardLayout from '../../components/DashboardLayout';
import { ClipboardList, Search, User, Stethoscope, AlertCircle, Activity, FlaskConical, Radio, Video, CalendarClock } from 'lucide-react';
import Swal from 'sweetalert2';

const DEPARTMENTS = [
    { id: 'OPD', name: 'OPD', icon: Stethoscope, color: 'blue', desc: 'Outpatient Department' },
    { id: 'ER', name: 'Emergency', icon: AlertCircle, color: 'red', desc: 'Emergency Room' },
    { id: 'IPD', name: 'IPD', icon: Activity, color: 'purple', desc: 'In-Patient Admission' },
    { id: 'LAB', name: 'Laboratory', icon: FlaskConical, color: 'green', desc: 'Lab Tests' },
    { id: 'RADIOLOGY', name: 'Radiology', icon: Radio, color: 'teal', desc: 'Radiology' },
    { id: 'TELEMEDICINE', name: 'Telemedicine', icon: Video, color: 'indigo', desc: 'Online Consultation' },
    { id: 'FOLLOWUP', name: 'Follow-up', icon: CalendarClock, color: 'orange', desc: 'Follow-up Visit' }
];

const PatientCheckIn = () => {
    const [step, setStep] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [patient, setPatient] = useState(null);
    const [department, setDepartment] = useState('');
    const [doctors, setDoctors] = useState([]);

    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        doctorId: '',
        appointmentId: '',
        checkInReason: '',
        priorityLevel: 'Normal',
        wardPreference: 'General Ward',
        triageLevel: 'YELLOW',
        chiefComplaint: '',
        testOrders: []
    });

    useEffect(() => {
        if (department === 'OPD' || department === 'TELEMEDICINE' || department === 'FOLLOWUP') {
            fetchDoctors();
        }
    }, [department]);

    const fetchDoctors = async () => {
        try {
            const token = localStorage.getItem('token');
            const { data } = await axiosInstance.get('/api/patient/doctors', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setDoctors(data.data.doctors || []);
        } catch (error) {
            console.error('Error fetching doctors:', error);
        }
    };

    const searchPatient = async () => {
        if (!searchTerm) return;
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const { data } = await axiosInstance.get(`/api/staff/patients?search=${searchTerm}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Backend returns data.data as array directly, not data.data.patients
            if (data.success && data.data && data.data.length > 0) {
                const staffPatient = data.data[0];

                // Map StaffPatient structure to expected patient structure
                const mappedPatient = {
                    _id: staffPatient._id,
                    patientId: staffPatient.patientId,
                    name: staffPatient.personalInfo?.fullName || 'N/A',
                    cnic: staffPatient.personalInfo?.cnic || 'N/A',
                    gender: staffPatient.personalInfo?.gender || 'N/A',
                    dateOfBirth: staffPatient.personalInfo?.dateOfBirth,
                    bloodGroup: staffPatient.personalInfo?.bloodGroup,
                    contact: {
                        phone: staffPatient.contactInfo?.mobileNumber || 'N/A',
                        address: staffPatient.contactInfo?.address || 'N/A',
                        email: staffPatient.contactInfo?.email
                    },
                    emergencyContact: staffPatient.contactInfo?.emergencyContact,
                    admissionDetails: staffPatient.admissionDetails,
                    medicalBackground: staffPatient.medicalBackground
                };

                setPatient(mappedPatient);
                setStep(2);
            } else {
                Swal.fire({ icon: 'error', title: 'Not Found', text: 'Patient not found' });
            }
        } catch (error) {
            console.error('Search error:', error);
            Swal.fire({ icon: 'error', title: 'Error', text: error.response?.data?.message || 'Failed to search patient' });
        } finally {
            setLoading(false);
        }
    };

    const handleCheckIn = async () => {
        if (!department) {
            Swal.fire({ icon: 'warning', title: 'Required', text: 'Please select a department' });
            return;
        }

        if (!formData.checkInReason) {
            Swal.fire({ icon: 'warning', title: 'Required', text: 'Please enter check-in reason' });
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('token');

            const payload = {
                patientId: patient._id,
                department,
                checkInReason: formData.checkInReason,
                priorityLevel: formData.priorityLevel
            };

            if (formData.doctorId) payload.doctorId = formData.doctorId;
            if (formData.appointmentId) payload.appointmentId = formData.appointmentId;

            if (department === 'ER') {
                payload.triageData = {
                    triageLevel: formData.triageLevel,
                    chiefComplaint: formData.chiefComplaint
                };
            }

            if (department === 'IPD') {
                payload.wardPreference = formData.wardPreference;
            }

            if (department === 'LAB' || department === 'RADIOLOGY') {
                payload.testOrders = formData.testOrders;
            }

            const { data } = await axiosInstance.post('/api/check-in', payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            let message = 'Patient checked in successfully';
            if (data.data.queueNumber) message += `\nQueue Number: ${data.data.queueNumber}`;
            if (data.data.tokenNumber) message += `\nToken: ${data.data.tokenNumber}`;
            if (data.data.wardBed) message += `\nBed: ${data.data.wardBed}`;

            await Swal.fire({ icon: 'success', title: 'Success!', text: message });

            // Reset
            setPatient(null);
            setDepartment('');
            setStep(1);
            setSearchTerm('');
            setFormData({
                doctorId: '',
                appointmentId: '',
                checkInReason: '',
                priorityLevel: 'Normal',
                wardPreference: 'General Ward',
                triageLevel: 'YELLOW',
                chiefComplaint: '',
                testOrders: []
            });
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Failed', text: error.response?.data?.message || 'Check-in failed' });
        } finally {
            setLoading(false);
        }
    };

    const getDeptColor = (color) => {
        const colors = {
            blue: 'from-blue-500 to-blue-600',
            red: 'from-red-500 to-red-600',
            purple: 'from-purple-500 to-purple-600',
            green: 'from-green-500 to-green-600',
            teal: 'from-teal-500 to-teal-600',
            indigo: 'from-indigo-500 to-indigo-600',
            orange: 'from-orange-500 to-orange-600'
        };
        return colors[color] || colors.blue;
    };

    return (
        <DashboardLayout>
            <div className="p-8 bg-gray-50 min-h-screen">
                <div className="max-w-5xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                            <ClipboardList className="text-blue-600" />
                            Patient Check-In
                        </h1>
                        <p className="text-gray-600 mt-1">Quick check-in for all departments</p>
                    </div>

                    {/* Step 1: Patient Search */}
                    {step === 1 && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                            <h3 className="text-lg font-semibold mb-4">Step 1: Find Patient</h3>
                            <div className="flex gap-3">
                                <div className="flex-1 relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                    <input
                                        type="text"
                                        placeholder="Enter Patient ID or CNIC..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && searchPatient()}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none text-lg"
                                    />
                                </div>
                                <button
                                    onClick={searchPatient}
                                    disabled={loading}
                                    className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                >
                                    Search
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Department Selection */}
                    {step === 2 && patient && (
                        <div className="space-y-6">
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <h3 className="text-lg font-semibold mb-2">Patient Information</h3>
                                <div className="flex items-center gap-4">
                                    <User className="text-gray-400" size={48} />
                                    <div>
                                        <p className="font-semibold text-lg">{patient.name}</p>
                                        <p className="text-sm text-gray-600">ID: {patient.patientId} | CNIC: {patient.cnic}</p>
                                        <p className="text-sm text-gray-600">Contact: {patient.contact?.phone}</p>
                                    </div>
                                    <button
                                        onClick={() => { setPatient(null); setStep(1); }}
                                        className="ml-auto px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                    >
                                        Change Patient
                                    </button>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <h3 className="text-lg font-semibold mb-4">Select Department</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {DEPARTMENTS.map((dept) => {
                                        const Icon = dept.icon;
                                        return (
                                            <button
                                                key={dept.id}
                                                onClick={() => { setDepartment(dept.id); setStep(3); }}
                                                className={`p-4 rounded-xl border-2 transition-all ${department === dept.id
                                                    ? `border-${dept.color}-500 bg-${dept.color}-50`
                                                    : 'border-gray-200 hover:border-gray-300'
                                                    }`}
                                            >
                                                <Icon className={`mx-auto mb-2 text-${dept.color}-600`} size={32} />
                                                <p className="font-semibold text-sm">{dept.name}</p>
                                                <p className="text-xs text-gray-500">{dept.desc}</p>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Department-Specific Form */}
                    {step === 3 && department && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <div className={`bg-gradient-to-r ${getDeptColor(DEPARTMENTS.find(d => d.id === department)?.color)} text-white p-4 rounded-lg mb-6 -m-6 mb-6`}>
                                <h3 className="text-xl font-semibold">{DEPARTMENTS.find(d => d.id === department)?.name} Check-In</h3>
                            </div>

                            <div className="space-y-4 mt-6">
                                {/* Common Fields */}
                                <div>
                                    <label className="text-sm font-medium text-gray-700 block mb-1">Check-In Reason *</label>
                                    <textarea
                                        value={formData.checkInReason}
                                        onChange={(e) => setFormData({ ...formData, checkInReason: e.target.value })}
                                        rows="3"
                                        className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none"
                                        placeholder="Enter reason for visit..."
                                    />
                                </div>

                                {/* Doctor Selection (OPD, Telemedicine, Follow-up) */}
                                {(['OPD', 'TELEMEDICINE', 'FOLLOWUP'].includes(department)) && (
                                    <div>
                                        <label className="text-sm font-medium text-gray-700 block mb-1">Select Doctor *</label>
                                        <select
                                            value={formData.doctorId}
                                            onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })}
                                            className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none"
                                        >
                                            <option value="">-- Select Doctor --</option>
                                            {doctors.map(doc => (
                                                <option key={doc._id} value={doc._id}>{doc.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {/* ER Specific */}
                                {department === 'ER' && (
                                    <>
                                        <div>
                                            <label className="text-sm font-medium text-gray-700 block mb-1">Priority Level</label>
                                            <select
                                                value={formData.priorityLevel}
                                                onChange={(e) => setFormData({ ...formData, priorityLevel: e.target.value })}
                                                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-100 outline-none"
                                            >
                                                <option value="Normal">Normal</option>
                                                <option value="Urgent">Urgent</option>
                                                <option value="Critical">Critical</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-700 block mb-1">Triage Level</label>
                                            <select
                                                value={formData.triageLevel}
                                                onChange={(e) => setFormData({ ...formData, triageLevel: e.target.value })}
                                                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-100 outline-none"
                                            >
                                                <option value="GREEN">Green - Non-Urgent</option>
                                                <option value="YELLOW">Yellow - Urgent</option>
                                                <option value="ORANGE">Orange - Very Urgent</option>
                                                <option value="RED">Red - Critical</option>
                                            </select>
                                        </div>
                                    </>
                                )}

                                {/* IPD Specific */}
                                {department === 'IPD' && (
                                    <div>
                                        <label className="text-sm font-medium text-gray-700 block mb-1">Ward Preference</label>
                                        <select
                                            value={formData.wardPreference}
                                            onChange={(e) => setFormData({ ...formData, wardPreference: e.target.value })}
                                            className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-100 outline-none"
                                        >
                                            <option value="General Ward">General Ward</option>
                                            <option value="ICU">ICU</option>
                                            <option value="Private Room">Private Room</option>
                                        </select>
                                    </div>
                                )}

                                <div className="flex gap-3 pt-4">
                                    <button
                                        onClick={() => setStep(2)}
                                        className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                                    >
                                        Back
                                    </button>
                                    <button
                                        onClick={handleCheckIn}
                                        disabled={loading}
                                        className="flex-1 px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                    >
                                        {loading ? 'Processing...' : 'Complete Check-In'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default PatientCheckIn;

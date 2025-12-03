import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../../api/axiosConfig';
import { Search, User, Star, Calendar, Video, Phone, Mail } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';

const DoctorDiscovery = () => {
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSpecialization, setSelectedSpecialization] = useState('');

    const specializations = [
        'All Specializations',
        'Cardiology',
        'Dermatology',
        'Neurology',
        'Orthopedics',
        'Pediatrics',
        'Psychiatry',
        'General Medicine',
    ];

    useEffect(() => {
        fetchDoctors();
    }, [selectedSpecialization]);

    const fetchDoctors = async () => {
        try {
            const token = localStorage.getItem('token');
            const params = {};
            if (selectedSpecialization && selectedSpecialization !== 'All Specializations') {
                params.specialization = selectedSpecialization;
            }

            const { data } = await axiosInstance.get('/api/patient/doctors', {
                headers: { Authorization: `Bearer ${token}` },
                params,
            });

            setDoctors(data.data.doctors);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching doctors:', error);
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        try {
            const token = localStorage.getItem('token');
            const params = {};
            if (searchTerm) params.search = searchTerm;
            if (selectedSpecialization && selectedSpecialization !== 'All Specializations') {
                params.specialization = selectedSpecialization;
            }

            const { data } = await axios.get('http://localhost:5001/api/patient/doctors', {
                headers: { Authorization: `Bearer ${token}` },
                params,
            });

            setDoctors(data.data.doctors);
        } catch (error) {
            console.error('Error searching doctors:', error);
        }
    };

    const filteredDoctors = doctors.filter(doctor =>
        doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doctor.specialization?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <DashboardLayout>
                <div className="p-8">
                    <div className="text-center py-12">
                        <p className="text-gray-500">Loading doctors...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="p-8">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">Find a Doctor</h1>
                    <p className="text-gray-600 mb-8">Browse our network of qualified healthcare professionals</p>

                    {/* Search and Filters */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Search Bar */}
                            <div className="md:col-span-2">
                                <div className="relative">
                                    <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                                    <input
                                        type="text"
                                        placeholder="Search by name or specialization..."
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                    />
                                </div>
                            </div>

                            {/* Specialization Filter */}
                            <div>
                                <select
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    value={selectedSpecialization}
                                    onChange={(e) => setSelectedSpecialization(e.target.value)}
                                >
                                    {specializations.map((spec) => (
                                        <option key={spec} value={spec}>
                                            {spec}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <button
                            onClick={handleSearch}
                            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                        >
                            Search Doctors
                        </button>
                    </div>

                    {/* Results Count */}
                    <div className="mb-4">
                        <p className="text-gray-600">
                            Found <span className="font-semibold text-gray-800">{filteredDoctors.length}</span> doctors
                        </p>
                    </div>

                    {/* Doctor Cards Grid */}
                    {filteredDoctors.length === 0 ? (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                            <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-gray-800 mb-2">No doctors found</h3>
                            <p className="text-gray-600">Try adjusting your search criteria</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredDoctors.map((doctor) => (
                                <div
                                    key={doctor._id}
                                    className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition duration-200"
                                >
                                    {/* Doctor Header */}
                                    <div className="flex items-start gap-4 mb-4">
                                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                                            {doctor.name.charAt(0)}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-lg font-semibold text-gray-800">{doctor.name}</h3>
                                            <p className="text-sm text-blue-600 font-medium">{doctor.specialization || 'General Physician'}</p>
                                            {doctor.experience && (
                                                <p className="text-xs text-gray-500 mt-1">{doctor.experience} years experience</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Rating */}
                                    <div className="flex items-center gap-1 mb-4">
                                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                        <Star className="w-4 h-4 text-gray-300" />
                                        <span className="text-sm text-gray-600 ml-2">4.0 (25 reviews)</span>
                                    </div>

                                    {/* Contact Info */}
                                    <div className="space-y-2 mb-4">
                                        {doctor.contact?.phone && (
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <Phone className="w-4 h-4" />
                                                <span>{doctor.contact.phone}</span>
                                            </div>
                                        )}
                                        {doctor.email && (
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <Mail className="w-4 h-4" />
                                                <span>{doctor.email}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Features */}
                                    <div className="flex gap-2 mb-4">
                                        <span className="px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full flex items-center gap-1">
                                            <Video className="w-3 h-3" />
                                            Video Consult
                                        </span>
                                        <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                                            Available Today
                                        </span>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-2">
                                        <Link
                                            to={`/patient/doctors/${doctor._id}`}
                                            className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-center text-sm font-medium"
                                        >
                                            View Profile
                                        </Link>
                                        <Link
                                            to={`/patient/book-appointment?doctorId=${doctor._id}`}
                                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-center text-sm font-medium flex items-center justify-center gap-1"
                                        >
                                            <Calendar className="w-4 h-4" />
                                            Book
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default DoctorDiscovery;

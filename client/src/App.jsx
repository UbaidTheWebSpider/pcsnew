import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageDoctors from './pages/admin/ManageDoctors';
import ManagePharmacies from './pages/admin/ManagePharmacies';
import ManagePatients from './pages/admin/ManagePatients';
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import PatientDashboard from './pages/patient/PatientDashboard';
import DoctorDiscovery from './pages/patient/DoctorDiscovery';
import BookAppointment from './pages/patient/BookAppointment';
import StaffDashboard from './pages/staff/StaffDashboard';
import PharmacyDashboard from './pages/pharmacy/PharmacyDashboard';
import PrescriptionQueue from './pages/pharmacy/PrescriptionQueue';
import MedicineInventory from './pages/pharmacy/MedicineInventory';
import StockAlerts from './pages/pharmacy/StockAlerts';
import TelemedicineRoom from './pages/TelemedicineRoom';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          {/* Admin Routes */}
          <Route element={<ProtectedRoute allowedRoles={['hospital_admin']} />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/doctors" element={<ManageDoctors />} />
            <Route path="/admin/pharmacies" element={<ManagePharmacies />} />
            <Route path="/admin/patients" element={<ManagePatients />} />
          </Route>
          {/* Doctor Routes */}
          <Route element={<ProtectedRoute allowedRoles={['doctor']} />}>
            <Route path="/doctor" element={<DoctorDashboard />} />
          </Route>
          {/* Patient Routes */}
          <Route element={<ProtectedRoute allowedRoles={['patient']} />}>
            <Route path="/patient" element={<PatientDashboard />} />
            <Route path="/patient/doctors" element={<DoctorDiscovery />} />
            <Route path="/patient/book-appointment" element={<BookAppointment />} />
          </Route>
          {/* Staff Routes */}
          <Route element={<ProtectedRoute allowedRoles={['hospital_staff']} />}>
            <Route path="/staff" element={<StaffDashboard />} />
          </Route>
          {/* Pharmacy Routes */}
          <Route element={<ProtectedRoute allowedRoles={['pharmacy']} />}>
            <Route path="/pharmacy" element={<PharmacyDashboard />} />
            <Route path="/pharmacy/prescriptions" element={<PrescriptionQueue />} />
            <Route path="/pharmacy/inventory" element={<MedicineInventory />} />
            <Route path="/pharmacy/alerts" element={<StockAlerts />} />
          </Route>

          {/* Shared Routes */}
          <Route element={<ProtectedRoute allowedRoles={['doctor', 'patient']} />}>
            <Route path="/telemedicine" element={<TelemedicineRoom />} />
          </Route>

        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;

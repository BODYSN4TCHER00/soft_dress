import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './utils/context/AuthContext';
import Login from './pages/Login';
import AdminDashboard from './pages/admin/Dashboard';
import Clientes from './pages/admin/Clientes';
import Personal from './pages/admin/Personal';
import Historial from './pages/admin/Historial';
import StaffMenu from './pages/staff/Menu';
import Rentas from './pages/staff/Rentas';
import Catalogo from './pages/Catalogo';
import ProtectedRoute from './Components/ProtectedRoute';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/clientes"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Clientes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/personal"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Personal />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/historial"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Historial />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/menu"
            element={
              <ProtectedRoute allowedRoles={['staff']}>
                <StaffMenu />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/personal"
            element={
              <ProtectedRoute allowedRoles={['staff']}>
                <StaffMenu />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/rentas"
            element={
              <ProtectedRoute allowedRoles={['staff']}>
                <Rentas />
              </ProtectedRoute>
            }
          />
          <Route
            path="/catalogo"
            element={
              <ProtectedRoute allowedRoles={['admin', 'staff']}>
                <Catalogo />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/catalogo"
            element={
              <ProtectedRoute allowedRoles={['staff']}>
                <Catalogo />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/catalogo"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Catalogo />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

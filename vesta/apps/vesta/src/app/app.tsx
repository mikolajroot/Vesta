import { Route, Routes, Navigate } from 'react-router-dom';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { DashboardPage } from '../pages/DashboardPage';
import { HomesPage } from '../pages/HomesPage';
import { RoomsPage } from '../pages/RoomsPage';
import { DevicesPage } from '../pages/DevicesPage';
import { Layout } from '../components/Layout';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { useAuth } from '../context/AuthContext';

export function App() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route
        path="/"
        element={
          isAuthenticated ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout>
              <DashboardPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/homes"
        element={
          <ProtectedRoute>
            <Layout>
              <HomesPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/rooms"
        element={
          <ProtectedRoute>
            <Layout>
              <RoomsPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/devices"
        element={
          <ProtectedRoute>
            <Layout>
              <DevicesPage />
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;

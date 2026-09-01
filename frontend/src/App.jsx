import React, { useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import Login from './pages/auth/Login';
import UserRegister from './pages/auth/UserRegister';
import SecondaryAdminRegister from './pages/auth/SecondaryAdminRegister';

import UserDashboard from './pages/user/UserDashboard';
import MyComplaints from './pages/user/MyComplaints';
import MyOrganization from './pages/user/MyOrganization';

import MainAdminDashboard from './pages/mainAdmin/MainAdminDashboard';
import Organizations from './pages/mainAdmin/Organizations';
import Categories from './pages/mainAdmin/Categories';
import AdminRequests from './pages/mainAdmin/AdminRequests';
import DatasetApprovals from './pages/mainAdmin/DatasetApprovals';

import SecondaryAdminDashboard from './pages/secondaryAdmin/SecondaryAdminDashboard';
import OrganizationComplaints from './pages/secondaryAdmin/OrganizationComplaints';
import PriorityQueuePage from './pages/secondaryAdmin/PriorityQueuePage';
import OrganizationDataset from './pages/secondaryAdmin/OrganizationDataset';

// Components
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

const AppLayout = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  // Close sidebar on route change (for mobile)
  React.useEffect(() => {
    setIsSidebarOpen(false);
  }, [location]);

  if (loading) {
    return <div className="loading-screen">COMPLAX is loading...</div>;
  }

  return (
    <div className="app-container">
      {isAuthenticated && (
        <>
          <Navbar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
          {isSidebarOpen && <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)}></div>}
          <Sidebar isOpen={isSidebarOpen} />
        </>
      )}
      <div className="main-layout">
        <main className={isAuthenticated ? "content with-sidebar" : "content"}>
          {children}
        </main>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<UserRegister />} />
          <Route path="/register-org" element={<SecondaryAdminRegister />} />

          {/* User Routes */}
          <Route path="/user/dashboard" element={<ProtectedRoute role="USER"><UserDashboard /></ProtectedRoute>} />
          <Route path="/user/my-complaints" element={<ProtectedRoute role="USER"><MyComplaints /></ProtectedRoute>} />
          <Route path="/user/my-organization" element={<ProtectedRoute role="USER"><MyOrganization /></ProtectedRoute>} />

          {/* Main Admin Routes */}
          <Route path="/admin/dashboard" element={<ProtectedRoute role="MAIN_ADMIN"><MainAdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/organizations" element={<ProtectedRoute role="MAIN_ADMIN"><Organizations /></ProtectedRoute>} />
          <Route path="/admin/categories" element={<ProtectedRoute role="MAIN_ADMIN"><Categories /></ProtectedRoute>} />
          <Route path="/admin/requests" element={<ProtectedRoute role="MAIN_ADMIN"><AdminRequests /></ProtectedRoute>} />
          <Route path="/admin/datasets" element={<ProtectedRoute role="MAIN_ADMIN"><DatasetApprovals /></ProtectedRoute>} />

          {/* Secondary Admin Routes */}
          <Route path="/secondary-admin/dashboard" element={<ProtectedRoute role="SECONDARY_ADMIN"><SecondaryAdminDashboard /></ProtectedRoute>} />
          <Route path="/secondary-admin/complaints" element={<ProtectedRoute role="SECONDARY_ADMIN"><OrganizationComplaints /></ProtectedRoute>} />
          <Route path="/secondary-admin/queue" element={<ProtectedRoute role="SECONDARY_ADMIN"><PriorityQueuePage /></ProtectedRoute>} />
          <Route path="/secondary-admin/dataset" element={<ProtectedRoute role="SECONDARY_ADMIN"><OrganizationDataset /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AppLayout>
    </AuthProvider>
  );
};

export default App;

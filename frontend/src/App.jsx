import React, { useState, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Lazy Loaded Pages for Instant Initial Loading Speed
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/auth/Login'));
const UserRegister = lazy(() => import('./pages/auth/UserRegister'));
const SecondaryAdminRegister = lazy(() => import('./pages/auth/SecondaryAdminRegister'));

const UserDashboard = lazy(() => import('./pages/user/UserDashboard'));
const MyComplaints = lazy(() => import('./pages/user/MyComplaints'));
const MyOrganization = lazy(() => import('./pages/user/MyOrganization'));

const MainAdminDashboard = lazy(() => import('./pages/mainAdmin/MainAdminDashboard'));
const Organizations = lazy(() => import('./pages/mainAdmin/Organizations'));
const Users = lazy(() => import('./pages/mainAdmin/Users'));
const Categories = lazy(() => import('./pages/mainAdmin/Categories'));
const AdminRequests = lazy(() => import('./pages/mainAdmin/AdminRequests'));
const DatasetApprovals = lazy(() => import('./pages/mainAdmin/DatasetApprovals'));

const SecondaryAdminDashboard = lazy(() => import('./pages/secondaryAdmin/SecondaryAdminDashboard'));
const OrganizationComplaints = lazy(() => import('./pages/secondaryAdmin/OrganizationComplaints'));
const PriorityQueuePage = lazy(() => import('./pages/secondaryAdmin/PriorityQueuePage'));
const OrganizationDataset = lazy(() => import('./pages/secondaryAdmin/OrganizationDataset'));
const SecondaryOrgUsers = lazy(() => import('./pages/secondaryAdmin/MyOrganization'));
const Profile = lazy(() => import('./pages/Profile'));

// Components
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

const PageLoader = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '200px',
    width: '100%'
  }}>
    <div className="loading-spinner"></div>
  </div>
);

const AppLayout = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  const publicPaths = ['/', '/home', '/login', '/register', '/register-org'];
  const isPublicRoute = publicPaths.includes(location.pathname);
  const showAuthLayout = isAuthenticated && !isPublicRoute;

  // Close sidebar on route change (for mobile)
  React.useEffect(() => {
    setIsSidebarOpen(false);
  }, [location]);

  if (loading) {
    return (
      <div className="loading-screen" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '1rem' }}>
        <div className="loading-spinner"></div>
        <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>COMPLAX loading...</span>
      </div>
    );
  }

  return (
    <div className="app-container">
      {showAuthLayout && (
        <>
          <Navbar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
          {isSidebarOpen && <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)}></div>}
          <Sidebar isOpen={isSidebarOpen} />
        </>
      )}
      <div className="main-layout">
        <main className={showAuthLayout ? "content with-sidebar" : "content"}>
          <Suspense fallback={<PageLoader />}>
            {children}
          </Suspense>
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
          <Route path="/" element={<Home />} />
          <Route path="/home" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<UserRegister />} />
          <Route path="/register-org" element={<SecondaryAdminRegister />} />

          {/* User Routes */}
          <Route path="/user/dashboard" element={<ProtectedRoute role="USER"><UserDashboard /></ProtectedRoute>} />
          <Route path="/user/my-complaints" element={<ProtectedRoute role="USER"><MyComplaints /></ProtectedRoute>} />
          <Route path="/user/my-organization" element={<ProtectedRoute role="USER"><MyOrganization /></ProtectedRoute>} />

          {/* Main Admin Routes */}
          <Route path="/admin/dashboard" element={<ProtectedRoute role="MAIN_ADMIN"><MainAdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/organizations" element={<ProtectedRoute role="MAIN_ADMIN"><Organizations /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute role="MAIN_ADMIN"><Users /></ProtectedRoute>} />
          <Route path="/admin/categories" element={<ProtectedRoute role="MAIN_ADMIN"><Categories /></ProtectedRoute>} />
          <Route path="/admin/requests" element={<ProtectedRoute role="MAIN_ADMIN"><AdminRequests /></ProtectedRoute>} />
          <Route path="/admin/datasets" element={<ProtectedRoute role="MAIN_ADMIN"><DatasetApprovals /></ProtectedRoute>} />

          {/* Secondary Admin Routes */}
          <Route path="/secondary-admin/dashboard" element={<ProtectedRoute role="SECONDARY_ADMIN"><SecondaryAdminDashboard /></ProtectedRoute>} />
          <Route path="/secondary-admin/complaints" element={<ProtectedRoute role="SECONDARY_ADMIN"><OrganizationComplaints /></ProtectedRoute>} />
          <Route path="/secondary-admin/queue" element={<ProtectedRoute role="SECONDARY_ADMIN"><PriorityQueuePage /></ProtectedRoute>} />
          <Route path="/secondary-admin/organization" element={<ProtectedRoute role="SECONDARY_ADMIN"><SecondaryOrgUsers /></ProtectedRoute>} />
          <Route path="/secondary-admin/dataset" element={<ProtectedRoute role="SECONDARY_ADMIN"><OrganizationDataset /></ProtectedRoute>} />

          {/* Shared Routes */}
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AppLayout>
    </AuthProvider>
  );
};

export default App;


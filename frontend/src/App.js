import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/auth/Login';
import Signup from './components/auth/Signup';
import Dashboard from './components/dashboard/Dashboard';
import ProjectConfiguration from './components/projects/ProjectConfiguration';
import KeyReview from './components/projects/KeyReview';
import ProjectUserManagement from './components/projects/ProjectUserManagement';
import AdminSettings from './components/admin/AdminSettings';
import UserManagement from './components/admin/UserManagement';
import LoadingSpinner from './components/common/LoadingSpinner';

// Samsung-inspired theme
const theme = createTheme({
    palette: {
        primary: {
            main: '#1976d2', // Samsung blue
            light: '#42a5f5',
            dark: '#1565c0',
        },
        secondary: {
            main: '#ff6f00', // Samsung orange accent
            light: '#ff8f00',
            dark: '#e65100',
        },
        background: {
            default: '#f5f5f5',
            paper: '#ffffff',
        },
    },
    typography: {
        fontFamily: '"Poppins", "Inter", "Arial", sans-serif',
        h4: {
            fontWeight: 600,
        },
        h6: {
            fontWeight: 500,
        },
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                    borderRadius: 8,
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 12,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                },
            },
        },
    },
});

// Protected Route component
const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return <LoadingSpinner />;
    }

    return user ? children : <Navigate to="/login" />;
};

// Admin Route component (admin only)
const AdminRoute = ({ children }) => {
    const { user, loading, USER_ROLES } = useAuth();

    if (loading) {
        return <LoadingSpinner />;
    }

    if (!user) {
        return <Navigate to="/login" />;
    }

    if (user.role !== USER_ROLES.ADMIN) {
        return <Navigate to="/dashboard" />;
    }

    return children;
};

// Public Route component (redirect to dashboard if already logged in)
const PublicRoute = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return <LoadingSpinner />;
    }

    return user ? <Navigate to="/dashboard" /> : children;
};

function AppContent() {
    return (
        <Router>
            <Routes>
                <Route
                    path="/login"
                    element={
                        <PublicRoute>
                            <Login />
                        </PublicRoute>
                    }
                />
                <Route
                    path="/signup"
                    element={
                        <PublicRoute>
                            <Signup />
                        </PublicRoute>
                    }
                />
                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/projects/configure"
                    element={
                        <ProtectedRoute>
                            <ProjectConfiguration />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/projects/:projectId/review"
                    element={
                        <ProtectedRoute>
                            <KeyReview />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/projects/:projectId/users"
                    element={
                        <AdminRoute>
                            <ProjectUserManagement />
                        </AdminRoute>
                    }
                />
                <Route
                    path="/admin/settings"
                    element={
                        <AdminRoute>
                            <AdminSettings />
                        </AdminRoute>
                    }
                />
                <Route
                    path="/admin/users"
                    element={
                        <AdminRoute>
                            <UserManagement />
                        </AdminRoute>
                    }
                />
                <Route path="/" element={<Navigate to="/login" />} />
                <Route path="*" element={<Navigate to="/login" />} />
            </Routes>
        </Router>
    );
}

function App() {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <AuthProvider>
                <AppContent />
                <ToastContainer
                    position="top-right"
                    autoClose={5000}
                    hideProgressBar={false}
                    newestOnTop={false}
                    closeOnClick
                    rtl={false}
                    pauseOnFocusLoss
                    draggable
                    pauseOnHover
                />
            </AuthProvider>
        </ThemeProvider>
    );
}

export default App; 
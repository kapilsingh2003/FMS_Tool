import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container,
    Paper,
    Box,
    Typography,
    Button,
    Card,
    CardContent,
    Grid,
    IconButton,
    Alert,
    Chip
} from '@mui/material';
import {
    ArrowBack,
    People,
    Assignment,
    Dashboard as DashboardIcon,
    ManageAccounts,
    AdminPanelSettings
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const AdminSettings = () => {
    const { user, USER_ROLES } = useAuth();
    const navigate = useNavigate();

    // Application info state
    const [appInfo] = useState({
        totalUsers: 25,
        totalProjects: 8,
        activeUsers: 12
    });

    useEffect(() => {
        if (user && user.role !== USER_ROLES.ADMIN) {
            navigate('/dashboard');
            return;
        }
    }, [user, navigate, USER_ROLES.ADMIN]);

    const handleBack = () => {
        navigate('/dashboard');
    };

    const handleUserManagement = () => {
        navigate('/admin/users');
    };

    return (
        <Container maxWidth="lg">
            <Box sx={{ mt: 4, mb: 4 }}>
                {/* Header */}
                <Paper sx={{ p: 3, mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <IconButton onClick={handleBack} sx={{ mr: 2 }}>
                            <ArrowBack />
                        </IconButton>
                        <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="h4" sx={{ color: '#0d459c', fontWeight: 700 }}>
                                Admin Settings
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                User management and project administration
                            </Typography>
                        </Box>
                        <Chip
                            icon={<AdminPanelSettings />}
                            label="Administrator"
                            color="error"
                            variant="outlined"
                        />
                    </Box>
                </Paper>

                {/* User Management Section */}
                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                            <ManageAccounts sx={{ mr: 1 }} />
                            User Management
                        </Typography>

                        <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                                <Card variant="outlined">
                                    <CardContent sx={{ textAlign: 'center' }}>
                                        <People sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                                        <Typography variant="h4" color="primary">
                                            {appInfo.totalUsers}
                                        </Typography>
                                        <Typography variant="body1" gutterBottom>
                                            Total Users
                                        </Typography>
                                        <Button
                                            variant="contained"
                                            startIcon={<ManageAccounts />}
                                            onClick={handleUserManagement}
                                            sx={{ mt: 2 }}
                                        >
                                            Manage Users
                                        </Button>
                                    </CardContent>
                                </Card>
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <Card variant="outlined">
                                    <CardContent sx={{ textAlign: 'center' }}>
                                        <Assignment sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
                                        <Typography variant="h4" color="success.main">
                                            {appInfo.totalProjects}
                                        </Typography>
                                        <Typography variant="body1" gutterBottom>
                                            Total Projects
                                        </Typography>
                                        <Button
                                            variant="outlined"
                                            startIcon={<Assignment />}
                                            onClick={() => navigate('/dashboard')}
                                            sx={{ mt: 2 }}
                                        >
                                            View Projects
                                        </Button>
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>

                        <Typography variant="h6" gutterBottom sx={{ mt: 3, mb: 2 }}>
                            Quick Actions
                        </Typography>

                        <Grid container spacing={2}>
                            <Grid item>
                                <Button
                                    variant="contained"
                                    startIcon={<People />}
                                    onClick={handleUserManagement}
                                >
                                    User Management
                                </Button>
                            </Grid>
                            <Grid item>
                                <Button
                                    variant="outlined"
                                    startIcon={<Assignment />}
                                    onClick={() => navigate('/projects/configure')}
                                >
                                    Create Project
                                </Button>
                            </Grid>
                            <Grid item>
                                <Button
                                    variant="outlined"
                                    startIcon={<DashboardIcon />}
                                    onClick={() => navigate('/dashboard')}
                                >
                                    Dashboard
                                </Button>
                            </Grid>
                        </Grid>

                        <Alert severity="info" sx={{ mt: 3 }}>
                            <Typography variant="subtitle2">Project User Management</Typography>
                            Manage users within projects, add or remove users from specific projects, and control project access.
                        </Alert>
                    </CardContent>
                </Card>
            </Box>
        </Container>
    );
};

export default AdminSettings; 
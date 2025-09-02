import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Container,
    Paper,
    Box,
    Typography,
    Button,
    Card,
    CardContent,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    Avatar,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Alert,
    CircularProgress,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Checkbox,
    Tooltip,
    Divider
} from '@mui/material';
import {
    ArrowBack,
    People,
    PersonAdd,
    PersonRemove,
    AdminPanelSettings,
    RateReview,
    Visibility,
    Search,
    Refresh
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
import { usersAPI, projectsAPI } from '../../services/api';

const ProjectUserManagement = () => {
    const { projectId } = useParams();
    const { user, USER_ROLES } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [project, setProject] = useState(null);
    const [allUsers, setAllUsers] = useState([]);
    const [projectUsers, setProjectUsers] = useState([]);

    // Add user dialog state
    const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);
    const [availableUsers, setAvailableUsers] = useState([]);
    const [selectedUsersToAdd, setSelectedUsersToAdd] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    // Remove user confirmation dialog
    const [removeUserDialogOpen, setRemoveUserDialogOpen] = useState(false);
    const [userToRemove, setUserToRemove] = useState(null);

    useEffect(() => {
        if (user && user.role !== USER_ROLES.ADMIN) {
            navigate('/dashboard');
            return;
        }
        loadData();
    }, [user, navigate, USER_ROLES.ADMIN, projectId]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [usersResult, projectResult] = await Promise.all([
                usersAPI.getAllUsers(),
                projectsAPI.getProject(projectId)
            ]);

            if (usersResult.success) {
                setAllUsers(usersResult.data);
            } else {
                toast.error(usersResult.error);
            }

            if (projectResult.success) {
                setProject(projectResult.data);
                // Get users assigned to this project
                const assignedUsers = projectResult.data.participants?.map(username => {
                    const userData = usersResult.data?.find(u => u.username === username);
                    return userData || { username, name: username, role: 'unknown' };
                }) || [];
                setProjectUsers(assignedUsers);
            } else {
                toast.error(projectResult.error);
            }
        } catch (error) {
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        navigate(`/projects/${projectId}/review`);
    };

    // Get users not assigned to this project
    const getAvailableUsers = () => {
        const assignedUsernames = project?.participants || [];
        return allUsers.filter(userData => !assignedUsernames.includes(userData.username));
    };

    // Handle adding users to project
    const handleAddUsersToProject = () => {
        const available = getAvailableUsers();
        setAvailableUsers(available);
        setSelectedUsersToAdd([]);
        setSearchTerm('');
        setAddUserDialogOpen(true);
    };

    // Handle removing user from project
    const handleRemoveUserFromProject = (userData) => {
        setUserToRemove(userData);
        setRemoveUserDialogOpen(true);
    };

    // Confirm adding selected users to project
    const confirmAddUsers = async () => {
        try {
            const promises = selectedUsersToAdd.map(username =>
                usersAPI.addUserToProject(username, projectId)
            );

            const results = await Promise.all(promises);
            const successCount = results.filter(r => r.success).length;

            if (successCount > 0) {
                toast.success(`${successCount} user(s) added to project successfully`);
                loadData(); // Refresh data
            }

            const failedCount = results.length - successCount;
            if (failedCount > 0) {
                toast.error(`Failed to add ${failedCount} user(s) to project`);
            }
        } catch (error) {
            toast.error('Failed to add users to project');
        } finally {
            setAddUserDialogOpen(false);
            setSelectedUsersToAdd([]);
        }
    };

    // Confirm removing user from project
    const confirmRemoveUser = async () => {
        try {
            const result = await usersAPI.removeUserFromProject(userToRemove.username, projectId);
            if (result.success) {
                toast.success('User removed from project successfully');
                loadData(); // Refresh data
            } else {
                toast.error(result.error);
            }
        } catch (error) {
            toast.error('Failed to remove user from project');
        } finally {
            setRemoveUserDialogOpen(false);
            setUserToRemove(null);
        }
    };

    // Handle user selection for adding
    const handleUserSelection = (username, checked) => {
        if (checked) {
            setSelectedUsersToAdd(prev => [...prev, username]);
        } else {
            setSelectedUsersToAdd(prev => prev.filter(name => name !== username));
        }
    };

    // Filter available users based on search term
    const filteredAvailableUsers = availableUsers.filter(userData =>
        userData.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        userData.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        userData.username.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getRoleIcon = (role) => {
        switch (role) {
            case USER_ROLES.ADMIN:
                return <AdminPanelSettings />;
            case USER_ROLES.REVIEWER:
                return <RateReview />;
            case USER_ROLES.VIEWER:
                return <Visibility />;
            default:
                return <Visibility />;
        }
    };

    const getRoleColor = (role) => {
        switch (role) {
            case USER_ROLES.ADMIN:
                return 'error';
            case USER_ROLES.REVIEWER:
                return 'warning';
            case USER_ROLES.VIEWER:
                return 'info';
            default:
                return 'default';
        }
    };

    if (loading) {
        return (
            <Container maxWidth="lg">
                <Box sx={{ mt: 4, mb: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                    <CircularProgress />
                </Box>
            </Container>
        );
    }

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
                                User Management
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Manage users for project: {project?.title}
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <Button
                                variant="contained"
                                startIcon={<PersonAdd />}
                                onClick={handleAddUsersToProject}
                            >
                                Add Users
                            </Button>
                            <Button
                                variant="outlined"
                                startIcon={<Refresh />}
                                onClick={loadData}
                            >
                                Refresh
                            </Button>
                        </Box>
                    </Box>
                </Paper>

                {/* Project Users */}
                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                            <People sx={{ mr: 1 }} />
                            Project Users ({projectUsers.length})
                        </Typography>

                        {projectUsers.length === 0 ? (
                            <Alert severity="info" sx={{ mt: 2 }}>
                                No users assigned to this project yet. Click "Add Users" to assign users to this project.
                            </Alert>
                        ) : (
                            <TableContainer sx={{ mt: 2 }}>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>User</TableCell>
                                            <TableCell>Role</TableCell>
                                            <TableCell>Department</TableCell>
                                            <TableCell align="center">Actions</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {projectUsers.map((userData) => (
                                            <TableRow key={userData.username}>
                                                <TableCell>
                                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                        <Avatar sx={{ mr: 2, bgcolor: 'primary.main', width: 40, height: 40 }}>
                                                            {userData.name?.charAt(0).toUpperCase()}
                                                        </Avatar>
                                                        <Box>
                                                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                                {userData.name}
                                                            </Typography>
                                                            <Typography variant="body2" color="text.secondary">
                                                                {userData.email}
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                </TableCell>
                                                <TableCell>
                                                    <Chip
                                                        icon={getRoleIcon(userData.role)}
                                                        label={userData.role?.charAt(0).toUpperCase() + userData.role?.slice(1)}
                                                        color={getRoleColor(userData.role)}
                                                        variant="outlined"
                                                        size="small"
                                                    />
                                                </TableCell>
                                                <TableCell>{userData.department || 'N/A'}</TableCell>
                                                <TableCell align="center">
                                                    {userData.role !== USER_ROLES.ADMIN && (
                                                        <Tooltip title="Remove from Project">
                                                            <IconButton
                                                                onClick={() => handleRemoveUserFromProject(userData)}
                                                                size="small"
                                                                color="error"
                                                            >
                                                                <PersonRemove />
                                                            </IconButton>
                                                        </Tooltip>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}
                    </CardContent>
                </Card>

                {/* Add Users Dialog */}
                <Dialog
                    open={addUserDialogOpen}
                    onClose={() => setAddUserDialogOpen(false)}
                    maxWidth="md"
                    fullWidth
                >
                    <DialogTitle>
                        Add Users to Project: {project?.title}
                    </DialogTitle>
                    <DialogContent>
                        <Box sx={{ mb: 2 }}>
                            <TextField
                                fullWidth
                                placeholder="Search users by name, email, or username..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                InputProps={{
                                    startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
                                }}
                                sx={{ mb: 2 }}
                            />
                        </Box>

                        {filteredAvailableUsers.length === 0 ? (
                            <Alert severity="info">
                                {searchTerm ? 'No users found matching your search.' : 'All users are already assigned to this project.'}
                            </Alert>
                        ) : (
                            <List>
                                {filteredAvailableUsers.map((userData) => (
                                    <ListItem key={userData.username} divider>
                                        <ListItemIcon>
                                            <Checkbox
                                                checked={selectedUsersToAdd.includes(userData.username)}
                                                onChange={(e) => handleUserSelection(userData.username, e.target.checked)}
                                            />
                                        </ListItemIcon>
                                        <ListItemIcon>
                                            <Avatar sx={{ width: 32, height: 32 }}>
                                                {userData.name?.charAt(0).toUpperCase()}
                                            </Avatar>
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={userData.name}
                                            secondary={`${userData.email} • ${userData.department || 'No Department'}`}
                                        />
                                        <Chip
                                            icon={getRoleIcon(userData.role)}
                                            label={userData.role}
                                            color={getRoleColor(userData.role)}
                                            variant="outlined"
                                            size="small"
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setAddUserDialogOpen(false)}>Cancel</Button>
                        <Button
                            variant="contained"
                            onClick={confirmAddUsers}
                            disabled={selectedUsersToAdd.length === 0}
                        >
                            Add {selectedUsersToAdd.length} User(s)
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Remove User Confirmation Dialog */}
                <Dialog
                    open={removeUserDialogOpen}
                    onClose={() => setRemoveUserDialogOpen(false)}
                    maxWidth="sm"
                    fullWidth
                >
                    <DialogTitle>Remove User from Project</DialogTitle>
                    <DialogContent>
                        <Typography variant="body1" gutterBottom>
                            Are you sure you want to remove <strong>{userToRemove?.name}</strong> from this project?
                        </Typography>
                        <Alert severity="warning" sx={{ mt: 2 }}>
                            This user will lose access to this project and all its data.
                        </Alert>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setRemoveUserDialogOpen(false)}>Cancel</Button>
                        <Button
                            variant="contained"
                            color="error"
                            onClick={confirmRemoveUser}
                        >
                            Remove User
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </Container>
    );
};

export default ProjectUserManagement; 
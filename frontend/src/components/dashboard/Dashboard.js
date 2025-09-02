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
  Chip,
  Avatar,
  Fab,
  CardActions,
  Divider,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Monitor,
  ExitToApp,
  AdminPanelSettings,
  RateReview,
  Visibility,
  Add,
  Search,
  People,
  Assessment,
  ManageAccounts
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { projectsAPI } from '../../services/api';
import { toast } from 'react-toastify';

const Dashboard = () => {
  const { user, logout, USER_ROLES } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProjects();
  }, [user]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await projectsAPI.getAllProjects();

      if (result.success) {
        // Filter projects based on user role and participation
        let userProjects = [];

        if (user?.role === USER_ROLES.ADMIN) {
          // Admin sees projects they created
          userProjects = result.data.filter(project => project.adminId === user.username);
        } else if (user?.role === USER_ROLES.REVIEWER) {
          // Reviewer sees projects they're part of
          userProjects = result.data.filter(project =>
            project.adminId === user.username ||
            (project.participants && project.participants.includes(user.username))
          );
        } else {
          // Viewer sees projects they have access to
          userProjects = result.data.filter(project =>
            project.adminId === user.username ||
            (project.participants && project.participants.includes(user.username))
          );
        }

        // Transform backend data to match frontend expectations
        const transformedProjects = userProjects.map(project => ({
          ...project,
          participants: [project.adminId, 'reviewer1', 'reviewer2'],
          status: 'active',
          productCategory: 'Smart Monitor',
          createdDate: new Date(project.createdDate).toISOString().split('T')[0]
        }));

        setProjects(transformedProjects);
      } else {
        setError(result.error);
        toast.error(result.error);
      }
    } catch (error) {
      setError('Failed to fetch projects');
      toast.error('Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  const handleCreateProject = () => {
    navigate('/projects/configure');
  };

  const handleExploreProjects = () => {
    // TODO: Navigate to explore projects page
    console.log('Navigate to explore projects');
  };

  const handleOpenProject = (projectId) => {
    console.log('Opening project:', projectId);
    navigate(`/projects/${projectId}/review`);
  };

  const handleProjectUserManagement = (event, projectId) => {
    event.stopPropagation(); // Prevent card click from opening project
    navigate(`/projects/${projectId}/users`);
  };

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

  // Project Card Component
  const ProjectCard = ({ project }) => {
    return (
      <Card
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: 4,
          },
          cursor: 'pointer'
        }}
        onClick={() => handleOpenProject(project.id)}
      >
        <CardContent sx={{ flexGrow: 1 }}>
          <Box sx={{ mb: 2 }}>
            <Typography
              variant="h6"
              component="h3"
              sx={{
                fontWeight: 600,
                mb: 2,
                wordWrap: 'break-word',
                wordBreak: 'break-word',
                hyphens: 'auto',
                lineHeight: 1.3
              }}
            >
              {project.title}
            </Typography>
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 40 }}>
            {project.description}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar sx={{ width: 32, height: 32, mr: 1, bgcolor: 'primary.main' }}>
                {project.adminName.split(' ').map(n => n[0]).join('')}
              </Avatar>
              <Typography variant="body2" color="text.secondary">
                Created by <strong>{project.adminName}</strong>
              </Typography>
            </Box>
            <Chip
              label={project.status}
              color={project.status === 'completed' ? 'success' : 'primary'}
              size="small"
            />
          </Box>

          {user?.role === USER_ROLES.ADMIN && (
            <Box sx={{ mt: 2 }}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<ManageAccounts />}
                onClick={(e) => handleProjectUserManagement(e, project.id)}
                size="small"
              >
                Manage Users
              </Button>
            </Box>
          )}
        </CardContent>

        <CardActions sx={{ justifyContent: 'space-between', px: 2, py: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <People sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary">
              {project.participants.length} members
            </Typography>
          </Box>
          <Typography variant="caption" color="text.secondary">
            {new Date(project.createdDate).toLocaleDateString()}
          </Typography>
        </CardActions>
      </Card>
    );
  };

  // Empty State Component
  const EmptyState = () => {
    if (user?.role === USER_ROLES.ADMIN) {
      return (
        <Box
          sx={{
            textAlign: 'center',
            py: 8,
            px: 4,
          }}
        >
          <Assessment sx={{ fontSize: 80, color: 'text.secondary', mb: 3 }} />
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
            Welcome, Project Admin!
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 500, mx: 'auto' }}>
            You haven't created any FMS key review projects yet. Start by creating your first project to configure model comparisons and invite team members.
          </Typography>
          <Button
            variant="contained"
            size="large"
            startIcon={<Add />}
            onClick={handleCreateProject}
            sx={{
              px: 4,
              py: 1.5,
              background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
              '&:hover': {
                background: 'linear-gradient(45deg, #1565c0 30%, #1976d2 90%)',
              },
            }}
          >
            Create Your First Project
          </Button>
        </Box>
      );
    } else {
      return (
        <Box
          sx={{
            textAlign: 'center',
            py: 8,
            px: 4,
          }}
        >
          <Search sx={{ fontSize: 80, color: 'text.secondary', mb: 3 }} />
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
            No Projects Found
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 500, mx: 'auto' }}>
            You haven't joined any FMS key review projects yet. Explore available projects or wait for an admin to invite you to a project.
          </Typography>
          <Button
            variant="contained"
            size="large"
            startIcon={<Search />}
            onClick={handleExploreProjects}
            sx={{
              px: 4,
              py: 1.5,
              background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
              '&:hover': {
                background: 'linear-gradient(45deg, #1565c0 30%, #1976d2 90%)',
              },
            }}
          >
            Explore Projects
          </Button>
        </Box>
      );
    }
  };

  // Loading State
  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ mt: 4, mb: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  // Error State
  if (error) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ mt: 4, mb: 4 }}>
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
          <Button variant="contained" onClick={fetchProjects}>
            Retry
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        {/* Header */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', mr: 2 }}>
                <Monitor color="primary" />
              </Box>
              <Typography
                variant="h4"
                sx={{
                  color: '#0d459c',
                  fontWeight: 700,
                }}
              >
                SAMSUNG FMS Portal
              </Typography>
            </Box>
            <Button
              variant="outlined"
              startIcon={<ExitToApp />}
              onClick={handleLogout}
              color="primary"
            >
              Logout
            </Button>
          </Box>
        </Paper>

        {/* Welcome Section */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar
                sx={{
                  bgcolor: 'primary.main',
                  mr: 2,
                  width: 56,
                  height: 56,
                }}
              >
                {user?.name?.charAt(0).toUpperCase()}
              </Avatar>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="h5" gutterBottom>
                  Welcome back, {user?.name}!
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip
                    icon={getRoleIcon(user?.role)}
                    label={user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
                    color={getRoleColor(user?.role)}
                    variant="outlined"
                  />
                  <Typography variant="body2" color="text.secondary">
                    {user?.department || user?.team} • {user?.username || user?.email?.split('@')[0]}
                  </Typography>
                </Box>
              </Box>

              {/* Action Buttons */}
              <Box sx={{ display: 'flex', gap: 1 }}>
                {user?.role === USER_ROLES.ADMIN && (
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={handleCreateProject}
                    sx={{
                      background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
                      '&:hover': {
                        background: 'linear-gradient(45deg, #1565c0 30%, #1976d2 90%)',
                      },
                    }}
                  >
                    Create Project
                  </Button>
                )}
                {user?.role !== USER_ROLES.ADMIN && (
                  <Button
                    variant="outlined"
                    startIcon={<Search />}
                    onClick={handleExploreProjects}
                  >
                    Explore Projects
                  </Button>
                )}
              </Box>
            </Box>
            <Typography variant="body1" color="text.secondary">
              You are logged in as a <strong>{user?.role}</strong>.
              {user?.role === USER_ROLES.ADMIN && " You can create and manage FMS key review projects."}
              {user?.role === USER_ROLES.REVIEWER && " You can review and modify FMS key values within assigned projects."}
              {user?.role === USER_ROLES.VIEWER && " You have read-only access to view FMS key data and comparisons."}
            </Typography>
          </CardContent>
        </Card>

        {/* Projects Section */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              {user?.role === USER_ROLES.ADMIN ? 'Your Projects' : 'Assigned Projects'}
            </Typography>
            {projects.length > 0 && (
              <Typography variant="body2" color="text.secondary">
                {projects.length} project{projects.length > 1 ? 's' : ''}
              </Typography>
            )}
          </Box>

          {projects.length === 0 ? (
            <EmptyState />
          ) : (
            <Grid container spacing={3}>
              {projects.map((project) => (
                <Grid item xs={12} md={6} lg={4} key={project.id}>
                  <ProjectCard project={project} />
                </Grid>
              ))}
            </Grid>
          )}
        </Box>

        {/* Floating Action Button for Mobile */}
        {user?.role === USER_ROLES.ADMIN && (
          <Fab
            color="primary"
            aria-label="create project"
            onClick={handleCreateProject}
            sx={{
              position: 'fixed',
              bottom: 24,
              right: 24,
              display: { xs: 'flex', md: 'none' },
            }}
          >
            <Add />
          </Fab>
        )}
      </Box>
    </Container>
  );
};

export default Dashboard; 
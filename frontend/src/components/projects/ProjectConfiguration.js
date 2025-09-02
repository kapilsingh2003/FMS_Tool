import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container,
    Paper,
    Box,
    Typography,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Button,
    Card,
    CardContent,
    Grid,
    Divider,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
    Stepper,
    Step,
    StepLabel,
    Autocomplete,
    Collapse,
    CardHeader,
    CardActions,
    CircularProgress,
    Tooltip
} from '@mui/material';
import {
    ArrowBack,
    Add,
    Edit,
    Delete,
    Save,
    CheckCircle,
    Error,
    Settings,
    CompareArrows,
    DeviceHub,
    ExpandMore,
    ExpandLess,
    Group,
    FolderOpen,
    InfoOutlined
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
import { projectsAPI, referenceAPI } from '../../services/api';

const TITLE_LIMIT = 100;
const DESCRIPTION_LIMIT = 500;

const comparisonTypes = [
    { value: '2-way', label: '2-Way Comparison' },
    { value: '3-way', label: '3-Way Comparison' },
    { value: '4-way', label: '4-Way Comparison' },
    { value: '2-way-vs-2-way', label: '2-Way vs 2-Way Comparison' }
];

const refreshSchedules = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' }
];

const steps = ['Basic Settings', 'Group Configuration', 'Model Management'];

const ProjectConfiguration = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [activeStep, setActiveStep] = useState(0);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Reference data from backend
    const [branches, setBranches] = useState([]);
    const [modelOptions, setModelOptions] = useState([]);

    // Project configuration state (removed comparisonType)
    const [projectConfig, setProjectConfig] = useState({
        title: '',
        description: '',
        refreshSchedule: '',
        groups: []
    });

    // Group management state (added comparisonType to group structure)
    const [groups, setGroups] = useState([]);
    const [groupDialogOpen, setGroupDialogOpen] = useState(false);
    const [newGroup, setNewGroup] = useState({ name: '', comparisonType: '', branches: {} });
    const [editingGroupIndex, setEditingGroupIndex] = useState(null);
    const [expandedGroups, setExpandedGroups] = useState({});

    // Model management state
    const [modelDialogOpen, setModelDialogOpen] = useState(false);
    const [newModel, setNewModel] = useState({});
    const [editingModel, setEditingModel] = useState({ groupIndex: null, modelIndex: null });
    const [currentGroupIndex, setCurrentGroupIndex] = useState(null);

    // Load reference data on component mount
    useEffect(() => {
        loadReferenceData();
    }, []);

    const loadReferenceData = async () => {
        try {
            setLoading(true);

            // Load branches and models in parallel
            const [branchesResult, modelsResult] = await Promise.all([
                referenceAPI.getBranches(),
                referenceAPI.getModels()
            ]);

            if (branchesResult.success) {
                setBranches(branchesResult.data.map(branch => branch.branch_name));
            } else {
                toast.error('Failed to load branches');
            }

            if (modelsResult.success) {
                setModelOptions(modelsResult.data.map(model => model.model_name));
            } else {
                toast.error('Failed to load models');
            }
        } catch (error) {
            toast.error('Failed to load reference data');
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        navigate('/dashboard');
    };

    const handleBasicSettingChange = (field, value) => {
        setProjectConfig(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Updated to work with group-specific comparison type
    const getBranchConfig = (comparisonType) => {
        switch (comparisonType) {
            case '2-way':
                return ['target', 'reference'];
            case '3-way':
                return ['target', 'reference1', 'reference2'];
            case '4-way':
                return ['target', 'reference1', 'reference2', 'reference3'];
            case '2-way-vs-2-way':
                return ['target1', 'reference1', 'target2', 'reference2'];
            default:
                return [];
        }
    };

    // Updated to work with group-specific comparison type
    const getModelFields = (comparisonType) => {
        switch (comparisonType) {
            case '2-way':
                return [
                    { key: 'target', label: 'Target Model' },
                    { key: 'reference', label: 'Reference Model' }
                ];
            case '3-way':
                return [
                    { key: 'target', label: 'Target Model' },
                    { key: 'reference1', label: 'Reference 1 Model' },
                    { key: 'reference2', label: 'Reference 2 Model' }
                ];
            case '4-way':
                return [
                    { key: 'target', label: 'Target Model' },
                    { key: 'reference1', label: 'Reference 1 Model' },
                    { key: 'reference2', label: 'Reference 2 Model' },
                    { key: 'reference3', label: 'Reference 3 Model' }
                ];
            case '2-way-vs-2-way':
                return [
                    { key: 'target1', label: 'Target 1 Model' },
                    { key: 'reference1', label: 'Reference 1 Model' },
                    { key: 'target2', label: 'Target 2 Model' },
                    { key: 'reference2', label: 'Reference 2 Model' }
                ];
            default:
                return [];
        }
    };

    const validateGroupBranches = (groupBranches, comparisonType) => {
        const branchConfig = getBranchConfig(comparisonType);
        const selectedBranches = branchConfig.map(type => groupBranches[type]).filter(Boolean);
        const uniqueBranches = [...new Set(selectedBranches)];
        return uniqueBranches.length === selectedBranches.length && selectedBranches.length === branchConfig.length;
    };

    const validateNewModel = (model, comparisonType) => {
        // Check that all required fields are filled
        const modelFields = getModelFields(comparisonType);
        const missingFields = modelFields.filter(field => !model[field.key]);
        return missingFields.length === 0;
    };

    // Group management functions
    const handleAddGroup = () => {
        setNewGroup({ name: '', comparisonType: '', branches: {} });
        setEditingGroupIndex(null);
        setGroupDialogOpen(true);
    };

    const handleEditGroup = (index) => {
        setNewGroup({ ...groups[index] });
        setEditingGroupIndex(index);
        setGroupDialogOpen(true);
    };

    const handleDeleteGroup = (index) => {
        const updatedGroups = groups.filter((_, i) => i !== index);
        setGroups(updatedGroups);
        setProjectConfig(prev => ({
            ...prev,
            groups: updatedGroups
        }));
        toast.success('Group deleted successfully');
    };

    const handleSaveGroup = () => {
        // Validate group name
        if (!newGroup.name.trim()) {
            toast.error('Group name is required');
            return;
        }

        // Validate comparison type
        if (!newGroup.comparisonType) {
            toast.error('FMS Comparison Type is required');
            return;
        }

        // Validate branches
        if (!validateGroupBranches(newGroup.branches, newGroup.comparisonType)) {
            toast.error('All branches must be selected and unique');
            return;
        }

        // Check for duplicate group names
        const existingGroups = editingGroupIndex !== null ?
            groups.filter((_, i) => i !== editingGroupIndex) : groups;

        if (existingGroups.some(group => group.name === newGroup.name.trim())) {
            toast.error('Group name already exists');
            return;
        }

        const groupToSave = {
            ...newGroup,
            name: newGroup.name.trim(),
            models: editingGroupIndex !== null ? groups[editingGroupIndex].models : []
        };

        if (editingGroupIndex !== null) {
            // Update existing group
            const updatedGroups = groups.map((group, index) =>
                index === editingGroupIndex ? groupToSave : group
            );
            setGroups(updatedGroups);
            setProjectConfig(prev => ({
                ...prev,
                groups: updatedGroups
            }));
            toast.success('Group updated successfully');
        } else {
            // Add new group
            const updatedGroups = [...groups, groupToSave];
            setGroups(updatedGroups);
            setProjectConfig(prev => ({
                ...prev,
                groups: updatedGroups
            }));
            toast.success('Group created successfully');
        }

        setGroupDialogOpen(false);
        setNewGroup({ name: '', comparisonType: '', branches: {} });
        setEditingGroupIndex(null);
    };

    const handleGroupFieldChange = (field, value) => {
        setNewGroup(prev => ({
            ...prev,
            [field]: value,
            // Reset branches when comparison type changes
            ...(field === 'comparisonType' ? { branches: {} } : {})
        }));
    };

    const handleGroupBranchChange = (branchType, value) => {
        setNewGroup(prev => ({
            ...prev,
            branches: {
                ...prev.branches,
                [branchType]: value
            }
        }));
    };

    const toggleGroupExpansion = (groupIndex) => {
        setExpandedGroups(prev => ({
            ...prev,
            [groupIndex]: !prev[groupIndex]
        }));
    };

    // Model management functions
    const handleAddModel = (groupIndex) => {
        setNewModel({});
        setEditingModel({ groupIndex: null, modelIndex: null });
        setCurrentGroupIndex(groupIndex);
        setModelDialogOpen(true);
    };

    const handleEditModel = (groupIndex, modelIndex) => {
        setNewModel({ ...groups[groupIndex].models[modelIndex] });
        setEditingModel({ groupIndex, modelIndex });
        setCurrentGroupIndex(groupIndex);
        setModelDialogOpen(true);
    };

    const handleDeleteModel = (groupIndex, modelIndex) => {
        const updatedGroups = groups.map((group, gIndex) => {
            if (gIndex === groupIndex) {
                return {
                    ...group,
                    models: group.models.filter((_, mIndex) => mIndex !== modelIndex)
                };
            }
            return group;
        });

        setGroups(updatedGroups);
        setProjectConfig(prev => ({
            ...prev,
            groups: updatedGroups
        }));
        toast.success('Model removed successfully');
    };

    const handleSaveModel = () => {
        const currentGroup = groups[currentGroupIndex];
        const comparisonType = currentGroup.comparisonType;

        // Validate model
        if (!validateNewModel(newModel, comparisonType)) {
            toast.error('Please fill all model fields');
            return;
        }

        // Generate mock key differences
        const keyDifferences = Math.floor(Math.random() * 50) + 1;
        const modelWithStats = { ...newModel, keyDifferences };

        const updatedGroups = groups.map((group, gIndex) => {
            if (gIndex === currentGroupIndex) {
                if (editingModel.groupIndex !== null && editingModel.modelIndex !== null) {
                    // Update existing model
                    return {
                        ...group,
                        models: group.models.map((model, mIndex) =>
                            mIndex === editingModel.modelIndex ? modelWithStats : model
                        )
                    };
                } else {
                    // Add new model
                    return {
                        ...group,
                        models: [...(group.models || []), modelWithStats]
                    };
                }
            }
            return group;
        });

        setGroups(updatedGroups);
        setProjectConfig(prev => ({
            ...prev,
            groups: updatedGroups
        }));

        const message = editingModel.groupIndex !== null && editingModel.modelIndex !== null ?
            'Model updated successfully' : 'Model added successfully';
        toast.success(message);

        setModelDialogOpen(false);
        setNewModel({});
        setEditingModel({ groupIndex: null, modelIndex: null });
        setCurrentGroupIndex(null);
    };

    const handleFinish = async () => {
        // Final validation
        if (!projectConfig.title || !projectConfig.description) {
            toast.error('Please fill all basic settings');
            return;
        }

        if (groups.length === 0) {
            toast.error('Please create at least one group');
            return;
        }

        const hasModels = groups.some(group => group.models && group.models.length > 0);
        if (!hasModels) {
            toast.error('Please add at least one model to any group');
            return;
        }

        // Prepare project data for backend
        const projectData = {
            title: projectConfig.title,
            description: projectConfig.description,
            adminName: user.name,
            adminId: user.username,
            groups: groups, // Include groups with their comparison types
            models: groups.flatMap(group => group.models || []).map(model => {
                const modelFields = getModelFields(groups.find(g => g.models?.includes(model))?.comparisonType);
                return modelFields.map(field => model[field.key]).filter(Boolean);
            }).flat()
        };

        try {
            setSaving(true);
            const result = await projectsAPI.createProject(projectData);

            if (result.success) {
                toast.success('Project created successfully!');
                navigate('/dashboard');
            } else {
                toast.error(result.error || 'Failed to create project');
            }
        } catch (error) {
            toast.error('Failed to create project');
        } finally {
            setSaving(false);
        }
    };

    const canProceedToNext = () => {
        switch (activeStep) {
            case 0:
                return projectConfig.title && projectConfig.description && projectConfig.refreshSchedule;
            case 1:
                return groups.length > 0 && groups.every(group =>
                    group.comparisonType && validateGroupBranches(group.branches, group.comparisonType)
                );
            case 2:
                return groups.some(group => group.models && group.models.length > 0);
            default:
                return false;
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
                                Create New Project
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Configure project settings with group-specific FMS comparison types
                            </Typography>
                        </Box>
                        <Chip
                            icon={<Settings />}
                            label={`${user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)} Mode`}
                            color="primary"
                            variant="outlined"
                        />
                    </Box>

                    {/* Stepper */}
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Stepper activeStep={activeStep} sx={{ mt: 3, flexGrow: 1 }}>
                            {steps.map((label) => (
                                <Step key={label}>
                                    <StepLabel>{label}</StepLabel>
                                </Step>
                            ))}
                        </Stepper>
                        <Tooltip
                            title={
                                <Box>
                                    <Typography variant="subtitle2" gutterBottom>Project Creation Process</Typography>
                                    <Typography variant="body2">
                                        <strong>Step 1:</strong> Set project title, description, and refresh schedule<br />
                                        <strong>Step 2:</strong> Create groups with comparison types and branch mappings<br />
                                        <strong>Step 3:</strong> Add models to groups for comparison analysis<br /><br />
                                        💡 <em>Each step must be completed before proceeding to the next</em>
                                    </Typography>
                                </Box>
                            }
                            arrow
                            placement="left"
                        >
                            <IconButton size="small" sx={{ ml: 2, mt: 3 }}>
                                <InfoOutlined fontSize="small" color="primary" />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Paper>

                {/* Step 0: Basic Settings (removed FMS Comparison Type) */}
                {activeStep === 0 && (
                    <Card sx={{ mb: 3 }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Settings sx={{ mr: 1 }} />
                                    Basic Project Settings
                                </Typography>
                                <Tooltip
                                    title={
                                        <Box>
                                            <Typography variant="subtitle2" gutterBottom>Basic Project Settings</Typography>
                                            <Typography variant="body2">
                                                • <strong>Project Title:</strong> A descriptive name for your FMS key review project<br />
                                                • <strong>Description:</strong> Explain the scope, objectives, and purpose of this review<br />
                                                • <strong>Refresh Schedule:</strong> How often the FMS data should be updated from the source
                                            </Typography>
                                        </Box>
                                    }
                                    arrow
                                    placement="right"
                                >
                                    <IconButton size="small" sx={{ ml: 1 }}>
                                        <InfoOutlined fontSize="small" color="action" />
                                    </IconButton>
                                </Tooltip>
                            </Box>

                            <Grid container spacing={3} sx={{ mt: 1 }}>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        label="Project Title"
                                        value={projectConfig.title}
                                        onChange={(e) => handleBasicSettingChange('title', e.target.value.slice(0, TITLE_LIMIT))}
                                        helperText={`${projectConfig.title.length}/${TITLE_LIMIT} characters`}
                                        placeholder="e.g., SM_GameBar_Keys_Review"
                                    />
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <FormControl fullWidth>
                                        <InputLabel>Refresh Schedule</InputLabel>
                                        <Select
                                            value={projectConfig.refreshSchedule}
                                            label="Refresh Schedule"
                                            onChange={(e) => handleBasicSettingChange('refreshSchedule', e.target.value)}
                                        >
                                            {refreshSchedules.map((schedule) => (
                                                <MenuItem key={schedule.value} value={schedule.value}>
                                                    {schedule.label}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>

                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        multiline
                                        rows={3}
                                        label="Project Description"
                                        value={projectConfig.description}
                                        onChange={(e) => handleBasicSettingChange('description', e.target.value.slice(0, DESCRIPTION_LIMIT))}
                                        helperText={`${projectConfig.description.length}/${DESCRIPTION_LIMIT} characters`}
                                        placeholder="Describe the scope and objectives of this FMS key review project..."
                                    />
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                )}

                {/* Step 1: Group Configuration (now includes FMS Comparison Type per group) */}
                {activeStep === 1 && (
                    <Card sx={{ mb: 3 }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                                        <Group sx={{ mr: 1 }} />
                                        Group Configuration
                                    </Typography>
                                    <Tooltip
                                        title={
                                            <Box>
                                                <Typography variant="subtitle2" gutterBottom>Group Configuration</Typography>
                                                <Typography variant="body2">
                                                    • <strong>Groups:</strong> Organize models with similar comparison requirements<br />
                                                    • <strong>FMS Comparison Type:</strong> Choose how many branches to compare (2-way, 3-way, etc.)<br />
                                                    • <strong>Branch Configuration:</strong> Map specific code branches for comparison<br />
                                                    • Each group can have different comparison types within the same project
                                                </Typography>
                                            </Box>
                                        }
                                        arrow
                                        placement="left"
                                    >
                                        <IconButton size="small" sx={{ ml: 1 }}>
                                            <InfoOutlined fontSize="small" color="action" />
                                        </IconButton>
                                    </Tooltip>
                                </Box>
                                <Button
                                    variant="contained"
                                    startIcon={<Add />}
                                    onClick={handleAddGroup}
                                    sx={{
                                        background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
                                        '&:hover': {
                                            background: 'linear-gradient(45deg, #1565c0 30%, #1976d2 90%)',
                                        },
                                    }}
                                >
                                    Create Group
                                </Button>
                            </Box>

                            <Alert severity="info" sx={{ mb: 2 }}>
                                Each group can have its own FMS comparison type and corresponding branch configuration.
                            </Alert>

                            {groups.length === 0 ? (
                                <Box sx={{ textAlign: 'center', py: 4 }}>
                                    <Typography variant="body1" color="text.secondary" gutterBottom>
                                        No groups configured yet
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Click "Create Group" to start configuring your groups with specific FMS comparison types
                                    </Typography>
                                </Box>
                            ) : (
                                <Box sx={{ mt: 2 }}>
                                    {groups.map((group, index) => (
                                        <Card key={index} sx={{ mb: 2, border: '1px solid #e0e0e0' }}>
                                            <CardHeader
                                                title={
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Typography variant="h6">{group.name}</Typography>
                                                        <Chip
                                                            size="small"
                                                            label={comparisonTypes.find(t => t.value === group.comparisonType)?.label || group.comparisonType}
                                                            color="secondary"
                                                        />
                                                        <Chip size="small" label={`${(group.models || []).length} models`} />
                                                    </Box>
                                                }
                                                subheader={
                                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                                                        {getBranchConfig(group.comparisonType).map((branchType) => (
                                                            <Chip
                                                                key={branchType}
                                                                label={`${branchType}: ${group.branches[branchType] || 'Not set'}`}
                                                                size="small"
                                                                variant="outlined"
                                                                color={group.branches[branchType] ? 'primary' : 'default'}
                                                            />
                                                        ))}
                                                    </Box>
                                                }
                                                action={
                                                    <Box>
                                                        <IconButton onClick={() => handleEditGroup(index)}>
                                                            <Edit />
                                                        </IconButton>
                                                        <IconButton onClick={() => handleDeleteGroup(index)} color="error">
                                                            <Delete />
                                                        </IconButton>
                                                    </Box>
                                                }
                                            />
                                        </Card>
                                    ))}
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Step 2: Model Management (updated to use group-specific comparison types) */}
                {activeStep === 2 && (
                    <Card sx={{ mb: 3 }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                                    <CompareArrows sx={{ mr: 1 }} />
                                    Model Management
                                </Typography>
                                <Tooltip
                                    title={
                                        <Box>
                                            <Typography variant="subtitle2" gutterBottom>Model Management</Typography>
                                            <Typography variant="body2">
                                                • <strong>Models:</strong> Specific product models to compare (e.g., M80D, G95SC)<br />
                                                • <strong>Model Fields:</strong> Based on group's comparison type (Target, Reference1, etc.)<br />
                                                • <strong>Key Differences:</strong> Auto-calculated differences in FMS keys between models<br />
                                                • Add multiple model configurations per group for comprehensive comparison
                                            </Typography>
                                        </Box>
                                    }
                                    arrow
                                    placement="right"
                                >
                                    <IconButton size="small" sx={{ ml: 1 }}>
                                        <InfoOutlined fontSize="small" color="action" />
                                    </IconButton>
                                </Tooltip>
                            </Box>

                            {groups.length === 0 ? (
                                <Box sx={{ textAlign: 'center', py: 4 }}>
                                    <Typography variant="body1" color="text.secondary" gutterBottom>
                                        No groups available
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Go back to create groups first
                                    </Typography>
                                </Box>
                            ) : (
                                <Box sx={{ mt: 2 }}>
                                    {groups.map((group, groupIndex) => (
                                        <Card key={groupIndex} sx={{ mb: 2, border: '1px solid #e0e0e0' }}>
                                            <CardHeader
                                                title={
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <FolderOpen color="primary" />
                                                        <Typography variant="h6">{group.name}</Typography>
                                                        <Chip
                                                            size="small"
                                                            label={comparisonTypes.find(t => t.value === group.comparisonType)?.label || group.comparisonType}
                                                            color="secondary"
                                                        />
                                                        <Chip size="small" label={`${(group.models || []).length} models`} />
                                                    </Box>
                                                }
                                                action={
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Button
                                                            size="small"
                                                            startIcon={<Add />}
                                                            onClick={() => handleAddModel(groupIndex)}
                                                        >
                                                            Add Model
                                                        </Button>
                                                        <IconButton onClick={() => toggleGroupExpansion(groupIndex)}>
                                                            {expandedGroups[groupIndex] ? <ExpandLess /> : <ExpandMore />}
                                                        </IconButton>
                                                    </Box>
                                                }
                                            />

                                            <Collapse in={expandedGroups[groupIndex]} timeout="auto" unmountOnExit>
                                                <CardContent sx={{ pt: 0 }}>
                                                    {!group.models || group.models.length === 0 ? (
                                                        <Box sx={{ textAlign: 'center', py: 2 }}>
                                                            <Typography variant="body2" color="text.secondary">
                                                                No models in this group yet
                                                            </Typography>
                                                        </Box>
                                                    ) : (
                                                        <TableContainer>
                                                            <Table size="small">
                                                                <TableHead>
                                                                    <TableRow>
                                                                        {getModelFields(group.comparisonType).map((field) => (
                                                                            <TableCell key={field.key}>{field.label}</TableCell>
                                                                        ))}
                                                                        <TableCell align="center">Key Differences</TableCell>
                                                                        <TableCell align="center">Actions</TableCell>
                                                                    </TableRow>
                                                                </TableHead>
                                                                <TableBody>
                                                                    {group.models.map((model, modelIndex) => (
                                                                        <TableRow key={modelIndex}>
                                                                            {getModelFields(group.comparisonType).map((field) => (
                                                                                <TableCell key={field.key}>
                                                                                    <Chip label={model[field.key]} variant="outlined" size="small" />
                                                                                </TableCell>
                                                                            ))}
                                                                            <TableCell align="center">
                                                                                <Chip
                                                                                    label={model.keyDifferences}
                                                                                    color="error"
                                                                                    size="small"
                                                                                    icon={<Error />}
                                                                                />
                                                                            </TableCell>
                                                                            <TableCell align="center">
                                                                                <IconButton
                                                                                    size="small"
                                                                                    onClick={() => handleEditModel(groupIndex, modelIndex)}
                                                                                >
                                                                                    <Edit />
                                                                                </IconButton>
                                                                                <IconButton
                                                                                    size="small"
                                                                                    onClick={() => handleDeleteModel(groupIndex, modelIndex)}
                                                                                    color="error"
                                                                                >
                                                                                    <Delete />
                                                                                </IconButton>
                                                                            </TableCell>
                                                                        </TableRow>
                                                                    ))}
                                                                </TableBody>
                                                            </Table>
                                                        </TableContainer>
                                                    )}
                                                </CardContent>
                                            </Collapse>
                                        </Card>
                                    ))}
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Navigation Buttons */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Tooltip title={activeStep === 0 ? "You're on the first step" : "Go back to previous step"}>
                        <span>
                            <Button
                                onClick={() => setActiveStep(prev => Math.max(0, prev - 1))}
                                disabled={activeStep === 0}
                            >
                                Previous
                            </Button>
                        </span>
                    </Tooltip>

                    <Box sx={{ display: 'flex', gap: 2 }}>
                        {activeStep < steps.length - 1 ? (
                            <Tooltip
                                title={
                                    !canProceedToNext()
                                        ? `Complete all fields in ${steps[activeStep]} to continue`
                                        : `Proceed to ${steps[activeStep + 1]}`
                                }
                            >
                                <span>
                                    <Button
                                        variant="contained"
                                        onClick={() => setActiveStep(prev => prev + 1)}
                                        disabled={!canProceedToNext()}
                                    >
                                        Next
                                    </Button>
                                </span>
                            </Tooltip>
                        ) : (
                            <Tooltip
                                title={
                                    !canProceedToNext() || saving
                                        ? "Add at least one model to any group before finishing"
                                        : "Create your project with all configured groups and models"
                                }
                            >
                                <span>
                                    <Button
                                        variant="contained"
                                        startIcon={<CheckCircle />}
                                        onClick={handleFinish}
                                        disabled={!canProceedToNext() || saving}
                                        sx={{
                                            background: 'linear-gradient(45deg, #4caf50 30%, #66bb6a 90%)',
                                            '&:hover': {
                                                background: 'linear-gradient(45deg, #388e3c 30%, #4caf50 90%)',
                                            },
                                        }}
                                    >
                                        {saving ? 'Creating...' : 'Finish Configuration'}
                                    </Button>
                                </span>
                            </Tooltip>
                        )}
                    </Box>
                </Box>

                {/* Group Creation/Edit Dialog (updated with FMS Comparison Type) */}
                <Dialog
                    open={groupDialogOpen}
                    onClose={() => setGroupDialogOpen(false)}
                    maxWidth="md"
                    fullWidth
                >
                    <DialogTitle>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {editingGroupIndex !== null ? 'Edit Group' : 'Create New Group'}
                            <Tooltip
                                title={
                                    <Box>
                                        <Typography variant="subtitle2" gutterBottom>Group Creation Guide</Typography>
                                        <Typography variant="body2">
                                            1. <strong>Choose a descriptive name</strong> for your group<br />
                                            2. <strong>Select FMS Comparison Type</strong> based on how many branches you want to compare<br />
                                            3. <strong>Configure branches</strong> by mapping each role to a specific code branch<br />
                                            4. All branches must be unique within a group
                                        </Typography>
                                    </Box>
                                }
                                arrow
                                placement="bottom"
                            >
                                <IconButton size="small" sx={{ ml: 1 }}>
                                    <InfoOutlined fontSize="small" color="action" />
                                </IconButton>
                            </Tooltip>
                        </Box>
                    </DialogTitle>
                    <DialogContent>
                        <Box sx={{ mt: 2 }}>
                            <Grid container spacing={2}>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        label="Group Name"
                                        value={newGroup.name}
                                        onChange={(e) => handleGroupFieldChange('name', e.target.value)}
                                        placeholder="e.g., GameBar_Models, PowerSave_Models"
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <FormControl fullWidth>
                                        <InputLabel>FMS Comparison Type</InputLabel>
                                        <Select
                                            value={newGroup.comparisonType}
                                            label="FMS Comparison Type"
                                            onChange={(e) => handleGroupFieldChange('comparisonType', e.target.value)}
                                        >
                                            {comparisonTypes.map((type) => (
                                                <MenuItem key={type.value} value={type.value}>
                                                    {type.label}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>
                            </Grid>

                            {newGroup.comparisonType && (
                                <>
                                    <Typography variant="subtitle1" gutterBottom sx={{ mt: 3 }}>
                                        Branch Configuration ({comparisonTypes.find(t => t.value === newGroup.comparisonType)?.label})
                                    </Typography>

                                    <Grid container spacing={2}>
                                        {getBranchConfig(newGroup.comparisonType).map((branchType) => (
                                            <Grid item xs={12} md={6} key={branchType}>
                                                <Autocomplete
                                                    options={branches}
                                                    value={newGroup.branches[branchType] || ''}
                                                    onChange={(_, value) => handleGroupBranchChange(branchType, value)}
                                                    renderInput={(params) => (
                                                        <TextField
                                                            {...params}
                                                            label={`${branchType.charAt(0).toUpperCase() + branchType.slice(1).replace(/([A-Z])/g, ' $1')} Branch`}
                                                            placeholder="Select or type branch name"
                                                        />
                                                    )}
                                                    freeSolo
                                                />
                                            </Grid>
                                        ))}
                                    </Grid>

                                    {!validateGroupBranches(newGroup.branches, newGroup.comparisonType) && Object.keys(newGroup.branches).length > 0 && (
                                        <Alert severity="warning" sx={{ mt: 2 }}>
                                            All branches must be selected and unique. No two branches can be the same.
                                        </Alert>
                                    )}
                                </>
                            )}
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setGroupDialogOpen(false)}>Cancel</Button>
                        <Button
                            variant="contained"
                            onClick={handleSaveGroup}
                            startIcon={<Save />}
                        >
                            {editingGroupIndex !== null ? 'Update' : 'Create'} Group
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Model Dialog (updated to use current group's comparison type) */}
                <Dialog
                    open={modelDialogOpen}
                    onClose={() => setModelDialogOpen(false)}
                    maxWidth="md"
                    fullWidth
                >
                    <DialogTitle>
                        <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                {editingModel.modelIndex !== null ? 'Edit Model Configuration' : 'Add New Model Configuration'}
                                <Tooltip
                                    title={
                                        <Box>
                                            <Typography variant="subtitle2" gutterBottom>Model Configuration Guide</Typography>
                                            <Typography variant="body2">
                                                • <strong>Model Fields:</strong> Based on your group's comparison type<br />
                                                • <strong>Target:</strong> The main model being analyzed<br />
                                                • <strong>Reference:</strong> Models to compare against the target<br />
                                                • Use autocomplete or type custom model names<br />
                                                • All fields must be filled to save the model
                                            </Typography>
                                        </Box>
                                    }
                                    arrow
                                    placement="bottom"
                                >
                                    <IconButton size="small" sx={{ ml: 1 }}>
                                        <InfoOutlined fontSize="small" color="action" />
                                    </IconButton>
                                </Tooltip>
                            </Box>
                            {currentGroupIndex !== null && (
                                <Typography variant="subtitle2" color="text.secondary">
                                    Group: {groups[currentGroupIndex]?.name} ({comparisonTypes.find(t => t.value === groups[currentGroupIndex]?.comparisonType)?.label})
                                </Typography>
                            )}
                        </Box>
                    </DialogTitle>
                    <DialogContent>
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                            {currentGroupIndex !== null && getModelFields(groups[currentGroupIndex]?.comparisonType).map((field) => (
                                <Grid item xs={12} md={6} key={field.key}>
                                    <Autocomplete
                                        fullWidth
                                        options={modelOptions}
                                        value={newModel[field.key] || ''}
                                        onChange={(_, value) => setNewModel(prev => ({
                                            ...prev,
                                            [field.key]: value || ''
                                        }))}
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                label={field.label}
                                                placeholder="Search and select model..."
                                            />
                                        )}
                                        freeSolo
                                    />
                                </Grid>
                            ))}
                        </Grid>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setModelDialogOpen(false)}>Cancel</Button>
                        <Button
                            variant="contained"
                            onClick={handleSaveModel}
                            startIcon={<Save />}
                        >
                            {editingModel.modelIndex !== null ? 'Update' : 'Add'} Model
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </Container>
    );
};

export default ProjectConfiguration; 
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Container,
    Paper,
    Box,
    Typography,
    IconButton,
    Collapse,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Card,
    CardContent,
    CardHeader,
    Divider,
    Badge,
    Tooltip,
    Menu,
    ListItemIcon,
    ListItemText,
    Checkbox,
    FormControlLabel,
    InputAdornment
} from '@mui/material';
import {
    ArrowBack,
    ExpandMore,
    ExpandLess,
    Edit,
    Save,
    Cancel,
    Group,
    Key,
    Assignment,
    Person,
    Code,
    List,
    Comment,
    Visibility,
    VisibilityOff,
    ManageAccounts,
    MoreVert,
    SortByAlpha,
    FilterList,
    Search,
    Clear,
    ArrowUpward,
    ArrowDownward
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';

// Mock data for the key review
const mockProjectData = {
    id: 'proj-001',
    title: 'SM_GameBar_Keys_Review',
    description: 'Review of Samsung GameBar FMS keys for 2025 models',
    comparisonType: '3-way',
    groups: [
        {
            name: 'Group_25Y_SM',
            branches: {
                target: 'Trunk_25_MonitorRC_MP_Prj',
                reference1: 'SmartMonitor_2025_MP_Prj',
                reference2: 'Feature_GameBar_2025'
            },
            models: ['M80D', 'M70D', 'G95SD']
        },
        {
            name: 'Group_24Y_SM',
            branches: {
                target: 'Trunk_25_MonitorRC_MP_Prj',
                reference1: 'SmartMonitor_2025_MP_Prj',
                reference2: 'Feature_PowerSave_2025'
            },
            models: ['M50D', 'S90PD']
        }
    ]
};

const mockKeysData = [
    {
        id: 'key-001',
        keyName: 'com.samsung.key_1',
        workAssignment: 'TP_GameBar',
        owner: 'John Smith',
        groups: [
            {
                groupName: 'Group_25Y_SM',
                models: [
                    {
                        model: 'M80D',
                        target: 'True',
                        reference1: 'False',
                        reference2: 'True',
                        comment: 'Value is correct',
                        kona: 'RQ250607-0239',
                        cl: '1980283',
                        status: 'reviewed',
                        lastModified: '2024-01-15'
                    },
                    {
                        model: 'M70D',
                        target: 'True',
                        reference1: 'False',
                        reference2: 'False',
                        comment: 'Change required, KONA created',
                        kona: '',
                        cl: '',
                        status: 'pending',
                        lastModified: '2024-01-14'
                    },
                    {
                        model: 'G95SD',
                        target: 'True',
                        reference1: 'True',
                        reference2: 'True',
                        comment: 'No change required',
                        kona: '',
                        cl: '',
                        status: 'no-change',
                        lastModified: '2024-01-13'
                    }
                ]
            },
            {
                groupName: 'Group_24Y_SM',
                models: [
                    {
                        model: 'M50D',
                        target: 'False',
                        reference1: 'False',
                        reference2: 'False',
                        comment: 'Value is correct',
                        kona: '',
                        cl: '',
                        status: 'discussion',
                        lastModified: '2024-01-12'
                    }
                ]
            }
        ]
    },
    {
        id: 'key-002',
        keyName: 'com.samsung.key_2',
        workAssignment: 'TP_PowerSave',
        owner: 'Jane Doe',
        groups: [
            {
                groupName: 'Group_24Y_SM',
                models: [
                    {
                        model: 'M50D',
                        target: '2',
                        reference1: '1',
                        reference2: '2',
                        comment: 'Value is correct',
                        kona: 'RQ250611-0156',
                        cl: '1980789',
                        status: 'reviewed',
                        lastModified: '2024-01-16'
                    },
                    {
                        model: 'S90PD',
                        target: '3',
                        reference1: '2',
                        reference2: '1',
                        comment: 'Change required, KONA created',
                        kona: '',
                        cl: '',
                        status: 'pending',
                        lastModified: '2024-01-15'
                    }
                ]
            }
        ]
    },
    {
        id: 'key-003',
        keyName: 'com.samsung.key_3',
        workAssignment: 'TP_Sound',
        owner: 'Mike Johnson',
        groups: [
            {
                groupName: 'Group_25Y_SM',
                models: [
                    {
                        model: 'M80D',
                        target: 'True',
                        reference1: 'True',
                        reference2: 'False',
                        comment: 'Change required, KONA created',
                        kona: '',
                        cl: '',
                        status: 'discussion',
                        lastModified: '2024-01-17'
                    }
                ]
            }
        ]
    }
];

const statusColors = {
    'reviewed': { color: '#4caf50', label: 'Reviewed' },
    'pending': { color: '#ff9800', label: 'Pending Response' },
    'no-change': { color: '#2196f3', label: 'No Change' },
    'discussion': { color: '#ffeb3b', label: 'Internal Discussion' }
};

const statusOptions = [
    { value: 'reviewed', label: 'Reviewed' },
    { value: 'pending', label: 'Pending Response' },
    { value: 'no-change', label: 'No Change' },
    { value: 'discussion', label: 'Internal Discussion' }
];

const KeyReview = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const { user, USER_ROLES } = useAuth();

    const [project, setProject] = useState(mockProjectData);
    const [keys, setKeys] = useState(mockKeysData);
    const [expandedKeys, setExpandedKeys] = useState({});
    const [expandedGroups, setExpandedGroups] = useState({});
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [currentEdit, setCurrentEdit] = useState(null);
    const [editValue, setEditValue] = useState('');

    // Column menu states
    const [columnMenus, setColumnMenus] = useState({});
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [filters, setFilters] = useState({});
    const [searchTerms, setSearchTerms] = useState({});

    // Key-level filtering and sorting states
    const [keySearchTerm, setKeySearchTerm] = useState('');
    const [keySortBy, setKeySortBy] = useState('keyName');
    const [keySortDirection, setKeySortDirection] = useState('asc');
    const [keyFilters, setKeyFilters] = useState({
        status: [],
        owner: [],
        workAssignment: []
    });
    const [keyFiltersOpen, setKeyFiltersOpen] = useState(false);

    useEffect(() => {
        // In real app, fetch project and keys data based on projectId
        console.log('Loading project:', projectId);
    }, [projectId]);

    const handleBack = () => {
        navigate('/dashboard');
    };

    const handleProjectUserManagement = () => {
        navigate(`/projects/${projectId}/users`);
    };

    const toggleKeyExpansion = (keyId) => {
        setExpandedKeys(prev => ({
            ...prev,
            [keyId]: !prev[keyId]
        }));
    };

    const toggleGroupExpansion = (keyId, groupName) => {
        const groupKey = `${keyId}-${groupName}`;
        setExpandedGroups(prev => ({
            ...prev,
            [groupKey]: !prev[groupKey]
        }));
    };

    const handleCommentEdit = (keyId, groupName, modelIndex, currentValue) => {
        setCurrentEdit({ keyId, groupName, modelIndex, field: 'comment' });
        setEditValue(currentValue);
        setEditDialogOpen(true);
    };

    const handleStatusEdit = (keyId, groupName, modelIndex, currentValue) => {
        setCurrentEdit({ keyId, groupName, modelIndex, field: 'status' });
        setEditValue(currentValue);
        setEditDialogOpen(true);
    };

    const handleKonaEdit = (keyId, groupName, modelIndex, currentValue) => {
        setCurrentEdit({ keyId, groupName, modelIndex, field: 'kona' });
        setEditValue(currentValue);
        setEditDialogOpen(true);
    };

    const handleClEdit = (keyId, groupName, modelIndex, currentValue) => {
        setCurrentEdit({ keyId, groupName, modelIndex, field: 'cl' });
        setEditValue(currentValue);
        setEditDialogOpen(true);
    };

    const handleSaveEdit = () => {
        if (!currentEdit) return;

        const { keyId, groupName, modelIndex, field } = currentEdit;

        setKeys(prevKeys =>
            prevKeys.map(key => {
                if (key.id === keyId) {
                    return {
                        ...key,
                        groups: key.groups.map(group => {
                            if (group.groupName === groupName) {
                                return {
                                    ...group,
                                    models: group.models.map((model, index) => {
                                        if (index === modelIndex) {
                                            return {
                                                ...model,
                                                [field]: editValue,
                                                lastModified: new Date().toISOString().split('T')[0]
                                            };
                                        }
                                        return model;
                                    })
                                };
                            }
                            return group;
                        })
                    };
                }
                return key;
            })
        );

        setEditDialogOpen(false);
        setCurrentEdit(null);
        setEditValue('');
        toast.success('Value updated successfully');
    };

    const getBranchLabels = () => {
        switch (project.comparisonType) {
            case '2-way':
                return { target: 'Target', reference1: 'Reference' };
            case '3-way':
                return { target: 'Target', reference1: 'Reference 1', reference2: 'Reference 2' };
            case '4-way':
                return { target: 'Target', reference1: 'Reference 1', reference2: 'Reference 2', reference3: 'Reference 3' };
            case '2-way-vs-2-way':
                return { target1: 'Target 1', reference1: 'Reference 1', target2: 'Target 2', reference2: 'Reference 2' };
            default:
                return {};
        }
    };

    const renderKeyHeader = (keyData) => {
        const { keyName, workAssignment, owner } = keyData;

        return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, p: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                    <Key color="primary" sx={{ fontSize: 20 }} />
                    <Typography variant="subtitle1" fontWeight="600" sx={{ fontSize: '1rem' }}>
                        {keyName}
                    </Typography>
                </Box>

                <Divider orientation="vertical" flexItem sx={{ height: 24, alignSelf: 'center' }} />

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 120 }}>
                    <Assignment sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="body2" sx={{ fontSize: '0.85rem', fontWeight: 500 }}>
                        {workAssignment}
                    </Typography>
                </Box>

                <Divider orientation="vertical" flexItem sx={{ height: 24, alignSelf: 'center' }} />

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                    <Person sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                        {owner}
                    </Typography>
                </Box>
            </Box>
        );
    };

    const renderModelRow = (keyId, groupName, model, modelIndex, branchLabels) => {
        const statusInfo = statusColors[model.status];

        return (
            <TableRow
                key={`${keyId}-${groupName}-${modelIndex}`}
                sx={{
                    backgroundColor: `${statusInfo.color}15`,
                    '&:hover': { backgroundColor: `${statusInfo.color}25` },
                    height: 48
                }}
            >
                <TableCell sx={{ py: 1, px: 2 }}>
                    <Typography variant="body2" fontWeight="500" sx={{ fontSize: '0.85rem' }}>
                        {model.model}
                    </Typography>
                </TableCell>

                {Object.entries(branchLabels).map(([branch, label]) => (
                    <TableCell key={branch} align="left" sx={{ py: 1, px: 2 }}>
                        <Typography variant="body2" fontWeight="500" sx={{ fontSize: '0.85rem' }}>
                            {model[branch]}
                        </Typography>
                    </TableCell>
                ))}

                <TableCell sx={{ py: 1, px: 2, maxWidth: 250 }}>
                    {model.comment ? (
                        <Tooltip
                            title={
                                <Box sx={{ maxWidth: 400 }}>
                                    <Typography variant="body2">{model.comment}</Typography>
                                </Box>
                            }
                            arrow
                            placement="top"
                        >
                            <Box
                                sx={{
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0.5,
                                    p: 0.5,
                                    borderRadius: 1,
                                    '&:hover': { backgroundColor: 'rgba(0,0,0,0.05)' }
                                }}
                                onClick={() => handleCommentEdit(keyId, groupName, modelIndex, model.comment)}
                            >
                                <Typography
                                    variant="body2"
                                    sx={{
                                        fontSize: '0.8rem',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        maxWidth: 200
                                    }}
                                >
                                    {model.comment}
                                </Typography>
                                <Edit sx={{ fontSize: 12, opacity: 0.5 }} />
                            </Box>
                        </Tooltip>
                    ) : (
                        <Box
                            sx={{
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5,
                                p: 0.5,
                                borderRadius: 1,
                                '&:hover': { backgroundColor: 'rgba(0,0,0,0.05)' }
                            }}
                            onClick={() => handleCommentEdit(keyId, groupName, modelIndex, model.comment)}
                        >
                            <Typography variant="body2" sx={{ fontSize: '0.8rem', color: 'text.secondary', fontStyle: 'italic' }}>
                                Add comment...
                            </Typography>
                            <Edit sx={{ fontSize: 12, opacity: 0.5 }} />
                        </Box>
                    )}
                </TableCell>

                <TableCell sx={{ py: 1, px: 2 }}>
                    <Box
                        sx={{
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            p: 0.5,
                            borderRadius: 1,
                            '&:hover': { backgroundColor: 'rgba(0,0,0,0.05)' }
                        }}
                        onClick={() => handleKonaEdit(keyId, groupName, modelIndex, model.kona)}
                    >
                        <Typography
                            variant="body2"
                            sx={{
                                fontSize: '0.8rem',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                maxWidth: 150
                            }}
                        >
                            {model.kona || 'Add KONA...'}
                        </Typography>
                        <Edit sx={{ fontSize: 12, opacity: 0.5 }} />
                    </Box>
                </TableCell>

                <TableCell sx={{ py: 1, px: 2 }}>
                    <Box
                        sx={{
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            p: 0.5,
                            borderRadius: 1,
                            '&:hover': { backgroundColor: 'rgba(0,0,0,0.05)' }
                        }}
                        onClick={() => handleClEdit(keyId, groupName, modelIndex, model.cl)}
                    >
                        <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                            {model.cl || 'Add CL...'}
                        </Typography>
                        <Edit sx={{ fontSize: 12, opacity: 0.5 }} />
                    </Box>
                </TableCell>

                <TableCell sx={{ py: 1, px: 2 }}>
                    <Box
                        sx={{
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            p: 0.5,
                            borderRadius: 1,
                            '&:hover': { backgroundColor: 'rgba(0,0,0,0.05)' },
                            maxWidth: 150
                        }}
                        onClick={() => handleStatusEdit(keyId, groupName, modelIndex, model.status)}
                    >
                        <Chip
                            size="small"
                            label={statusInfo.label}
                            sx={{
                                backgroundColor: statusInfo.color,
                                color: model.status === 'discussion' ? '#000' : '#fff',
                                fontSize: '0.7rem',
                                height: 22,
                                minWidth: 80
                            }}
                        />
                        <Edit sx={{ fontSize: 12, opacity: 0.5 }} />
                    </Box>
                </TableCell>
            </TableRow>
        );
    };

    const branchLabels = getBranchLabels();

    // Key-level filtering and sorting functions
    const getKeyStatistics = (keyData) => {
        const stats = { total: 0, reviewed: 0, pending: 0, 'no-change': 0, discussion: 0 };

        keyData.groups.forEach(group => {
            group.models.forEach(model => {
                stats.total++;
                stats[model.status]++;
            });
        });

        return stats;
    };

    const getFilteredAndSortedKeys = () => {
        let filteredKeys = keys.filter(key => {
            // Search filter
            const searchLower = keySearchTerm.toLowerCase();
            const matchesSearch = !keySearchTerm ||
                key.keyName.toLowerCase().includes(searchLower) ||
                key.workAssignment.toLowerCase().includes(searchLower) ||
                key.owner.toLowerCase().includes(searchLower);

            // Status filter
            const stats = getKeyStatistics(key);
            const matchesStatus = keyFilters.status.length === 0 ||
                keyFilters.status.some(status => stats[status] > 0);

            // Owner filter
            const matchesOwner = keyFilters.owner.length === 0 ||
                keyFilters.owner.includes(key.owner);

            // Work Assignment filter
            const matchesWA = keyFilters.workAssignment.length === 0 ||
                keyFilters.workAssignment.includes(key.workAssignment);

            return matchesSearch && matchesStatus && matchesOwner && matchesWA;
        });

        // Sort keys
        filteredKeys.sort((a, b) => {
            let aValue, bValue;

            switch (keySortBy) {
                case 'keyName':
                    aValue = a.keyName.toLowerCase();
                    bValue = b.keyName.toLowerCase();
                    break;
                case 'workAssignment':
                    aValue = a.workAssignment.toLowerCase();
                    bValue = b.workAssignment.toLowerCase();
                    break;
                case 'owner':
                    aValue = a.owner.toLowerCase();
                    bValue = b.owner.toLowerCase();
                    break;
                case 'totalModels':
                    aValue = getKeyStatistics(a).total;
                    bValue = getKeyStatistics(b).total;
                    break;
                case 'reviewedCount':
                    aValue = getKeyStatistics(a).reviewed;
                    bValue = getKeyStatistics(b).reviewed;
                    break;
                default:
                    aValue = a.keyName.toLowerCase();
                    bValue = b.keyName.toLowerCase();
            }

            if (keySortDirection === 'asc') {
                return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
            } else {
                return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
            }
        });

        return filteredKeys;
    };

    const handleKeyFilterChange = (filterType, value) => {
        setKeyFilters(prev => {
            const currentValues = prev[filterType];
            const newValues = currentValues.includes(value)
                ? currentValues.filter(v => v !== value)
                : [...currentValues, value];

            return { ...prev, [filterType]: newValues };
        });
    };

    const clearKeyFilters = () => {
        setKeyFilters({ status: [], owner: [], workAssignment: [] });
        setKeySearchTerm('');
        toast.success('Cleared all key filters');
    };

    const getUniqueOwners = () => [...new Set(keys.map(key => key.owner))];
    const getUniqueWorkAssignments = () => [...new Set(keys.map(key => key.workAssignment))];

    const renderKeyControls = () => {
        const filteredKeys = getFilteredAndSortedKeys();
        const hasActiveFilters = keySearchTerm ||
            keyFilters.status.length > 0 ||
            keyFilters.owner.length > 0 ||
            keyFilters.workAssignment.length > 0;

        return (
            <Paper sx={{ p: 1.5, mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
                    <Typography variant="h6" sx={{ fontSize: '0.9rem', fontWeight: 600 }}>
                        Key Management
                    </Typography>
                    <Chip
                        label={`${filteredKeys.length} of ${keys.length} keys`}
                        color={filteredKeys.length === keys.length ? 'default' : 'primary'}
                        size="small"
                        sx={{ fontSize: '0.7rem', height: 24 }}
                    />
                    {hasActiveFilters && (
                        <Button
                            size="small"
                            startIcon={<Clear sx={{ fontSize: 14 }} />}
                            onClick={clearKeyFilters}
                            sx={{ fontSize: '0.7rem', py: 0.25, px: 1 }}
                        >
                            Clear Filters
                        </Button>
                    )}
                </Box>

                <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
                    {/* Search */}
                    <TextField
                        size="small"
                        placeholder="Search keys by name, work assignment, or owner..."
                        value={keySearchTerm}
                        onChange={(e) => setKeySearchTerm(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Search sx={{ fontSize: 16 }} />
                                </InputAdornment>
                            ),
                            sx: { fontSize: '0.8rem', height: 32 }
                        }}
                        sx={{ minWidth: 250, '& .MuiInputBase-input': { fontSize: '0.8rem', py: 0.5 } }}
                    />

                    {/* Sort */}
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel sx={{ fontSize: '0.8rem' }}>Sort by</InputLabel>
                        <Select
                            value={keySortBy}
                            label="Sort by"
                            onChange={(e) => setKeySortBy(e.target.value)}
                            sx={{ fontSize: '0.8rem', height: 32 }}
                        >
                            <MenuItem value="keyName" sx={{ fontSize: '0.8rem' }}>Key Name</MenuItem>
                            <MenuItem value="workAssignment" sx={{ fontSize: '0.8rem' }}>Work Assignment</MenuItem>
                            <MenuItem value="owner" sx={{ fontSize: '0.8rem' }}>Owner</MenuItem>
                            <MenuItem value="totalModels" sx={{ fontSize: '0.8rem' }}>Total Models</MenuItem>
                            <MenuItem value="reviewedCount" sx={{ fontSize: '0.8rem' }}>Reviewed Count</MenuItem>
                        </Select>
                    </FormControl>

                    {/* Sort Direction */}
                    <IconButton
                        size="small"
                        onClick={() => setKeySortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
                        color="primary"
                        sx={{ p: 0.5 }}
                    >
                        {keySortDirection === 'asc' ? <ArrowUpward sx={{ fontSize: 18 }} /> : <ArrowDownward sx={{ fontSize: 18 }} />}
                    </IconButton>

                    {/* Filters Button */}
                    <Button
                        size="small"
                        startIcon={<FilterList sx={{ fontSize: 14 }} />}
                        onClick={() => setKeyFiltersOpen(true)}
                        variant={hasActiveFilters ? 'contained' : 'outlined'}
                        sx={{ fontSize: '0.7rem', py: 0.25, px: 1.5 }}
                    >
                        Filters
                        {hasActiveFilters && (
                            <Badge
                                color="secondary"
                                badgeContent={
                                    keyFilters.status.length +
                                    keyFilters.owner.length +
                                    keyFilters.workAssignment.length
                                }
                                sx={{ ml: 0.5 }}
                            />
                        )}
                    </Button>
                </Box>

                {/* Active Filters Display */}
                {hasActiveFilters && (
                    <Box sx={{ mt: 1.5, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {keyFilters.status.map(status => (
                            <Chip
                                key={status}
                                label={`Status: ${statusColors[status]?.label || status}`}
                                size="small"
                                onDelete={() => handleKeyFilterChange('status', status)}
                                color="primary"
                                variant="outlined"
                                sx={{ fontSize: '0.7rem', height: 22 }}
                            />
                        ))}
                        {keyFilters.owner.map(owner => (
                            <Chip
                                key={owner}
                                label={`Owner: ${owner}`}
                                size="small"
                                onDelete={() => handleKeyFilterChange('owner', owner)}
                                color="secondary"
                                variant="outlined"
                                sx={{ fontSize: '0.7rem', height: 22 }}
                            />
                        ))}
                        {keyFilters.workAssignment.map(wa => (
                            <Chip
                                key={wa}
                                label={`WA: ${wa}`}
                                size="small"
                                onDelete={() => handleKeyFilterChange('workAssignment', wa)}
                                color="info"
                                variant="outlined"
                                sx={{ fontSize: '0.7rem', height: 22 }}
                            />
                        ))}
                    </Box>
                )}
            </Paper>
        );
    };

    const renderKeyFiltersDialog = () => {
        return (
            <Dialog
                open={keyFiltersOpen}
                onClose={() => setKeyFiltersOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Filter Keys</DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 1 }}>
                        {/* Status Filter */}
                        <Typography variant="subtitle2" gutterBottom>
                            Filter by Status:
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
                            {Object.entries(statusColors).map(([status, info]) => (
                                <FormControlLabel
                                    key={status}
                                    control={
                                        <Checkbox
                                            size="small"
                                            checked={keyFilters.status.includes(status)}
                                            onChange={() => handleKeyFilterChange('status', status)}
                                        />
                                    }
                                    label={
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Box
                                                sx={{
                                                    width: 12,
                                                    height: 12,
                                                    borderRadius: '50%',
                                                    backgroundColor: info.color
                                                }}
                                            />
                                            {info.label}
                                        </Box>
                                    }
                                />
                            ))}
                        </Box>

                        {/* Owner Filter */}
                        <Typography variant="subtitle2" gutterBottom>
                            Filter by Owner:
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
                            {getUniqueOwners().map(owner => (
                                <FormControlLabel
                                    key={owner}
                                    control={
                                        <Checkbox
                                            size="small"
                                            checked={keyFilters.owner.includes(owner)}
                                            onChange={() => handleKeyFilterChange('owner', owner)}
                                        />
                                    }
                                    label={owner}
                                />
                            ))}
                        </Box>

                        {/* Work Assignment Filter */}
                        <Typography variant="subtitle2" gutterBottom>
                            Filter by Work Assignment:
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            {getUniqueWorkAssignments().map(wa => (
                                <FormControlLabel
                                    key={wa}
                                    control={
                                        <Checkbox
                                            size="small"
                                            checked={keyFilters.workAssignment.includes(wa)}
                                            onChange={() => handleKeyFilterChange('workAssignment', wa)}
                                        />
                                    }
                                    label={wa}
                                />
                            ))}
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setKeyFiltersOpen(false)}>Close</Button>
                    <Button onClick={clearKeyFilters} color="error">Clear All</Button>
                </DialogActions>
            </Dialog>
        );
    };

    const handleColumnMenuOpen = (event, column, keyId, groupName) => {
        const menuKey = `${keyId}-${groupName}-${column}`;
        setColumnMenus(prev => ({
            ...prev,
            [menuKey]: event.currentTarget
        }));
    };

    const handleColumnMenuClose = (keyId, groupName, column) => {
        const menuKey = `${keyId}-${groupName}-${column}`;
        setColumnMenus(prev => ({
            ...prev,
            [menuKey]: null
        }));
    };

    const handleSort = (keyId, groupName, column, direction) => {
        setSortConfig({ key: `${keyId}-${groupName}-${column}`, direction });

        setKeys(prevKeys =>
            prevKeys.map(key => {
                if (key.id === keyId) {
                    return {
                        ...key,
                        groups: key.groups.map(group => {
                            if (group.groupName === groupName) {
                                const sortedModels = [...group.models].sort((a, b) => {
                                    let aValue = a[column] || '';
                                    let bValue = b[column] || '';

                                    // Handle different data types
                                    if (column === 'status') {
                                        const statusOrder = { 'reviewed': 0, 'pending': 1, 'no-change': 2, 'discussion': 3 };
                                        aValue = statusOrder[aValue] || 999;
                                        bValue = statusOrder[bValue] || 999;
                                    } else {
                                        aValue = aValue.toString().toLowerCase();
                                        bValue = bValue.toString().toLowerCase();
                                    }

                                    if (direction === 'asc') {
                                        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
                                    } else {
                                        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
                                    }
                                });

                                return { ...group, models: sortedModels };
                            }
                            return group;
                        })
                    };
                }
                return key;
            })
        );

        handleColumnMenuClose(keyId, groupName, column);
        toast.success(`Sorted by ${column} (${direction})`);
    };

    const handleFilter = (keyId, groupName, column, filterValue) => {
        const filterKey = `${keyId}-${groupName}-${column}`;
        setFilters(prev => ({
            ...prev,
            [filterKey]: filterValue
        }));
        handleColumnMenuClose(keyId, groupName, column);
        toast.success(`Filter applied to ${column}`);
    };

    const handleSearch = (keyId, groupName, column, searchTerm) => {
        const searchKey = `${keyId}-${groupName}-${column}`;
        setSearchTerms(prev => ({
            ...prev,
            [searchKey]: searchTerm
        }));
    };

    const clearFilter = (keyId, groupName, column) => {
        const filterKey = `${keyId}-${groupName}-${column}`;
        const searchKey = `${keyId}-${groupName}-${column}`;

        setFilters(prev => {
            const newFilters = { ...prev };
            delete newFilters[filterKey];
            return newFilters;
        });

        setSearchTerms(prev => {
            const newSearchTerms = { ...prev };
            delete newSearchTerms[searchKey];
            return newSearchTerms;
        });

        handleColumnMenuClose(keyId, groupName, column);
        toast.success(`Cleared filters for ${column}`);
    };

    const getFilteredModels = (models, keyId, groupName) => {
        return models.filter(model => {
            // Apply all active filters and searches
            return Object.entries(filters).every(([filterKey, filterValue]) => {
                if (!filterKey.startsWith(`${keyId}-${groupName}-`) || !filterValue) return true;
                const column = filterKey.split('-').pop();
                return model[column]?.toString().toLowerCase().includes(filterValue.toLowerCase());
            }) && Object.entries(searchTerms).every(([searchKey, searchTerm]) => {
                if (!searchKey.startsWith(`${keyId}-${groupName}-`) || !searchTerm) return true;
                const column = searchKey.split('-').pop();
                return model[column]?.toString().toLowerCase().includes(searchTerm.toLowerCase());
            });
        });
    };

    const getUniqueValues = (models, column) => {
        const values = models.map(model => model[column]).filter(Boolean);
        return [...new Set(values)];
    };

    const renderColumnMenu = (column, keyId, groupName, models) => {
        const menuKey = `${keyId}-${groupName}-${column}`;
        const anchorEl = columnMenus[menuKey];
        const searchKey = `${keyId}-${groupName}-${column}`;
        const filterKey = `${keyId}-${groupName}-${column}`;

        const uniqueValues = getUniqueValues(models, column);
        const currentSort = sortConfig.key === `${keyId}-${groupName}-${column}` ? sortConfig.direction : null;

        return (
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={() => handleColumnMenuClose(keyId, groupName, column)}
                PaperProps={{
                    sx: { minWidth: 200, fontSize: '0.8rem' }
                }}
            >
                {/* Search */}
                <Box sx={{ p: 1.5 }}>
                    <TextField
                        size="small"
                        fullWidth
                        placeholder={`Search ${column}...`}
                        value={searchTerms[searchKey] || ''}
                        onChange={(e) => handleSearch(keyId, groupName, column, e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Search fontSize="small" />
                                </InputAdornment>
                            ),
                            sx: { fontSize: '0.8rem' }
                        }}
                    />
                </Box>

                <Divider />

                {/* Sort Options */}
                <MenuItem onClick={() => handleSort(keyId, groupName, column, 'asc')} sx={{ py: 0.5, fontSize: '0.8rem' }}>
                    <ListItemIcon sx={{ minWidth: 28 }}>
                        <ArrowUpward fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Sort A-Z" primaryTypographyProps={{ fontSize: '0.8rem' }} />
                    {currentSort === 'asc' && <Badge color="primary" variant="dot" />}
                </MenuItem>

                <MenuItem onClick={() => handleSort(keyId, groupName, column, 'desc')} sx={{ py: 0.5, fontSize: '0.8rem' }}>
                    <ListItemIcon sx={{ minWidth: 28 }}>
                        <ArrowDownward fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Sort Z-A" primaryTypographyProps={{ fontSize: '0.8rem' }} />
                    {currentSort === 'desc' && <Badge color="primary" variant="dot" />}
                </MenuItem>

                <Divider />

                {/* Filter Options */}
                <Box sx={{ p: 1, maxHeight: 150, overflowY: 'auto' }}>
                    <Typography variant="caption" sx={{ px: 1, color: 'text.secondary', fontSize: '0.7rem' }}>
                        Filter by value:
                    </Typography>
                    {uniqueValues.map((value) => (
                        <MenuItem key={value} onClick={() => handleFilter(keyId, groupName, column, value)} sx={{ py: 0.25, fontSize: '0.8rem' }}>
                            <Checkbox
                                size="small"
                                checked={filters[filterKey] === value}
                                sx={{ py: 0, mr: 1 }}
                            />
                            <ListItemText primary={value} primaryTypographyProps={{ fontSize: '0.8rem' }} />
                        </MenuItem>
                    ))}
                </Box>

                <Divider />

                {/* Clear Filters */}
                <MenuItem onClick={() => clearFilter(keyId, groupName, column)} sx={{ py: 0.5, fontSize: '0.8rem' }}>
                    <ListItemIcon sx={{ minWidth: 28 }}>
                        <Clear fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Clear Filters" primaryTypographyProps={{ fontSize: '0.8rem' }} />
                </MenuItem>
            </Menu>
        );
    };

    const renderTableHeader = (column, label, keyId, groupName, models) => {
        const menuKey = `${keyId}-${groupName}-${column}`;
        const hasActiveFilter = filters[`${keyId}-${groupName}-${column}`] || searchTerms[`${keyId}-${groupName}-${column}`];
        const currentSort = sortConfig.key === `${keyId}-${groupName}-${column}` ? sortConfig.direction : null;

        return (
            <TableCell
                key={column}
                align="left"
                sx={{ py: 1, px: 2, fontSize: '0.8rem', fontWeight: 600, position: 'relative' }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
                    <Typography variant="inherit">
                        {label}
                    </Typography>
                    <IconButton
                        size="small"
                        onClick={(e) => handleColumnMenuOpen(e, column, keyId, groupName)}
                        sx={{ ml: 1, p: 0.25 }}
                    >
                        <MoreVert fontSize="small" />
                    </IconButton>
                    {hasActiveFilter && (
                        <Badge
                            color="primary"
                            variant="dot"
                            sx={{ position: 'absolute', top: 8, right: 8 }}
                        />
                    )}
                    {currentSort && (
                        <Box sx={{ position: 'absolute', top: 6, right: 16 }}>
                            {currentSort === 'asc' ?
                                <ArrowUpward sx={{ fontSize: 12, color: 'primary.main' }} /> :
                                <ArrowDownward sx={{ fontSize: 12, color: 'primary.main' }} />
                            }
                        </Box>
                    )}
                </Box>
                {renderColumnMenu(column, keyId, groupName, models)}
            </TableCell>
        );
    };

    return (
        <Container maxWidth="xl">
            <Box sx={{ mt: 3, mb: 3 }}>
                {/* Header */}
                <Paper sx={{ p: 2, mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <IconButton onClick={handleBack} sx={{ mr: 2 }} size="small">
                            <ArrowBack />
                        </IconButton>
                        <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="h5" sx={{ color: '#0d459c', fontWeight: 600, fontSize: '1.5rem' }}>
                                {project.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                                {project.description}
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                            <Chip
                                label={`${keys.length} Keys`}
                                color="primary"
                                variant="outlined"
                                size="small"
                                sx={{ fontSize: '0.75rem', height: 28 }}
                            />
                            <Chip
                                label={`${project.comparisonType} Comparison`}
                                color="secondary"
                                variant="outlined"
                                size="small"
                                sx={{ fontSize: '0.75rem', height: 28 }}
                            />
                            {user?.role === USER_ROLES.ADMIN && (
                                <Button
                                    variant="contained"
                                    startIcon={<ManageAccounts />}
                                    onClick={handleProjectUserManagement}
                                    size="small"
                                    sx={{
                                        fontSize: '0.8rem',
                                        height: 32,
                                        px: 2
                                    }}
                                >
                                    Manage Users
                                </Button>
                            )}
                        </Box>
                    </Box>
                </Paper>

                {/* Key Controls */}
                {renderKeyControls()}

                {/* Keys List */}
                <Box sx={{ mb: 2 }}>
                    {getFilteredAndSortedKeys().map((keyData) => (
                        <Card key={keyData.id} sx={{ mb: 1.5, border: '1px solid #e0e0e0' }}>
                            <CardHeader
                                title={renderKeyHeader(keyData)}
                                action={
                                    <IconButton onClick={() => toggleKeyExpansion(keyData.id)} size="small" sx={{ mt: 1 }}>
                                        {expandedKeys[keyData.id] ? <ExpandLess /> : <ExpandMore />}
                                    </IconButton>
                                }
                                sx={{ pb: 0, pt: 0 }}
                            />

                            <Collapse in={expandedKeys[keyData.id]} timeout="auto" unmountOnExit>
                                <CardContent sx={{ pt: 0, pb: 1 }}>
                                    {keyData.groups.map((group) => {
                                        const groupKey = `${keyData.id}-${group.groupName}`;
                                        return (
                                            <Card key={groupKey} sx={{ mb: 1.5, border: '1px solid #f0f0f0' }}>
                                                <CardHeader
                                                    title={
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <Group color="primary" sx={{ fontSize: 18 }} />
                                                            <Typography variant="subtitle1" sx={{ fontSize: '0.95rem', fontWeight: 500 }}>
                                                                {group.groupName}
                                                            </Typography>
                                                            <Chip
                                                                size="small"
                                                                label={`${group.models.length} models`}
                                                                variant="outlined"
                                                                sx={{ fontSize: '0.7rem', height: 20 }}
                                                            />
                                                        </Box>
                                                    }
                                                    action={
                                                        <IconButton onClick={() => toggleGroupExpansion(keyData.id, group.groupName)} size="small">
                                                            {expandedGroups[groupKey] ? <ExpandLess /> : <ExpandMore />}
                                                        </IconButton>
                                                    }
                                                    sx={{ py: 1 }}
                                                />

                                                <Collapse in={expandedGroups[groupKey]} timeout="auto" unmountOnExit>
                                                    <CardContent sx={{ pt: 0, pb: 1 }}>
                                                        <TableContainer>
                                                            <Table size="small">
                                                                <TableHead>
                                                                    <TableRow>
                                                                        {renderTableHeader('model', 'Model', keyData.id, group.groupName, group.models)}
                                                                        {Object.entries(branchLabels).map(([branch, label]) =>
                                                                            renderTableHeader(branch, label, keyData.id, group.groupName, group.models)
                                                                        )}
                                                                        {renderTableHeader('comment', 'Comment', keyData.id, group.groupName, group.models)}
                                                                        {renderTableHeader('kona', 'KONA', keyData.id, group.groupName, group.models)}
                                                                        {renderTableHeader('cl', 'CL', keyData.id, group.groupName, group.models)}
                                                                        {renderTableHeader('status', 'Status', keyData.id, group.groupName, group.models)}
                                                                    </TableRow>
                                                                </TableHead>
                                                                <TableBody>
                                                                    {getFilteredModels(group.models, keyData.id, group.groupName).map((model, modelIndex) => {
                                                                        // Find the original index for proper editing
                                                                        const originalIndex = group.models.findIndex(m => m === model);
                                                                        return renderModelRow(keyData.id, group.groupName, model, originalIndex, branchLabels);
                                                                    })}
                                                                    {getFilteredModels(group.models, keyData.id, group.groupName).length === 0 && (
                                                                        <TableRow>
                                                                            <TableCell
                                                                                colSpan={6 + Object.keys(branchLabels).length}
                                                                                align="center"
                                                                                sx={{ py: 3, color: 'text.secondary' }}
                                                                            >
                                                                                No models match the current filters
                                                                            </TableCell>
                                                                        </TableRow>
                                                                    )}
                                                                </TableBody>
                                                            </Table>
                                                        </TableContainer>
                                                    </CardContent>
                                                </Collapse>
                                            </Card>
                                        );
                                    })}
                                </CardContent>
                            </Collapse>
                        </Card>
                    ))}

                    {/* No Keys Message */}
                    {getFilteredAndSortedKeys().length === 0 && (
                        <Paper sx={{ p: 4, textAlign: 'center' }}>
                            <Typography variant="h6" color="text.secondary" gutterBottom>
                                No keys match your current filters
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Try adjusting your search terms or clearing some filters
                            </Typography>
                        </Paper>
                    )}
                </Box>

                {/* Filter Dialog */}
                {renderKeyFiltersDialog()}

                {/* Edit Dialog */}
                <Dialog
                    open={editDialogOpen}
                    onClose={() => setEditDialogOpen(false)}
                    maxWidth="sm"
                    fullWidth
                >
                    <DialogTitle sx={{ fontSize: '1.1rem' }}>
                        Edit {currentEdit?.field === 'comment' ? 'Comment' :
                            currentEdit?.field === 'status' ? 'Status' :
                                currentEdit?.field === 'kona' ? 'KONA ID' :
                                    currentEdit?.field === 'cl' ? 'Change List' : 'Field'}
                    </DialogTitle>
                    <DialogContent>
                        {currentEdit?.field === 'comment' ? (
                            <TextField
                                fullWidth
                                multiline
                                rows={4}
                                label="Comment"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                sx={{ mt: 2 }}
                                placeholder="Enter your comment here..."
                            />
                        ) : currentEdit?.field === 'status' ? (
                            <FormControl fullWidth sx={{ mt: 2 }}>
                                <InputLabel>Status</InputLabel>
                                <Select
                                    value={editValue}
                                    label="Status"
                                    onChange={(e) => setEditValue(e.target.value)}
                                >
                                    {statusOptions.map((option) => (
                                        <MenuItem key={option.value} value={option.value}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Box
                                                    sx={{
                                                        width: 12,
                                                        height: 12,
                                                        borderRadius: '50%',
                                                        backgroundColor: statusColors[option.value].color
                                                    }}
                                                />
                                                {option.label}
                                            </Box>
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        ) : currentEdit?.field === 'kona' ? (
                            <TextField
                                fullWidth
                                label="KONA ID"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                sx={{ mt: 2 }}
                                placeholder="Enter KONA ID (e.g., RQ250607-0239)"
                            />
                        ) : currentEdit?.field === 'cl' ? (
                            <TextField
                                fullWidth
                                label="Change List"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                sx={{ mt: 2 }}
                                placeholder="Enter Change List number (e.g., 1980283)"
                            />
                        ) : null}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setEditDialogOpen(false)} size="small">
                            Cancel
                        </Button>
                        <Button variant="contained" onClick={handleSaveEdit} startIcon={<Save />} size="small">
                            Save
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </Container>
    );
};

export default KeyReview; 
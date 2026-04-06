import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { keyReviewAPI, projectsAPI, commentAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
import CommentDialog from '../common/CommentDialog';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
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
    InputAdornment,
    CircularProgress,
    Popover,
    Alert,
    ToggleButton,
    ToggleButtonGroup
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
    ArrowDownward,
    Info,
    AccountTree,
    ChatBubbleOutline,
    ChatBubble,
    Download,
    GroupWork,
    ContentCopy,
    CheckBox,
    CheckBoxOutlineBlank,
    Settings,
    BookmarkAdd,
    Bookmark,
    Delete,
    Replay
} from '@mui/icons-material';

// Mock data for the key review - now using real API calls
/*
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
*/

const statusColors = {
    'unreviewed': { color: 'transparent', label: 'Unreviewed', textColor: '#000' },
    'changes_made': { color: '#4caf50', label: 'Changes Made', textColor: '#fff' },
    'pending_response': { color: '#ff9800', label: 'Pending Response', textColor: '#fff' },
    'no_change_req': { color: '#2196f3', label: 'No Change Required', textColor: '#fff' },
    'internal_discussion': { color: '#ffeb3b', label: 'Internal Discussion', textColor: '#000' },
    'changes_in_progress': { color: '#9e9e9e', label: 'Changes in Progress', textColor: '#fff' },
    'value_changed': { color: '#f44336', label: 'Value Changed', textColor: '#fff' }
};

const statusOptions = [
    { value: 'unreviewed', label: 'Unreviewed' },
    { value: 'changes_made', label: 'Changes Made' },
    { value: 'pending_response', label: 'Pending Response' },
    { value: 'no_change_req', label: 'No Change Required' },
    { value: 'internal_discussion', label: 'Internal Discussion' },
    { value: 'changes_in_progress', label: 'Changes in Progress' }
];

const KeyReview = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const { user, USER_ROLES, isGlobalAdmin } = useAuth();

    // Permission helper functions
    const canManageUsers = () => {
        return isProjectAdmin; // Only project admins can manage users
    };

    const canEditFields = () => {
        // Admins, reviewers, and Project Leads can edit
        return userRole === 'admin' || userRole === 'reviewer' || userRole === 'pl' || isProjectLead;
    };

    const [project, setProject] = useState(null);
    const [keys, setKeys] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [isProjectAdmin, setIsProjectAdmin] = useState(false);
    const [isProjectLead, setIsProjectLead] = useState(false);
    const [expandedKeys, setExpandedKeys] = useState({});
    const [expandedGroups, setExpandedGroups] = useState({});
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [currentEdit, setCurrentEdit] = useState(null);
    const [editValue, setEditValue] = useState('');
    const [showUnionKeys, setShowUnionKeys] = useState(true);
    // Branch-wise filter for "no item in this branch" - when showUnionKeys is false
    // Keys: target, ref1, ref2, ref3. Value: 'off' | 'show' | 'hide'
    // 'off' = no filter, 'show' = show only NA items, 'hide' = hide NA items
    const [unionBranchFilters, setUnionBranchFilters] = useState({
        target: 'off',
        ref1: 'off',
        ref2: 'off',
        ref3: 'off'
    });
    const [unionFilterAnchorEl, setUnionFilterAnchorEl] = useState(null);

    // Key description popover state
    const [descriptionAnchorEl, setDescriptionAnchorEl] = useState(null);
    const [descriptionText, setDescriptionText] = useState('');

    // Comment dialog states
    const [commentDialogOpen, setCommentDialogOpen] = useState(false);
    const [selectedKeyReview, setSelectedKeyReview] = useState(null);
    const [selectedKeyName, setSelectedKeyName] = useState('');
    const [selectedGroupName, setSelectedGroupName] = useState('');
    const [selectedGroupKeyReviewIds, setSelectedGroupKeyReviewIds] = useState([]);

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
        workAssignment: [],
        keyNames: [],
        groups: []
    });
    const [keyFiltersOpen, setKeyFiltersOpen] = useState(false);

    // Filter dialog search states
    const [ownerSearch, setOwnerSearch] = useState('');
    const [waSearch, setWaSearch] = useState('');
    const [keyNamesSearch, setKeyNamesSearch] = useState('');
    const [groupSearch, setGroupSearch] = useState('');

    // Saved filters state
    const [savedFilters, setSavedFilters] = useState([]);
    const [saveFilterDialogOpen, setSaveFilterDialogOpen] = useState(false);
    const [newFilterName, setNewFilterName] = useState('');

    // Multi-select states for bulk actions - using Object for better React performance
    const [selectedKeysMap, setSelectedKeysMap] = useState({});
    const [bulkActionDialogOpen, setBulkActionDialogOpen] = useState(false);
    const [bulkActionType, setBulkActionType] = useState(''); // 'status', 'comment', 'kona', 'cl'
    const [bulkActionValue, setBulkActionValue] = useState('');

    // Debounce ref for bulk action text input
    const bulkActionInputRef = useRef(null);

    // Memoized selectedKeys as a Set-like interface for compatibility
    const selectedKeys = useMemo(() => {
        const keys = Object.keys(selectedKeysMap).filter(k => selectedKeysMap[k]);
        return {
            has: (id) => !!selectedKeysMap[id],
            size: keys.length,
            values: () => keys[Symbol.iterator]()
        };
    }, [selectedKeysMap]);

    // Project info dialog state
    const [projectInfoOpen, setProjectInfoOpen] = useState(false);

    // AI summary states - keyed by key_review_id
    // Each entry: { status: 'idle'|'loading'|'done'|'error', summary: string|null, error: string|null }
    const [aiSummaryStates, setAiSummaryStates] = useState({});
    // Popover anchor for showing the AI summary
    const [aiSummaryAnchorEl, setAiSummaryAnchorEl] = useState(null);
    const [aiSummaryPopoverId, setAiSummaryPopoverId] = useState(null);
    const [aiSummaryPopoverContext, setAiSummaryPopoverContext] = useState(null); // { model, keyName, keyDescription }

    // Pagination states for performance
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(20); // Show 20 keys per page
    const [filtersLoaded, setFiltersLoaded] = useState(false);

    // Load filters from localStorage on mount
    useEffect(() => {
        const savedFiltersData = localStorage.getItem(`keyReview_filters_${projectId}`);
        if (savedFiltersData) {
            try {
                const parsed = JSON.parse(savedFiltersData);
                if (parsed.keySearchTerm !== undefined) setKeySearchTerm(parsed.keySearchTerm);
                if (parsed.keySortBy !== undefined) setKeySortBy(parsed.keySortBy);
                if (parsed.keySortDirection !== undefined) setKeySortDirection(parsed.keySortDirection);
                if (parsed.keyFilters !== undefined) setKeyFilters(parsed.keyFilters);
                if (parsed.showUnionKeys !== undefined) setShowUnionKeys(parsed.showUnionKeys);
                if (parsed.unionBranchFilters !== undefined) {
                    // Migrate old boolean format to new 'off' | 'show' | 'hide' format
                    const migratedFilters = {};
                    for (const [key, value] of Object.entries(parsed.unionBranchFilters)) {
                        if (typeof value === 'boolean') {
                            // Old format: true = hide, false = off
                            migratedFilters[key] = value ? 'hide' : 'off';
                        } else {
                            // New format: keep as-is
                            migratedFilters[key] = value;
                        }
                    }
                    setUnionBranchFilters(migratedFilters);
                }
                console.log('📂 Loaded filters from localStorage for project', projectId);
            } catch (e) {
                console.error('Failed to parse saved filters:', e);
            }
        }
        
        // Load saved filter presets
        const savedFilterPresets = localStorage.getItem(`keyReview_savedFilters_${projectId}`);
        if (savedFilterPresets) {
            try {
                setSavedFilters(JSON.parse(savedFilterPresets));
            } catch (e) {
                console.error('Failed to parse saved filter presets:', e);
            }
        }
        
        setFiltersLoaded(true);
    }, [projectId]);

    // Save filters to localStorage whenever they change
    useEffect(() => {
        if (!filtersLoaded) return; // Don't save until initial load is complete

        const filtersToSave = {
            keySearchTerm,
            keySortBy,
            keySortDirection,
            keyFilters,
            showUnionKeys,
            unionBranchFilters
        };
        localStorage.setItem(`keyReview_filters_${projectId}`, JSON.stringify(filtersToSave));
    }, [projectId, keySearchTerm, keySortBy, keySortDirection, keyFilters, showUnionKeys, unionBranchFilters, filtersLoaded]);

    // Reset pagination when search/sort changes
    useEffect(() => {
        setCurrentPage(1);
    }, [keySearchTerm, keySortBy, keySortDirection]);

    // Function to load/refresh project data - extracted so it can be called from other places
    const loadProjectData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            // Load project details
            const projectResult = await projectsAPI.getProject(projectId);
            if (projectResult.success) {
                console.log('🔍 RAW PROJECT DATA:', JSON.stringify(projectResult.data, null, 2));

                // Extract project data from the API response structure
                const projectData = projectResult.data.project || projectResult.data;

                // Set user role and admin status
                setUserRole(projectData.currentUserRole);
                setIsProjectAdmin(projectData.isProjectAdmin);
                setIsProjectLead(projectData.isProjectLead || false);
                console.log('🔍 User Role:', projectData.currentUserRole);
                console.log('🔍 Is Project Admin:', projectData.isProjectAdmin);
                console.log('🔍 Is Project Lead:', projectData.isProjectLead);

                // Debug project structure
                console.log('🔍 Project Structure Check:');
                console.log('- Project ID:', projectData.project_id);
                console.log('- Project Title:', projectData.title);
                console.log('- Has groups array:', Array.isArray(projectData.groups));
                console.log('- Groups count:', projectData.groups?.length || 0);

                if (projectData.groups && projectData.groups.length > 0) {
                    projectData.groups.forEach((group, index) => {
                        console.log(`🔍 Group ${index + 1}:`, {
                            name: group.name,
                            comparison_type: group.comparison_type,
                            has_branches: !!group.branches,
                            has_branchConfig: !!group.branchConfig,
                            branches: group.branches,
                            branchConfig: group.branchConfig
                        });
                    });
                }

                console.log('🔍 Setting project data with groups:', {
                    hasGroups: !!projectData.groups,
                    groupsCount: projectData.groups?.length || 0,
                    groupsType: typeof projectData.groups,
                    isArray: Array.isArray(projectData.groups)
                });
                setProject(projectData);
            } else {
                throw new Error(projectResult.error || 'Failed to load project');
            }

            // Load key reviews for this project
            const keysResult = await keyReviewAPI.getProjectReviews(projectId);
            if (keysResult.success) {
                // Debug: Log the raw API response
                console.log('🔍 RAW API RESPONSE:', JSON.stringify(keysResult.data, null, 2));

                // Debug: Check if we have the expected structure
                console.log('🔍 API Response Structure Check:');
                console.log('- Has reviews array:', Array.isArray(keysResult.data.reviews));
                console.log('- Reviews count:', keysResult.data.reviews?.length || 0);

                if (keysResult.data.reviews && keysResult.data.reviews.length > 0) {
                    const firstKey = keysResult.data.reviews[0];
                    console.log('🔍 First Key Structure:', {
                        fms_key_id: firstKey.fms_key_id,
                        key_name: firstKey.key_name,
                        work_assignment: firstKey.work_assignment,
                        groups_count: firstKey.groups?.length || 0,
                        groups: firstKey.groups
                    });

                    if (firstKey.groups && firstKey.groups.length > 0) {
                        const firstGroup = firstKey.groups[0];
                        console.log('🔍 First Group Structure:', {
                            group_id: firstGroup.group_id,
                            group_name: firstGroup.group_name,
                            comparison_type: firstGroup.comparison_type,
                            models_count: firstGroup.models?.length || 0
                        });

                        if (firstGroup.models && firstGroup.models.length > 0) {
                            const firstModel = firstGroup.models[0];
                            console.log('🔍 First Model Structure:', {
                                model_name: firstModel.model_name,
                                target: firstModel.target,
                                ref1: firstModel.ref1,
                                ref2: firstModel.ref2,
                                ref3: firstModel.ref3,
                                status: firstModel.status,
                                comment: firstModel.comment
                            });
                        }
                    }
                }

                // Transform the API data to match frontend expectations
                const transformedKeys = (keysResult.data.reviews || []).map(key => ({
                    ...key,
                    id: key.fms_key_id,
                    keyName: key.key_name,
                    workAssignment: key.work_assignment,
                    owner: key.work_assignment_owner,
                    groups: (key.groups || []).map(group => ({
                        ...group,
                        groupName: group.group_name,
                        comparisonType: group.comparison_type,
                        models: (group.models || []).map(model => ({
                            ...model,
                            model: model.model_name,  // Map model_name to model for frontend compatibility
                            kona: model.kona_ids,
                            cl: model.cl_numbers,
                            // Map the main properties
                            target: model.target,
                            ref1: model.ref1,
                            ref2: model.ref2,
                            ref3: model.ref3,
                            // Include comment (singular, not plural) if available
                            comment: model.comment || ''
                        }))
                    }))
                }));

                console.log('🔍 TRANSFORMED KEYS DATA:', JSON.stringify(transformedKeys, null, 2));

                // Debug: Check the transformed structure
                if (transformedKeys.length > 0) {
                    const firstTransformedKey = transformedKeys[0];
                    console.log('🔍 Transformed First Key:', {
                        id: firstTransformedKey.id,
                        keyName: firstTransformedKey.keyName,
                        groups_count: firstTransformedKey.groups?.length || 0
                    });

                    if (firstTransformedKey.groups && firstTransformedKey.groups.length > 0) {
                        const firstTransformedGroup = firstTransformedKey.groups[0];
                        console.log('🔍 Transformed First Group:', {
                            groupName: firstTransformedGroup.groupName,
                            comparisonType: firstTransformedGroup.comparisonType,
                            models_count: firstTransformedGroup.models?.length || 0
                        });

                        if (firstTransformedGroup.models && firstTransformedGroup.models.length > 0) {
                            const firstTransformedModel = firstTransformedGroup.models[0];
                            console.log('🔍 Transformed First Model:', {
                                model: firstTransformedModel.model,
                                target: firstTransformedModel.target,
                                ref1: firstTransformedModel.ref1,
                                ref2: firstTransformedModel.ref2,
                                ref3: firstTransformedModel.ref3,
                                status: firstTransformedModel.status
                            });
                        }
                    }
                }

                setKeys(transformedKeys);
            } else {
                throw new Error(keysResult.error || 'Failed to load key reviews');
            }

        } catch (error) {
            console.error('Error loading project data:', error);
            setError(error.message);
            toast.error(`Failed to load project data: ${error.message}`);
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        if (projectId) {
            loadProjectData();
        }
    }, [projectId, loadProjectData]);

    const handleBack = () => {
        navigate('/dashboard');
    };

    const handleProjectUserManagement = () => {
        navigate(`/projects/${projectId}/users`);
    };

    const handleDownloadExcel = () => {
        try {
            const workbook = XLSX.utils.book_new();

            // Group by model combination (each sheet will be for one model combination)
            const modelCombinationData = {};

            keys.forEach((key) => {
                key.groups.forEach((group) => {
                    group.models.forEach((model) => {
                        // Each model represents a different model combination
                        // Create a unique identifier for this model combination
                        const modelCombo = model.model || 'Unknown';

                        const sheetKey = `${group.groupName} - ${modelCombo}`;

                        if (!modelCombinationData[sheetKey]) {
                            modelCombinationData[sheetKey] = {
                                groupInfo: group,
                                modelInfo: model,
                                data: []
                            };
                        }

                        // Store data for this model combination
                        // Use the comment field directly since it's already the latest comment
                        const comment = model.comment || model.latest_comment_text || '';

                        // Get branch names from project for this group
                        const branchNames = getGroupBranchNames(group.groupName);

                        modelCombinationData[sheetKey].data.push({
                            key_name: key.keyName || key.name,
                            work_assignment: key.workAssignment || key.work_assignment || '',
                            work_assignment_owner: key.owner || key.work_assignment_owner || '',
                            target_val: model.target || '',
                            ref1_val: model.ref1 || '',
                            ref2_val: model.ref2 || '',
                            ref3_val: model.ref3 || '',
                            status: model.status || '',
                            latest_comment: comment,
                            kona: model.kona || '',
                            cl: model.cl || '',
                            branch_names: branchNames
                        });
                    });
                });
            });

            // Create a worksheet for each model combination
            Object.keys(modelCombinationData).forEach((sheetKey, index) => {
                const { groupInfo, modelInfo, data } = modelCombinationData[sheetKey];

                // Determine which columns to create based on the model data
                const hasRef2 = modelInfo.ref2 !== undefined && modelInfo.ref2 !== '';
                const hasRef3 = modelInfo.ref3 !== undefined && modelInfo.ref3 !== '';

                // Extract model names from the model combination
                const modelNames = modelInfo.model.split(' | ');
                const targetModelName = modelNames[0] || 'Target';
                const ref1ModelName = modelNames[1] || 'Ref1';
                const ref2ModelName = modelNames[2] || 'Ref2';
                const ref3ModelName = modelNames[3] || 'Ref3';

                // Get branch names from first data row (all rows have the same branch names for a group)
                const branchNames = data.length > 0 && data[0].branch_names ? data[0].branch_names : {};

                console.log('🔍 Branch names for group:', branchNames);

                // Create merged headers with branch name | model name format
                const targetHeader = `${branchNames.target || ''} | ${targetModelName}`;
                const ref1Header = `${branchNames.reference1 || ''} | ${ref1ModelName}`;
                const ref2Header = `${branchNames.reference2 || ''} | ${ref2ModelName}`;
                const ref3Header = `${branchNames.reference3 || ''} | ${ref3ModelName}`;

                // Create headers with merged branch name | model name
                const headers = ['FMS Key Name', 'Work Assignment', 'Owner', targetHeader, ref1Header];
                if (hasRef2) headers.push(ref2Header);
                if (hasRef3) headers.push(ref3Header);
                headers.push('Status', 'Comments', 'KONA', 'CL');

                console.log('🔍 Merged headers:', headers);

                // Prepare data rows
                const dataRows = data.map(row => {
                    const excelRow = [
                        row.key_name,
                        row.work_assignment,
                        row.work_assignment_owner,
                        row.target_val,
                        row.ref1_val
                    ];
                    if (hasRef2) excelRow.push(row.ref2_val);
                    if (hasRef3) excelRow.push(row.ref3_val);
                    excelRow.push(row.status, row.latest_comment, row.kona, row.cl);
                    return excelRow;
                });

                // Create worksheet data with proper structure (removed separate branch names row)
                const titleRow = [`${groupInfo.groupName} - ${modelInfo.model}`];

                const worksheetData = [
                    titleRow,
                    headers,
                    ...dataRows
                ];

                const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

                // Create unique sheet name with index to ensure uniqueness
                const baseSheetName = sheetKey.substring(0, 25).replace(/[\\\/\?\*\[\]:|]/g, '_');
                const sheetName = `Sheet${index + 1}`;

                XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
            });

            // Generate Excel file
            const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
            const blob = new Blob([wbout], { type: 'application/octet-stream' });
            const fileName = `${project?.title || 'Key_Review'}_Data_${new Date().toISOString().slice(0, 10)}.xlsx`;
            saveAs(blob, fileName);

            toast.success(`Excel file downloaded successfully with ${workbook.SheetNames.length} sheets!`);
        } catch (error) {
            console.error('Error downloading Excel file:', error);
            toast.error('Failed to download Excel file');
        }
    };

    const getLatestComment = (comments) => {
        if (!comments || comments.length === 0) return '';
        // Sort by date (most recent first) and return the latest comment
        const sortedComments = [...comments].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        const latest = sortedComments[0];
        if (latest.commented_by_username && latest.comment_text) {
            return `${latest.commented_by_username}: ${latest.comment_text}`;
        }
        return '';
    };

    const getAllCommentsText = (comments) => {
        if (!comments || comments.length === 0) return '';
        return comments.map(c => `${c.commented_by_username}: ${c.comment_text}`).join('\n');
    };

    const toggleKeyExpansion = useCallback((keyId) => {
        setExpandedKeys(prev => {
            const newExpandedKeys = {
                ...prev,
                [keyId]: !prev[keyId]
            };

            // If expanding the key, also expand all groups within it
            if (!prev[keyId]) {
                const keyData = keys.find(k => k.id === keyId);
                if (keyData && keyData.groups) {
                    keyData.groups.forEach(group => {
                        const groupKey = `${keyId}-${group.groupName}`;
                        setExpandedGroups(prevGroups => ({
                            ...prevGroups,
                            [groupKey]: true
                        }));
                    });
                }
            }

            return newExpandedKeys;
        });
    }, [keys]);

    const toggleGroupExpansion = useCallback((keyId, groupName) => {
        const groupKey = `${keyId}-${groupName}`;
        setExpandedGroups(prev => ({
            ...prev,
            [groupKey]: !prev[groupKey]
        }));
    }, []);

    const expandAllKeys = useCallback(() => {
        const newExpandedKeys = {};
        const newExpandedGroups = {};

        keys.forEach(key => {
            newExpandedKeys[key.id] = true;
            if (key.groups) {
                key.groups.forEach(group => {
                    const groupKey = `${key.id}-${group.groupName}`;
                    newExpandedGroups[groupKey] = true;
                });
            }
        });

        setExpandedKeys(newExpandedKeys);
        setExpandedGroups(newExpandedGroups);
    }, [keys]);

    const collapseAllKeys = useCallback(() => {
        setExpandedKeys({});
        setExpandedGroups({});
    }, []);

    // Filter keys based on Union of Keys toggle with branch-wise control
    const getFilteredKeys = useCallback(() => {
        // Check if any branch filter is active
        const hasActiveFilters = Object.values(unionBranchFilters).some(v => v !== 'off');

        if (!showUnionKeys && hasActiveFilters) {
            // Get branches with 'hide' filter and 'show' filter
            const hideBranches = Object.entries(unionBranchFilters)
                .filter(([_, value]) => value === 'hide')
                .map(([key]) => key);
            const showBranches = Object.entries(unionBranchFilters)
                .filter(([_, value]) => value === 'show')
                .map(([key]) => key);

            return keys.filter(key => {
                // Check if key should be hidden (has NA in any 'hide' branch)
                const shouldHide = key.groups.some(group =>
                    group.models.some(model => {
                        for (const branch of hideBranches) {
                            if (model[branch] === 'no item in this branch') return true;
                        }
                        return false;
                    })
                );

                // If there are 'show' filters, key must have NA in at least one of those branches
                const shouldShow = showBranches.length === 0 || key.groups.some(group =>
                    group.models.some(model => {
                        for (const branch of showBranches) {
                            if (model[branch] === 'no item in this branch') return true;
                        }
                        return false;
                    })
                );

                // Key is shown if: not hidden AND (no show filter OR should show)
                return !shouldHide && shouldShow;
            });
        } else {
            // Show all keys (including those with "no item in this branch")
            return keys;
        }
    }, [keys, showUnionKeys, unionBranchFilters]);

    const handleCommentEdit = (keyId, groupName, modelIndex, currentValue) => {
        if (!canEditFields()) {
            toast.error('You do not have permission to edit comments');
            return;
        }
        setCurrentEdit({ keyId, groupName, modelIndex, field: 'comment' });
        setEditValue(currentValue);
        setEditDialogOpen(true);
    };

    // New comment dialog handlers
    const handleAISummary = async (model, keyName, keyDescription, event) => {
        const keyReviewId = model.key_review_id;
        if (!keyReviewId) return;

        const context = { model, keyName, keyDescription };

        // If already done or error, just open the popover
        const existing = aiSummaryStates[keyReviewId];
        if (existing && (existing.status === 'done' || existing.status === 'error')) {
            setAiSummaryAnchorEl(event.currentTarget);
            setAiSummaryPopoverId(keyReviewId);
            setAiSummaryPopoverContext(context);
            return;
        }

        // If already loading, open popover to show spinner
        if (existing && existing.status === 'loading') {
            setAiSummaryAnchorEl(event.currentTarget);
            setAiSummaryPopoverId(keyReviewId);
            setAiSummaryPopoverContext(context);
            return;
        }

        await runAISummary(model, keyName, keyDescription, keyReviewId, context, event.currentTarget);
    };

    const runAISummary = async (model, keyName, keyDescription, keyReviewId, context, anchorEl) => {
        // Build JSON_Data from model values
        const jsonData = {};
        if (model.target !== undefined && model.target !== null) jsonData['Target_Value'] = String(model.target);
        if (model.ref1 !== undefined && model.ref1 !== null) jsonData['Ref_1_Value'] = String(model.ref1);
        if (model.ref2 !== undefined && model.ref2 !== null) jsonData['Ref_2_Value'] = String(model.ref2);
        if (model.ref3 !== undefined && model.ref3 !== null) jsonData['Ref_3_Value'] = String(model.ref3);

        // Set loading state and open popover
        setAiSummaryStates(prev => ({
            ...prev,
            [keyReviewId]: { status: 'loading', summary: null, error: null }
        }));
        if (anchorEl) setAiSummaryAnchorEl(anchorEl);
        setAiSummaryPopoverId(keyReviewId);
        if (context) setAiSummaryPopoverContext(context);

        const result = await keyReviewAPI.generateAISummary(keyName, keyDescription || '', jsonData);

        if (result.success && result.data?.success) {
            setAiSummaryStates(prev => ({
                ...prev,
                [keyReviewId]: { status: 'done', summary: result.data.summary, error: null }
            }));
        } else {
            setAiSummaryStates(prev => ({
                ...prev,
                [keyReviewId]: {
                    status: 'error',
                    summary: null,
                    error: result.error || result.data?.error || 'Failed to generate summary'
                }
            }));
        }
    };

    // Renders a markdown string into MUI elements.
    // Handles: # headings, **bold**, *italic*, bullet lists (- / *), and newlines.
    const renderMarkdown = (text) => {
        if (!text) return null;
        const lines = text.split('\n');
        const elements = [];
        let listBuffer = [];

        const flushList = (key) => {
            if (listBuffer.length === 0) return;
            elements.push(
                <Box key={`list-${key}`} component="ul" sx={{ m: 0, pl: 2.5, mb: 0.5 }}>
                    {listBuffer.map((item, i) => (
                        <Typography key={i} component="li" variant="body2"
                            sx={{ lineHeight: 1.7, color: 'text.primary', mb: 0.25 }}>
                            {inlineFormat(item)}
                        </Typography>
                    ))}
                </Box>
            );
            listBuffer = [];
        };

        const inlineFormat = (str) => {
            // Split on **bold**, *italic* markers and render spans
            const parts = [];
            const regex = /(\*\*(.+?)\*\*|\*(.+?)\*)/g;
            let last = 0, match;
            while ((match = regex.exec(str)) !== null) {
                if (match.index > last) parts.push(str.slice(last, match.index));
                if (match[2]) parts.push(<strong key={match.index}>{match[2]}</strong>);
                else if (match[3]) parts.push(<em key={match.index}>{match[3]}</em>);
                last = match.index + match[0].length;
            }
            if (last < str.length) parts.push(str.slice(last));
            return parts.length > 0 ? parts : str;
        };

        lines.forEach((line, i) => {
            const trimmed = line.trim();

            // Heading: # / ## / ###
            const headingMatch = trimmed.match(/^(#{1,3})\s+(.+)/);
            if (headingMatch) {
                flushList(i);
                const level = headingMatch[1].length;
                const variant = level === 1 ? 'subtitle1' : 'subtitle2';
                elements.push(
                    <Typography key={i} variant={variant} fontWeight={700}
                        sx={{ mt: level === 1 ? 1.5 : 1, mb: 0.25, color: 'text.primary' }}>
                        {inlineFormat(headingMatch[2])}
                    </Typography>
                );
                return;
            }

            // Bullet list item: - or * at start
            const bulletMatch = trimmed.match(/^[-*]\s+(.+)/);
            if (bulletMatch) {
                listBuffer.push(bulletMatch[1]);
                return;
            }

            // Empty line — flush any pending list, add spacing
            if (trimmed === '') {
                flushList(i);
                elements.push(<Box key={i} sx={{ height: 6 }} />);
                return;
            }

            // Regular paragraph line
            flushList(i);
            elements.push(
                <Typography key={i} variant="body2"
                    sx={{ lineHeight: 1.7, color: 'text.primary', mb: 0.25 }}>
                    {inlineFormat(trimmed)}
                </Typography>
            );
        });

        flushList('end');
        return <Box>{elements}</Box>;
    };

    const handleAIRegenerate = () => {
        if (!aiSummaryPopoverContext || !aiSummaryPopoverId) return;
        const { model, keyName, keyDescription } = aiSummaryPopoverContext;
        runAISummary(model, keyName, keyDescription, aiSummaryPopoverId, aiSummaryPopoverContext, null);
    };

    const handleCommentClick = (keyReviewId, keyName, keyId, groupName) => {
        setSelectedKeyReview(keyReviewId);
        setSelectedKeyName(keyName);
        setSelectedGroupName(groupName);

        // Find all key_review_ids for this key-group combination
        const targetKey = keys.find(key => key.fms_key_id === keyId);
        if (targetKey) {
            const targetGroup = targetKey.groups.find(group => group.group_name === groupName);
            if (targetGroup) {
                const groupKeyReviewIds = targetGroup.models.map(model => model.key_review_id).filter(id => id);
                setSelectedGroupKeyReviewIds(groupKeyReviewIds);
            }
        }

        setCommentDialogOpen(true);
    };

    const handleCommentDialogClose = () => {
        setCommentDialogOpen(false);
        setSelectedKeyReview(null);
        setSelectedKeyName('');
        setSelectedGroupName('');
        setSelectedGroupKeyReviewIds([]);
    };

    const handleStatusEdit = (keyId, groupName, modelIndex, currentValue) => {
        if (!canEditFields()) {
            toast.error('You do not have permission to edit status');
            return;
        }
        setCurrentEdit({ keyId, groupName, modelIndex, field: 'status' });
        setEditValue(currentValue);
        setEditDialogOpen(true);
    };

    const handleKonaEdit = (keyId, groupName, modelIndex, currentValue) => {
        if (!canEditFields()) {
            toast.error('You do not have permission to edit KONA IDs');
            return;
        }
        setCurrentEdit({ keyId, groupName, modelIndex, field: 'kona' });
        setEditValue(currentValue);
        setEditDialogOpen(true);
    };

    const handleClEdit = (keyId, groupName, modelIndex, currentValue) => {
        if (!canEditFields()) {
            toast.error('You do not have permission to edit CL numbers');
            return;
        }
        setCurrentEdit({ keyId, groupName, modelIndex, field: 'cl' });
        setEditValue(currentValue);
        setEditDialogOpen(true);
    };

    const handleSaveEdit = async () => {
        if (!currentEdit) return;

        const { keyId, groupName, modelIndex, field } = currentEdit;

        try {
            // First, find the model to get its ID for the API call
            let modelData = null;
            let reviewId = null;
            let gmId = null;
            let groupId = null;

            // Find the model in the current keys state
            keys.forEach(key => {
                if (key.fms_key_id === keyId) {
                    key.groups.forEach(group => {
                        if (group.group_name === groupName && group.models[modelIndex]) {
                            modelData = group.models[modelIndex];
                            // Get the new identifiers
                            reviewId = modelData.key_review_id;
                            gmId = modelData.gm_id;
                            groupId = modelData.group_id;
                        }
                    });
                }
            });

            console.log('Model data for edit:', modelData);
            console.log('Extracted reviewId:', reviewId, 'gmId:', gmId, 'groupId:', groupId);

            if (!modelData) {
                throw new Error('Could not find model data for editing.');
            }

            console.log('Attempting to update field:', field, 'with value:', editValue);

            let result;
            if (reviewId) {
                // If we have a real review ID, try the specific update endpoints
                switch (field) {
                    case 'comment':
                        result = await keyReviewAPI.updateReviewComment(reviewId, editValue);
                        break;
                    case 'status':
                        result = await keyReviewAPI.updateReviewStatus(reviewId, editValue);
                        break;
                    case 'kona':
                        result = await keyReviewAPI.updateKonaIds(reviewId, editValue);
                        break;
                    case 'cl':
                        result = await keyReviewAPI.updateClNumbers(reviewId, editValue);
                        break;
                    default:
                        throw new Error(`Unknown field: ${field}`);
                }
            } else if (gmId && groupId) {
                // Create or update using the new structure
                const reviewData = {
                    fms_key_id: keyId,
                    gm_id: gmId,
                    group_id: groupId,
                    target_val: modelData.target || '',
                    ref1_val: modelData.ref1 || '',
                    ref2_val: modelData.ref2 || '',
                    ref3_val: modelData.ref3 || '',
                    comment: field === 'comment' ? editValue : (modelData.comment || ''),
                    status: field === 'status' ? editValue : (modelData.status || 'unreviewed'),
                    kona_ids: field === 'kona' ? editValue : (modelData.kona_ids || ''),
                    cl_numbers: field === 'cl' ? editValue : (modelData.cl_numbers || '')
                };

                result = await keyReviewAPI.createOrUpdateReview(reviewData);
            } else {
                throw new Error('Missing required identifiers (gm_id, group_id) for creating/updating review.');
            }

            if (!result.success) {
                throw new Error(result.error || 'Failed to update value');
            }

            // Update local state only if API call was successful
            setKeys(prevKeys =>
                prevKeys.map(key => {
                    if (key.fms_key_id === keyId) {
                        return {
                            ...key,
                            groups: key.groups.map(group => {
                                if (group.group_name === groupName) {
                                    return {
                                        ...group,
                                        models: group.models.map((model, index) => {
                                            if (index === modelIndex) {
                                                return {
                                                    ...model,
                                                    [field]: editValue,
                                                    last_modified: new Date().toISOString().split('T')[0]
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

            toast.success(`${field.charAt(0).toUpperCase() + field.slice(1)} updated successfully`);
        } catch (error) {
            console.error('Error updating value:', error);
            toast.error(`Failed to update ${field}: ${error.message}`);
        }

        setEditDialogOpen(false);
        setCurrentEdit(null);
        setEditValue('');
    };

    const handleApplyToGroup = async () => {
        if (!currentEdit) return;

        const { keyId, groupName, field } = currentEdit;

        // Confirm with user
        const confirmMessage = `Apply this ${field} to all models in group "${groupName}" for this key?`;
        if (!window.confirm(confirmMessage)) {
            return;
        }

        try {
            let successCount = 0;
            let failCount = 0;

            // Find all models in this group for this key
            const targetKey = keys.find(key => key.fms_key_id === keyId);
            if (!targetKey) {
                throw new Error('Key not found');
            }

            const targetGroup = targetKey.groups.find(group => group.group_name === groupName);
            if (!targetGroup) {
                throw new Error('Group not found');
            }

            // Apply to all models in the group
            for (let modelIndex = 0; modelIndex < targetGroup.models.length; modelIndex++) {
                const modelData = targetGroup.models[modelIndex];
                const reviewId = modelData.key_review_id;
                const gmId = modelData.gm_id;
                const groupId = modelData.group_id;

                try {
                    let result;
                    if (reviewId) {
                        // Use specific update endpoints
                        switch (field) {
                            case 'comment':
                                result = await keyReviewAPI.updateReviewComment(reviewId, editValue);
                                break;
                            case 'status':
                                result = await keyReviewAPI.updateReviewStatus(reviewId, editValue);
                                break;
                            case 'kona':
                                result = await keyReviewAPI.updateKonaIds(reviewId, editValue);
                                break;
                            case 'cl':
                                result = await keyReviewAPI.updateClNumbers(reviewId, editValue);
                                break;
                            default:
                                throw new Error(`Unknown field: ${field}`);
                        }
                    } else if (gmId && groupId) {
                        // Create or update using the new structure
                        const reviewData = {
                            fms_key_id: keyId,
                            gm_id: gmId,
                            group_id: groupId,
                            target_val: modelData.target || '',
                            ref1_val: modelData.ref1 || '',
                            ref2_val: modelData.ref2 || '',
                            ref3_val: modelData.ref3 || '',
                            comment: field === 'comment' ? editValue : (modelData.comment || ''),
                            status: field === 'status' ? editValue : (modelData.status || 'unreviewed'),
                            kona_ids: field === 'kona' ? editValue : (modelData.kona_ids || ''),
                            cl_numbers: field === 'cl' ? editValue : (modelData.cl_numbers || '')
                        };

                        result = await keyReviewAPI.createOrUpdateReview(reviewData);
                    }

                    if (result && result.success) {
                        successCount++;
                    } else {
                        failCount++;
                    }
                } catch (error) {
                    console.error(`Error updating model ${modelIndex}:`, error);
                    failCount++;
                }
            }

            // Update local state for all models in the group
            setKeys(prevKeys =>
                prevKeys.map(key => {
                    if (key.fms_key_id === keyId) {
                        return {
                            ...key,
                            groups: key.groups.map(group => {
                                if (group.group_name === groupName) {
                                    return {
                                        ...group,
                                        models: group.models.map(model => ({
                                            ...model,
                                            [field]: editValue,
                                            last_modified: new Date().toISOString().split('T')[0]
                                        }))
                                    };
                                }
                                return group;
                            })
                        };
                    }
                    return key;
                })
            );

            if (failCount === 0) {
                toast.success(`${field.charAt(0).toUpperCase() + field.slice(1)} applied to ${successCount} model(s) in group`);
            } else {
                toast.warning(`Applied to ${successCount} model(s), ${failCount} failed`);
            }
        } catch (error) {
            console.error('Error applying to group:', error);
            toast.error(`Failed to apply to group: ${error.message}`);
        }

        setEditDialogOpen(false);
        setCurrentEdit(null);
        setEditValue('');
    };

    const getBranchLabels = () => {
        // Safety check: ensure project exists
        if (!project) {
            return { target: 'Target', reference1: 'Reference 1' }; // Default fallback
        }

        switch (project.comparisonType || project.comparison_type) {
            case '2-way':
                return { target: 'Target', reference1: 'Reference' };
            case '3-way':
                return { target: 'Target', reference1: 'Reference 1', reference2: 'Reference 2' };
            case '4-way':
                return { target: 'Target', reference1: 'Reference 1', reference2: 'Reference 2', reference3: 'Reference 3' };
            case '2-way-vs-2-way':
            case '2-way vs 2-way':
                // Backend stores as: target, reference1, reference2, reference3
                // UI displays as: Target 1, Reference 1, Target 2, Reference 2
                return { target: 'Target 1', reference1: 'Reference 1', reference2: 'Target 2', reference3: 'Reference 2' };
            default:
                return { target: 'Target', reference1: 'Reference 1' }; // Default fallback
        }
    };

    // Get actual branch names for a specific group
    const getGroupBranchNames = (groupName) => {
        console.log(`🔍 getGroupBranchNames called for group: "${groupName}"`);
        console.log('🔍 Current project state:', {
            project: !!project,
            projectId: project?.project_id,
            hasGroups: !!project?.groups,
            groupsType: typeof project?.groups,
            isArray: Array.isArray(project?.groups),
            groupsLength: project?.groups?.length || 0,
            projectKeys: project ? Object.keys(project) : []
        });

        // Safety check: ensure project and project.groups exist
        if (!project || !project.groups || !Array.isArray(project.groups)) {
            console.warn('🚨 Project groups not available, using fallback branch labels');
            console.log('🔍 Project state:', { project: !!project, hasGroups: !!project?.groups, isArray: Array.isArray(project?.groups) });
            return getBranchLabels(); // Fallback to generic labels
        }

        console.log(`🔍 Searching for group "${groupName}" in ${project.groups.length} available groups:`);
        project.groups.forEach((g, i) => {
            console.log(`  Group ${i + 1}: name="${g.name}", has_branches=${!!g.branches}, has_branchConfig=${!!g.branchConfig}`);
        });

        const group = project.groups.find(g => g.name === groupName);
        if (!group) {
            console.warn(`🚨 Group "${groupName}" not found, using fallback`);
            return getBranchLabels(); // Fallback to generic labels
        }

        console.log(`🔍 Found group "${groupName}":`, {
            name: group.name,
            comparison_type: group.comparison_type,
            has_branches: !!group.branches,
            has_branchConfig: !!group.branchConfig,
            branches: group.branches,
            branchConfig: group.branchConfig
        });

        // Use branches if available, otherwise use branchConfig
        const branchData = group.branches || group.branchConfig;
        if (!branchData || Object.keys(branchData).length === 0) {
            console.warn(`🚨 Group "${groupName}" has no branch data, using fallback`);
            return getBranchLabels(); // Fallback to generic labels
        }

        console.log(`🔍 Returning branch data for group "${groupName}":`, branchData);
        return branchData;
    };

    // Truncate branch name and add tooltip
    const truncateBranchName = (branchName, maxLength = 20) => {
        if (branchName.length <= maxLength) {
            return branchName;
        }
        return branchName.substring(0, maxLength) + '...';
    };

    // Render branch header with tooltip
    const renderBranchHeader = (branch, branchName, keyId, groupName, models) => {
        const truncatedName = truncateBranchName(branchName);
        const needsTooltip = branchName.length > 20;

        const headerContent = renderTableHeader(branch, truncatedName, keyId, groupName, models);

        if (needsTooltip) {
            return (
                <Tooltip key={branch} title={branchName} arrow placement="top">
                    {headerContent}
                </Tooltip>
            );
        }

        return headerContent;
    };

    const handleCopyToClipboard = (text, label) => {
        // Use modern Clipboard API if available (requires HTTPS or localhost)
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(() => {
                toast.success(`${label} copied to clipboard!`, { autoClose: 1500 });
            }).catch(() => {
                toast.error('Failed to copy to clipboard');
            });
        } else {
            // Fallback for HTTP or older browsers
            try {
                const textArea = document.createElement('textarea');
                textArea.value = text;
                textArea.style.position = 'fixed';
                textArea.style.left = '-9999px';
                textArea.style.top = '-9999px';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                const successful = document.execCommand('copy');
                document.body.removeChild(textArea);
                if (successful) {
                    toast.success(`${label} copied to clipboard!`, { autoClose: 1500 });
                } else {
                    toast.error('Failed to copy to clipboard');
                }
            } catch (err) {
                toast.error('Failed to copy to clipboard');
            }
        }
    };

    const renderKeyHeader = (keyData) => {
        const { keyName, workAssignment, owner, description } = keyData;

        return (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1.5 }}>
                {/* Left side - Key name with copy button and info button */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0, flex: 1 }}>
                    <Key color="primary" sx={{ fontSize: 20 }} />
                    <Typography variant="subtitle1" fontWeight="600" sx={{ fontSize: '1rem' }}>
                        {keyName}
                    </Typography>
                    <Tooltip title="Copy key name">
                        <IconButton
                            size="small"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleCopyToClipboard(keyName, 'Key name');
                            }}
                            sx={{
                                ml: 0.5,
                                p: 0.25,
                                opacity: 0.6,
                                '&:hover': { opacity: 1, bgcolor: 'action.hover' }
                            }}
                        >
                            <ContentCopy sx={{ fontSize: 14 }} />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Show key description">
                        <IconButton
                            size="small"
                            onClick={(e) => {
                                e.stopPropagation();
                                setDescriptionText(description || 'No description available.');
                                setDescriptionAnchorEl(e.currentTarget);
                            }}
                            sx={{
                                p: 0.25,
                                opacity: 0.6,
                                '&:hover': { opacity: 1, bgcolor: 'action.hover' }
                            }}
                        >
                            <Info sx={{ fontSize: 14 }} />
                        </IconButton>
                    </Tooltip>
                </Box>

                {/* Right side - WA and Owner */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Assignment sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2" sx={{ fontSize: '0.85rem', fontWeight: 500 }}>
                            {workAssignment}
                        </Typography>
                    </Box>

                    <Divider orientation="vertical" flexItem sx={{ height: 24, alignSelf: 'center' }} />

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Person sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                            {owner}
                        </Typography>
                        <Tooltip title="Copy owner name">
                            <IconButton
                                size="small"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleCopyToClipboard(owner, 'Owner name');
                                }}
                                sx={{
                                    ml: 0.5,
                                    p: 0.25,
                                    opacity: 0.6,
                                    '&:hover': { opacity: 1, bgcolor: 'action.hover' }
                                }}
                            >
                                <ContentCopy sx={{ fontSize: 14 }} />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Box>
            </Box>
        );
    };

    // Helper function to get all model names for display across branches
    const getModelNamesForRow = (keyId, groupName, currentModel) => {
        // Simply return the model name from the current model
        // The backend already provides the correct model combination in model.model_name
        return currentModel.model || currentModel.model_name || 'Unknown';
    };

    const renderModelRow = (keyId, groupName, model, modelIndex, branchLabels, keyName, keyDescription) => {
        // Safety check: ensure model.status exists and is valid
        const modelStatus = model.status || 'unreviewed'; // Default to 'unreviewed' if undefined
        const statusInfo = statusColors[modelStatus] || statusColors['unreviewed']; // Fallback to 'unreviewed' status

        // Debug: Log detailed model data to understand structure
        console.log(`🔍 renderModelRow called for key ${keyId}, group "${groupName}", model ${modelIndex}:`);
        console.log('🔍 Model data:', {
            model_name: model.model_name,
            model: model.model,
            target: model.target,
            ref1: model.ref1,
            ref2: model.ref2,
            ref3: model.ref3,
            status: model.status,
            comment: model.comment
        });
        console.log('🔍 Branch labels:', branchLabels);
        console.log('🔍 Branch labels keys:', Object.keys(branchLabels || {}));

        return (
            <TableRow
                key={`${keyId}-${groupName}-${modelIndex}`}
                sx={{
                    backgroundColor: `${statusInfo.color}15`,
                    '&:hover': { backgroundColor: `${statusInfo.color}25` },
                    height: 48
                }}
            >
                <TableCell sx={{ py: 1, px: 2, minWidth: 200, whiteSpace: 'nowrap' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="body2" fontWeight="500" sx={{ fontSize: '0.85rem' }}>
                            {getModelNamesForRow(keyId, groupName, model)}
                        </Typography>
                        {model.key_review_id && (() => {
                            const aiState = aiSummaryStates[model.key_review_id];
                            const isLoading = aiState?.status === 'loading';
                            return (
                                <Tooltip title="Generate AI summary of the differences" placement="top">
                                    <IconButton
                                        size="small"
                                        onClick={(e) => handleAISummary(model, keyName, keyDescription, e)}
                                        sx={{
                                            p: 0.5,
                                            borderRadius: '50%',
                                            width: 40,
                                            height: 40,
                                            flexShrink: 0,
                                            '&:hover': {
                                                backgroundColor: 'rgba(0,0,0,0.06)',
                                                transform: 'scale(1.1)'
                                            },
                                            transition: 'transform 0.15s ease'
                                        }}
                                    >
                                        <img
                                            src={isLoading ? '/ai-loading-svg-animated.svg' : '/ai-loading-svg-normal.svg'}
                                            width="60"
                                            height="60"
                                            alt="AI summary"
                                            style={{ display: 'block', pointerEvents: 'none' }}
                                        />
                                    </IconButton>
                                </Tooltip>
                            );
                        })()}
                    </Box>
                </TableCell>

                {Object.entries(branchLabels).map(([branch, label]) => {
                    // Map branch keys to model property names
                    let modelProperty;
                    switch (branch) {
                        case 'target':
                            modelProperty = 'target';
                            break;
                        case 'reference1':
                            modelProperty = 'ref1';
                            break;
                        case 'reference2':
                            modelProperty = 'ref2';
                            break;
                        case 'reference3':
                            modelProperty = 'ref3';
                            break;
                        default:
                            modelProperty = branch;
                    }

                    return (
                        <TableCell key={branch} align="left" sx={{ py: 1, px: 2 }}>
                            <Typography variant="body2" fontWeight="500" sx={{ fontSize: '0.85rem' }}>
                                {model[modelProperty] || '-'}
                            </Typography>
                        </TableCell>
                    );
                })}

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
                        style={{
                            cursor: canEditFields() ? 'pointer' : 'default',
                            opacity: canEditFields() ? 1 : 0.6
                        }}
                    >
                        <Chip
                            size="small"
                            label={statusInfo.label}
                            sx={{
                                backgroundColor: statusInfo.color,
                                color: statusInfo.textColor || '#fff',
                                border: statusInfo.color === 'transparent' ? '1px solid #ccc' : 'none',
                                fontSize: '0.7rem',
                                height: 22,
                                minWidth: 80
                            }}
                        />
                        <Edit sx={{ fontSize: 12, opacity: 0.5 }} />
                    </Box>
                </TableCell>

                <TableCell sx={{ py: 1, px: 2, maxWidth: 250 }}>
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
                        onClick={() => handleCommentClick(model.key_review_id, keyName, keyId, groupName)}
                    >
                        {model.latest_comment_text ? (
                            <>
                                <ChatBubble sx={{ fontSize: 16, color: 'primary.main' }} />
                                <Typography
                                    variant="body2"
                                    sx={{
                                        fontSize: '0.8rem',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        maxWidth: 180
                                    }}
                                >
                                    {model.latest_comment_text}
                                </Typography>
                                {model.total_comments > 1 && (
                                    <Chip
                                        size="small"
                                        label={`+${model.total_comments - 1}`}
                                        sx={{
                                            fontSize: '0.6rem',
                                            height: 16,
                                            backgroundColor: 'primary.light',
                                            color: 'primary.contrastText'
                                        }}
                                    />
                                )}
                            </>
                        ) : (
                            <>
                                <ChatBubbleOutline sx={{ fontSize: 16, color: 'text.secondary' }} />
                                <Typography variant="body2" sx={{ fontSize: '0.8rem', color: 'text.secondary', fontStyle: 'italic' }}>
                                    No comments
                                </Typography>
                            </>
                        )}
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
                        onClick={() => handleKonaEdit(keyId, groupName, modelIndex, model.kona)}
                        style={{
                            cursor: canEditFields() ? 'pointer' : 'default',
                            opacity: canEditFields() ? 1 : 0.6
                        }}
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
                        style={{
                            cursor: canEditFields() ? 'pointer' : 'default',
                            opacity: canEditFields() ? 1 : 0.6
                        }}
                    >
                        <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                            {model.cl || (canEditFields() ? 'Add CL...' : 'No CL')}
                        </Typography>
                        <Edit sx={{ fontSize: 12, opacity: 0.5 }} />
                    </Box>
                </TableCell>

            </TableRow>
        );
    };

    // Key-level filtering and sorting functions
    const getKeyStatistics = (keyData) => {
        const stats = {
            total: 0,
            unreviewed: 0,
            changes_made: 0,
            pending_response: 0,
            no_change_req: 0,
            internal_discussion: 0,
            changes_in_progress: 0,
            value_changed: 0
        };

        keyData.groups.forEach(group => {
            group.models.forEach(model => {
                stats.total++;
                const status = model.status || 'unreviewed';
                if (stats.hasOwnProperty(status)) {
                    stats[status]++;
                } else {
                    stats.unreviewed++; // fallback
                }
            });
        });

        return stats;
    };

    const getFilteredAndSortedKeys = useMemo(() => {
        // First apply Union of Keys filter
        let unionFilteredKeys = getFilteredKeys();

        // Apply group filter first - filter groups within each key
        let keysWithFilteredGroups = unionFilteredKeys.map(key => {
            if (keyFilters.groups.length === 0) {
                return key; // No group filter, return as is
            }
            // Filter groups within this key
            const filteredGroups = key.groups?.filter(group =>
                keyFilters.groups.includes(group.groupName)
            ) || [];
            return { ...key, groups: filteredGroups };
        }).filter(key => key.groups && key.groups.length > 0); // Remove keys with no matching groups

        let filteredKeys = keysWithFilteredGroups.filter(key => {
            // Search filter
            const searchLower = keySearchTerm.toLowerCase();
            const matchesSearch = !keySearchTerm ||
                (key.keyName && key.keyName.toLowerCase().includes(searchLower)) ||
                (key.workAssignment && key.workAssignment.toLowerCase().includes(searchLower)) ||
                (key.owner && key.owner.toLowerCase().includes(searchLower));

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

            // Key Names filter
            const matchesKeyName = keyFilters.keyNames.length === 0 ||
                keyFilters.keyNames.includes(key.keyName);

            return matchesSearch && matchesStatus && matchesOwner && matchesWA && matchesKeyName;
        });

        // Sort keys
        filteredKeys.sort((a, b) => {
            let aValue, bValue;

            switch (keySortBy) {
                case 'keyName':
                    aValue = (a.keyName || '').toLowerCase();
                    bValue = (b.keyName || '').toLowerCase();
                    break;
                case 'workAssignment':
                    aValue = (a.workAssignment || '').toLowerCase();
                    bValue = (b.workAssignment || '').toLowerCase();
                    break;
                case 'owner':
                    aValue = (a.owner || '').toLowerCase();
                    bValue = (b.owner || '').toLowerCase();
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
                    aValue = (a.keyName || '').toLowerCase();
                    bValue = (b.keyName || '').toLowerCase();
            }

            if (keySortDirection === 'asc') {
                return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
            } else {
                return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
            }
        });

        return filteredKeys;
    }, [keys, keySearchTerm, keyFilters, keySortBy, keySortDirection, showUnionKeys, getFilteredKeys]);

    // Paginated keys for performance
    const paginatedKeys = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return getFilteredAndSortedKeys.slice(startIndex, endIndex);
    }, [getFilteredAndSortedKeys, currentPage, itemsPerPage]);

    const totalPages = useMemo(() =>
        Math.ceil(getFilteredAndSortedKeys.length / itemsPerPage),
        [getFilteredAndSortedKeys.length, itemsPerPage]
    );

    // Multi-select helper functions - optimized for performance
    const handleKeySelection = useCallback((keyId, event) => {
        event?.stopPropagation();
        setSelectedKeysMap(prev => ({
            ...prev,
            [keyId]: !prev[keyId]
        }));
    }, []);

    const handleSelectAllKeys = useCallback(() => {
        const allKeyIds = getFilteredAndSortedKeys.map(key => key.id);
        const allSelected = allKeyIds.every(id => selectedKeysMap[id]);

        if (allSelected) {
            setSelectedKeysMap({});
        } else {
            const newMap = {};
            allKeyIds.forEach(id => { newMap[id] = true; });
            setSelectedKeysMap(newMap);
        }
    }, [getFilteredAndSortedKeys, selectedKeysMap]);

    const clearSelection = useCallback(() => {
        setSelectedKeysMap({});
    }, []);

    // Memoized key_review_ids for selected keys
    const selectedKeyReviewIds = useMemo(() => {
        const ids = [];
        keys.forEach(key => {
            if (selectedKeysMap[key.id]) {
                key.groups?.forEach(group => {
                    group.models?.forEach(model => {
                        if (model.key_review_id) {
                            ids.push(model.key_review_id);
                        }
                    });
                });
            }
        });
        return ids;
    }, [keys, selectedKeysMap]);

    // For backward compatibility
    const getSelectedKeyReviewIds = useCallback(() => selectedKeyReviewIds, [selectedKeyReviewIds]);

    // Bulk action handlers
    const handleBulkAction = useCallback((actionType) => {
        setBulkActionType(actionType);
        setBulkActionValue('');
        setBulkActionDialogOpen(true);
    }, []);

    const handleBulkActionSubmit = async () => {
        const keyReviewIds = selectedKeyReviewIds;
        if (keyReviewIds.length === 0) {
            toast.error('No key reviews selected');
            return;
        }

        // Get value from ref for text inputs, or from state for status
        const actionValue = bulkActionType === 'status'
            ? bulkActionValue
            : bulkActionInputRef.current?.value || '';

        // Skip value check for verify action
        if (!actionValue && bulkActionType !== 'verify') {
            toast.error('Please enter a value');
            return;
        }

        try {
            if (bulkActionType === 'status') {
                // Update status for all selected key reviews
                await Promise.all(keyReviewIds.map(id =>
                    keyReviewAPI.updateReviewStatus(id, actionValue)
                ));
                toast.success(`Status updated to "${actionValue}" for ${keyReviewIds.length} items`);
            } else if (bulkActionType === 'comment') {
                // Add comment to all selected key reviews
                await commentAPI.createBulkComment(keyReviewIds, actionValue);
                toast.success(`Comment added to ${keyReviewIds.length} items`);
            } else if (bulkActionType === 'kona') {
                // Update KONA for all selected key reviews
                await Promise.all(keyReviewIds.map(id =>
                    keyReviewAPI.updateKonaIds(id, actionValue)
                ));
                toast.success(`KONA updated to "${actionValue}" for ${keyReviewIds.length} items`);
            } else if (bulkActionType === 'cl') {
                // Update CL for all selected key reviews
                await Promise.all(keyReviewIds.map(id =>
                    keyReviewAPI.updateClNumbers(id, actionValue)
                ));
                toast.success(`CL updated to "${actionValue}" for ${keyReviewIds.length} items`);
            } else if (bulkActionType === 'verify') {
                // Verify all comments for selected key reviews (admin only)
                const result = await commentAPI.verifyBulkComments(keyReviewIds);
                if (result.success) {
                    toast.success(result.data.message || `${result.data.totalVerified} comment(s) verified`);
                } else {
                    toast.error(result.error || 'Failed to verify comments');
                }
            }

            // Refresh data and clear selection
            await loadProjectData();
            clearSelection();
            setBulkActionDialogOpen(false);
        } catch (error) {
            console.error('Bulk action error:', error);
            toast.error('Failed to apply bulk action');
        }
    };

    const handleKeyFilterChange = useCallback((filterType, value) => {
        setKeyFilters(prev => {
            const currentValues = prev[filterType];
            const newValues = currentValues.includes(value)
                ? currentValues.filter(v => v !== value)
                : [...currentValues, value];

            return { ...prev, [filterType]: newValues };
        });
        setCurrentPage(1); // Reset to first page when filters change
    }, []);

    const clearKeyFilters = useCallback(() => {
        setKeyFilters({ status: [], owner: [], workAssignment: [], keyNames: [], groups: [] });
        setKeySearchTerm('');
        setGroupSearch('');
        setCurrentPage(1); // Reset to first page when clearing filters
        toast.success('Cleared all key filters');
    }, []);

    // Check if current filters have any active selections
    const hasActiveKeyFilters = useMemo(() => {
        return keyFilters.status.length > 0 ||
            keyFilters.owner.length > 0 ||
            keyFilters.workAssignment.length > 0 ||
            keyFilters.keyNames.length > 0 ||
            keyFilters.groups.length > 0;
    }, [keyFilters]);

    // Save current filter as a preset
    const handleSaveFilter = useCallback(() => {
        if (!newFilterName.trim()) {
            toast.error('Please enter a filter name');
            return;
        }

        const filterToSave = {
            id: Date.now().toString(),
            name: newFilterName.trim(),
            createdAt: new Date().toISOString(),
            filters: {
                status: [...keyFilters.status],
                owner: [...keyFilters.owner],
                workAssignment: [...keyFilters.workAssignment],
                keyNames: [...keyFilters.keyNames],
                groups: [...keyFilters.groups]
            }
        };

        const updatedSavedFilters = [...savedFilters, filterToSave];
        setSavedFilters(updatedSavedFilters);
        localStorage.setItem(`keyReview_savedFilters_${projectId}`, JSON.stringify(updatedSavedFilters));
        
        setSaveFilterDialogOpen(false);
        setNewFilterName('');
        toast.success(`Filter "${filterToSave.name}" saved successfully`);
    }, [newFilterName, keyFilters, savedFilters, projectId]);

    // Apply a saved filter
    const handleApplySavedFilter = useCallback((savedFilter) => {
        setKeyFilters(savedFilter.filters);
        setCurrentPage(1);
        toast.success(`Applied filter "${savedFilter.name}"`);
    }, []);

    // Delete a saved filter
    const handleDeleteSavedFilter = useCallback((filterId, filterName, e) => {
        e.stopPropagation(); // Prevent applying the filter when clicking delete
        const updatedSavedFilters = savedFilters.filter(f => f.id !== filterId);
        setSavedFilters(updatedSavedFilters);
        localStorage.setItem(`keyReview_savedFilters_${projectId}`, JSON.stringify(updatedSavedFilters));
        toast.success(`Filter "${filterName}" deleted`);
    }, [savedFilters, projectId]);

    const getUniqueOwners = useMemo(() =>
        [...new Set(keys.map(key => key.owner).filter(Boolean))].sort(), [keys]
    );
    const getUniqueWorkAssignments = useMemo(() =>
        [...new Set(keys.map(key => key.workAssignment).filter(Boolean))].sort(), [keys]
    );
    const getUniqueKeyNames = useMemo(() =>
        [...new Set(keys.map(key => key.keyName).filter(Boolean))].sort(), [keys]
    );
    const getUniqueGroups = useMemo(() => {
        const allGroups = new Set();
        keys.forEach(key => {
            key.groups?.forEach(group => {
                if (group.groupName) allGroups.add(group.groupName);
            });
        });
        return [...allGroups].sort();
    }, [keys]);

    // Handle paste in filter search fields - supports pasting multiple values from Excel
    // Excel columns are separated by \t (tabs), rows by \r\n or \n
    const handlePasteFilter = useCallback((type, e) => {
        const pastedText = e.clipboardData.getData('text');

        // Split by newlines and/or tabs (Excel row/column separators)
        const parsedValues = pastedText
            .split(/[\r\n\t]+/)
            .map(v => v.trim())
            .filter(v => v.length > 0);

        // Single value: let normal paste + search behavior handle it
        if (parsedValues.length <= 1) return;

        // Multiple values: prevent default to avoid filling the search box
        e.preventDefault();

        let availableOptions;
        if (type === 'keyNames') availableOptions = getUniqueKeyNames;
        else if (type === 'owner') availableOptions = getUniqueOwners;
        else if (type === 'workAssignment') availableOptions = getUniqueWorkAssignments;
        else if (type === 'groups') availableOptions = getUniqueGroups;
        else return;

        // Match pasted values against available options (case-insensitive)
        const matched = [];
        parsedValues.forEach(pasted => {
            const match = availableOptions.find(
                opt => opt.toLowerCase() === pasted.toLowerCase()
            );
            if (match && !matched.includes(match)) {
                matched.push(match);
            }
        });

        if (matched.length > 0) {
            setKeyFilters(prev => ({
                ...prev,
                [type]: [...new Set([...prev[type], ...matched])]
            }));
            setCurrentPage(1);
            toast.success(
                `✅ Selected ${matched.length} of ${parsedValues.length} pasted values` +
                (matched.length < parsedValues.length
                    ? ` (${parsedValues.length - matched.length} not found)`
                    : '')
            );
        } else {
            toast.warning(`No matching items found among ${parsedValues.length} pasted values`);
        }
    }, [getUniqueKeyNames, getUniqueOwners, getUniqueWorkAssignments, getUniqueGroups]);

    const renderKeyControls = () => {
        const filteredKeys = getFilteredAndSortedKeys;
        const hasActiveFilters = keySearchTerm ||
            keyFilters.status.length > 0 ||
            keyFilters.owner.length > 0 ||
            keyFilters.workAssignment.length > 0 ||
            keyFilters.keyNames.length > 0 ||
            keyFilters.groups.length > 0;

        // Calculate status summary based on filtered keys
        const calculateStatusCount = (status) => {
            return filteredKeys.reduce((count, key) => {
                if (!key.groups) return count;
                key.groups.forEach(group => {
                    if (group.models) {
                        group.models.forEach(model => {
                            if (model.status === status) {
                                count++;
                            }
                        });
                    }
                });
                return count;
            }, 0);
        };

        const statusCounts = {
            unreviewed: calculateStatusCount('unreviewed'),
            changes_made: calculateStatusCount('changes_made'),
            pending_response: calculateStatusCount('pending_response'),
            no_change_req: calculateStatusCount('no_change_req'),
            internal_discussion: calculateStatusCount('internal_discussion'),
            changes_in_progress: calculateStatusCount('changes_in_progress'),
            value_changed: calculateStatusCount('value_changed')
        };

        const totalModels = statusCounts.unreviewed + statusCounts.changes_made + statusCounts.pending_response +
            statusCounts.no_change_req + statusCounts.internal_discussion +
            statusCounts.changes_in_progress + statusCounts.value_changed;

        const allKeyIds = filteredKeys.map(key => key.id);
        const allSelected = allKeyIds.length > 0 && allKeyIds.every(id => selectedKeys.has(id));
        const someSelected = allKeyIds.some(id => selectedKeys.has(id));

        return (
            <Paper sx={{ p: 1.5, mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5, flexWrap: 'wrap' }}>
                    {/* Select All Checkbox */}
                    <Tooltip title={allSelected ? "Deselect all" : "Select all visible keys"}>
                        <Checkbox
                            checked={allSelected}
                            indeterminate={someSelected && !allSelected}
                            onChange={handleSelectAllKeys}
                            size="small"
                            sx={{ p: 0.5 }}
                        />
                    </Tooltip>
                    <Typography variant="h6" sx={{ fontSize: '0.9rem', fontWeight: 600 }}>
                        Key Management
                    </Typography>
                    <Chip
                        label={`${filteredKeys.length} of ${keys.length} keys`}
                        color={filteredKeys.length === keys.length ? 'default' : 'primary'}
                        size="small"
                        sx={{ fontSize: '0.7rem', height: 24 }}
                    />
                    {selectedKeys.size > 0 && (
                        <Chip
                            label={`${selectedKeys.size} selected`}
                            color="secondary"
                            size="small"
                            sx={{ fontSize: '0.7rem', height: 24 }}
                        />
                    )}
                    {hasActiveFilters && (
                        <>
                            <Button
                                size="small"
                                startIcon={<Clear sx={{ fontSize: 14 }} />}
                                onClick={clearKeyFilters}
                                sx={{ fontSize: '0.7rem', py: 0.25, px: 1 }}
                            >
                                Clear Filters
                            </Button>
                            <Button
                                size="small"
                                startIcon={<BookmarkAdd sx={{ fontSize: 14 }} />}
                                onClick={() => setSaveFilterDialogOpen(true)}
                                sx={{ fontSize: '0.7rem', py: 0.25, px: 1 }}
                                color="primary"
                            >
                                Save Filter
                            </Button>
                        </>
                    )}

                    {/* Summary - Aligned to the right */}
                    <Box sx={{ ml: 'auto', display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                        <Divider orientation="vertical" flexItem sx={{ height: 28 }} />
                        <Typography variant="caption" sx={{ fontSize: '0.7rem', fontWeight: 600, color: 'text.secondary' }}>
                            Summary:
                        </Typography>
                        {statusCounts.unreviewed > 0 && (
                            <Chip
                                label={`${statusCounts.unreviewed} Unreviewed`}
                                size="small"
                                sx={{
                                    fontSize: '0.65rem',
                                    height: 22,
                                    bgcolor: 'grey.700',
                                    color: 'white'
                                }}
                            />
                        )}
                        {statusCounts.changes_made > 0 && (
                            <Chip
                                label={`${statusCounts.changes_made} Changes Made`}
                                size="small"
                                sx={{
                                    fontSize: '0.65rem',
                                    height: 22,
                                    bgcolor: 'success.main',
                                    color: 'white'
                                }}
                            />
                        )}
                        {statusCounts.pending_response > 0 && (
                            <Chip
                                label={`${statusCounts.pending_response} Pending`}
                                size="small"
                                sx={{
                                    fontSize: '0.65rem',
                                    height: 22,
                                    bgcolor: 'warning.main',
                                    color: 'white'
                                }}
                            />
                        )}
                        {statusCounts.no_change_req > 0 && (
                            <Chip
                                label={`${statusCounts.no_change_req} No Change`}
                                size="small"
                                sx={{
                                    fontSize: '0.65rem',
                                    height: 22,
                                    bgcolor: 'info.main',
                                    color: 'white'
                                }}
                            />
                        )}
                        {statusCounts.internal_discussion > 0 && (
                            <Chip
                                label={`${statusCounts.internal_discussion} Discussion`}
                                size="small"
                                sx={{
                                    fontSize: '0.65rem',
                                    height: 22,
                                    bgcolor: '#ffc107',
                                    color: 'white'
                                }}
                            />
                        )}
                        {statusCounts.changes_in_progress > 0 && (
                            <Chip
                                label={`${statusCounts.changes_in_progress} In Progress`}
                                size="small"
                                sx={{
                                    fontSize: '0.65rem',
                                    height: 22,
                                    bgcolor: 'grey.600',
                                    color: 'white'
                                }}
                            />
                        )}
                        {statusCounts.value_changed > 0 && (
                            <Chip
                                label={`${statusCounts.value_changed} Val Changed`}
                                size="small"
                                sx={{
                                    fontSize: '0.65rem',
                                    height: 22,
                                    bgcolor: 'error.main',
                                    color: 'white'
                                }}
                            />
                        )}
                        <Chip
                            label={`Total: ${totalModels}`}
                            size="small"
                            sx={{
                                fontSize: '0.65rem',
                                height: 22,
                                fontWeight: 600,
                                bgcolor: 'primary.main',
                                color: 'white'
                            }}
                        />
                    </Box>
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
                                    keyFilters.workAssignment.length +
                                    keyFilters.keyNames.length
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
                        {keyFilters.keyNames.map(keyName => (
                            <Chip
                                key={keyName}
                                label={`Key: ${keyName}`}
                                size="small"
                                onDelete={() => handleKeyFilterChange('keyNames', keyName)}
                                color="success"
                                variant="outlined"
                                sx={{ fontSize: '0.7rem', height: 22 }}
                            />
                        ))}
                    </Box>
                )}

                {/* Additional Controls Row */}
                <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center', mt: 1.5 }}>
                    {/* Expand All / Collapse All Buttons */}
                    <Button
                        size="small"
                        startIcon={<ExpandMore sx={{ fontSize: 14 }} />}
                        onClick={expandAllKeys}
                        variant="outlined"
                        sx={{ fontSize: '0.7rem', py: 0.25, px: 1.5 }}
                    >
                        Expand All
                    </Button>
                    <Button
                        size="small"
                        startIcon={<ExpandLess sx={{ fontSize: 14 }} />}
                        onClick={collapseAllKeys}
                        variant="outlined"
                        sx={{ fontSize: '0.7rem', py: 0.25, px: 1.5 }}
                    >
                        Collapse All
                    </Button>

                    {/* Union of Keys Toggle with Branch Filter */}
                    <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={showUnionKeys}
                                    onChange={(e) => setShowUnionKeys(e.target.checked)}
                                    size="small"
                                    color="primary"
                                />
                            }
                            label={
                                <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                                    Show Union of Keys
                                </Typography>
                            }
                            sx={{ mr: 0 }}
                        />
                        {/* Branch filter button - show when hiding union keys */}
                        {!showUnionKeys && (
                            <Tooltip title="Configure Show/Hide NA items per branch">
                                <IconButton
                                    size="small"
                                    onClick={(e) => setUnionFilterAnchorEl(e.currentTarget)}
                                    sx={{
                                        p: 1.0,
                                        color: Object.values(unionBranchFilters).some(v => v !== 'off') ? 'warning.main' : 'primary.main'
                                    }}
                                >
                                    <Settings sx={{ fontSize: 16 }} />
                                </IconButton>
                            </Tooltip>
                        )}
                        <Popover
                            open={Boolean(unionFilterAnchorEl)}
                            anchorEl={unionFilterAnchorEl}
                            onClose={() => setUnionFilterAnchorEl(null)}
                            anchorOrigin={{
                                vertical: 'bottom',
                                horizontal: 'left',
                            }}
                            transformOrigin={{
                                vertical: 'top',
                                horizontal: 'left',
                            }}
                        >
                            <Box sx={{ p: 2, minWidth: 320 }}>
                                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                                    Show/Hide NA Items in Branch
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                                    Toggle to show only NA items or hide NA items for each branch
                                </Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                    {[
                                        { key: 'target', label: 'Target Branch' },
                                        { key: 'ref1', label: 'Reference 1' },
                                        { key: 'ref2', label: 'Reference 2' },
                                        { key: 'ref3', label: 'Reference 3' }
                                    ].map(({ key, label }) => (
                                        <Box key={key} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <Typography variant="body2" sx={{ fontSize: '0.85rem', minWidth: 100 }}>
                                                {label}
                                            </Typography>
                                            <ToggleButtonGroup
                                                value={unionBranchFilters[key]}
                                                exclusive
                                                onChange={(e, newValue) => {
                                                    if (newValue !== null) {
                                                        setUnionBranchFilters(prev => ({ ...prev, [key]: newValue }));
                                                    }
                                                }}
                                                size="small"
                                                sx={{
                                                    '& .MuiToggleButton-root': {
                                                        py: 0.25,
                                                        px: 1,
                                                        fontSize: '0.7rem',
                                                        textTransform: 'none'
                                                    }
                                                }}
                                            >
                                                <ToggleButton
                                                    value="off"
                                                    sx={{
                                                        '&.Mui-selected': {
                                                            bgcolor: 'grey.200',
                                                            color: 'text.primary'
                                                        }
                                                    }}
                                                >
                                                    Off
                                                </ToggleButton>
                                                <ToggleButton
                                                    value="show"
                                                    sx={{
                                                        '&.Mui-selected': {
                                                            bgcolor: 'success.light',
                                                            color: 'success.contrastText',
                                                            '&:hover': { bgcolor: 'success.main' }
                                                        }
                                                    }}
                                                >
                                                    Show NA
                                                </ToggleButton>
                                                <ToggleButton
                                                    value="hide"
                                                    sx={{
                                                        '&.Mui-selected': {
                                                            bgcolor: 'error.light',
                                                            color: 'error.contrastText',
                                                            '&:hover': { bgcolor: 'error.main' }
                                                        }
                                                    }}
                                                >
                                                    Hide NA
                                                </ToggleButton>
                                            </ToggleButtonGroup>
                                        </Box>
                                    ))}
                                </Box>
                                <Divider sx={{ my: 1.5 }} />
                                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        onClick={() => setUnionBranchFilters({ target: 'off', ref1: 'off', ref2: 'off', ref3: 'off' })}
                                        sx={{ fontSize: '0.7rem' }}
                                    >
                                        Reset All
                                    </Button>
                                </Box>
                            </Box>
                        </Popover>
                    </Box>

                </Box>
            </Paper>
        );
    };

    const renderKeyFiltersDialog = () => {
        const allOwners = getUniqueOwners;
        const allWAs = getUniqueWorkAssignments;
        const allKeyNames = getUniqueKeyNames;
        const allGroups = getUniqueGroups;
        const allStatuses = Object.keys(statusColors);

        const filteredOwners = allOwners.filter(owner =>
            owner.toLowerCase().includes(ownerSearch.toLowerCase())
        );
        const filteredWAs = allWAs.filter(wa =>
            wa.toLowerCase().includes(waSearch.toLowerCase())
        );
        const filteredKeyNames = allKeyNames.filter(keyName =>
            keyName.toLowerCase().includes(keyNamesSearch.toLowerCase())
        );
        const filteredGroups = allGroups.filter(group =>
            group.toLowerCase().includes(groupSearch.toLowerCase())
        );

        const handleSelectAll = (type) => {
            let allValues;
            if (type === 'owner') allValues = allOwners;
            else if (type === 'workAssignment') allValues = allWAs;
            else if (type === 'keyNames') allValues = allKeyNames;
            else if (type === 'groups') allValues = allGroups;
            else if (type === 'status') allValues = allStatuses;
            else allValues = [];

            const currentValues = keyFilters[type];
            const isAllSelected = allValues.length > 0 && allValues.every(value => currentValues.includes(value));

            if (isAllSelected) {
                setKeyFilters(prev => ({ ...prev, [type]: [] }));
            } else {
                setKeyFilters(prev => ({ ...prev, [type]: [...allValues] }));
            }
        };

        const handleDialogClose = () => {
            setKeyFiltersOpen(false);
            setOwnerSearch('');
            setWaSearch('');
            setKeyNamesSearch('');
            setGroupSearch('');
        };

        return (
            <Dialog
                open={keyFiltersOpen}
                onClose={handleDialogClose}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>Filter Keys</DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 1 }}>
                        {/* Saved Filters Section */}
                        {savedFilters.length > 0 && (
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Bookmark sx={{ fontSize: 18 }} />
                                    Saved Filters:
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                    {savedFilters.map(filter => (
                                        <Chip
                                            key={filter.id}
                                            label={filter.name}
                                            onClick={() => handleApplySavedFilter(filter)}
                                            onDelete={(e) => handleDeleteSavedFilter(filter.id, filter.name, e)}
                                            deleteIcon={<Delete sx={{ fontSize: 16 }} />}
                                            sx={{ 
                                                cursor: 'pointer',
                                                '&:hover': { bgcolor: 'primary.light', color: 'primary.contrastText' }
                                            }}
                                            variant="outlined"
                                            color="primary"
                                        />
                                    ))}
                                </Box>
                                <Divider sx={{ my: 2 }} />
                            </Box>
                        )}

                        {/* Status Filter */}
                        <Typography variant="subtitle2" gutterBottom>
                            Filter by Status:
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        size="small"
                                        checked={allStatuses.length > 0 && allStatuses.every(status => keyFilters.status.includes(status))}
                                        indeterminate={allStatuses.some(status => keyFilters.status.includes(status)) && !allStatuses.every(status => keyFilters.status.includes(status))}
                                        onChange={() => handleSelectAll('status')}
                                    />
                                }
                                label="Select All"
                            />
                            <Typography variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>
                                ({keyFilters.status.length} of {allStatuses.length} selected)
                            </Typography>
                        </Box>
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

                        {/* Group Filter */}
                        <Typography variant="subtitle2" gutterBottom>
                            Filter by Group:
                        </Typography>
                        <Box sx={{ mb: 2 }}>
                            <TextField
                                size="small"
                                fullWidth
                                placeholder="Search groups… or paste multiple from Excel"
                                value={groupSearch}
                                onChange={(e) => setGroupSearch(e.target.value)}
                                onPaste={(e) => handlePasteFilter('groups', e)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Search sx={{ fontSize: 16 }} />
                                        </InputAdornment>
                                    ),
                                }}
                                sx={{ mb: 1 }}
                            />
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            size="small"
                                            checked={allGroups.length > 0 && allGroups.every(group => keyFilters.groups.includes(group))}
                                            indeterminate={allGroups.some(group => keyFilters.groups.includes(group)) && !allGroups.every(group => keyFilters.groups.includes(group))}
                                            onChange={() => handleSelectAll('groups')}
                                        />
                                    }
                                    label="Select All"
                                />
                                <Typography variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>
                                    ({keyFilters.groups.length} of {allGroups.length} selected)
                                </Typography>
                            </Box>
                            <Box sx={{ maxHeight: 200, overflowY: 'auto', border: '1px solid #e0e0e0', borderRadius: 1, p: 1 }}>
                                {filteredGroups.map(group => (
                                    <FormControlLabel
                                        key={group}
                                        control={
                                            <Checkbox
                                                size="small"
                                                checked={keyFilters.groups.includes(group)}
                                                onChange={() => handleKeyFilterChange('groups', group)}
                                            />
                                        }
                                        label={group}
                                        sx={{ display: 'block', mb: 0.5 }}
                                    />
                                ))}
                                {filteredGroups.length === 0 && groupSearch && (
                                    <Typography variant="body2" sx={{ p: 1, textAlign: 'center', color: 'text.secondary' }}>
                                        No groups found matching "{groupSearch}"
                                    </Typography>
                                )}
                            </Box>
                        </Box>

                        {/* Owner Filter */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <Typography variant="subtitle2">
                                Filter by Owner:
                            </Typography>
                            <Tooltip title="Tip: Paste multiple owners copied from Excel to select them all at once">
                                <Info sx={{ fontSize: 15, color: 'text.secondary', cursor: 'help' }} />
                            </Tooltip>
                        </Box>
                        <Box sx={{ mb: 2 }}>
                            <TextField
                                size="small"
                                fullWidth
                                placeholder="Search owners… or paste multiple from Excel"
                                value={ownerSearch}
                                onChange={(e) => setOwnerSearch(e.target.value)}
                                onPaste={(e) => handlePasteFilter('owner', e)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Search sx={{ fontSize: 16 }} />
                                        </InputAdornment>
                                    ),
                                }}
                                sx={{ mb: 1 }}
                            />
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            size="small"
                                            checked={allOwners.length > 0 && allOwners.every(owner => keyFilters.owner.includes(owner))}
                                            indeterminate={allOwners.some(owner => keyFilters.owner.includes(owner)) && !allOwners.every(owner => keyFilters.owner.includes(owner))}
                                            onChange={() => handleSelectAll('owner')}
                                        />
                                    }
                                    label="Select All"
                                />
                                <Typography variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>
                                    ({keyFilters.owner.length} of {allOwners.length} selected)
                                </Typography>
                            </Box>
                            <Box sx={{ maxHeight: 200, overflowY: 'auto', border: '1px solid #e0e0e0', borderRadius: 1, p: 1 }}>
                                {filteredOwners.map(owner => (
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
                                        sx={{ display: 'block', mb: 0.5 }}
                                    />
                                ))}
                                {filteredOwners.length === 0 && ownerSearch && (
                                    <Typography variant="body2" sx={{ p: 1, textAlign: 'center', color: 'text.secondary' }}>
                                        No owners found matching "{ownerSearch}"
                                    </Typography>
                                )}
                            </Box>
                        </Box>

                        {/* Work Assignment Filter */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <Typography variant="subtitle2">
                                Filter by Work Assignment:
                            </Typography>
                            <Tooltip title="Tip: Paste multiple WAs copied from Excel to select them all at once">
                                <Info sx={{ fontSize: 15, color: 'text.secondary', cursor: 'help' }} />
                            </Tooltip>
                        </Box>
                        <Box sx={{ mb: 2 }}>
                            <TextField
                                size="small"
                                fullWidth
                                placeholder="Search work assignments… or paste multiple from Excel"
                                value={waSearch}
                                onChange={(e) => setWaSearch(e.target.value)}
                                onPaste={(e) => handlePasteFilter('workAssignment', e)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Search sx={{ fontSize: 16 }} />
                                        </InputAdornment>
                                    ),
                                }}
                                sx={{ mb: 1 }}
                            />
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            size="small"
                                            checked={allWAs.length > 0 && allWAs.every(wa => keyFilters.workAssignment.includes(wa))}
                                            indeterminate={allWAs.some(wa => keyFilters.workAssignment.includes(wa)) && !allWAs.every(wa => keyFilters.workAssignment.includes(wa))}
                                            onChange={() => handleSelectAll('workAssignment')}
                                        />
                                    }
                                    label="Select All"
                                />
                                <Typography variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>
                                    ({keyFilters.workAssignment.length} of {allWAs.length} selected)
                                </Typography>
                            </Box>
                            <Box sx={{ maxHeight: 200, overflowY: 'auto', border: '1px solid #e0e0e0', borderRadius: 1, p: 1 }}>
                                {filteredWAs.map(wa => (
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
                                        sx={{ display: 'block', mb: 0.5 }}
                                    />
                                ))}
                                {filteredWAs.length === 0 && waSearch && (
                                    <Typography variant="body2" sx={{ p: 1, textAlign: 'center', color: 'text.secondary' }}>
                                        No work assignments found matching "{waSearch}"
                                    </Typography>
                                )}
                            </Box>
                        </Box>

                        {/* Key Names Filter */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <Typography variant="subtitle2">
                                Filter by Key Names:
                            </Typography>
                            <Tooltip title="Tip: Copy a column of keys from Excel and paste in the search box below — all matching keys will be selected automatically">
                                <Info sx={{ fontSize: 15, color: 'text.secondary', cursor: 'help' }} />
                            </Tooltip>
                        </Box>
                        <Box sx={{ mb: 2 }}>
                            <TextField
                                size="small"
                                fullWidth
                                placeholder="Search key names… or paste multiple from Excel"
                                value={keyNamesSearch}
                                onChange={(e) => setKeyNamesSearch(e.target.value)}
                                onPaste={(e) => handlePasteFilter('keyNames', e)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Search sx={{ fontSize: 16 }} />
                                        </InputAdornment>
                                    ),
                                    endAdornment: keyFilters.keyNames.length > 0 && (
                                        <InputAdornment position="end">
                                            <Tooltip title="Tip: Paste multiple keys copied from Excel to select them all at once">
                                                <Info sx={{ fontSize: 16, color: 'text.secondary', cursor: 'help' }} />
                                            </Tooltip>
                                        </InputAdornment>
                                    ),
                                }}
                                sx={{ mb: 1 }}
                            />
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            size="small"
                                            checked={allKeyNames.length > 0 && allKeyNames.every(keyName => keyFilters.keyNames.includes(keyName))}
                                            indeterminate={allKeyNames.some(keyName => keyFilters.keyNames.includes(keyName)) && !allKeyNames.every(keyName => keyFilters.keyNames.includes(keyName))}
                                            onChange={() => handleSelectAll('keyNames')}
                                        />
                                    }
                                    label="Select All"
                                />
                                <Typography variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>
                                    ({keyFilters.keyNames.length} of {allKeyNames.length} selected)
                                </Typography>
                            </Box>
                            <Box sx={{ maxHeight: 200, overflowY: 'auto', border: '1px solid #e0e0e0', borderRadius: 1, p: 1 }}>
                                {filteredKeyNames.map(keyName => (
                                    <FormControlLabel
                                        key={keyName}
                                        control={
                                            <Checkbox
                                                size="small"
                                                checked={keyFilters.keyNames.includes(keyName)}
                                                onChange={() => handleKeyFilterChange('keyNames', keyName)}
                                            />
                                        }
                                        label={keyName}
                                        sx={{ display: 'block', mb: 0.5 }}
                                    />
                                ))}
                                {filteredKeyNames.length === 0 && keyNamesSearch && (
                                    <Typography variant="body2" sx={{ p: 1, textAlign: 'center', color: 'text.secondary' }}>
                                        No key names found matching "{keyNamesSearch}"
                                    </Typography>
                                )}
                            </Box>
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ justifyContent: 'space-between' }}>
                    <Button 
                        onClick={() => setSaveFilterDialogOpen(true)} 
                        startIcon={<BookmarkAdd />}
                        disabled={!hasActiveKeyFilters}
                        color="primary"
                    >
                        Save Filter
                    </Button>
                    <Box>
                        <Button onClick={handleDialogClose}>Close</Button>
                        <Button onClick={clearKeyFilters} color="error">Clear All</Button>
                    </Box>
                </DialogActions>
            </Dialog>
        );
    };

    // Bulk action toolbar rendering
    const renderBulkActionToolbar = () => {
        if (selectedKeys.size === 0) return null;

        const selectedCount = selectedKeys.size;
        const totalKeyReviews = selectedKeyReviewIds.length;

        return (
            <Paper
                sx={{
                    p: 1.5,
                    mb: 2,
                    bgcolor: 'background.paper',
                    border: '1px solid #e0e0e0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 2
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Chip
                        label={`${selectedCount} key${selectedCount !== 1 ? 's' : ''} selected (${totalKeyReviews} reviews)`}
                        color="primary"
                        size="small"
                        sx={{ fontWeight: 600 }}
                    />
                    <Button
                        size="small"
                        variant="outlined"
                        onClick={clearSelection}
                        sx={{ fontSize: '0.7rem', py: 0.25, px: 1.5 }}
                    >
                        Clear Selection
                    </Button>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleBulkAction('status')}
                        disabled={!canEditFields()}
                        sx={{ fontSize: '0.7rem', py: 0.25, px: 1.5 }}
                    >
                        Set Status
                    </Button>
                    <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleBulkAction('comment')}
                        disabled={!canEditFields()}
                        sx={{ fontSize: '0.7rem', py: 0.25, px: 1.5 }}
                    >
                        Add Comment
                    </Button>
                    <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleBulkAction('kona')}
                        disabled={!canEditFields()}
                        sx={{ fontSize: '0.7rem', py: 0.25, px: 1.5 }}
                    >
                        Set KONA
                    </Button>
                    <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleBulkAction('cl')}
                        disabled={!canEditFields()}
                        sx={{ fontSize: '0.7rem', py: 0.25, px: 1.5 }}
                    >
                        Set CL
                    </Button>
                    {/* Verify Comments button - only for project admins */}
                    {isProjectAdmin && (
                        <Button
                            size="small"
                            variant="contained"
                            color="success"
                            onClick={() => handleBulkAction('verify')}
                            sx={{ fontSize: '0.7rem', py: 0.25, px: 1.5 }}
                        >
                            Verify Comments
                        </Button>
                    )}
                </Box>
            </Paper>
        );
    };

    // Bulk action dialog rendering - using uncontrolled inputs for better performance
    const renderBulkActionDialog = () => {
        const getDialogTitle = () => {
            switch (bulkActionType) {
                case 'status': return 'Set Status for Selected Keys';
                case 'comment': return 'Add Comment to Selected Keys';
                case 'kona': return 'Set KONA for Selected Keys';
                case 'cl': return 'Set CL for Selected Keys';
                case 'verify': return 'Verify Comments for Selected Keys';
                default: return 'Bulk Action';
            }
        };

        const getDialogContent = () => {
            if (bulkActionType === 'status') {
                return (
                    <FormControl fullWidth sx={{ mt: 2 }}>
                        <InputLabel>Status</InputLabel>
                        <Select
                            value={bulkActionValue}
                            label="Status"
                            onChange={(e) => setBulkActionValue(e.target.value)}
                        >
                            {statusOptions.map(option => (
                                <MenuItem key={option.value} value={option.value}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Box
                                            sx={{
                                                width: 12,
                                                height: 12,
                                                borderRadius: '50%',
                                                backgroundColor: statusColors[option.value]?.color || 'grey'
                                            }}
                                        />
                                        {option.label}
                                    </Box>
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                );
            } else if (bulkActionType === 'comment') {
                return (
                    <TextField
                        fullWidth
                        multiline
                        rows={4}
                        label="Comment"
                        placeholder="Enter comment to add to all selected keys..."
                        inputRef={bulkActionInputRef}
                        defaultValue=""
                        sx={{ mt: 2 }}
                    />
                );
            } else if (bulkActionType === 'verify') {
                return (
                    <Box sx={{ mt: 2 }}>
                        <Alert severity="info">
                            This will verify all pending comments for the selected {selectedKeyReviewIds.length} key review(s).
                            Only pending comments will be affected. Already verified comments will be skipped.
                        </Alert>
                    </Box>
                );
            } else {
                return (
                    <TextField
                        fullWidth
                        label={bulkActionType === 'kona' ? 'KONA ID' : 'CL Number'}
                        placeholder={bulkActionType === 'kona' ? 'Enter KONA ID...' : 'Enter CL number...'}
                        inputRef={bulkActionInputRef}
                        defaultValue=""
                        sx={{ mt: 2 }}
                    />
                );
            }
        };

        return (
            <Dialog
                open={bulkActionDialogOpen}
                onClose={() => setBulkActionDialogOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>{getDialogTitle()}</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary">
                        This action will apply to {selectedKeys.size} key{selectedKeys.size !== 1 ? 's' : ''} ({selectedKeyReviewIds.length} key reviews)
                    </Typography>
                    {getDialogContent()}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setBulkActionDialogOpen(false)}>Cancel</Button>
                    <Button
                        onClick={handleBulkActionSubmit}
                        variant="contained"
                        color={bulkActionType === 'verify' ? 'success' : 'primary'}
                        disabled={bulkActionType === 'status' && !bulkActionValue}
                    >
                        {bulkActionType === 'verify' ? 'Verify All' : 'Apply'}
                    </Button>
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
                const expectedPrefix = `${keyId}-${groupName}-`;
                if (!filterKey.startsWith(expectedPrefix) || !filterValue) return true;
                const column = filterKey.substring(expectedPrefix.length);
                return model[column]?.toString().toLowerCase().includes(filterValue.toLowerCase());
            }) && Object.entries(searchTerms).every(([searchKey, searchTerm]) => {
                const expectedPrefix = `${keyId}-${groupName}-`;
                if (!searchKey.startsWith(expectedPrefix) || !searchTerm) return true;
                const column = searchKey.substring(expectedPrefix.length);
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

    // Loading state
    if (loading) {
        return (
            <Container maxWidth="xl">
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                    <CircularProgress size={40} />
                    <Typography variant="h6" sx={{ ml: 2 }}>Loading project data...</Typography>
                </Box>
            </Container>
        );
    }

    // Error state
    if (error) {
        return (
            <Container maxWidth="xl">
                <Box sx={{ mt: 3, textAlign: 'center' }}>
                    <Typography variant="h6" color="error" gutterBottom>
                        Error loading project data
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                        {error}
                    </Typography>
                    <Button variant="contained" onClick={() => navigate('/dashboard')}>
                        Back to Dashboard
                    </Button>
                </Box>
            </Container>
        );
    }

    // No project found
    if (!project) {
        return (
            <Container maxWidth="xl">
                <Box sx={{ mt: 3, textAlign: 'center' }}>
                    <Typography variant="h6" gutterBottom>
                        Project not found
                    </Typography>
                    <Button variant="contained" onClick={() => navigate('/dashboard')}>
                        Back to Dashboard
                    </Button>
                </Box>
            </Container>
        );
    }

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
                                {project.title || project.project_title || project.name || 'Project Key Review'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                                {project.description || project.project_description || 'Review and manage FMS key values'}
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexShrink: 0 }}>
                            <Chip
                                label={`${keys.length} Keys`}
                                color="primary"
                                variant="outlined"
                                size="small"
                                sx={{ fontSize: '0.75rem', height: 28 }}
                            />
                            <Chip
                                label={`Project ID: ${project.project_id}`}
                                color="primary"
                                variant="outlined"
                                size="small"
                                sx={{ fontSize: '0.75rem', height: 28 }}
                            />
                            <Button
                                variant="contained"
                                startIcon={<Info />}
                                onClick={() => setProjectInfoOpen(true)}
                                size="small"
                                sx={{
                                    fontSize: '0.8rem',
                                    height: 32,
                                    px: 1,
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                Project Info
                            </Button>
                            <Button
                                variant="contained"
                                startIcon={<Download />}
                                onClick={handleDownloadExcel}
                                size="small"
                                color="success"
                                sx={{
                                    fontSize: '0.8rem',
                                    height: 32,
                                    px: 1.5,
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                Download Data
                            </Button>
                            {canManageUsers() && (
                                <Button
                                    variant="contained"
                                    startIcon={<ManageAccounts />}
                                    onClick={handleProjectUserManagement}
                                    size="small"
                                    sx={{
                                        fontSize: '0.8rem',
                                        height: 32,
                                        px: 2,
                                        whiteSpace: 'nowrap'
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

                {/* Bulk Action Toolbar */}
                {renderBulkActionToolbar()}

                {/* Pagination Info */}
                {getFilteredAndSortedKeys.length > itemsPerPage && (
                    <Paper sx={{ p: 2, mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                            Showing {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, getFilteredAndSortedKeys.length)} of {getFilteredAndSortedKeys.length} keys
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Button
                                size="small"
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(prev => prev - 1)}
                            >
                                Previous
                            </Button>
                            <Typography variant="body2">
                                Page {currentPage} of {totalPages}
                            </Typography>
                            <Button
                                size="small"
                                disabled={currentPage >= totalPages}
                                onClick={() => setCurrentPage(prev => prev + 1)}
                            >
                                Next
                            </Button>
                        </Box>
                    </Paper>
                )}

                {/* Keys List */}
                <Box sx={{ mb: 2 }}>
                    {keys.length > 0 ? paginatedKeys.map((keyData) => (
                        <Card
                            key={keyData.id}
                            sx={{
                                mb: 1.5,
                                border: selectedKeys.has(keyData.id) ? '2px solid' : '1px solid #e0e0e0',
                                borderColor: selectedKeys.has(keyData.id) ? 'primary.main' : '#e0e0e0',
                                bgcolor: selectedKeys.has(keyData.id) ? 'primary.50' : 'background.paper'
                            }}
                        >
                            <CardHeader
                                avatar={
                                    <Checkbox
                                        checked={selectedKeys.has(keyData.id)}
                                        onChange={(e) => handleKeySelection(keyData.id, e)}
                                        onClick={(e) => e.stopPropagation()}
                                        size="small"
                                        sx={{ p: 0.5 }}
                                    />
                                }
                                title={renderKeyHeader(keyData)}
                                action={
                                    <IconButton onClick={(e) => { e.stopPropagation(); toggleKeyExpansion(keyData.id); }} size="small" sx={{ mt: 1 }}>
                                        {expandedKeys[keyData.id] ? <ExpandLess /> : <ExpandMore />}
                                    </IconButton>
                                }
                                onClick={() => toggleKeyExpansion(keyData.id)}
                                sx={{
                                    pb: 0,
                                    pt: 0,
                                    cursor: 'pointer',
                                    '&:hover': {
                                        backgroundColor: 'rgba(0, 0, 0, 0.04)'
                                    },
                                    transition: 'background-color 0.2s ease'
                                }}
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
                                                        <IconButton onClick={(e) => { e.stopPropagation(); toggleGroupExpansion(keyData.id, group.groupName); }} size="small">
                                                            {expandedGroups[groupKey] ? <ExpandLess /> : <ExpandMore />}
                                                        </IconButton>
                                                    }
                                                    onClick={() => toggleGroupExpansion(keyData.id, group.groupName)}
                                                    sx={{
                                                        py: 1,
                                                        cursor: 'pointer',
                                                        '&:hover': {
                                                            backgroundColor: 'rgba(0, 0, 0, 0.04)'
                                                        },
                                                        transition: 'background-color 0.2s ease'
                                                    }}
                                                />

                                                <Collapse in={expandedGroups[groupKey]} timeout="auto" unmountOnExit>
                                                    <CardContent sx={{ pt: 0, pb: 1 }}>
                                                        <TableContainer>
                                                            <Table size="small">
                                                                <TableHead>
                                                                    <TableRow>
                                                                        {renderTableHeader('model', 'Model', keyData.id, group.groupName, group.models)}
                                                                        {(() => {
                                                                            const branchNames = getGroupBranchNames(group.groupName);
                                                                            console.log(`🔍 Rendering headers for group "${group.groupName}":`, branchNames);
                                                                            console.log(`🔍 Branch entries:`, Object.entries(branchNames || {}));
                                                                            return Object.entries(branchNames).map(([branch, branchName]) => {
                                                                                console.log(`🔍 Rendering header for branch "${branch}": "${branchName}"`);
                                                                                return renderBranchHeader(branch, branchName, keyData.id, group.groupName, group.models);
                                                                            });
                                                                        })()}
                                                                        {renderTableHeader('status', 'Status', keyData.id, group.groupName, group.models)}
                                                                        {renderTableHeader('comment', 'Comment', keyData.id, group.groupName, group.models)}
                                                                        {renderTableHeader('kona', 'KONA', keyData.id, group.groupName, group.models)}
                                                                        {renderTableHeader('cl', 'CL', keyData.id, group.groupName, group.models)}
                                                                    </TableRow>
                                                                </TableHead>
                                                                <TableBody>
                                                                    {getFilteredModels(group.models, keyData.id, group.groupName).map((model, modelIndex) => {
                                                                        // Find the original index for proper editing
                                                                        const originalIndex = group.models.findIndex(m => m === model);
                                                                        const branchNamesForModel = getGroupBranchNames(group.groupName);
                                                                        console.log(`🔍 Rendering model row ${modelIndex} for key ${keyData.id}, group "${group.groupName}"`);
                                                                        console.log(`🔍 Model:`, model.model_name || model.model);
                                                                        console.log(`🔍 Branch names for model:`, branchNamesForModel);
                                                                        return renderModelRow(keyData.id, group.groupName, model, originalIndex, branchNamesForModel, keyData.keyName, keyData.description);
                                                                    })}
                                                                    {getFilteredModels(group.models, keyData.id, group.groupName).length === 0 && (
                                                                        <TableRow>
                                                                            <TableCell
                                                                                colSpan={6 + Object.keys(getGroupBranchNames(group.groupName)).length}
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
                    )) : (
                        <Paper sx={{ p: 4, textAlign: 'center' }}>
                            <Typography variant="h6" color="text.secondary" gutterBottom>
                                No Key Reviews Available
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                This project doesn't have any key review data yet.
                            </Typography>
                        </Paper>
                    )}

                    {/* No Keys Message */}
                    {keys.length > 0 && getFilteredAndSortedKeys.length === 0 && (
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

                {/* Bottom Pagination */}
                {getFilteredAndSortedKeys.length > itemsPerPage && (
                    <Paper sx={{ p: 2, mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                            Showing {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, getFilteredAndSortedKeys.length)} of {getFilteredAndSortedKeys.length} keys
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Button
                                size="small"
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(prev => prev - 1)}
                            >
                                Previous
                            </Button>
                            <Typography variant="body2">
                                Page {currentPage} of {totalPages}
                            </Typography>
                            <Button
                                size="small"
                                disabled={currentPage >= totalPages}
                                onClick={() => setCurrentPage(prev => prev + 1)}
                            >
                                Next
                            </Button>
                        </Box>
                    </Paper>
                )}

                {/* Filter Dialog */}
                {renderKeyFiltersDialog()}

                {/* Save Filter Dialog */}
                <Dialog
                    open={saveFilterDialogOpen}
                    onClose={() => {
                        setSaveFilterDialogOpen(false);
                        setNewFilterName('');
                    }}
                    maxWidth="xs"
                    fullWidth
                >
                    <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <BookmarkAdd color="primary" />
                        Save Current Filter
                    </DialogTitle>
                    <DialogContent>
                        <Box sx={{ mt: 1 }}>
                            <TextField
                                autoFocus
                                fullWidth
                                label="Filter Name"
                                placeholder="e.g., My Review Filters"
                                value={newFilterName}
                                onChange={(e) => setNewFilterName(e.target.value)}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') handleSaveFilter();
                                }}
                            />
                            <Typography variant="caption" sx={{ mt: 2, display: 'block', color: 'text.secondary' }}>
                                This will save your current filter selections:
                            </Typography>
                            <Box sx={{ mt: 1, pl: 1 }}>
                                {keyFilters.status.length > 0 && (
                                    <Typography variant="caption" display="block">
                                        • Status: {keyFilters.status.length} selected
                                    </Typography>
                                )}
                                {keyFilters.groups.length > 0 && (
                                    <Typography variant="caption" display="block">
                                        • Groups: {keyFilters.groups.length} selected
                                    </Typography>
                                )}
                                {keyFilters.owner.length > 0 && (
                                    <Typography variant="caption" display="block">
                                        • Owners: {keyFilters.owner.length} selected
                                    </Typography>
                                )}
                                {keyFilters.workAssignment.length > 0 && (
                                    <Typography variant="caption" display="block">
                                        • Work Assignments: {keyFilters.workAssignment.length} selected
                                    </Typography>
                                )}
                                {keyFilters.keyNames.length > 0 && (
                                    <Typography variant="caption" display="block">
                                        • Key Names: {keyFilters.keyNames.length} selected
                                    </Typography>
                                )}
                            </Box>
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => {
                            setSaveFilterDialogOpen(false);
                            setNewFilterName('');
                        }}>
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleSaveFilter} 
                            variant="contained"
                            disabled={!newFilterName.trim()}
                        >
                            Save Filter
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Bulk Action Dialog */}
                {renderBulkActionDialog()}

                {/* Project Info Dialog */}
                <Dialog
                    open={projectInfoOpen}
                    onClose={() => setProjectInfoOpen(false)}
                    maxWidth="lg"
                    fullWidth
                >
                    <DialogTitle>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <AccountTree color="primary" />
                            <Typography variant="h6">Project Information</Typography>
                        </Box>
                    </DialogTitle>
                    <DialogContent>
                        {project && (
                            <Box sx={{ mt: 2 }}>
                                {/* Project Details */}
                                <Paper sx={{ p: 2, mb: 3 }}>
                                    <Typography variant="h6" gutterBottom>
                                        Project Details
                                    </Typography>
                                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
                                        <Box>
                                            <Typography variant="body2" color="text.secondary">Title:</Typography>
                                            <Typography variant="body1">{project.title}</Typography>
                                        </Box>
                                        <Box>
                                            <Typography variant="body2" color="text.secondary">Admin:</Typography>
                                            <Typography variant="body1">{project.admin_name}</Typography>
                                        </Box>
                                        <Box>
                                            <Typography variant="body2" color="text.secondary">Status:</Typography>
                                            <Chip
                                                label={project.status}
                                                size="small"
                                                sx={{
                                                    bgcolor:
                                                        project.status === 'active' ? 'success.main' :
                                                            project.status === 'syncing' ? 'info.main' :
                                                                project.status === 'sync error' ? 'error.main' : 'default',
                                                    color: 'common.white'
                                                }}
                                            />
                                        </Box>
                                        <Box>
                                            <Typography variant="body2" color="text.secondary">Created:</Typography>
                                            <Typography variant="body1">
                                                {new Date(project.created_date).toLocaleDateString()}
                                            </Typography>
                                        </Box>
                                    </Box>
                                    {project.description && (
                                        <Box sx={{ mt: 2 }}>
                                            <Typography variant="body2" color="text.secondary">Description:</Typography>
                                            <Typography variant="body1">{project.description}</Typography>
                                        </Box>
                                    )}

                                    {/* Official Project Info */}
                                    {project.is_official && (
                                        <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid #e0e0e0' }}>
                                            <Typography variant="subtitle1" fontWeight="bold" color="primary" gutterBottom>
                                                Official Project Details
                                            </Typography>
                                            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
                                                <Box>
                                                    <Typography variant="body2" color="text.secondary">SWPLM Project Name:</Typography>
                                                    <Typography variant="body1">{project.swplm_project_name || 'N/A'}</Typography>
                                                </Box>
                                                <Box>
                                                    <Typography variant="body2" color="text.secondary">Target Completion Date:</Typography>
                                                    <Typography variant="body1">
                                                        {project.target_completion_date
                                                            ? new Date(project.target_completion_date).toLocaleDateString()
                                                            : 'N/A'}
                                                    </Typography>
                                                </Box>
                                                <Box>
                                                    <Typography variant="body2" color="text.secondary">Project Lead (PL):</Typography>
                                                    <Chip
                                                        label={project.project_lead_name || project.project_lead_username || 'N/A'}
                                                        size="small"
                                                        color="success"
                                                        sx={{ mt: 0.5 }}
                                                    />
                                                </Box>
                                                <Box>
                                                    <Typography variant="body2" color="text.secondary">Project Manager (PM):</Typography>
                                                    <Chip
                                                        label={project.project_manager_name || project.project_manager_username || 'N/A'}
                                                        size="small"
                                                        color="secondary"
                                                        sx={{ mt: 0.5 }}
                                                    />
                                                </Box>
                                                <Box>
                                                    <Typography variant="body2" color="text.secondary">PM Approval Status:</Typography>
                                                    <Chip
                                                        label={
                                                            project.pm_approval_status === 'not_submitted' ? 'Not Submitted' :
                                                                project.pm_approval_status === 'pending' ? 'Awaiting PM Approval' :
                                                                    project.pm_approval_status === 'approved' ? 'Approved by PM' :
                                                                        project.pm_approval_status === 'rejected' ? 'Rejected by PM' : 'Unknown'
                                                        }
                                                        size="small"
                                                        color={
                                                            project.pm_approval_status === 'approved' ? 'success' :
                                                                project.pm_approval_status === 'rejected' ? 'error' :
                                                                    project.pm_approval_status === 'pending' ? 'warning' : 'default'
                                                        }
                                                        sx={{ mt: 0.5 }}
                                                    />
                                                </Box>
                                            </Box>
                                        </Box>
                                    )}
                                </Paper>

                                {/* Groups and Models */}
                                <Paper sx={{ p: 2 }}>
                                    <Typography variant="h6" gutterBottom>
                                        Groups and Models Configuration
                                    </Typography>
                                    {project.groups?.map((group, index) => (
                                        <Card key={index} sx={{ mb: 2, border: '1px solid #e0e0e0' }}>
                                            <CardHeader
                                                title={
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                        <Typography variant="h6">{group.name}</Typography>
                                                        <Chip
                                                            label={group.comparison_type}
                                                            color="secondary"
                                                            size="small"
                                                        />
                                                        <Chip
                                                            label={`${group.models?.length || 0} models`}
                                                            size="small"
                                                            variant="outlined"
                                                        />
                                                    </Box>
                                                }
                                                subheader={
                                                    <Box sx={{ mt: 1 }}>
                                                        <Typography variant="body2" color="text.secondary" gutterBottom>
                                                            Branches:
                                                        </Typography>
                                                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                                            {group.target_branch_name && (
                                                                <Chip
                                                                    label={`Target: ${group.target_branch_name}`}
                                                                    size="small"
                                                                    color="primary"
                                                                    variant="outlined"
                                                                />
                                                            )}
                                                            {group.ref1_branch_name && (
                                                                <Chip
                                                                    label={`Ref1: ${group.ref1_branch_name}`}
                                                                    size="small"
                                                                    color="primary"
                                                                    variant="outlined"
                                                                />
                                                            )}
                                                            {group.ref2_branch_name && (
                                                                <Chip
                                                                    label={`Ref2: ${group.ref2_branch_name}`}
                                                                    size="small"
                                                                    color="primary"
                                                                    variant="outlined"
                                                                />
                                                            )}
                                                            {group.ref3_branch_name && (
                                                                <Chip
                                                                    label={`Ref3: ${group.ref3_branch_name}`}
                                                                    size="small"
                                                                    color="primary"
                                                                    variant="outlined"
                                                                />
                                                            )}
                                                        </Box>
                                                    </Box>
                                                }
                                            />
                                            <CardContent sx={{ pt: 0 }}>
                                                {group.models && group.models.length > 0 ? (
                                                    <Box>
                                                        <Typography variant="body2" color="text.secondary" gutterBottom>
                                                            Model Combinations:
                                                        </Typography>
                                                        <TableContainer>
                                                            <Table size="small">
                                                                <TableHead>
                                                                    <TableRow>
                                                                        <TableCell>Target Model</TableCell>
                                                                        {group.comparison_type === '2-way' && <TableCell>Reference Model</TableCell>}
                                                                        {group.comparison_type !== '2-way' && <TableCell>Ref1 Model</TableCell>}
                                                                        {(group.comparison_type === '3-way' || group.comparison_type === '4-way' || group.comparison_type === '2-way-vs-2-way' || group.comparison_type === '2-way vs 2-way') && <TableCell>Ref2 Model</TableCell>}
                                                                        {(group.comparison_type === '4-way' || group.comparison_type === '2-way-vs-2-way' || group.comparison_type === '2-way vs 2-way') && <TableCell>Ref3 Model</TableCell>}
                                                                    </TableRow>
                                                                </TableHead>
                                                                <TableBody>
                                                                    {group.models.map((model, modelIndex) => (
                                                                        <TableRow key={modelIndex}>
                                                                            <TableCell>
                                                                                <Chip
                                                                                    label={model.target}
                                                                                    size="small"
                                                                                    variant="outlined"
                                                                                />
                                                                            </TableCell>
                                                                            {group.comparison_type === '2-way' && (
                                                                                <TableCell>
                                                                                    <Chip
                                                                                        label={model.reference}
                                                                                        size="small"
                                                                                        variant="outlined"
                                                                                    />
                                                                                </TableCell>
                                                                            )}
                                                                            {group.comparison_type !== '2-way' && (
                                                                                <TableCell>
                                                                                    <Chip
                                                                                        label={model.reference1}
                                                                                        size="small"
                                                                                        variant="outlined"
                                                                                    />
                                                                                </TableCell>
                                                                            )}
                                                                            {(group.comparison_type === '3-way' || group.comparison_type === '4-way' || group.comparison_type === '2-way-vs-2-way' || group.comparison_type === '2-way vs 2-way') && (
                                                                                <TableCell>
                                                                                    <Chip
                                                                                        label={model.reference2}
                                                                                        size="small"
                                                                                        variant="outlined"
                                                                                    />
                                                                                </TableCell>
                                                                            )}
                                                                            {(group.comparison_type === '4-way' || group.comparison_type === '2-way-vs-2-way' || group.comparison_type === '2-way vs 2-way') && (
                                                                                <TableCell>
                                                                                    <Chip
                                                                                        label={model.reference3}
                                                                                        size="small"
                                                                                        variant="outlined"
                                                                                    />
                                                                                </TableCell>
                                                                            )}
                                                                        </TableRow>
                                                                    ))}
                                                                </TableBody>
                                                            </Table>
                                                        </TableContainer>
                                                    </Box>
                                                ) : (
                                                    <Typography variant="body2" color="text.secondary">
                                                        No models configured for this group.
                                                    </Typography>
                                                )}
                                            </CardContent>
                                        </Card>
                                    ))}
                                    {(!project.groups || project.groups.length === 0) && (
                                        <Typography variant="body2" color="text.secondary">
                                            No groups configured for this project.
                                        </Typography>
                                    )}
                                </Paper>
                            </Box>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setProjectInfoOpen(false)} variant="contained">
                            Close
                        </Button>
                    </DialogActions>
                </Dialog>

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
                    <DialogActions sx={{ justifyContent: 'space-between', px: 3, py: 2 }}>
                        {/* Left side - Apply to Group button */}
                        <Button
                            onClick={handleApplyToGroup}
                            startIcon={<GroupWork />}
                            size="small"
                            variant="outlined"
                            color="secondary"
                        >
                            Apply to Group
                        </Button>

                        {/* Right side - Cancel and Save buttons */}
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button onClick={() => setEditDialogOpen(false)} size="small">
                                Cancel
                            </Button>
                            <Button variant="contained" onClick={handleSaveEdit} startIcon={<Save />} size="small">
                                Save
                            </Button>
                        </Box>
                    </DialogActions>
                </Dialog>

                {/* Comment Dialog */}
                <CommentDialog
                    open={commentDialogOpen}
                    onClose={handleCommentDialogClose}
                    keyReviewId={selectedKeyReview}
                    keyName={selectedKeyName}
                    groupName={selectedGroupName}
                    groupKeyReviewIds={selectedGroupKeyReviewIds}
                    onCommentAdded={loadProjectData}
                    isProjectAdmin={isProjectAdmin}
                />

                {/* Key Description Popover */}
                <Popover
                    open={Boolean(descriptionAnchorEl)}
                    anchorEl={descriptionAnchorEl}
                    onClose={() => setDescriptionAnchorEl(null)}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                    transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                    slotProps={{ paper: { sx: { maxWidth: 360, borderRadius: 2, boxShadow: 4 } } }}
                >
                    <Box sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Info sx={{ fontSize: 16, color: 'primary.main' }} />
                            <Typography variant="subtitle2" fontWeight={600} color="primary.main">
                                Key Description
                            </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                            {descriptionText}
                        </Typography>
                    </Box>
                </Popover>

                {/* AI Summary Popover */}
                <Popover
                    open={Boolean(aiSummaryAnchorEl)}
                    anchorEl={aiSummaryAnchorEl}
                    onClose={() => { setAiSummaryAnchorEl(null); setAiSummaryPopoverId(null); }}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                    transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                    slotProps={{ paper: { sx: { maxWidth: 420, borderRadius: 2, boxShadow: 4, overflow: 'hidden' } } }}
                >
                    {(() => {
                        const aiState = aiSummaryPopoverId ? aiSummaryStates[aiSummaryPopoverId] : null;
                        const isLoading = aiState?.status === 'loading';
                        return (
                            <Box>
                                {/* Header */}
                                <Box sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    px: 2,
                                    py: 1,
                                    borderBottom: '1px solid',
                                    borderColor: 'divider'
                                }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                                        <img
                                            src={isLoading ? '/ai-loading-svg-animated.svg' : '/ai-loading-svg-normal.svg'}
                                            width="42"
                                            height="42"
                                            alt=""
                                            style={{ display: 'block', flexShrink: 0 }}
                                        />
                                        <Typography variant="subtitle2" fontWeight={600} color="text.primary">
                                            AI Summary of Differences
                                        </Typography>
                                    </Box>
                                    <Tooltip title="Regenerate summary" placement="top">
                                        <span>
                                            <IconButton
                                                size="small"
                                                onClick={handleAIRegenerate}
                                                disabled={isLoading}
                                                sx={{
                                                    ml: 1,
                                                    opacity: isLoading ? 0.4 : 0.75,
                                                    '&:hover': { opacity: 1, bgcolor: 'action.hover' }
                                                }}
                                            >
                                                <Replay fontSize="small" />
                                            </IconButton>
                                        </span>
                                    </Tooltip>
                                </Box>

                                {/* Body */}
                                <Box sx={{ p: 2 }}>
                                    {isLoading && (
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1 }}>
                                            <CircularProgress size={18} sx={{ color: '#9b59b6' }} />
                                            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                                Generating summary…
                                            </Typography>
                                        </Box>
                                    )}
                                    {aiState?.status === 'done' && (
                                        <Box sx={{ pt: 0.5 }}>
                                            {renderMarkdown(aiState.summary)}
                                        </Box>
                                    )}
                                    {aiState?.status === 'error' && (
                                        <Alert severity="error" sx={{ py: 0.5 }}>
                                            {aiState.error}
                                        </Alert>
                                    )}
                                </Box>
                            </Box>
                        );
                    })()}
                </Popover>
            </Box>
        </Container>
    );
};

export default KeyReview; 

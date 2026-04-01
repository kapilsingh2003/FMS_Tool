// Key Review Routes - Samsung FMS Portal
const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const KeyReview = require('../models/KeyReview');
const Project = require('../models/Project');
const { authenticateToken } = require('./auth');
const router = express.Router();


// Apply authentication middleware to all routes
router.use(authenticateToken);

// GET /api/keyreviews/project/:projectId - Get all key reviews for a project
router.get('/project/:projectId', async (req, res) => {
    try {
        const projectId = req.params.projectId;

        // Check if user has access to this project
        const hasAccess = await Project.hasAccess(projectId, req.user.username);
        if (!hasAccess) {
            return res.status(403).json({
                success: false,
                message: 'Access denied to this project'
            });
        }

        const reviews = await KeyReview.getHierarchicalDataWithComments(projectId);

        res.json({
            success: true,
            reviews
        });
    } catch (error) {
        console.error('Get project key reviews error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch key reviews'
        });
    }
});

// GET /api/keyreviews/group/:groupId - Get key reviews for a specific group
router.get('/group/:groupId', async (req, res) => {
    try {
        const groupId = req.params.groupId;

        // TODO: Add group access validation
        const reviews = await KeyReview.getByGroup(groupId);

        res.json({
            success: true,
            reviews
        });
    } catch (error) {
        console.error('Get group key reviews error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch group key reviews'
        });
    }
});

// POST /api/keyreviews - Create or update a key review
router.post('/', async (req, res) => {
    try {
        const {
            fms_key_id,
            gm_id,
            group_id,
            target_val,
            ref1_val,
            ref2_val,
            ref3_val,
            comment,
            status,
            kona_ids,
            cl_numbers
        } = req.body;

        // Validate required fields
        if (!fms_key_id || !gm_id || !group_id) {
            return res.status(400).json({
                success: false,
                message: 'FMS Key ID, gm_id and group_id are required'
            });
        }

        // Only reviewers and admins can create/update reviews
        if (req.user.role === 'viewer') {
            return res.status(403).json({
                success: false,
                message: 'Viewers cannot modify key reviews'
            });
        }

        const reviewData = {
            fms_key_id,
            gm_id,
            group_id,
            target_val,
            ref1_val,
            ref2_val,
            ref3_val,
            comment,
            status: status || 'unreviewed',
            kona_ids,
            cl_numbers,
            reviewed_by_username: req.user.username
        };

        const review = await KeyReview.upsert(reviewData);

        res.json({
            success: true,
            message: 'Key review saved successfully',
            review
        });
    } catch (error) {
        console.error('Create/update key review error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to save key review'
        });
    }
});

// PUT /api/keyreviews/:reviewId/status - Update review status
router.put('/:reviewId/status', async (req, res) => {
    try {
        const reviewId = req.params.reviewId;
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({
                success: false,
                message: 'Status is required'
            });
        }

        // Only reviewers and admins can update status
        if (req.user.role === 'viewer') {
            return res.status(403).json({
                success: false,
                message: 'Viewers cannot modify review status'
            });
        }

        await KeyReview.updateStatus(reviewId, status, req.user.username);

        res.json({
            success: true,
            message: 'Review status updated successfully'
        });
    } catch (error) {
        console.error('Update review status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update review status'
        });
    }
});

// PUT /api/keyreviews/:reviewId/values - Update review values
router.put('/:reviewId/values', async (req, res) => {
    try {
        const reviewId = req.params.reviewId;
        const { target_val, ref1_val, ref2_val, ref3_val } = req.body;

        // Only reviewers and admins can update values
        if (req.user.role === 'viewer') {
            return res.status(403).json({
                success: false,
                message: 'Viewers cannot modify review values'
            });
        }

        const values = { target_val, ref1_val, ref2_val, ref3_val };
        await KeyReview.updateValues(reviewId, values);

        res.json({
            success: true,
            message: 'Review values updated successfully'
        });
    } catch (error) {
        console.error('Update review values error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update review values'
        });
    }
});

// PUT /api/keyreviews/:reviewId/comment - Update review comment
router.put('/:reviewId/comment', async (req, res) => {
    try {
        const reviewId = req.params.reviewId;
        const { comment } = req.body;

        // Only reviewers and admins can update comments
        if (req.user.role === 'viewer') {
            return res.status(403).json({
                success: false,
                message: 'Viewers cannot modify review comments'
            });
        }

        await KeyReview.updateComment(reviewId, comment, req.user.username);

        res.json({
            success: true,
            message: 'Review comment updated successfully'
        });
    } catch (error) {
        console.error('Update review comment error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update review comment'
        });
    }
});

// PUT /api/keyreviews/:reviewId/kona - Update KONA IDs
router.put('/:reviewId/kona', async (req, res) => {
    try {
        const reviewId = req.params.reviewId;
        const { kona_ids } = req.body;

        // Only reviewers and admins can update KONA IDs
        if (req.user.role === 'viewer') {
            return res.status(403).json({
                success: false,
                message: 'Viewers cannot modify KONA IDs'
            });
        }

        await KeyReview.updateKonaIds(reviewId, kona_ids, req.user.username);

        res.json({
            success: true,
            message: 'KONA IDs updated successfully'
        });
    } catch (error) {
        console.error('Update KONA IDs error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update KONA IDs'
        });
    }
});

// PUT /api/keyreviews/:reviewId/cl - Update CL numbers
router.put('/:reviewId/cl', async (req, res) => {
    try {
        const reviewId = req.params.reviewId;
        const { cl_numbers } = req.body;

        // Only reviewers and admins can update CL numbers
        if (req.user.role === 'viewer') {
            return res.status(403).json({
                success: false,
                message: 'Viewers cannot modify CL numbers'
            });
        }

        await KeyReview.updateClNumbers(reviewId, cl_numbers, req.user.username);

        res.json({
            success: true,
            message: 'CL numbers updated successfully'
        });
    } catch (error) {
        console.error('Update CL numbers error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update CL numbers'
        });
    }
});

// DELETE /api/keyreviews/:reviewId - Delete a key review
router.delete('/:reviewId', async (req, res) => {
    try {
        const reviewId = req.params.reviewId;

        // Only admins can delete reviews
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Only admins can delete key reviews'
            });
        }

        await KeyReview.delete(reviewId);

        res.json({
            success: true,
            message: 'Key review deleted successfully'
        });
    } catch (error) {
        console.error('Delete key review error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete key review'
        });
    }
});

// GET /api/keyreviews/project/:projectId/stats - Get review statistics for project
router.get('/project/:projectId/stats', async (req, res) => {
    try {
        const projectId = req.params.projectId;

        // Check if user has access to this project
        const hasAccess = await Project.hasAccess(projectId, req.user.username);
        if (!hasAccess) {
            return res.status(403).json({
                success: false,
                message: 'Access denied to this project'
            });
        }

        const stats = await KeyReview.getProjectStats(projectId);

        res.json({
            success: true,
            stats
        });
    } catch (error) {
        console.error('Get project review stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch review statistics'
        });
    }
});

// GET /api/keyreviews/project/:projectId/activity - Get recent review activity
router.get('/project/:projectId/activity', async (req, res) => {
    try {
        const projectId = req.params.projectId;
        const limit = parseInt(req.query.limit) || 10;

        // Check if user has access to this project
        const hasAccess = await Project.hasAccess(projectId, req.user.username);
        if (!hasAccess) {
            return res.status(403).json({
                success: false,
                message: 'Access denied to this project'
            });
        }

        const activity = await KeyReview.getRecentActivity(projectId, limit);

        res.json({
            success: true,
            activity
        });
    } catch (error) {
        console.error('Get project review activity error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch review activity'
        });
    }
});

// GET /api/keyreviews/all-comments - Get all keys with VERIFIED comments across all projects
// This endpoint is accessible to all authenticated users (read-only access)
router.get('/all-comments', async (req, res) => {
    try {
        const { executeQuery } = require('../config/database');

        // Get all key reviews that have at least one VERIFIED comment, grouped by key
        const query = `
            SELECT DISTINCT
                fk.fms_key_id,
                fk.key_name,
                fk.work_assignment,
                fk.work_assignment_owner,
                fk.description
            FROM FMS_Keys fk
            INNER JOIN Key_Reviews kr ON fk.fms_key_id = kr.fms_key_id
            INNER JOIN Comments c ON kr.key_review_id = c.key_review_id
            WHERE c.verification_status = 'verified'
            ORDER BY fk.key_name ASC
        `;

        const keysWithComments = await executeQuery(query);

        // For each key, get all the reviews with comments
        const result = [];

        for (const key of keysWithComments) {
            const reviewsQuery = `
                SELECT 
                    kr.key_review_id,
                    kr.status,
                    kr.target_val,
                    kr.ref1_val,
                    kr.ref2_val,
                    kr.ref3_val,
                    g.name as group_name,
                    g.comparison_type,
                    p.project_id,
                    p.title as project_title,
                    target_m.model_name as target_model_name,
                    ref1_m.model_name as ref1_model_name,
                    ref2_m.model_name as ref2_model_name,
                    ref3_m.model_name as ref3_model_name,
                    target_b.branch_name as target_branch_name,
                    ref1_b.branch_name as ref1_branch_name,
                    ref2_b.branch_name as ref2_branch_name,
                    ref3_b.branch_name as ref3_branch_name,
                    (SELECT COUNT(*) FROM Comments WHERE key_review_id = kr.key_review_id AND verification_status = 'verified') as comment_count,
                    (SELECT comment_text FROM Comments WHERE key_review_id = kr.key_review_id AND verification_status = 'verified' ORDER BY created_at DESC LIMIT 1) as latest_comment
                FROM Key_Reviews kr
                INNER JOIN grps g ON kr.group_id = g.group_id
                INNER JOIN Projects p ON g.project_id = p.project_id
                INNER JOIN Group_Model_Mapping gmm ON kr.gm_id = gmm.gm_id
                LEFT JOIN Models target_m ON gmm.target_model_id = target_m.model_id
                LEFT JOIN Models ref1_m ON gmm.ref1_model_id = ref1_m.model_id
                LEFT JOIN Models ref2_m ON gmm.ref2_model_id = ref2_m.model_id
                LEFT JOIN Models ref3_m ON gmm.ref3_model_id = ref3_m.model_id
                LEFT JOIN Branches target_b ON g.target_branch_id = target_b.branch_id
                LEFT JOIN Branches ref1_b ON g.ref1_branch_id = ref1_b.branch_id
                LEFT JOIN Branches ref2_b ON g.ref2_branch_id = ref2_b.branch_id
                LEFT JOIN Branches ref3_b ON g.ref3_branch_id = ref3_b.branch_id
                WHERE kr.fms_key_id = ?
                AND EXISTS (SELECT 1 FROM Comments c WHERE c.key_review_id = kr.key_review_id AND c.verification_status = 'verified')
                ORDER BY p.title ASC, g.name ASC
            `;

            const reviews = await executeQuery(reviewsQuery, [key.fms_key_id]);

            // Group reviews by project -> group
            const groupsMap = new Map();

            for (const review of reviews) {
                const groupKey = `${review.project_id}_${review.group_name}`;
                const displayName = `${review.project_title} → ${review.group_name}`;

                if (!groupsMap.has(groupKey)) {
                    groupsMap.set(groupKey, {
                        group_name: displayName,
                        project_id: review.project_id,
                        project_title: review.project_title,
                        original_group_name: review.group_name,
                        comparison_type: review.comparison_type,
                        models: []
                    });
                }

                groupsMap.get(groupKey).models.push({
                    key_review_id: review.key_review_id,
                    status: review.status,
                    target: review.target_val,
                    ref1: review.ref1_val,
                    ref2: review.ref2_val,
                    ref3: review.ref3_val,
                    target_model_name: review.target_model_name,
                    ref1_model_name: review.ref1_model_name,
                    ref2_model_name: review.ref2_model_name,
                    ref3_model_name: review.ref3_model_name,
                    target_branch_name: review.target_branch_name,
                    ref1_branch_name: review.ref1_branch_name,
                    ref2_branch_name: review.ref2_branch_name,
                    ref3_branch_name: review.ref3_branch_name,
                    comment_count: review.comment_count,
                    latest_comment: review.latest_comment
                });
            }

            result.push({
                fms_key_id: key.fms_key_id,
                key_name: key.key_name,
                work_assignment: key.work_assignment,
                work_assignment_owner: key.work_assignment_owner,
                description: key.description,
                groups: Array.from(groupsMap.values())
            });
        }

        res.json({
            success: true,
            keys: result,
            totalKeys: result.length
        });

    } catch (error) {
        console.error('Get all comments error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch all comments'
        });
    }
});

// POST /api/keyreviews/ai-summary - Generate AI summary via Python
// Uses the same shim pattern as project creation in projects.js:
// spawn('python', ['-c', shimCode, jsonArg]) with stdio: ['ignore', 'pipe', 'pipe']
router.post('/ai-summary', async (req, res) => {
    const { fmsKey, fmsKeyDescription, jsonData } = req.body;

    if (!fmsKey || !jsonData) {
        return res.status(400).json({ success: false, error: 'fmsKey and jsonData are required' });
    }

    const scriptPath = path.resolve(__dirname, '../../sample key review data/summarizer.py');
    const escapedPath = scriptPath.replace(/\\/g, '\\\\');

    const jsonArg = JSON.stringify({ fmsKey, fmsKeyDescription: fmsKeyDescription || '', jsonData });

    // Shim: load summarizer.py via importlib (no __main__ needed), call the function, print JSON result
    const shimCode = [
        `import sys, json, importlib.util`,
        `spec = importlib.util.spec_from_file_location('summarizer', r'${escapedPath}')`,
        `mod = importlib.util.module_from_spec(spec)`,
        `spec.loader.exec_module(mod)`,
        `arg = json.loads(sys.argv[1])`,
        `result = mod.summarizeDifferences(arg['fmsKey'], arg['fmsKeyDescription'], arg['jsonData'])`,
        `print(json.dumps({'success': True, 'summary': result}), flush=True)`,
        `import os; os._exit(0)`
    ].join(';');

    const child = spawn('python', ['-c', shimCode, jsonArg], {
        stdio: ['ignore', 'pipe', 'pipe'],
        detached: false
    });

    let output = '';
    let errorOutput = '';
    let responded = false;

    const respond = (statusCode, body) => {
        if (responded) return;
        responded = true;
        clearTimeout(timeout);
        res.status(statusCode).json(body);
    };

    // Respond as soon as the shim prints its JSON line — don't wait for 'close'
    // because os._exit(0) in the shim can prevent 'close' from firing reliably.
    // The shim always emits exactly one complete JSON object, so try parsing on
    // every data chunk and respond the moment it succeeds.
    child.stdout.on('data', (data) => {
        output += data.toString();
        try {
            const parsed = JSON.parse(output.trim());
            respond(200, parsed);
        } catch {
            // Incomplete chunk — keep buffering until full JSON arrives
        }
    });

    child.stderr.on('data', (data) => {
        errorOutput += data.toString();
        console.error(`[AI-summarizer]: ${data.toString()}`);
    });

    const timeout = setTimeout(() => {
        respond(408, { success: false, error: 'Request timed out after 2 minutes' });
        child.kill('SIGTERM');
    }, 120000);

    // 'close' fires if the process exits cleanly — kept as a fallback
    child.on('close', () => {
        if (responded) return;
        if (output.trim()) {
            try {
                respond(200, JSON.parse(output.trim()));
            } catch {
                respond(200, { success: true, summary: output.trim() });
            }
        } else {
            respond(500, { success: false, error: errorOutput || 'No output from summarizer' });
        }
    });

    child.on('error', (err) => {
        clearTimeout(timeout);
        if (responded) return;
        responded = true;
        res.status(500).json({ success: false, error: 'Failed to launch Python: ' + err.message });
    });
});

module.exports = router;

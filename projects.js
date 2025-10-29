// Project Routes - Samsung FMS Portal
const express = require('express');
const Project = require('../models/Project');
const KeyReview = require('../models/KeyReview');
const Group = require('../models/Group');
const { executeQuery } = require('../config/database');
const { authenticateToken } = require('./auth');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { spawnSync, spawn } = require('child_process');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Helper function to get branch ID by name
async function getBranchIdByName(branchName) {
  const query = 'SELECT branch_id FROM Branches WHERE branch_name = ?';
  const result = await executeQuery(query, [branchName]);
  return result[0]?.branch_id || null;
}

// GET /api/projects - Get projects for current user
router.get('/', async (req, res) => {
  try {
    console.log('Getting projects for user:', req.user.username);
    const projects = await Project.getByUser(req.user.username);
    console.log('Found projects:', projects.length);

    // Get statistics and participants for each project
    const projectsWithStats = await Promise.all(
      projects.map(async (project) => {
        try {
          const [stats, participants] = await Promise.all([
            Project.getStats(project.project_id),
            Project.getParticipants(project.project_id)
          ]);

          const participantUsernames = participants.map(p => p.user_username);
          console.log(`Project ${project.project_id} participants:`, participantUsernames);

          return {
            ...project,
            ...stats,
            participants: participantUsernames // Just the usernames
          };
        } catch (statsError) {
          console.error('Error getting stats for project', project.project_id, ':', statsError);
          return {
            ...project,
            keyDifferences: 0,
            reviewedKeys: 0,
            participants: []
          };
        }
      })
    );

    res.json({
      success: true,
      projects: projectsWithStats
    });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch projects',
      error: error.message
    });
  }
});

// GET /api/projects/:id - Get project details
router.get('/:id', async (req, res) => {
  try {
    const projectId = req.params.id;

    // Check if user has access to this project
    const hasAccess = await Project.hasAccess(projectId, req.user.username);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this project'
      });
    }

    const project = await Project.getFullDetails(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Get current user's role in this project
    const User = require('../models/User');
    const userRole = await User.getProjectParticipant(req.user.username, projectId);

    res.json({
      success: true,
      project: {
        ...project,
        currentUserRole: userRole?.participant_role || null,
        isProjectAdmin: project.admin_username === req.user.username
      }
    });
  } catch (error) {
    console.error('Get project details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch project details'
    });
  }
});

// POST /api/projects - Create new project
router.post('/', async (req, res) => {
  try {
    const { title, description, refreshSchedule, groups } = req.body;

    // Only admins can create projects
    if (req.user.user_type !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can create projects'
      });
    }

    // Validate input
    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Project title is required'
      });
    }

    const projectData = {
      title: title.substring(0, 100), // Enforce character limit
      description: description ? description.substring(0, 500) : '',
      admin_username: req.user.username,
      refresh_schedule: refreshSchedule || 'Weekly'
    };

    const project = await Project.create(projectData);

    // Add creator as admin participant
    await Project.addParticipant(project.project_id, req.user.username, req.user.username, 'admin');

    // Create groups with the new structure (grps table with branch data)
    if (groups && Array.isArray(groups) && groups.length > 0) {
      for (const groupData of groups) {
        const { name, comparisonType, branches, models } = groupData;

        // Get branch IDs - handle both reference1 and reference for 2-way comparisons
        const targetBranchId = branches?.target ? await getBranchIdByName(branches.target) : null;
        const ref1BranchId = branches?.reference1 || branches?.reference ? await getBranchIdByName(branches.reference1 || branches.reference) : null;
        const ref2BranchId = branches?.reference2 ? await getBranchIdByName(branches.reference2) : null;
        const ref3BranchId = branches?.reference3 ? await getBranchIdByName(branches.reference3) : null;

        // Create the group with branch data directly in grps table
        const group = await Project.createGroup({
          project_id: project.project_id,
          name,
          comparison_type: comparisonType,
          target_branch_id: targetBranchId,
          ref1_branch_id: ref1BranchId,
          ref2_branch_id: ref2BranchId,
          ref3_branch_id: ref3BranchId
        });

        // Add models to the group if provided
        if (models && Array.isArray(models) && models.length > 0) {
          for (const modelData of models) {
            await Project.addModelToGroup(group.group_id, modelData);
          }
        }
      }
    }

    // Get the complete project with all details
    const completeProject = await Project.getFullDetails(project.project_id);

    // Build branch_models_dict for P4 script
    let branchModelsDict = null;
    try {
      const branchList2D = [];
      const modelList3D = [];

      for (const group of completeProject.groups) {
        const comparisonType = group.comparison_type || group.comparisonType;
        const branches = [];

        // Always add target branch
        if (group.target_branch_name || group.branches?.target) {
          branches.push(group.target_branch_name || group.branches?.target);
        }

        // Add reference branches based on comparison type
        if (comparisonType === '2-way' || comparisonType === '3-way' || comparisonType === '4-way' || comparisonType === '2-way-vs-2-way') {
          // For 2-way, check both reference1 and reference fields
          const ref1Branch = group.ref1_branch_name || group.branches?.reference1 || group.branches?.reference;
          if (ref1Branch) {
            branches.push(ref1Branch);
          }
        }

        if (comparisonType === '3-way' || comparisonType === '4-way') {
          if (group.ref2_branch_name || group.branches?.reference2) {
            branches.push(group.ref2_branch_name || group.branches?.reference2);
          }
        }

        if (comparisonType === '4-way') {
          if (group.ref3_branch_name || group.branches?.reference3) {
            branches.push(group.ref3_branch_name || group.branches?.reference3);
          }
        }

        branchList2D.push(branches);

        // Fetch model combinations for the group
        const modelCombinations = await Project.getGroupModelCombinations(group.group_id);
        const modelRows = modelCombinations.map((row) => {
          const models = [];
          if (row.target) models.push(row.target);
          if (branches.length >= 2) models.push(row.reference || row.reference1 || row.target);
          if (branches.length >= 3) models.push(row.reference2 || row.target);
          if (branches.length >= 4) models.push(row.reference3 || row.target);
          return models;
        });
        modelList3D.push(modelRows);
      }

      branchModelsDict = { branch: branchList2D, model: modelList3D };
      console.log('branch_models_dict for project', project.project_id, JSON.stringify(branchModelsDict));

      // Set project status to syncing before starting async job
      try {
        await Project.update(project.project_id, {
          title: completeProject.title,
          description: completeProject.description,
          refresh_schedule: completeProject.refresh_schedule,
          status: 'syncing'
        });
        console.log(`Project ${project.project_id} status set to syncing`);
      } catch (_) { }

      // Fire-and-forget: spawn Python process to call get_dif_from_p4 and flip status back to active on exit
      try {
        const pythonPath = 'python';
        const scriptPath = path.join(__dirname, '..', '..', 'sample key review data', 'new_p4_diff_code.py');
        const jsonArg = JSON.stringify(branchModelsDict);

        // Determine which Python function to call based on comparison types
        const has2WayVs2Way = completeProject.groups.some(group =>
          (group.comparison_type || group.comparisonType) === '2-way-vs-2-way'
        );
        const pythonFunction = has2WayVs2Way ? 'get_dif_from_p4_2wayvs2way' : 'get_dif_from_p4';

        // We will call the Python script with a small shim to read the JSON and call the function
        const shimCode = `import sys,json;\nfrom pathlib import Path;\nfp = ${JSON.stringify(scriptPath) !== undefined ? `r'''${scriptPath.replace(/\\/g, '\\\\')}'''` : `''`};\nimport importlib.util;\nspec = importlib.util.spec_from_file_location('p4mod', fp);\nmod = importlib.util.module_from_spec(spec);\nspec.loader.exec_module(mod);\narg=json.loads(sys.argv[1]);\nprint('P4 shim start');\nres = mod.${pythonFunction}(arg, mod.model_data, mod.branch_data);\nprint('P4 shim done', len(res) if res else 0);\nprint('DF_COUNT:', len(res) if res else 0);\nimport pandas as pd;\nprint('DF_DATA_START');\nfor i, df in enumerate(res or []):\n    # Transform column names to match expected format safely (4-way -> 3-way -> 2-way)\n    df_processed = df.copy()\n    ncols = len(df_processed.columns)\n    try:\n        if ncols >= 5:\n            df_processed = df_processed.iloc[:, :5]\n            df_processed.columns = ['key name', 'target_model data', 'ref1 model data', 'ref2 model data', 'ref3 model data']\n        elif ncols == 4:\n            df_processed = df_processed.iloc[:, :4]\n            df_processed.columns = ['key name', 'target_model data', 'ref1 model data', 'ref2 model data']\n        elif ncols == 3:\n            df_processed = df_processed.iloc[:, :3]\n            df_processed.columns = ['key name', 'target_model data', 'ref1 model data']\n        else:\n            print('Skipping DF index', i, 'unsupported column count', ncols)\n            continue\n    except Exception as e:\n        print('Column rename error for DF', i, 'with ncols', ncols, ':', e)\n        continue\n    print('DF_START', i);\n    print(df_processed.to_json(orient='records'));\n    print('DF_END', i);\nprint('DF_DATA_END')`;

        const child = spawn(pythonPath, ['-c', shimCode, jsonArg], {
          stdio: ['ignore', 'pipe', 'pipe'],
          detached: false
        });

        let output = '';
        let errorOutput = '';

        child.stdout.on('data', (data) => {
          output += data.toString();
        });

        child.stderr.on('data', (data) => {
          errorOutput += data.toString();
        });

        // Set 10 minute timeout
        const timeout = setTimeout(async () => {
          child.kill('SIGTERM');
          try {
            await Project.update(project.project_id, {
              title: completeProject.title,
              description: completeProject.description,
              refresh_schedule: completeProject.refresh_schedule,
              status: 'sync error'
            });
            console.log(`Project ${project.project_id} sync timed out after 10 minutes. Status set to 'sync error'.`);
          } catch (statusErr) {
            console.error('Failed to set project status to error syncing:', statusErr.message);
          }
        }, 10 * 60 * 1000); // 10 minutes

        child.on('exit', async (code) => {
          clearTimeout(timeout);

          // Extract DataFrame count from output
          const dfCountMatch = output.match(/DF_COUNT:\s*(\d+)/);
          const dfCount = dfCountMatch ? parseInt(dfCountMatch[1]) : 0;

          console.log(`Project ${project.project_id} Python output:`, output.trim());
          if (errorOutput) {
            console.error(`Project ${project.project_id} Python error:`, errorOutput.trim());
          }
          console.log(`Project ${project.project_id} returned ${dfCount} DataFrames`);

          // Parse DataFrame data if available
          if (code === 0 && dfCount > 0) {
            try {
              const dataFrames = [];
              const dfDataStart = output.indexOf('DF_DATA_START');
              const dfDataEnd = output.indexOf('DF_DATA_END');

              console.log(`DF_DATA_START position: ${dfDataStart}`);
              console.log(`DF_DATA_END position: ${dfDataEnd}`);

              if (dfDataStart !== -1 && dfDataEnd !== -1) {
                const dfDataSection = output.substring(dfDataStart, dfDataEnd);
                console.log(`DataFrame section length: ${dfDataSection.length}`);
                console.log(`DataFrame section preview: ${dfDataSection.substring(0, 500)}...`);
                console.log(`Full DataFrame section:`, dfDataSection);

                // Try different regex patterns
                const dfMatches1 = dfDataSection.match(/DF_START (\d+)\n(.*?)\nDF_END \1/gs);
                const dfMatches2 = dfDataSection.match(/DF_START (\d+)\n(.*?)\nDF_END \1/g);
                const dfMatches3 = dfDataSection.match(/DF_START (\d+)\n(.*?)\nDF_END \1/s);

                console.log(`Regex 1 (with 's' flag): ${dfMatches1 ? dfMatches1.length : 0} matches`);
                console.log(`Regex 2 (without 's' flag): ${dfMatches2 ? dfMatches2.length : 0} matches`);
                console.log(`Regex 3 (with 's' flag, no 'g'): ${dfMatches3 ? dfMatches3.length : 0} matches`);

                const dfMatches = dfMatches1 || dfMatches2 || dfMatches3;

                if (dfMatches) {
                  for (const match of dfMatches) {
                    const lines = match.split('\n');
                    const dfIndex = parseInt(lines[0].split(' ')[1]);
                    const jsonData = lines.slice(1, -1).join('\n');


                    try {
                      const dfData = JSON.parse(jsonData);
                      dataFrames[dfIndex] = dfData;
                    } catch (parseErr) {
                      console.error(`✗ Error parsing DataFrame ${dfIndex}:`, parseErr.message);
                      console.error(`JSON data that failed:`, jsonData.substring(0, 500));
                    }
                  }
                } else {
                  console.error('No DataFrame matches found in output');

                  // Fallback: try to parse manually by splitting on DF_START/DF_END
                  console.log('Trying fallback parsing method...');
                  const parts = dfDataSection.split('DF_START');
                  console.log(`Found ${parts.length - 1} DF_START markers`);

                  for (let i = 1; i < parts.length; i++) {
                    const part = parts[i];
                    const endIndex = part.indexOf('DF_END');
                    if (endIndex !== -1) {
                      const dfIndex = parseInt(part.split('\n')[0].trim());
                      const jsonData = part.substring(part.indexOf('\n') + 1, endIndex).trim();

                      console.log(`\n--- Fallback parsing DataFrame ${dfIndex} ---`);
                      console.log(`JSON data length: ${jsonData.length}`);
                      console.log(`JSON data preview: ${jsonData.substring(0, 200)}...`);

                      try {
                        const dfData = JSON.parse(jsonData);
                        dataFrames[dfIndex] = dfData;
                        console.log(`✓ Successfully parsed DataFrame ${dfIndex} with ${dfData.length} rows`);
                        console.log(`Sample row:`, dfData[0]);
                      } catch (parseErr) {
                        console.error(`✗ Error parsing DataFrame ${dfIndex}:`, parseErr.message);
                        console.error(`JSON data that failed:`, jsonData.substring(0, 500));
                      }
                    }
                  }
                }

                // Insert DataFrame data into database
                if (dataFrames.length > 0) {
                  const KeyReview = require('../models/KeyReview');
                  const insertResult = await KeyReview.insertDataFrameData(project.project_id, dataFrames, branchModelsDict);

                  if (insertResult.success) {
                    console.log(`✓ Successfully inserted ${insertResult.inserted} key review records`);
                  } else {
                    console.error('✗ Failed to insert DataFrame data:', insertResult.error);
                    try {
                      await Project.update(project.project_id, {
                        title: completeProject.title,
                        description: completeProject.description,
                        refresh_schedule: completeProject.refresh_schedule,
                        status: 'sync error'
                      });
                    } catch (statusErr) {
                      console.error('Failed to set project status to sync error after insert failure:', statusErr.message);
                    }
                  }
                } else {
                  console.error('No DataFrames to insert');
                }
              } else {
                console.error('DF_DATA_START or DF_DATA_END markers not found in output');
                console.log('Full output:', output);
                try {
                  await Project.update(project.project_id, {
                    title: completeProject.title,
                    description: completeProject.description,
                    refresh_schedule: completeProject.refresh_schedule,
                    status: 'sync error'
                  });
                } catch (statusErr) {
                  console.error('Failed to set project status to sync error after parsing failure:', statusErr.message);
                }
              }
            } catch (dataErr) {
              console.error('Error processing DataFrame data:', dataErr.message);
              console.error('Stack trace:', dataErr.stack);
              try {
                await Project.update(project.project_id, {
                  title: completeProject.title,
                  description: completeProject.description,
                  refresh_schedule: completeProject.refresh_schedule,
                  status: 'sync error'
                });
              } catch (statusErr) {
                console.error('Failed to set project status to sync error after exception:', statusErr.message);
              }
            }
          } else {
            console.log(`Skipping DataFrame processing - code: ${code}, dfCount: ${dfCount}`);
          }

          try {
            // If code is 0 and we didn't hit earlier errors, set active; otherwise sync error
            const newStatus = code === 0 ? 'active' : 'sync error';
            await Project.update(project.project_id, {
              title: completeProject.title,
              description: completeProject.description,
              refresh_schedule: completeProject.refresh_schedule,
              status: newStatus
            });
            console.log(`Project ${project.project_id} sync finished with code ${code}. Status set to ${newStatus}.`);
          } catch (statusErr) {
            console.error('Failed to set project status:', statusErr.message);
          }
        });
      } catch (pyErr) {
        console.error('Failed to spawn P4 Python process:', pyErr.message);
      }
    } catch (buildErr) {
      console.error('Failed to build/send branch_models_dict:', buildErr.message);
    }

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: completeProject,
      branchModelsDict
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create project'
    });
  }
});


// PUT /api/projects/:id - Update project
router.put('/:id', async (req, res) => {
  try {
    const projectId = req.params.id;
    const { title, description, refreshSchedule, groups } = req.body;

    // Check if user is admin of this project
    const project = await Project.findById(projectId);
    if (!project || project.admin_username !== req.user.username) {
      return res.status(403).json({
        success: false,
        message: 'Only project admin can update project'
      });
    }

    // Update basic project information
    const updateData = {
      title: title ? title.substring(0, 100) : project.title,
      description: description !== undefined ? description.substring(0, 500) : project.description,
      refresh_schedule: refreshSchedule || project.refresh_schedule || 'Weekly' // Default to 'Weekly' if both are undefined
    };

    console.log('Update data being passed to Project.update:', updateData);
    console.log('Project ID:', projectId);

    const updatedProject = await Project.update(projectId, updateData);

    // If groups are being updated, trigger a configuration refresh
    if (groups && Array.isArray(groups)) {
      console.log('Updating project configuration with intelligent refresh...');

      // Update the configuration intelligently
      const configChanges = await updateProjectConfiguration(projectId, groups);

      // Set project status to syncing
      await Project.update(projectId, {
        ...updateData,
        status: 'syncing'
      });

      // Return immediately with syncing status
      res.json({
        success: true,
        message: 'Project configuration update initiated',
        data: { ...updatedProject, status: 'syncing' }
      });

      // Trigger the refresh process to sync new data
      setImmediate(async () => {
        try {
          // Call the refresh project logic which will get new data from P4
          await refreshProjectDataAfterConfigUpdate(projectId);
        } catch (error) {
          console.error('Background sync error after config update:', error);
          await Project.update(projectId, {
            ...updateData,
            status: 'sync error'
          });
        }
      });

      return;
    }

    // Update groups and their configurations if provided
    if (groups && Array.isArray(groups)) {
      // Delete existing groups and their mappings
      await executeQuery('DELETE FROM `Group_Model_Mapping` WHERE group_id IN (SELECT group_id FROM `grps` WHERE project_id = ?)', [projectId]);
      await executeQuery('DELETE FROM `grps` WHERE project_id = ?', [projectId]);

      // Create new groups
      for (const groupData of groups) {
        const { name, comparisonType, branches, models } = groupData;

        // Ensure required fields are not undefined
        if (!name || !comparisonType) {
          console.error('Group data missing required fields:', { name, comparisonType });
          throw new Error('Group name and comparison type are required');
        }

        // Get branch IDs from branch names
        const branchIds = {};
        if (branches && typeof branches === 'object') {
          for (const [role, branchName] of Object.entries(branches)) {
            const branchQuery = `SELECT branch_id FROM \`Branches\` WHERE branch_name = ?`;
            const branchResults = await executeQuery(branchQuery, [branchName]);
            if (branchResults.length > 0) {
              branchIds[role] = branchResults[0].branch_id;
            }
          }
        }

        // Create the group with branch IDs
        const groupQuery = `
          INSERT INTO \`grps\` (project_id, name, comparison_type, target_branch_id, ref1_branch_id, ref2_branch_id, ref3_branch_id)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        const groupResult = await executeQuery(groupQuery, [
          projectId,
          name,
          comparisonType,
          branchIds.target || null,
          branchIds.ref1 || branchIds.reference || null,
          branchIds.ref2 || null,
          branchIds.ref3 || null
        ]);

        const groupId = groupResult.insertId;

        // Add models to the group if provided
        if (models && Array.isArray(models) && models.length > 0) {
          for (const modelData of models) {
            // Get model IDs
            const modelIds = {};
            for (const [role, modelName] of Object.entries(modelData)) {
              if (modelName) {
                const modelQuery = `SELECT model_id FROM \`Models\` WHERE model_name = ?`;
                const modelResults = await executeQuery(modelQuery, [modelName]);
                if (modelResults.length > 0) {
                  modelIds[role] = modelResults[0].model_id;
                }
              }
            }

            // Create model mapping
            const modelMappingQuery = `
              INSERT INTO \`Group_Model_Mapping\` (group_id, target_model_id, ref1_model_id, ref2_model_id, ref3_model_id)
              VALUES (?, ?, ?, ?, ?)
            `;

            await executeQuery(modelMappingQuery, [
              groupId,
              modelIds.target || null,
              modelIds.ref1 || modelIds.reference || null,
              modelIds.ref2 || null,
              modelIds.ref3 || null
            ]);
          }
        }
      }
    }

    // Get the complete updated project with all details
    const completeProject = await Project.getFullDetails(projectId);

    // Start syncing process if groups were updated
    if (groups && Array.isArray(groups)) {
      console.log(`Starting sync process for updated project ${projectId}`);

      // Set project status to syncing
      await Project.update(projectId, {
        title: completeProject.title,
        description: completeProject.description,
        refresh_schedule: completeProject.refresh_schedule,
        status: 'syncing'
      });

      // Build branch_models_dict for P4 script
      let branchModelsDict = null;
      try {
        const branchList2D = [];
        const modelList3D = [];

        for (const group of completeProject.groups) {
          const comparisonType = group.comparison_type || group.comparisonType;
          const branches = [];

          // Always add target branch
          if (group.target_branch_name || group.branches?.target) {
            branches.push(group.target_branch_name || group.branches?.target);
          }

          // Add reference branches based on comparison type
          if (comparisonType === '2-way' || comparisonType === '3-way' || comparisonType === '4-way' || comparisonType === '2-way-vs-2-way') {
            // For 2-way, check both reference1 and reference fields
            const ref1Branch = group.ref1_branch_name || group.branches?.reference1 || group.branches?.reference;
            if (ref1Branch) {
              branches.push(ref1Branch);
            }
          }

          if (comparisonType === '3-way' || comparisonType === '4-way') {
            if (group.ref2_branch_name || group.branches?.reference2) {
              branches.push(group.ref2_branch_name || group.branches?.reference2);
            }
          }

          if (comparisonType === '4-way') {
            if (group.ref3_branch_name || group.branches?.reference3) {
              branches.push(group.ref3_branch_name || group.branches?.reference3);
            }
          }

          branchList2D.push(branches);

          // Fetch model combinations for the group
          const modelCombinations = await Project.getGroupModelCombinations(group.group_id);
          const modelRows = modelCombinations.map((row) => {
            const models = [];
            if (row.target) models.push(row.target);
            if (branches.length >= 2) models.push(row.reference || row.reference1 || row.target);
            if (branches.length >= 3) models.push(row.reference2 || row.target);
            if (branches.length >= 4) models.push(row.reference3 || row.target);
            return models;
          });
          modelList3D.push(modelRows);
        }

        branchModelsDict = { branch: branchList2D, model: modelList3D };
        console.log('Branch models dict for update:', JSON.stringify(branchModelsDict, null, 2));

        // Execute Python script
        try {
          const pythonPath = 'python';
          const scriptPath = path.join(__dirname, '..', '..', 'sample key review data', 'new_p4_diff_code.py');
          const jsonArg = JSON.stringify(branchModelsDict);

          // Determine which Python function to call based on comparison types
          const has2WayVs2Way = completeProject.groups.some(group =>
            (group.comparison_type || group.comparisonType) === '2-way-vs-2-way'
          );
          const pythonFunction = has2WayVs2Way ? 'get_dif_from_p4_2wayvs2way' : 'get_dif_from_p4';

          // Python shim code (same as in project creation)
          const shimCode = `import sys,json;\nfrom pathlib import Path;\nfp = ${JSON.stringify(scriptPath) !== undefined ? `r'''${scriptPath.replace(/\\/g, '\\\\')}'''` : `''`};\nimport importlib.util;\nspec = importlib.util.spec_from_file_location('p4mod', fp);\nmod = importlib.util.module_from_spec(spec);\nspec.loader.exec_module(mod);\narg=json.loads(sys.argv[1]);\nprint('P4 shim start');\nres = mod.${pythonFunction}(arg, mod.model_data, mod.branch_data);\nprint('P4 shim done', len(res) if res else 0);\nprint('DF_COUNT:', len(res) if res else 0);\nimport pandas as pd;\nprint('DF_DATA_START');\nfor i, df in enumerate(res or []):\n    # Transform column names to match expected format safely (4-way -> 3-way -> 2-way)\n    df_processed = df.copy()\n    ncols = len(df_processed.columns)\n    try:\n        if ncols >= 5:\n            df_processed = df_processed.iloc[:, :5]\n            df_processed.columns = ['key name', 'target_model data', 'ref1 model data', 'ref2 model data', 'ref3 model data']\n        elif ncols == 4:\n            df_processed = df_processed.iloc[:, :4]\n            df_processed.columns = ['key name', 'target_model data', 'ref1 model data', 'ref2 model data']\n        elif ncols == 3:\n            df_processed = df_processed.iloc[:, :3]\n            df_processed.columns = ['key name', 'target_model data', 'ref1 model data']\n        else:\n            print('Skipping DF index', i, 'unsupported column count', ncols)\n            continue\n    except Exception as e:\n        print('Column rename error for DF', i, 'with ncols', ncols, ':', e)\n        continue\n    print('DF_START', i);\n    print(df_processed.to_json(orient='records'));\n    print('DF_END', i);\nprint('DF_DATA_END')`;

          const child = spawn(pythonPath, ['-c', shimCode, jsonArg], {
            stdio: ['ignore', 'pipe', 'pipe'],
            detached: false
          });

          let output = '';
          let errorOutput = '';

          child.stdout.on('data', (data) => {
            output += data.toString();
          });

          child.stderr.on('data', (data) => {
            errorOutput += data.toString();
          });

          // Set 10 minute timeout
          const timeout = setTimeout(async () => {
            child.kill('SIGTERM');
            try {
              await Project.update(projectId, {
                title: completeProject.title,
                description: completeProject.description,
                refresh_schedule: completeProject.refresh_schedule,
                status: 'sync error'
              });
              console.log(`Project ${projectId} sync timed out after 10 minutes. Status set to 'sync error'.`);
            } catch (statusErr) {
              console.error('Failed to set project status to error syncing:', statusErr.message);
            }
          }, 10 * 60 * 1000); // 10 minutes

          child.on('exit', async (code) => {
            clearTimeout(timeout);

            // Extract DataFrame count from output
            const dfCountMatch = output.match(/DF_COUNT:\s*(\d+)/);
            const dfCount = dfCountMatch ? parseInt(dfCountMatch[1]) : 0;

            console.log(`Project ${projectId} Python output:`, output.trim());
            if (errorOutput) {
              console.error(`Project ${projectId} Python error:`, errorOutput.trim());
            }
            console.log(`Project ${projectId} returned ${dfCount} DataFrames`);

            // Parse DataFrame data if available
            if (code === 0 && dfCount > 0) {
              try {
                const dataFrames = [];
                const dfDataStart = output.indexOf('DF_DATA_START');
                const dfDataEnd = output.indexOf('DF_DATA_END');

                console.log(`DF_DATA_START position: ${dfDataStart}`);
                console.log(`DF_DATA_END position: ${dfDataEnd}`);

                if (dfDataStart !== -1 && dfDataEnd !== -1) {
                  const dfDataSection = output.substring(dfDataStart, dfDataEnd);
                  console.log(`DataFrame section length: ${dfDataSection.length}`);

                  // Try different regex patterns
                  const dfMatches1 = dfDataSection.match(/DF_START (\d+)\n(.*?)\nDF_END \1/gs);
                  const dfMatches2 = dfDataSection.match(/DF_START (\d+)\n(.*?)\nDF_END \1/g);
                  const dfMatches3 = dfDataSection.match(/DF_START (\d+)\n(.*?)\nDF_END \1/s);

                  const dfMatches = dfMatches1 || dfMatches2 || dfMatches3;

                  if (dfMatches) {
                    for (const match of dfMatches) {
                      const lines = match.split('\n');
                      const dfIndex = parseInt(lines[0].split(' ')[1]);
                      const jsonData = lines.slice(1, -1).join('\n');

                      console.log(`\n--- Parsing DataFrame ${dfIndex} ---`);
                      try {
                        const dfData = JSON.parse(jsonData);
                        dataFrames[dfIndex] = dfData;
                        console.log(`✓ Successfully parsed DataFrame ${dfIndex} with ${dfData.length} rows`);
                      } catch (parseErr) {
                        console.error(`✗ Error parsing DataFrame ${dfIndex}:`, parseErr.message);
                      }
                    }
                  } else {
                    console.error('No DataFrame matches found in output');
                  }

                  // Insert DataFrame data into database
                  if (dataFrames.length > 0) {
                    console.log(`\n=== STARTING DATABASE INSERTION ===`);
                    console.log(`DataFrames to insert: ${dataFrames.length}`);
                    const KeyReview = require('../models/KeyReview');
                    const insertResult = await KeyReview.insertDataFrameData(projectId, dataFrames, branchModelsDict);

                    if (insertResult.success) {
                      console.log(`✓ Successfully inserted ${insertResult.inserted} key review records`);
                    } else {
                      console.error('✗ Failed to insert DataFrame data:', insertResult.error);
                      try {
                        await Project.update(projectId, {
                          title: completeProject.title,
                          description: completeProject.description,
                          refresh_schedule: completeProject.refresh_schedule,
                          status: 'sync error'
                        });
                      } catch (statusErr) {
                        console.error('Failed to set project status to sync error after insert failure:', statusErr.message);
                      }
                    }
                  } else {
                    console.error('No DataFrames to insert');
                  }
                } else {
                  console.error('DF_DATA_START or DF_DATA_END markers not found in output');
                  try {
                    await Project.update(projectId, {
                      title: completeProject.title,
                      description: completeProject.description,
                      refresh_schedule: completeProject.refresh_schedule,
                      status: 'sync error'
                    });
                  } catch (statusErr) {
                    console.error('Failed to set project status to sync error after parsing failure:', statusErr.message);
                  }
                }
              } catch (dataErr) {
                console.error('Error processing DataFrame data:', dataErr.message);
                try {
                  await Project.update(projectId, {
                    title: completeProject.title,
                    description: completeProject.description,
                    refresh_schedule: completeProject.refresh_schedule,
                    status: 'sync error'
                  });
                } catch (statusErr) {
                  console.error('Failed to set project status to sync error after exception:', statusErr.message);
                }
              }
            } else {
              console.log(`Skipping DataFrame processing - code: ${code}, dfCount: ${dfCount}`);
            }

            try {
              // If code is 0 and we didn't hit earlier errors, set active; otherwise sync error
              const newStatus = code === 0 ? 'active' : 'sync error';
              await Project.update(projectId, {
                title: completeProject.title,
                description: completeProject.description,
                refresh_schedule: completeProject.refresh_schedule,
                status: newStatus
              });
              console.log(`Project ${projectId} sync finished with code ${code}. Status set to ${newStatus}.`);
            } catch (statusErr) {
              console.error('Failed to set project status:', statusErr.message);
            }
          });
        } catch (pyErr) {
          console.error('Failed to spawn P4 Python process:', pyErr.message);
          try {
            await Project.update(projectId, {
              title: completeProject.title,
              description: completeProject.description,
              refresh_schedule: completeProject.refresh_schedule,
              status: 'sync error'
            });
          } catch (statusErr) {
            console.error('Failed to set project status to sync error after Python spawn failure:', statusErr.message);
          }
        }
      } catch (buildErr) {
        console.error('Failed to build/send branch_models_dict:', buildErr.message);
        try {
          await Project.update(projectId, {
            title: completeProject.title,
            description: completeProject.description,
            refresh_schedule: completeProject.refresh_schedule,
            status: 'sync error'
          });
        } catch (statusErr) {
          console.error('Failed to set project status to sync error after build failure:', statusErr.message);
        }
      }
    }

    res.json({
      success: true,
      message: 'Project updated successfully',
      data: completeProject
    });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update project'
    });
  }
});

// DELETE /api/projects/:id - Delete project
router.delete('/:id', async (req, res) => {
  try {
    const projectId = req.params.id;

    // Check if user is admin of this project
    const project = await Project.findById(projectId);
    if (!project || project.admin_username !== req.user.username) {
      return res.status(403).json({
        success: false,
        message: 'Only project admin can delete project'
      });
    }

    await Project.delete(projectId);

    res.json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete project'
    });
  }
});

// POST /api/projects/:id/participants - Add participant to project
router.post('/:id/participants', async (req, res) => {
  try {
    const projectId = req.params.id;
    const { username, role } = req.body;

    // Check if user is admin of this project
    const project = await Project.findById(projectId);
    if (!project || project.admin_username !== req.user.username) {
      return res.status(403).json({
        success: false,
        message: 'Only project admin can add participants'
      });
    }

    await Project.addParticipant(projectId, username, req.user.username, role || 'reviewer');

    res.json({
      success: true,
      message: 'Participant added successfully'
    });
  } catch (error) {
    console.error('Add participant error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add participant'
    });
  }
});

// DELETE /api/projects/:id/participants/:username - Remove participant
router.delete('/:id/participants/:username', async (req, res) => {
  try {
    const projectId = req.params.id;
    const username = req.params.username;

    // Check if user is admin of this project
    const project = await Project.findById(projectId);
    if (!project || project.admin_username !== req.user.username) {
      return res.status(403).json({
        success: false,
        message: 'Only project admin can remove participants'
      });
    }

    await Project.removeParticipant(projectId, username);

    res.json({
      success: true,
      message: 'Participant removed successfully'
    });
  } catch (error) {
    console.error('Remove participant error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove participant'
    });
  }
});

// GET /api/projects/:id/groups - Get project groups
router.get('/:id/groups', async (req, res) => {
  try {
    const projectId = req.params.id;

    // Check access
    const hasAccess = await Project.hasAccess(projectId, req.user.username);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this project'
      });
    }

    const groups = await Group.getByProject(projectId);

    res.json({
      success: true,
      groups
    });
  } catch (error) {
    console.error('Get project groups error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch project groups'
    });
  }
});

// POST /api/projects/:id/groups - Create group in project
router.post('/:id/groups', async (req, res) => {
  try {
    const projectId = req.params.id;
    const { name, comparison_type, branchConfig } = req.body;

    // Check if user is admin of this project
    const project = await Project.findById(projectId);
    if (!project || project.admin_username !== req.user.username) {
      return res.status(403).json({
        success: false,
        message: 'Only project admin can create groups'
      });
    }

    // Validate input
    if (!name || !comparison_type) {
      return res.status(400).json({
        success: false,
        message: 'Group name and comparison type are required'
      });
    }

    const groupData = {
      project_id: projectId,
      name,
      comparison_type
    };

    const group = await Group.create(groupData);

    // Set branch configuration if provided
    if (branchConfig) {
      await Group.setBranchConfig(group.group_id, branchConfig);
    }

    res.status(201).json({
      success: true,
      message: 'Group created successfully',
      group
    });
  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create group'
    });
  }
});

// GET /api/projects/:id/reviews - Get key reviews for project
router.get('/:id/reviews', async (req, res) => {
  try {
    const projectId = req.params.id;

    // Check access
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
    console.error('Get project reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch project reviews'
    });
  }
});

// GET /api/projects/:id/stats - Get project statistics
router.get('/:id/stats', async (req, res) => {
  try {
    const projectId = req.params.id;

    // Check access
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
    console.error('Get project stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch project statistics'
    });
  }
});

// POST /api/projects/:id/refresh - Refresh project data from P4
router.post('/:id/refresh', async (req, res) => {
  try {
    const projectId = req.params.id;
    console.log(`Starting refresh for project ${projectId}`);

    // Get project details
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check if user has permission to refresh this project
    const participants = await Project.getParticipants(projectId);
    const participantUsernames = participants.map(p => p.user_username);

    if (!participantUsernames.includes(req.user.username)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to refresh this project'
      });
    }

    // Set project status to 'syncing' immediately
    await Project.update(projectId, {
      title: project.title,
      description: project.description,
      refresh_schedule: project.refresh_schedule,
      status: 'syncing'
    });

    // Send immediate response so frontend can show syncing status
    res.json({
      success: true,
      message: 'Project refresh started',
      data: { ...project, status: 'syncing' }
    });

    // Continue refresh process in the background
    setImmediate(async () => {
      try {
        // Get project groups and their model combinations
        const groups = await Project.getGroups(projectId);
        if (!groups || groups.length === 0) {
          console.error('No groups found for this project');
          await Project.update(projectId, {
            title: project.title,
            description: project.description,
            refresh_schedule: project.refresh_schedule,
            status: 'sync error'
          });
          return;
        }

        // Build branch_models_dict for Python script (same as project creation)
        const branchList2D = [];
        const modelList3D = [];

        for (const group of groups) {
          const comparisonType = group.comparison_type;
          const branches = [];

          // Always add target branch (without adding extra brackets - they're already in DB)
          if (group.target_branch_name) {
            branches.push(group.target_branch_name);
          }

          // Add reference branches based on comparison type
          if (comparisonType === '2-way' || comparisonType === '3-way' || comparisonType === '4-way' || comparisonType === '2-way vs 2-way') {
            if (group.ref1_branch_name) {
              branches.push(group.ref1_branch_name);
            }
          }

          if (comparisonType === '3-way' || comparisonType === '4-way') {
            if (group.ref2_branch_name) {
              branches.push(group.ref2_branch_name);
            }
          }

          if (comparisonType === '4-way') {
            if (group.ref3_branch_name) {
              branches.push(group.ref3_branch_name);
            }
          }

          branchList2D.push(branches);

          // Fetch model combinations for the group (same as project creation)
          const modelCombinations = await Project.getGroupModelCombinations(group.group_id);
          const modelRows = modelCombinations.map((row) => {
            const models = [];
            if (row.target) models.push(row.target);
            if (branches.length >= 2) models.push(row.reference || row.reference1 || row.target);
            if (branches.length >= 3) models.push(row.reference2 || row.target);
            if (branches.length >= 4) models.push(row.reference3 || row.target);
            return models;
          });
          modelList3D.push(modelRows);
        }

        const branchModelsDict = { branch: branchList2D, model: modelList3D };

        console.log('Branch models dict for refresh:', JSON.stringify(branchModelsDict, null, 2));

        // Execute Python script to get fresh diff data (using shim code like project creation)
        const pythonPath = 'python';
        const scriptPath = path.join(__dirname, '..', '..', 'sample key review data', 'new_p4_diff_code.py');
        const jsonArg = JSON.stringify(branchModelsDict);

        // Determine which Python function to call based on comparison types
        const has2WayVs2Way = groups.some(group =>
          (group.comparison_type || group.comparisonType) === '2-way-vs-2-way'
        );
        const pythonFunction = has2WayVs2Way ? 'get_dif_from_p4_2wayvs2way' : 'get_dif_from_p4';

        // Python shim code (same as project creation - uses JSON format with column renaming)
        const shimCode = `import sys,json;\nfrom pathlib import Path;\nfp = ${JSON.stringify(scriptPath) !== undefined ? `r'''${scriptPath.replace(/\\/g, '\\\\')}'''` : `''`};\nimport importlib.util;\nspec = importlib.util.spec_from_file_location('p4mod', fp);\nmod = importlib.util.module_from_spec(spec);\nspec.loader.exec_module(mod);\narg=json.loads(sys.argv[1]);\nprint('P4 shim start');\nres = mod.${pythonFunction}(arg, mod.model_data, mod.branch_data);\nprint('P4 shim done', len(res) if res else 0);\nprint('DF_COUNT:', len(res) if res else 0);\nimport pandas as pd;\nprint('DF_DATA_START');\nfor i, df in enumerate(res or []):\n    # Transform column names to match expected format safely (4-way -> 3-way -> 2-way)\n    df_processed = df.copy()\n    ncols = len(df_processed.columns)\n    try:\n        if ncols >= 5:\n            df_processed = df_processed.iloc[:, :5]\n            df_processed.columns = ['key name', 'target_model data', 'ref1 model data', 'ref2 model data', 'ref3 model data']\n        elif ncols == 4:\n            df_processed = df_processed.iloc[:, :4]\n            df_processed.columns = ['key name', 'target_model data', 'ref1 model data', 'ref2 model data']\n        elif ncols == 3:\n            df_processed = df_processed.iloc[:, :3]\n            df_processed.columns = ['key name', 'target_model data', 'ref1 model data']\n        else:\n            print('Skipping DF index', i, 'unsupported column count', ncols)\n            continue\n    except Exception as e:\n        print('Column rename error for DF', i, 'with ncols', ncols, ':', e)\n        continue\n    print('DF_START', i);\n    print(df_processed.to_json(orient='records'));\n    print('DF_END', i);\nprint('DF_DATA_END');`;

        const child = spawn(pythonPath, ['-c', shimCode, jsonArg], {
          stdio: ['ignore', 'pipe', 'pipe'],
          detached: false
        });

        let pythonOutput = '';
        let pythonError = '';

        child.stdout.on('data', (data) => {
          pythonOutput += data.toString();
        });

        child.stderr.on('data', (data) => {
          pythonError += data.toString();
        });

        child.on('close', async (code) => {
          console.log('Python process closed with code:', code);

          if (code !== 0) {
            console.error('Python script failed with code:', code);
            console.error('Python stderr:', pythonError);
            return res.status(500).json({
              success: false,
              message: 'Failed to execute Python script',
              error: pythonError,
              exitCode: code
            });
          }

          try {
            console.log('Parsing DataFrame output...');

            // Parse the DataFrame output (same logic as project creation)
            const dataFrames = [];
            const dfDataStart = pythonOutput.indexOf('DF_DATA_START');
            const dfDataEnd = pythonOutput.indexOf('DF_DATA_END');

            if (dfDataStart !== -1 && dfDataEnd !== -1) {
              const dfDataSection = pythonOutput.substring(dfDataStart, dfDataEnd);

              // Try different regex patterns (same as project creation)
              const dfMatches1 = dfDataSection.match(/DF_START (\d+)\n(.*?)\nDF_END \1/gs);
              const dfMatches2 = dfDataSection.match(/DF_START (\d+)\n(.*?)\nDF_END \1/g);
              const dfMatches3 = dfDataSection.match(/DF_START (\d+)\n(.*?)\nDF_END \1/s);

              const dfMatches = dfMatches1 || dfMatches2 || dfMatches3;
              console.log(`DataFrame regex matches: ${dfMatches ? dfMatches.length : 0}`);

              if (dfMatches && dfMatches.length > 0) {
                console.log(`Found ${dfMatches.length} DataFrame matches`);

                for (const match of dfMatches) {
                  const lines = match.split('\n');
                  const dfIndex = parseInt(lines[0].split(' ')[1]);
                  const jsonData = lines.slice(1, -1).join('\n');

                  console.log(`\n--- Parsing DataFrame ${dfIndex} ---`);
                  console.log(`JSON data length: ${jsonData.length}`);
                  console.log(`JSON data preview: ${jsonData.substring(0, 200)}...`);

                  try {
                    const dfData = JSON.parse(jsonData);
                    dataFrames[dfIndex] = dfData;
                    console.log(`✓ Successfully parsed DataFrame ${dfIndex} with ${dfData.length} rows`);
                    console.log(`Sample row:`, dfData[0]);
                  } catch (parseErr) {
                    console.error(`✗ Error parsing DataFrame ${dfIndex}:`, parseErr.message);
                    console.error(`JSON data that failed:`, jsonData.substring(0, 500));
                  }
                }
              } else {
                // Fallback: try to parse manually by splitting on DF_START/DF_END (same as project creation)
                console.log('No regex matches, trying fallback parsing...');
                const parts = dfDataSection.split('DF_START');
                console.log(`Found ${parts.length - 1} DF_START markers`);

                for (let i = 1; i < parts.length; i++) {
                  const part = parts[i];
                  const endIndex = part.indexOf('DF_END');
                  if (endIndex !== -1) {
                    const dfIndex = parseInt(part.split('\n')[0].trim());
                    const jsonData = part.substring(part.indexOf('\n') + 1, endIndex).trim();

                    console.log(`\n--- Fallback parsing DataFrame ${dfIndex} ---`);
                    console.log(`JSON data length: ${jsonData.length}`);
                    console.log(`JSON data preview: ${jsonData.substring(0, 200)}...`);

                    try {
                      const dfData = JSON.parse(jsonData);
                      dataFrames[dfIndex] = dfData;
                    } catch (parseErr) {
                      console.error(`✗ Error parsing DataFrame ${dfIndex}:`, parseErr.message);
                      console.error(`JSON data that failed:`, jsonData.substring(0, 500));
                    }
                  }
                }
              }
            } else {
              console.error('DF_DATA_START or DF_DATA_END not found in output');
            }

            console.log(`Parsed ${dataFrames.length} DataFrames from Python output`);

            if (dataFrames.length === 0) {
              console.error('No DataFrames were parsed! Check Python output.');
              console.log('Python stdout (first 1000 chars):', pythonOutput.substring(0, 1000));
              return res.status(500).json({
                success: false,
                message: 'No data returned from Python script'
              });
            }

            // Log first DataFrame structure for debugging
            if (dataFrames.length > 0 && dataFrames[0].length > 0) {
              console.log('First DataFrame sample:', {
                rowCount: dataFrames[0].length,
                columns: Object.keys(dataFrames[0][0]),
                firstRow: dataFrames[0][0]
              });
            }

            // Now implement the refresh logic
            await refreshProjectData(projectId, dataFrames, branchModelsDict);

            // Set project status to 'active' after successful refresh
            await Project.update(projectId, {
              title: project.title,
              description: project.description,
              refresh_schedule: project.refresh_schedule,
              status: 'active'
            });

            console.log(`Project ${projectId} refresh completed successfully. Status set to active.`);

          } catch (parseError) {
            console.error('Error parsing Python output:', parseError);
            console.error('Raw Python output:', pythonOutput);
            console.error('Python stderr:', pythonError);

            // Set project status to 'sync error' on failure
            await Project.update(projectId, {
              title: project.title,
              description: project.description,
              refresh_schedule: project.refresh_schedule,
              status: 'sync error'
            });
          }
        });

      } catch (error) {
        console.error('Error refreshing project:', error);
        // Set project status to 'sync error' on failure
        try {
          await Project.update(projectId, {
            title: project.title,
            description: project.description,
            refresh_schedule: project.refresh_schedule,
            status: 'sync error'
          });
        } catch (updateError) {
          console.error('Failed to update project status to sync error:', updateError);
        }
      }
    });

  } catch (error) {
    console.error('Error starting refresh:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to start project refresh',
      error: error.message
    });
  }
});

// Helper function to refresh project data
async function refreshProjectData(projectId, newDataFrames, branchModelsDict) {
  console.log('Starting refresh data processing...');

  // Get current project data
  const currentReviews = await KeyReview.getByProject(projectId);
  console.log(`Current project has ${currentReviews.length} key reviews`);

  // Get project groups to understand the structure
  const groups = await Project.getGroups(projectId);

  // Create a map of current key reviews by key name and group
  const currentKeyMap = new Map();
  currentReviews.forEach(review => {
    // Build model_combination from individual model names
    const modelNames = [];
    if (review.target_model_name) modelNames.push(review.target_model_name);
    if (review.ref1_model_name) modelNames.push(review.ref1_model_name);
    if (review.ref2_model_name) modelNames.push(review.ref2_model_name);
    if (review.ref3_model_name) modelNames.push(review.ref3_model_name);
    review.model_combination = modelNames.join(' | ');

    const key = `${review.key_name}_${review.group_name}`;
    if (!currentKeyMap.has(key)) {
      currentKeyMap.set(key, []);
    }
    currentKeyMap.get(key).push(review);
  });


  // Process new data from DataFrames
  const newKeyMap = new Map();
  let dfIndex = 0;


  for (let groupIndex = 0; groupIndex < branchModelsDict.branch.length; groupIndex++) {
    const groupBranches = branchModelsDict.branch[groupIndex];
    const groupModels = branchModelsDict.model[groupIndex];
    const groupName = groups[groupIndex]?.name || `Group_${groupIndex + 1}`;


    for (let modelIndex = 0; modelIndex < groupModels.length; modelIndex++) {
      if (dfIndex >= newDataFrames.length) {
        console.error(`No DataFrame available for model combination ${modelIndex + 1} (dfIndex: ${dfIndex}, total DataFrames: ${newDataFrames.length})`);
        continue;
      }

      const df = newDataFrames[dfIndex];
      const modelNames = groupModels[modelIndex]; // This is an array of model names


      // Process each row in the DataFrame
      for (let rowIndex = 0; rowIndex < df.length; rowIndex++) {
        const row = df[rowIndex];

        // Column names after shim code transformation: 'key name', 'target_model data', 'ref1 model data', 'ref2 model data', 'ref3 model data'
        const keyName = row['key name'];

        if (!keyName) {
          console.warn(`Row ${rowIndex} in DataFrame ${dfIndex} has no key name. Row:`, row);
          continue;
        }

        const key = `${keyName}_${groupName}`;
        if (!newKeyMap.has(key)) {
          newKeyMap.set(key, []);
        }

        // Extract values from standardized column names
        const targetValue = row['target_model data'] || '';
        const ref1Value = row['ref1 model data'] || '';
        const ref2Value = row['ref2 model data'] || '';
        const ref3Value = row['ref3 model data'] || '';

        // Create new key review data
        const newKeyReview = {
          key_name: keyName,
          group_name: groupName,
          model_combination: modelNames.join(' | '),
          target: targetValue,
          ref1: ref1Value,
          ref2: ref2Value,
          ref3: ref3Value,
          branches: groupBranches,
          models: modelNames
        };

        newKeyMap.get(key).push(newKeyReview);
      }

      dfIndex++;
    }
  }


  // Now implement the 4 cases
  await processRefreshCases(projectId, currentKeyMap, newKeyMap, branchModelsDict);
}

// Process the 4 refresh cases
async function processRefreshCases(projectId, currentKeyMap, newKeyMap, branchModelsDict) {

  const allCurrentKeys = new Set(currentKeyMap.keys());
  const allNewKeys = new Set(newKeyMap.keys());

  // Case 0: Keys that exist in both with no data (just for counting)
  console.log(`Case 0: ${allCurrentKeys.size} keys exist in current data, ${allNewKeys.size} keys in new data`);

  // Case 1: Keys that exist in both - check for value changes
  const commonKeys = new Set([...allCurrentKeys].filter(key => allNewKeys.has(key)));
  console.log(`Case 1: ${commonKeys.size} keys exist in both current and new data`);

  for (const key of commonKeys) {
    await processCommonKey(projectId, key, currentKeyMap.get(key), newKeyMap.get(key));
  }

  // Case 2: Keys that exist in current but not in new (missing keys)
  const missingKeys = new Set([...allCurrentKeys].filter(key => !allNewKeys.has(key)));
  console.log(`Case 2: ${missingKeys.size} keys missing from new data`);

  if (missingKeys.size > 0) {
    await processMissingKeys(projectId, missingKeys, currentKeyMap, branchModelsDict);
  }

  // Case 3: Keys that exist in new but not in current (new keys)
  const newKeys = new Set([...allNewKeys].filter(key => !allCurrentKeys.has(key)));
  console.log(`Case 3: ${newKeys.size} new keys to add`);

  for (const key of newKeys) {
    await processNewKey(projectId, key, newKeyMap.get(key));
  }
}

// Process keys that exist in both current and new data
async function processCommonKey(projectId, key, currentReviews, newReviews) {

  for (const currentReview of currentReviews) {
    // Find matching new review by model combination
    const newReview = newReviews.find(nr =>
      nr.model_combination === currentReview.model_combination
    );

    if (!newReview) {
      console.log(`No matching new review for model combination: ${currentReview.model_combination}`);
      continue;
    }

    // Check if values have changed (use correct database field names)
    const valuesChanged =
      currentReview.target_val !== newReview.target ||
      currentReview.ref1_val !== newReview.ref1 ||
      currentReview.ref2_val !== newReview.ref2 ||
      currentReview.ref3_val !== newReview.ref3;

    if (valuesChanged) {

      // Update the key review with new values and set status to "Value Changed"
      await KeyReview.update(currentReview.key_review_id, {
        target: newReview.target,
        ref1: newReview.ref1,
        ref2: newReview.ref2,
        ref3: newReview.ref3,
        status: 'value_changed'
      });

      // Add system comment about the value change (use correct database field names)
      await addSystemComment(currentReview.key_review_id, {
        type: 'value_changed',
        oldValues: {
          target: currentReview.target_val,
          ref1: currentReview.ref1_val,
          ref2: currentReview.ref2_val,
          ref3: currentReview.ref3_val
        },
        newValues: {
          target: newReview.target,
          ref1: newReview.ref1,
          ref2: newReview.ref2,
          ref3: newReview.ref3
        },
        modelCombination: currentReview.model_combination,
        branches: newReview.branches
      });
    }
  }
}

// Process keys that are missing from new data
async function processMissingKeys(projectId, missingKeys, currentKeyMap, branchModelsDict) {

  // Execute Python script to get all data (not just diffs) using shim code
  const pythonPath = 'python';
  const scriptPath = path.join(__dirname, '..', '..', 'sample key review data', 'new_p4_diff_code.py');
  const jsonArg = JSON.stringify(branchModelsDict);

  // Python shim code for get_all_data_from_p4 (same as project creation - uses JSON format with column renaming)
  const shimCode = `import sys,json;\nfrom pathlib import Path;\nfp = ${JSON.stringify(scriptPath) !== undefined ? `r'''${scriptPath.replace(/\\/g, '\\\\')}'''` : `''`};\nimport importlib.util;\nspec = importlib.util.spec_from_file_location('p4mod', fp);\nmod = importlib.util.module_from_spec(spec);\nspec.loader.exec_module(mod);\narg=json.loads(sys.argv[1]);\nprint('P4 shim start (all_data)');\nres = mod.get_all_data_from_p4(arg, mod.model_data, mod.branch_data);\nprint('P4 shim done', len(res) if res else 0);\nprint('DF_COUNT:', len(res) if res else 0);\nimport pandas as pd;\nprint('DF_DATA_START');\nfor i, df in enumerate(res or []):\n    # Transform column names to match expected format safely (4-way -> 3-way -> 2-way)\n    df_processed = df.copy()\n    ncols = len(df_processed.columns)\n    try:\n        if ncols >= 5:\n            df_processed = df_processed.iloc[:, :5]\n            df_processed.columns = ['key name', 'target_model data', 'ref1 model data', 'ref2 model data', 'ref3 model data']\n        elif ncols == 4:\n            df_processed = df_processed.iloc[:, :4]\n            df_processed.columns = ['key name', 'target_model data', 'ref1 model data', 'ref2 model data']\n        elif ncols == 3:\n            df_processed = df_processed.iloc[:, :3]\n            df_processed.columns = ['key name', 'target_model data', 'ref1 model data']\n        else:\n            print('Skipping DF index', i, 'unsupported column count', ncols)\n            continue\n    except Exception as e:\n        print('Column rename error for DF', i, 'with ncols', ncols, ':', e)\n        continue\n    print('DF_START', i);\n    print(df_processed.to_json(orient='records'));\n    print('DF_END', i);\nprint('DF_DATA_END');`;

  const child = spawn(pythonPath, ['-c', shimCode, jsonArg], {
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: false
  });

  let pythonOutput = '';
  let pythonError = '';

  child.stdout.on('data', (data) => {
    pythonOutput += data.toString();
  });

  child.stderr.on('data', (data) => {
    pythonError += data.toString();
  });

  child.on('close', async (code) => {
    if (code !== 0) {
      console.error('Python script failed for missing keys:', pythonError);
      return;
    }

    try {
      // Parse the DataFrame output (same logic as main refresh - JSON format)
      const allDataFrames = [];

      // Use regex to find all DF_START/DF_END blocks
      const dfRegex = /DF_START\s+(\d+)\s*\r?\n([\s\S]*?)\r?\nDF_END\s+\1/g;
      let match;

      while ((match = dfRegex.exec(pythonOutput)) !== null) {
        const dfIndex = match[1];
        const jsonStr = match[2].trim();

        console.log(`Found DataFrame ${dfIndex} for all_data, JSON length: ${jsonStr.length}`);

        try {
          const dfData = JSON.parse(jsonStr);
          if (Array.isArray(dfData)) {
            allDataFrames.push(dfData);
            console.log(`Parsed DataFrame ${dfIndex} for all_data: ${dfData.length} rows`);
          } else {
            console.warn(`DataFrame ${dfIndex} for all_data is not an array:`, typeof dfData);
          }
        } catch (jsonErr) {
          console.error(`Failed to parse JSON for DataFrame ${dfIndex} for all_data:`, jsonErr.message);
          console.error(`JSON string (first 200 chars): ${jsonStr.substring(0, 200)}`);

          // Fallback: try manual parsing
          try {
            const lines = jsonStr.split('\n').filter(line => line.trim());
            if (lines.length > 0) {
              const combinedJson = lines.join('');
              const fallbackData = JSON.parse(combinedJson);
              if (Array.isArray(fallbackData)) {
                allDataFrames.push(fallbackData);
                console.log(`Fallback parse succeeded for DataFrame ${dfIndex} for all_data`);
              }
            }
          } catch (fallbackErr) {
            console.error(`Fallback parse also failed for DataFrame ${dfIndex} for all_data`);
          }
        }
      }

      console.log('Received all data DataFrames:', allDataFrames.length);

      if (allDataFrames.length === 0) {
        console.warn('No DataFrames received from get_all_data_from_p4. Missing keys cannot be processed.');
        console.log('Python output for all_data:', pythonOutput.substring(0, 500));
        return;
      }

      // Process missing keys with all data
      await processMissingKeysWithAllData(projectId, missingKeys, currentKeyMap, allDataFrames, branchModelsDict);

    } catch (parseError) {
      console.error('Error parsing all data output:', parseError);
      console.error('Raw Python output for missing keys:', pythonOutput.substring(0, 1000));
    }
  });
}

// Process missing keys using all data from P4
async function processMissingKeysWithAllData(projectId, missingKeys, currentKeyMap, allDataFrames, branchModelsDict) {

  // Get project groups
  const groups = await Project.getGroups(projectId);

  // Create a map of all data by key name
  const allDataMap = new Map();
  let dfIndex = 0;

  console.log(`Branch models dict structure:`, JSON.stringify(branchModelsDict, null, 2));

  for (let groupIndex = 0; groupIndex < branchModelsDict.branch.length; groupIndex++) {
    const groupBranches = branchModelsDict.branch[groupIndex];
    const groupModels = branchModelsDict.model[groupIndex];
    const groupName = groups[groupIndex]?.name || `Group_${groupIndex + 1}`;


    for (let modelIndex = 0; modelIndex < groupModels.length; modelIndex++) {
      if (dfIndex >= allDataFrames.length) continue;

      const df = allDataFrames[dfIndex];
      const modelNames = groupModels[modelIndex]; // This is an array of model names

      for (let rowIndex = 0; rowIndex < df.length; rowIndex++) {
        const row = df[rowIndex];
        // Column names after shim code transformation: 'key name', 'target_model data', 'ref1 model data', 'ref2 model data', 'ref3 model data'
        const keyName = row['key name'];

        if (!keyName) continue;

        const key = `${keyName}_${groupName}`;
        if (!allDataMap.has(key)) {
          allDataMap.set(key, []);
        }

        // Extract values from standardized column names
        const targetValue = row['target_model data'] || '';
        const ref1Value = row['ref1 model data'] || '';
        const ref2Value = row['ref2 model data'] || '';
        const ref3Value = row['ref3 model data'] || '';

        allDataMap.get(key).push({
          key_name: keyName,
          group_name: groupName,
          model_combination: modelNames.join(' | '),
          target: targetValue,
          ref1: ref1Value,
          ref2: ref2Value,
          ref3: ref3Value,
          branches: groupBranches,
          models: modelNames
        });
      }

      dfIndex++;
    }
  }


  // Process each missing key
  for (const missingKey of missingKeys) {
    const currentReviews = currentKeyMap.get(missingKey);
    const allDataReviews = allDataMap.get(missingKey) || [];


    for (const currentReview of currentReviews) {
      const allDataReview = allDataReviews.find(adr =>
        adr.model_combination === currentReview.model_combination
      );

      if (allDataReview) {
        // Check if values have changed (use correct database field names)
        const valuesChanged =
          currentReview.target_val !== allDataReview.target ||
          currentReview.ref1_val !== allDataReview.ref1 ||
          currentReview.ref2_val !== allDataReview.ref2 ||
          currentReview.ref3_val !== allDataReview.ref3;

        if (valuesChanged) {

          // Update the key review
          await KeyReview.update(currentReview.key_review_id, {
            target: allDataReview.target,
            ref1: allDataReview.ref1,
            ref2: allDataReview.ref2,
            ref3: allDataReview.ref3,
            status: 'value_changed'
          });

          // Add system comment (use correct database field names)
          await addSystemComment(currentReview.key_review_id, {
            type: 'value_changed',
            oldValues: {
              target: currentReview.target_val,
              ref1: currentReview.ref1_val,
              ref2: currentReview.ref2_val,
              ref3: currentReview.ref3_val
            },
            newValues: {
              target: allDataReview.target,
              ref1: allDataReview.ref1,
              ref2: allDataReview.ref2,
              ref3: allDataReview.ref3
            },
            modelCombination: currentReview.model_combination,
            branches: allDataReview.branches
          });
        }
      }
    }
  }
}

// Process new keys that don't exist in current data
async function processNewKey(projectId, key, newReviews) {

  for (const newReview of newReviews) {
    // Extract model names from the models array
    const modelNames = newReview.models || [];

    // Insert new key review as "Unreviewed"
    await KeyReview.create({
      project_id: projectId,
      key_name: newReview.key_name,
      group_name: newReview.group_name,
      target_model_name: modelNames[0] || null,
      ref1_model_name: modelNames[1] || null,
      ref2_model_name: modelNames[2] || null,
      ref3_model_name: modelNames[3] || null,
      target: newReview.target,
      ref1: newReview.ref1,
      ref2: newReview.ref2,
      ref3: newReview.ref3,
      status: 'unreviewed',
      comment: '',
      kona: '',
      cl: ''
    });
  }
}

// Add system comment for value changes
async function addSystemComment(keyReviewId, changeData) {
  const Comment = require('../models/Comment');

  let commentText = `System: Value changed for model combination "${changeData.modelCombination}"\n\n`;
  commentText += `Previous values:\n`;
  commentText += `- Target: ${changeData.oldValues.target}\n`;
  commentText += `- Ref1: ${changeData.oldValues.ref1}\n`;
  commentText += `- Ref2: ${changeData.oldValues.ref2}\n`;
  commentText += `- Ref3: ${changeData.oldValues.ref3}\n\n`;
  commentText += `New values:\n`;
  commentText += `- Target: ${changeData.newValues.target}\n`;
  commentText += `- Ref1: ${changeData.newValues.ref1}\n`;
  commentText += `- Ref2: ${changeData.newValues.ref2}\n`;
  commentText += `- Ref3: ${changeData.newValues.ref3}\n\n`;
  commentText += `Branches: ${changeData.branches.join(', ')}\n`;
  commentText += `Changed at: ${new Date().toISOString()}`;

  await Comment.create({
    key_review_id: keyReviewId,
    comment_text: commentText,
    commented_by_username: 'system'
  });
}

// Intelligent configuration update - processes configuration changes while preserving existing data
async function updateProjectConfiguration(projectId, newGroups) {
  console.log(`Starting intelligent configuration update for project ${projectId}`);

  // Get existing groups from database
  const oldGroups = await Project.getGroups(projectId);

  // Build maps for comparison
  const oldGroupMap = new Map();
  const newGroupMap = new Map();

  oldGroups.forEach(g => {
    const key = `${g.name}_${g.comparison_type}`;
    oldGroupMap.set(key, g);
  });

  newGroups.forEach(g => {
    const key = `${g.name}_${g.comparisonType || g.comparison_type}`;
    newGroupMap.set(key, g);
  });

  // Detect changes
  const groupsToAdd = [];
  const groupsToRemove = [];

  // Check for new groups
  newGroupMap.forEach((newGroup, key) => {
    if (!oldGroupMap.has(key)) {
      groupsToAdd.push(newGroup);
    }
  });

  // Check for removed groups
  oldGroupMap.forEach((oldGroup, key) => {
    if (!newGroupMap.has(key)) {
      groupsToRemove.push(oldGroup);
    }
  });

  console.log(`Configuration changes detected: ${groupsToAdd.length} new groups, ${groupsToRemove.length} removed groups`);

  // Handle removed groups - delete their key reviews
  for (const removedGroup of groupsToRemove) {
    console.log(`Deleting group: ${removedGroup.name} (ID: ${removedGroup.group_id})`);

    // Delete all key reviews for this group
    await executeQuery(
      'DELETE FROM `Key_Reviews` WHERE group_id = ?',
      [removedGroup.group_id]
    );

    // Delete model mappings
    await executeQuery(
      'DELETE FROM `Group_Model_Mapping` WHERE group_id = ?',
      [removedGroup.group_id]
    );

    // Delete the group
    await executeQuery(
      'DELETE FROM `grps` WHERE group_id = ?',
      [removedGroup.group_id]
    );
  }

  // Handle added groups - they will be processed with new key reviews after Python sync
  // For now, just note them
  console.log(`Groups to add: ${groupsToAdd.map(g => g.name).join(', ')}`);

  // Update/Add all new groups to database
  for (const groupData of newGroups) {
    const { name, comparisonType, branches, models } = groupData;

    // Check if group exists
    let existingGroup = oldGroupMap.get(`${name}_${comparisonType}`);

    if (existingGroup) {
      console.log(`Updating existing group: ${name}`);
      // Update existing group's branches if changed
      const branchIds = {};
      if (branches && typeof branches === 'object') {
        for (const [role, branchName] of Object.entries(branches)) {
          const branchQuery = `SELECT branch_id FROM \`Branches\` WHERE branch_name = ?`;
          const branchResults = await executeQuery(branchQuery, [branchName]);
          if (branchResults.length > 0) {
            const id = branchResults[0].branch_id;
            // Normalize UI keys (reference1/2/3) to DB keys (ref1/2/3)
            if (role === 'reference1' || role === 'ref1' || role === 'reference') branchIds.ref1 = id;
            else if (role === 'reference2' || role === 'ref2') branchIds.ref2 = id;
            else if (role === 'reference3' || role === 'ref3') branchIds.ref3 = id;
            else if (role === 'target') branchIds.target = id;
          }
        }
      }

      // Update group branches
      await executeQuery(
        `UPDATE \`grps\` SET target_branch_id = ?, ref1_branch_id = ?, ref2_branch_id = ?, ref3_branch_id = ? 
         WHERE group_id = ?`,
        [
          branchIds.target || null,
          branchIds.ref1 || null,
          branchIds.ref2 || null,
          branchIds.ref3 || null,
          existingGroup.group_id
        ]
      );

      // Diff model mappings: add new, remove deleted, keep unchanged
      const existingMappings = await executeQuery(
        'SELECT gm_id, target_model_id, ref1_model_id, ref2_model_id, ref3_model_id FROM `Group_Model_Mapping` WHERE group_id = ?',
        [existingGroup.group_id]
      );

      const existingKeyByTuple = new Map();
      for (const row of existingMappings) {
        const tupleKey = [row.target_model_id || 0, row.ref1_model_id || 0, row.ref2_model_id || 0, row.ref3_model_id || 0].join('|');
        existingKeyByTuple.set(tupleKey, row.gm_id);
      }

      const desiredTupleSet = new Set();
      const desiredTuples = [];
      if (models && Array.isArray(models)) {
        for (const modelData of models) {
          const normalized = {};
          if (typeof modelData === 'string') {
            normalized.target = modelData;
          } else if (modelData && typeof modelData === 'object') {
            normalized.target = modelData.target || modelData.target1 || modelData.model || modelData.model_name || null;
            normalized.ref1 = modelData.reference || modelData.reference1 || modelData.ref1 || modelData.target2 || null;
            normalized.ref2 = modelData.reference2 || modelData.ref2 || null;
            normalized.ref3 = modelData.reference3 || modelData.ref3 || null;
          }

          const modelIds = {};
          for (const [role, modelName] of Object.entries(normalized)) {
            if (modelName) {
              const modelQuery = `SELECT model_id FROM \`Models\` WHERE model_name = ?`;
              const modelResults = await executeQuery(modelQuery, [modelName]);
              if (modelResults.length > 0) {
                modelIds[role] = modelResults[0].model_id;
              }
            }
          }

          if (!modelIds.target) continue;
          const tuple = [modelIds.target || 0, modelIds.ref1 || 0, modelIds.ref2 || 0, modelIds.ref3 || 0];
          const tupleKey = tuple.join('|');
          desiredTupleSet.add(tupleKey);
          desiredTuples.push({ tuple, modelIds });
        }
      }

      // Insert additions
      for (const { tuple, modelIds } of desiredTuples) {
        const tupleKey = tuple.join('|');
        if (!existingKeyByTuple.has(tupleKey)) {
          await executeQuery(
            'INSERT INTO `Group_Model_Mapping` (group_id, target_model_id, ref1_model_id, ref2_model_id, ref3_model_id) VALUES (?, ?, ?, ?, ?)',
            [
              existingGroup.group_id,
              modelIds.target || null,
              modelIds.ref1 || null,
              modelIds.ref2 || null,
              modelIds.ref3 || null
            ]
          );
        }
      }

      // Delete removals (and their key reviews)
      for (const [tupleKey, gmId] of existingKeyByTuple.entries()) {
        if (!desiredTupleSet.has(tupleKey)) {
          await executeQuery('DELETE FROM `Key_Reviews` WHERE gm_id = ?', [gmId]);
          await executeQuery('DELETE FROM `Group_Model_Mapping` WHERE gm_id = ?', [gmId]);
        }
      }
    } else {
      console.log(`Creating new group: ${name}`);
      // Create new group
      const branchIds = {};
      if (branches && typeof branches === 'object') {
        for (const [role, branchName] of Object.entries(branches)) {
          const branchQuery = `SELECT branch_id FROM \`Branches\` WHERE branch_name = ?`;
          const branchResults = await executeQuery(branchQuery, [branchName]);
          if (branchResults.length > 0) {
            const id = branchResults[0].branch_id;
            if (role === 'reference1' || role === 'ref1' || role === 'reference') branchIds.ref1 = id;
            else if (role === 'reference2' || role === 'ref2') branchIds.ref2 = id;
            else if (role === 'reference3' || role === 'ref3') branchIds.ref3 = id;
            else if (role === 'target') branchIds.target = id;
          }
        }
      }

      const groupQuery = `
        INSERT INTO \`grps\` (project_id, name, comparison_type, target_branch_id, ref1_branch_id, ref2_branch_id, ref3_branch_id)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;

      const groupResult = await executeQuery(groupQuery, [
        projectId,
        name,
        comparisonType,
        branchIds.target || null,
        branchIds.ref1 || null,
        branchIds.ref2 || null,
        branchIds.ref3 || null
      ]);

      existingGroup = { group_id: groupResult.insertId };
    }

    // Add models to the new group
    if (models && Array.isArray(models) && models.length > 0) {
      for (const modelData of models) {
        // Normalize various possible shapes from UI
        const normalized = {};
        if (typeof modelData === 'string') {
          normalized.target = modelData;
        } else if (modelData && typeof modelData === 'object') {
          normalized.target = modelData.target || modelData.target1 || modelData.model || modelData.model_name || null;
          normalized.ref1 = modelData.reference || modelData.reference1 || modelData.ref1 || modelData.target2 || null;
          normalized.ref2 = modelData.reference2 || modelData.ref2 || null;
          normalized.ref3 = modelData.reference3 || modelData.ref3 || null;
        }

        const modelIds = {};
        for (const [role, modelName] of Object.entries(normalized)) {
          if (modelName) {
            const modelQuery = `SELECT model_id FROM \`Models\` WHERE model_name = ?`;
            const modelResults = await executeQuery(modelQuery, [modelName]);
            if (modelResults.length > 0) {
              modelIds[role] = modelResults[0].model_id;
            }
          }
        }

        // If no valid target, skip this model row
        if (!modelIds.target) {
          console.warn('Skipping model row without valid target model for group', existingGroup.group_id);
          continue;
        }

        const modelMappingQuery = `
        INSERT INTO \`Group_Model_Mapping\` (group_id, target_model_id, ref1_model_id, ref2_model_id, ref3_model_id)
        VALUES (?, ?, ?, ?, ?)
      `;

        await executeQuery(modelMappingQuery, [
          existingGroup.group_id,
          modelIds.target || null,
          modelIds.ref1 || modelIds.reference || null,
          modelIds.ref2 || null,
          modelIds.ref3 || null
        ]);
      }
    }
  }

  console.log(`Configuration update complete. ${groupsToAdd.length} new groups will be synced.`);
  return { groupsToAdd, groupsToRemove };
}

// Refresh project data after configuration update
async function refreshProjectDataAfterConfigUpdate(projectId) {
  console.log(`Starting P4 sync for updated project ${projectId}`);

  try {
    // Get current project groups
    const groups = await Project.getGroups(projectId);

    // Build branch_models_dict (same logic as refresh endpoint)
    const branchList2D = [];
    const modelList3D = [];

    for (const group of groups) {
      const comparisonType = group.comparison_type || group.comparisonType;
      const branches = [];

      if (group.target_branch_name) {
        branches.push(group.target_branch_name);
      }

      if (comparisonType === '2-way' || comparisonType === '3-way' || comparisonType === '4-way' || comparisonType === '2-way-vs-2-way' || comparisonType === '2-way vs 2-way') {
        if (group.ref1_branch_name) {
          branches.push(group.ref1_branch_name);
        }
      }

      if (comparisonType === '3-way' || comparisonType === '4-way') {
        if (group.ref2_branch_name) {
          branches.push(group.ref2_branch_name);
        }
      }

      if (comparisonType === '4-way') {
        if (group.ref3_branch_name) {
          branches.push(group.ref3_branch_name);
        }
      }

      branchList2D.push(branches);

      const modelCombinations = await Project.getGroupModelCombinations(group.group_id);
      const seenCombos = new Set();
      const modelRows = [];
      for (const row of modelCombinations) {
        const models = [];
        if (row.target) models.push(row.target);
        if (branches.length >= 2) models.push(row.reference || row.reference1 || row.target);
        if (branches.length >= 3) models.push(row.reference2 || row.target);
        if (branches.length >= 4) models.push(row.reference3 || row.target);
        const key = models.join('|');
        if (!seenCombos.has(key)) {
          seenCombos.add(key);
          modelRows.push(models);
        }
      }
      modelList3D.push(modelRows);
    }

    const branchModelsDict = { branch: branchList2D, model: modelList3D };
    console.log(`Edit-config branchModelsDict for project ${projectId}:`, JSON.stringify(branchModelsDict));

    // Execute Python script to get diff data
    const pythonPath = 'python';
    const scriptPath = path.join(__dirname, '..', '..', 'sample key review data', 'new_p4_diff_code.py');
    const jsonArg = JSON.stringify(branchModelsDict);

    // Determine which Python function to call based on comparison types
    const has2WayVs2Way = groups.some(group => {
      const ct = group.comparison_type || group.comparisonType;
      return ct === '2-way-vs-2-way' || ct === '2-way vs 2-way';
    });
    const pythonFunction = has2WayVs2Way ? 'get_dif_from_p4_2wayvs2way' : 'get_dif_from_p4';

    const shimCode = `import sys,json;\nfrom pathlib import Path;\nfp = ${JSON.stringify(scriptPath) !== undefined ? `r'''${scriptPath.replace(/\\/g, '\\\\')}'''` : `''`};\nimport importlib.util;\nspec = importlib.util.spec_from_file_location('p4mod', fp);\nmod = importlib.util.module_from_spec(spec);\nspec.loader.exec_module(mod);\narg=json.loads(sys.argv[1]);\nprint('P4 shim start');\nres = mod.${pythonFunction}(arg, mod.model_data, mod.branch_data);\nprint('P4 shim done', len(res) if res else 0);\nprint('DF_COUNT:', len(res) if res else 0);\nimport pandas as pd;\nprint('DF_DATA_START');\nfor i, df in enumerate(res or []):\n    df_processed = df.copy()\n    ncols = len(df_processed.columns)\n    try:\n        if ncols >= 5:\n            df_processed = df_processed.iloc[:, :5]\n            df_processed.columns = ['key name', 'target_model data', 'ref1 model data', 'ref2 model data', 'ref3 model data']\n        elif ncols == 4:\n            df_processed = df_processed.iloc[:, :4]\n            df_processed.columns = ['key name', 'target_model data', 'ref1 model data', 'ref2 model data']\n        elif ncols == 3:\n            df_processed = df_processed.iloc[:, :3]\n            df_processed.columns = ['key name', 'target_model data', 'ref1 model data']\n        else:\n            continue\n    except Exception as e:\n        continue\n    print('DF_START', i);\n    print(df_processed.to_json(orient='records'));\n    print('DF_END', i);\nprint('DF_DATA_END')`;

    const child = spawn(pythonPath, ['-c', shimCode, jsonArg], {
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: false
    });

    let output = '';
    let errorOutput = '';

    child.stdout.on('data', (data) => {
      output += data.toString();
    });

    child.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    child.on('exit', async (code) => {
      if (code !== 0) {
        console.error('Python script failed');
        if (errorOutput) {
          console.error('Python stderr:', errorOutput);
        }
        await Project.update(projectId, { status: 'sync error' });
        return;
      }

      console.log('=== Python Output (first 500 chars) ===');
      console.log(output.substring(0, 500));
      console.log('=== End Python Output ===');

      // Parse DataFrame data
      const dfCountMatch = output.match(/DF_COUNT:\s*(\d+)/);
      const dfCount = dfCountMatch ? parseInt(dfCountMatch[1]) : 0;
      console.log(`Detected DF_COUNT: ${dfCount}`);

      if (dfCount > 0) {
        const dataFrames = [];
        const dfDataStart = output.indexOf('DF_DATA_START');
        const dfDataEnd = output.indexOf('DF_DATA_END');

        if (dfDataStart !== -1 && dfDataEnd !== -1) {
          const dfDataSection = output.substring(dfDataStart, dfDataEnd);
          const dfMatches = dfDataSection.match(/DF_START (\d+)\n(.*?)\nDF_END \1/gs);

          console.log(`Found ${dfMatches ? dfMatches.length : 0} DataFrame matches`);

          if (dfMatches) {
            for (const match of dfMatches) {
              const lines = match.split('\n');
              const dfIndex = parseInt(lines[0].split(' ')[1]);
              const jsonData = lines.slice(1, -1).join('\n');

              try {
                const dfData = JSON.parse(jsonData);
                dataFrames[dfIndex] = dfData;
                console.log(`Parsed DataFrame ${dfIndex}: ${dfData.length} rows`);
              } catch (parseErr) {
                console.error(`Error parsing DataFrame ${dfIndex}:`, parseErr.message);
                console.error('JSON data:', jsonData.substring(0, 200));
              }
            }
          }

          console.log(`Total DataFrames parsed: ${dataFrames.filter(Boolean).length}`);
          // Process edit-config: preserve user data (comments, status, KONA, CL) while syncing new diff
          await processEditConfigSync(projectId, dataFrames, branchModelsDict);
        } else {
          console.log('Could not find DF_DATA_START or DF_DATA_END markers');
        }
      } else {
        console.log('No DataFrames returned from Python; preserving existing key reviews');
      }

      // Set status to active
      await Project.update(projectId, { status: 'active' });
      console.log(`Configuration sync complete for project ${projectId}`);
    });
  } catch (error) {
    console.error('Configuration sync error:', error);
    await Project.update(projectId, { status: 'sync error' });
    throw error;
  }
}

// Process edit-config sync: replace all key reviews with new diff data while preserving user annotations
async function processEditConfigSync(projectId, newDataFrames, branchModelsDict) {
  console.log('Processing edit-config sync: preserving comments/status/KONA/CL...');

  const KeyReview = require('../models/KeyReview');
  const groups = await Project.getGroups(projectId);

  // Step 1: Save all existing key reviews with their user data in memory
  const existingReviews = await KeyReview.getByProject(projectId);
  const savedUserData = new Map(); // key: "fms_key_name|group_name|model_combo", value: { status, comments, kona, cl }

  for (const review of existingReviews) {
    const modelCombo = [
      review.target_model_name,
      review.ref1_model_name,
      review.ref2_model_name,
      review.ref3_model_name
    ].filter(Boolean).join(' | ');

    const lookupKey = `${review.key_name}|${review.group_name}|${modelCombo}`;
    savedUserData.set(lookupKey, {
      status: review.status,
      kona_ids: review.kona_ids,
      cl_numbers: review.cl_numbers
    });
  }

  console.log(`Saved ${savedUserData.size} existing key reviews with user data`);

  // Step 2: Delete existing key reviews only for groups that will be synced
  // (updateProjectConfiguration already deleted key reviews for removed groups)
  const groupIds = groups.map(g => g.group_id);
  if (groupIds.length > 0) {
    const placeholders = groupIds.map(() => '?').join(',');
    await executeQuery(`DELETE FROM \`Key_Reviews\` WHERE group_id IN (${placeholders})`, groupIds);
    console.log(`Cleared existing key reviews for ${groupIds.length} groups`);
  }

  // Step 3: Insert all new key reviews from Python diff data
  let dfIndex = 0;
  let insertedCount = 0;
  let restoredCount = 0;

  for (let groupIndex = 0; groupIndex < branchModelsDict.branch.length; groupIndex++) {
    const groupBranches = branchModelsDict.branch[groupIndex];
    const groupModels = branchModelsDict.model[groupIndex];
    const groupName = groups[groupIndex]?.name || `Group_${groupIndex + 1}`;

    for (let modelIndex = 0; modelIndex < groupModels.length; modelIndex++) {
      if (dfIndex >= newDataFrames.length) {
        console.log(`No DataFrame available for model combination ${modelIndex + 1} (dfIndex: ${dfIndex}, total DataFrames: ${newDataFrames.length})`);
        dfIndex++;
        continue;
      }

      const df = newDataFrames[dfIndex];
      const modelNames = groupModels[modelIndex];

      for (let rowIndex = 0; rowIndex < df.length; rowIndex++) {
        const row = df[rowIndex];
        const keyName = row['key name'];
        if (!keyName) continue;

        const modelCombo = modelNames.join(' | ');
        const lookupKey = `${keyName}|${groupName}|${modelCombo}`;

        // Check if we have saved user data for this key+model combination
        const saved = savedUserData.get(lookupKey);

        await KeyReview.create({
          project_id: projectId,
          key_name: keyName,
          group_name: groupName,
          target_model_name: modelNames[0] || null,
          ref1_model_name: modelNames[1] || null,
          ref2_model_name: modelNames[2] || null,
          ref3_model_name: modelNames[3] || null,
          target: row['target_model data'] || '',
          ref1: row['ref1 model data'] || '',
          ref2: row['ref2 model data'] || '',
          ref3: row['ref3 model data'] || '',
          status: saved ? saved.status : 'unreviewed',
          kona_ids: saved ? saved.kona_ids : null,
          cl_numbers: saved ? saved.cl_numbers : null
        });

        insertedCount++;
        if (saved) {
          restoredCount++;
        }
      }
      dfIndex++;
    }
  }

  console.log(`✓ Inserted ${insertedCount} key reviews; restored user data for ${restoredCount} keys`);

  // Step 4: Restore comments for matching key+model combinations
  const Comment = require('../models/Comment');
  const newReviews = await KeyReview.getByProject(projectId);

  for (const newReview of newReviews) {
    const modelCombo = [
      newReview.target_model_name,
      newReview.ref1_model_name,
      newReview.ref2_model_name,
      newReview.ref3_model_name
    ].filter(Boolean).join(' | ');

    const lookupKey = `${newReview.key_name}|${newReview.group_name}|${modelCombo}`;

    // Find old review ID that matches this key+model combo
    const oldReview = existingReviews.find(old => {
      const oldModelCombo = [
        old.target_model_name,
        old.ref1_model_name,
        old.ref2_model_name,
        old.ref3_model_name
      ].filter(Boolean).join(' | ');
      return old.key_name === newReview.key_name &&
        old.group_name === newReview.group_name &&
        oldModelCombo === modelCombo;
    });

    if (oldReview && oldReview.key_review_id) {
      // Copy all comments from old review to new review
      const oldComments = await executeQuery(
        'SELECT * FROM `Comments` WHERE key_review_id = ? ORDER BY created_at ASC',
        [oldReview.key_review_id]
      );

      for (const oldComment of oldComments) {
        await executeQuery(
          'INSERT INTO `Comments` (key_review_id, user_id, comment_text, created_at) VALUES (?, ?, ?, ?)',
          [newReview.key_review_id, oldComment.user_id, oldComment.comment_text, oldComment.created_at]
        );
      }
    }
  }

  console.log('✓ Comments restored for matching key reviews');
}

// Expose internal refresh function to other modules (e.g., scheduler)
// This preserves the router default export while attaching helpers as properties.
router.refreshProjectData = refreshProjectData;

module.exports = router;
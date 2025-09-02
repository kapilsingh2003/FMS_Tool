const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const USERS_FILE = path.join(__dirname, '../data/users.json');
const PROJECTS_FILE = path.join(__dirname, '../data/projects.json');

// Utility: Load users
const loadUsers = () => {
    if (!fs.existsSync(USERS_FILE)) return [];
    const data = fs.readFileSync(USERS_FILE);
    return JSON.parse(data);
};

// Utility: Save users
const saveUsers = (users) => {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
};

// Utility: Load projects
const loadProjects = () => {
    if (!fs.existsSync(PROJECTS_FILE)) return [];
    const data = fs.readFileSync(PROJECTS_FILE);
    return JSON.parse(data);
};

// Utility: Save projects
const saveProjects = (projects) => {
    fs.writeFileSync(PROJECTS_FILE, JSON.stringify(projects, null, 2));
};

// GET /api/users - Get all users (admin only)
router.get('/', (req, res) => {
    try {
        const users = loadUsers();
        // Remove passwords from response for security
        const safeUsers = users.map(user => {
            const { password, ...userWithoutPassword } = user;
            return userWithoutPassword;
        });
        res.json(safeUsers);
    } catch (error) {
        console.error('Error loading users:', error);
        res.status(500).json({ message: 'Error loading users' });
    }
});

// GET /api/users/:username - Get specific user (admin only)
router.get('/:username', (req, res) => {
    try {
        const users = loadUsers();
        const user = users.find(u => u.username === req.params.username);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Remove password from response
        const { password, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
    } catch (error) {
        console.error('Error loading user:', error);
        res.status(500).json({ message: 'Error loading user' });
    }
});

// PUT /api/users/:username - Update user (admin only)
router.put('/:username', (req, res) => {
    try {
        const users = loadUsers();
        const userIndex = users.findIndex(u => u.username === req.params.username);

        if (userIndex === -1) {
            return res.status(404).json({ message: 'User not found' });
        }

        const { password, ...updateData } = req.body;
        const updatedUser = {
            ...users[userIndex],
            ...updateData,
            updatedAt: new Date().toISOString()
        };

        // Only update password if provided
        if (password) {
            updatedUser.password = password; // In production, hash this!
        }

        users[userIndex] = updatedUser;
        saveUsers(users);

        // Remove password from response
        const { password: _, ...userWithoutPassword } = updatedUser;
        res.json({ success: true, user: userWithoutPassword });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ message: 'Error updating user' });
    }
});

// DELETE /api/users/:username - Delete user (admin only)
router.delete('/:username', (req, res) => {
    try {
        const users = loadUsers();
        const userIndex = users.findIndex(u => u.username === req.params.username);

        if (userIndex === -1) {
            return res.status(404).json({ message: 'User not found' });
        }

        const deletedUser = users[userIndex];
        users.splice(userIndex, 1);
        saveUsers(users);

        res.json({ success: true, message: 'User deleted successfully', user: deletedUser });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ message: 'Error deleting user' });
    }
});

// POST /api/users/:username/projects/:projectId - Add user to project
router.post('/:username/projects/:projectId', (req, res) => {
    try {
        const projects = loadProjects();
        const users = loadUsers();

        const user = users.find(u => u.username === req.params.username);
        const projectIndex = projects.findIndex(p => p.id.toString() === req.params.projectId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (projectIndex === -1) {
            return res.status(404).json({ message: 'Project not found' });
        }

        const project = projects[projectIndex];

        // Initialize participants array if it doesn't exist
        if (!project.participants) {
            project.participants = [];
        }

        // Add user to project if not already added
        if (!project.participants.includes(user.username)) {
            project.participants.push(user.username);
            projects[projectIndex] = project;
            saveProjects(projects);

            res.json({
                success: true,
                message: 'User added to project successfully',
                project: project
            });
        } else {
            res.json({
                success: true,
                message: 'User already in project',
                project: project
            });
        }
    } catch (error) {
        console.error('Error adding user to project:', error);
        res.status(500).json({ message: 'Error adding user to project' });
    }
});

// DELETE /api/users/:username/projects/:projectId - Remove user from project
router.delete('/:username/projects/:projectId', (req, res) => {
    try {
        const projects = loadProjects();
        const users = loadUsers();

        const user = users.find(u => u.username === req.params.username);
        const projectIndex = projects.findIndex(p => p.id.toString() === req.params.projectId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (projectIndex === -1) {
            return res.status(404).json({ message: 'Project not found' });
        }

        const project = projects[projectIndex];

        if (project.participants) {
            project.participants = project.participants.filter(username => username !== user.username);
            projects[projectIndex] = project;
            saveProjects(projects);
        }

        res.json({
            success: true,
            message: 'User removed from project successfully',
            project: project
        });
    } catch (error) {
        console.error('Error removing user from project:', error);
        res.status(500).json({ message: 'Error removing user from project' });
    }
});

// GET /api/users/:username/projects - Get projects for a specific user
router.get('/:username/projects', (req, res) => {
    try {
        const projects = loadProjects();
        const users = loadUsers();

        const user = users.find(u => u.username === req.params.username);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Find projects where user is admin or participant
        const userProjects = projects.filter(project =>
            project.adminId === user.username ||
            (project.participants && project.participants.includes(user.username))
        );

        res.json(userProjects);
    } catch (error) {
        console.error('Error loading user projects:', error);
        res.status(500).json({ message: 'Error loading user projects' });
    }
});

module.exports = router; 
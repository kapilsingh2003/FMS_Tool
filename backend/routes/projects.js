const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const PROJECTS_FILE = path.join(__dirname, '../data/projects.json');

// Load projects
const loadProjects = () => {
  if (!fs.existsSync(PROJECTS_FILE)) return [];
  return JSON.parse(fs.readFileSync(PROJECTS_FILE));
};

// Save projects
const saveProjects = (projects) => {
  fs.writeFileSync(PROJECTS_FILE, JSON.stringify(projects, null, 2));
};

// GET /api/projects
router.get('/', (req, res) => {
  const projects = loadProjects();
  res.json(projects);
});

// GET /api/projects/:id - Get specific project
router.get('/:id', (req, res) => {
  try {
    const projects = loadProjects();
    const project = projects.find(p => p.id.toString() === req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.json(project);
  } catch (error) {
    console.error('Error loading project:', error);
    res.status(500).json({ message: 'Error loading project' });
  }
});

// POST /api/projects
router.post('/', (req, res) => {
  const { title, description, adminName, adminId, models } = req.body;

  const projects = loadProjects();
  const newProject = {
    id: Date.now(),
    title,
    description,
    adminName,
    adminId,
    models,
    participants: [], // Initialize empty participants array
    createdDate: new Date().toISOString()
  };

  projects.push(newProject);
  saveProjects(projects);

  res.json({ success: true, project: newProject });
});

module.exports = router;
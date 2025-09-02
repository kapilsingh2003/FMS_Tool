const express = require('express');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const router = express.Router();

// GET /api/reference/models
router.get('/models', (req, res) => {
  const results = [];
  const modelsFile = path.join(__dirname, '../data/models.csv');

  fs.createReadStream(modelsFile)
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', () => {
      res.json(results);
    })
    .on('error', (err) => {
      console.error(err);
      res.status(500).json({ message: 'Error reading models.csv' });
    });
});

// GET /api/reference/branches
router.get('/branches', (req, res) => {
  const results = [];
  const branchesFile = path.join(__dirname, '../data/branches.csv');

  fs.createReadStream(branchesFile)
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', () => {
      res.json(results);
    })
    .on('error', (err) => {
      console.error(err);
      res.status(500).json({ message: 'Error reading branches.csv' });
    });
});

module.exports = router;

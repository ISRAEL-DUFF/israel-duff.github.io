// require('dotenv').config();
const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const JSZip = require('jszip');
const path = require('path');
const fs = require('fs').promises;
const { body, validationResult } = require('express-validator');

const { getDatabase } = require('../database/init');
const { processStoryUpload } = require('../services/storyService');

const router = express.Router();

// Configure multer for handling multipart/form-data
let fileSize = parseInt(process.env.MAX_FILE_SIZE) || 50 * 1024 * 1024; // 50MB default;
console.log('FILE SIZE:', fileSize)

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    // fileSize,
    files: 2 // story.json and assets.zip
  },
  fileFilter: (req, file, cb) => {
    // Only allow specific file types
    if (file.fieldname === 'story' && file.mimetype === 'application/json') {
      cb(null, true);
    } else if (file.fieldname === 'assets' && file.mimetype === 'application/zip') {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  }
});

// Validation middleware
const validateStoryData = [
  body('title').isString().trim().isLength({ min: 1, max: 200 }),
  body('scenes').isArray({ min: 1, max: 10 }),
  body('scenes.*.greekText').isString().trim().isLength({ min: 1 }),
  body('scenes.*.englishTranslation').isString().trim().isLength({ min: 1 }),
  body('scenes.*.imagePrompt').isString().trim().isLength({ min: 1 })
];

// POST /api/stories/save-with-assets
// Save a story with its associated assets (images and audio)
router.post('/save-with-assets', upload.fields([
  { name: 'story', maxCount: 1 },
  { name: 'assets', maxCount: 1 }
]), async (req, res, next) => {
  try {
    // Check if files were uploaded
    if (!req.files || !req.files.story || !req.files.assets) {
      return res.status(400).json({
        error: 'Missing Files',
        message: 'Both story.json and assets.zip files are required'
      });
    }

    const storyFile = req.files.story[0];
    const assetsFile = req.files.assets[0];

    // Parse story JSON
    let storyData;
    try {
      const storyContent = storyFile.buffer.toString('utf8');
      storyData = JSON.parse(storyContent);
    } catch (error) {
      return res.status(400).json({
        error: 'Invalid Story Format',
        message: 'The story file must be valid JSON'
      });
    }

    // Validate story data
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid story data',
        details: errors.array()
      });
    }

    // Process the upload
    const result = await processStoryUpload(storyData, assetsFile.buffer);
    
    res.status(201).json({
      message: 'Story saved successfully',
      storyId: result.storyId,
      assetsCount: result.assetsCount
    });

  } catch (error) {
    next(error);
  }
});

// GET /api/stories/list
// Get a list of all saved stories
router.get('/list', async (req, res, next) => {
  try {
    const database = getDatabase();
    
    const query = `
      SELECT 
        s.id,
        s.title,
        s.created_at as createdAt,
        s.updated_at as updatedAt,
        COUNT(a.id) as assetCount
      FROM stories s
      LEFT JOIN assets a ON s.id = a.story_id
      GROUP BY s.id
      ORDER BY s.created_at DESC
    `;

    database.all(query, [], (err, rows) => {
      if (err) {
        return next(err);
      }

      const stories = rows.map(row => ({
        id: row.id,
        title: row.title,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        assetCount: row.assetCount
      }));

      res.json({ stories });
    });

  } catch (error) {
    next(error);
  }
});

// GET /api/stories/:id
// Get a specific story with its assets
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const database = getDatabase();

    // Get story data
    const storyQuery = 'SELECT * FROM stories WHERE id = ?';
    database.get(storyQuery, [id], (err, storyRow) => {
      if (err) {
        return next(err);
      }

      if (!storyRow) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Story not found'
        });
      }

      // Get assets for this story
      const assetsQuery = 'SELECT * FROM assets WHERE story_id = ? ORDER BY scene_index, asset_type';
      database.all(assetsQuery, [id], (err, assetRows) => {
        if (err) {
          return next(err);
        }

        // Parse scenes JSON
        let scenes;
        try {
          scenes = JSON.parse(storyRow.scenes);
        } catch (error) {
          return next(new Error('Invalid story data in database'));
        }

        // Organize assets by scene index
        const assets = {};
        assetRows.forEach(asset => {
          if (!assets[asset.scene_index]) {
            assets[asset.scene_index] = {};
          }
          
          const assetUrl = `/assets/${asset.file_path}`;
          if (asset.asset_type === 'image') {
            assets[asset.scene_index].imageUrl = assetUrl;
          } else if (asset.asset_type === 'audio') {
            assets[asset.scene_index].audioUrl = assetUrl;
          }
        });

        const story = {
          id: storyRow.id,
          title: storyRow.title,
          scenes: scenes,
          assets: assets,
          createdAt: storyRow.created_at,
          updatedAt: storyRow.updated_at
        };

        res.json({ story });
      });
    });

  } catch (error) {
    next(error);
  }
});

// DELETE /api/stories/:id
// Delete a story and all its assets
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const database = getDatabase();

    // Get assets to delete files
    const assetsQuery = 'SELECT file_path FROM assets WHERE story_id = ?';
    database.all(assetsQuery, [id], async (err, assetRows) => {
      if (err) {
        return next(err);
      }

      // Delete asset files
      const uploadsDir = process.env.STORAGE_PATH || './uploads';
      for (const asset of assetRows) {
        try {
          await fs.unlink(path.join(uploadsDir, asset.file_path));
        } catch (fileError) {
          console.warn(`Failed to delete asset file: ${asset.file_path}`, fileError);
        }
      }

      // Delete from database (cascade will handle assets)
      const deleteQuery = 'DELETE FROM stories WHERE id = ?';
      database.run(deleteQuery, [id], function(err) {
        if (err) {
          return next(err);
        }

        if (this.changes === 0) {
          return res.status(404).json({
            error: 'Not Found',
            message: 'Story not found'
          });
        }

        res.json({
          message: 'Story deleted successfully',
          deletedAssets: assetRows.length
        });
      });
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router; 
const { v4: uuidv4 } = require('uuid');
const JSZip = require('jszip');
const path = require('path');
const fs = require('fs').promises;
const { getDatabase } = require('../database/init');

/**
 * Process a story upload by extracting assets from ZIP and saving to database
 * @param {Object} storyData - The story JSON data
 * @param {Buffer} assetsZipBuffer - The ZIP file buffer containing assets
 * @returns {Promise<Object>} - Result with storyId and assetsCount
 */
async function processStoryUpload(storyData, assetsZipBuffer) {
  const storyId = uuidv4();
  const database = getDatabase();
  const uploadsDir = process.env.STORAGE_PATH || './uploads';
  
  // Create story-specific directory
  const storyDir = path.join(uploadsDir, storyId);
  await fs.mkdir(storyDir, { recursive: true });

  try {
    // Extract ZIP file
    const zip = new JSZip();
    const zipContent = await zip.loadAsync(assetsZipBuffer);
    
    const assetFiles = [];
    const assetPromises = [];

    // Process each file in the ZIP
    for (const [filename, file] of Object.entries(zipContent.files)) {
      if (file.dir) continue; // Skip directories

      // Parse filename to get scene index and asset type
      const match = filename.match(/^(image|audio)_(\d+)\.(png|wav)$/);
      if (!match) {
        console.warn(`Skipping unrecognized file: ${filename}`);
        continue;
      }

      const [, assetType, sceneIndex, extension] = match;
      const sceneIndexNum = parseInt(sceneIndex, 10);

      // Generate unique filename
      const uniqueFilename = `${assetType}_${sceneIndex}_${uuidv4()}.${extension}`;
      const filePath = path.join(storyId, uniqueFilename);
      const fullPath = path.join(uploadsDir, filePath);

      // Extract file content
      const fileContent = await file.async('nodebuffer');
      
      // Save file to disk
      const writePromise = fs.writeFile(fullPath, fileContent);
      assetPromises.push(writePromise);

      // Prepare asset record
      assetFiles.push({
        id: uuidv4(),
        storyId,
        sceneIndex: sceneIndexNum,
        assetType,
        filePath,
        fileName: filename
      });
    }

    // Wait for all files to be written
    await Promise.all(assetPromises);

    // Save story to database
    await new Promise((resolve, reject) => {
      const storyQuery = `
        INSERT INTO stories (id, title, scenes) 
        VALUES (?, ?, ?)
      `;
      
      database.run(storyQuery, [
        storyId,
        storyData.title,
        JSON.stringify(storyData.scenes)
      ], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });

    // Save assets to database
    for (const asset of assetFiles) {
      await new Promise((resolve, reject) => {
        const assetQuery = `
          INSERT INTO assets (id, story_id, scene_index, asset_type, file_path, file_name)
          VALUES (?, ?, ?, ?, ?, ?)
        `;
        
        database.run(assetQuery, [
          asset.id,
          asset.storyId,
          asset.sceneIndex,
          asset.assetType,
          asset.filePath,
          asset.fileName
        ], function(err) {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    }

    return {
      storyId,
      assetsCount: assetFiles.length
    };

  } catch (error) {
    // Cleanup on error
    try {
      await fs.rmdir(storyDir, { recursive: true });
    } catch (cleanupError) {
      console.error('Failed to cleanup story directory:', cleanupError);
    }
    throw error;
  }
}

/**
 * Get a story by ID with all its assets
 * @param {string} storyId - The story ID
 * @returns {Promise<Object>} - The story with assets
 */
function getStoryById(storyId) {
  return new Promise((resolve, reject) => {
    const database = getDatabase();
    
    // Get story data
    const storyQuery = 'SELECT * FROM stories WHERE id = ?';
    database.get(storyQuery, [storyId], (err, storyRow) => {
      if (err) {
        reject(err);
        return;
      }

      if (!storyRow) {
        reject(new Error('Story not found'));
        return;
      }

      // Get assets
      const assetsQuery = 'SELECT * FROM assets WHERE story_id = ? ORDER BY scene_index, asset_type';
      database.all(assetsQuery, [storyId], (err, assetRows) => {
        if (err) {
          reject(err);
          return;
        }

        // Parse scenes
        let scenes;
        try {
          scenes = JSON.parse(storyRow.scenes);
        } catch (error) {
          reject(new Error('Invalid story data'));
          return;
        }

        // Organize assets
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

        resolve({
          id: storyRow.id,
          title: storyRow.title,
          scenes: scenes,
          assets: assets,
          createdAt: storyRow.created_at,
          updatedAt: storyRow.updated_at
        });
      });
    });
  });
}

/**
 * Get all stories with basic information
 * @returns {Promise<Array>} - Array of stories
 */
function getAllStories() {
  return new Promise((resolve, reject) => {
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
        reject(err);
        return;
      }

      const stories = rows.map(row => ({
        id: row.id,
        title: row.title,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        assetCount: row.assetCount
      }));

      resolve(stories);
    });
  });
}

/**
 * Delete a story and all its assets
 * @param {string} storyId - The story ID to delete
 * @returns {Promise<Object>} - Result with deleted assets count
 */
async function deleteStory(storyId) {
  const database = getDatabase();
  const uploadsDir = process.env.STORAGE_PATH || './uploads';

  return new Promise((resolve, reject) => {
    // Get assets to delete files
    const assetsQuery = 'SELECT file_path FROM assets WHERE story_id = ?';
    database.all(assetsQuery, [storyId], async (err, assetRows) => {
      if (err) {
        reject(err);
        return;
      }

      // Delete asset files
      for (const asset of assetRows) {
        try {
          await fs.unlink(path.join(uploadsDir, asset.file_path));
        } catch (fileError) {
          console.warn(`Failed to delete asset file: ${asset.file_path}`, fileError);
        }
      }

      // Try to delete story directory
      try {
        const storyDir = path.join(uploadsDir, storyId);
        await fs.rmdir(storyDir, { recursive: true });
      } catch (dirError) {
        console.warn(`Failed to delete story directory: ${storyId}`, dirError);
      }

      // Delete from database
      const deleteQuery = 'DELETE FROM stories WHERE id = ?';
      database.run(deleteQuery, [storyId], function(err) {
        if (err) {
          reject(err);
          return;
        }

        if (this.changes === 0) {
          reject(new Error('Story not found'));
          return;
        }

        resolve({
          deletedAssets: assetRows.length
        });
      });
    });
  });
}

module.exports = {
  processStoryUpload,
  getStoryById,
  getAllStories,
  deleteStory
}; 
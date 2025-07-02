const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || './data/stories.db';

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Ensure uploads directory exists
const uploadsDir = process.env.STORAGE_PATH || './uploads';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

let db;

function getDatabase() {
  if (!db) {
    db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('Error opening database:', err.message);
        throw err;
      }
      console.log('Connected to SQLite database');
    });
  }
  return db;
}

function initializeDatabase() {
  return new Promise((resolve, reject) => {
    const database = getDatabase();
    
    // Enable foreign keys
    database.run('PRAGMA foreign_keys = ON');
    
    // Create stories table
    const createStoriesTable = `
      CREATE TABLE IF NOT EXISTS stories (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        scenes TEXT NOT NULL, -- JSON string of scenes
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    // Create assets table
    const createAssetsTable = `
      CREATE TABLE IF NOT EXISTS assets (
        id TEXT PRIMARY KEY,
        story_id TEXT NOT NULL,
        scene_index INTEGER NOT NULL,
        asset_type TEXT NOT NULL CHECK(asset_type IN ('image', 'audio')),
        file_path TEXT NOT NULL,
        file_name TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE
      )
    `;
    
    // Create indexes for better performance
    const createIndexes = [
      'CREATE INDEX IF NOT EXISTS idx_stories_created_at ON stories(created_at)',
      'CREATE INDEX IF NOT EXISTS idx_assets_story_id ON assets(story_id)',
      'CREATE INDEX IF NOT EXISTS idx_assets_scene_index ON assets(scene_index)',
      'CREATE INDEX IF NOT EXISTS idx_assets_type ON assets(asset_type)'
    ];
    
    database.serialize(() => {
      database.run(createStoriesTable, (err) => {
        if (err) {
          console.error('Error creating stories table:', err.message);
          reject(err);
          return;
        }
        console.log('Stories table created or already exists');
      });
      
      database.run(createAssetsTable, (err) => {
        if (err) {
          console.error('Error creating assets table:', err.message);
          reject(err);
          return;
        }
        console.log('Assets table created or already exists');
      });
      
      // Create indexes
      createIndexes.forEach((indexSql, i) => {
        database.run(indexSql, (err) => {
          if (err) {
            console.error(`Error creating index ${i + 1}:`, err.message);
          }
        });
      });
      
      // Add trigger to update updated_at timestamp
      const createTrigger = `
        CREATE TRIGGER IF NOT EXISTS update_stories_updated_at 
        AFTER UPDATE ON stories
        BEGIN
          UPDATE stories SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
        END
      `;
      
      database.run(createTrigger, (err) => {
        if (err) {
          console.error('Error creating trigger:', err.message);
        }
      });
      
      resolve();
    });
  });
}

function closeDatabase() {
  return new Promise((resolve, reject) => {
    if (db) {
      db.close((err) => {
        if (err) {
          console.error('Error closing database:', err.message);
          reject(err);
        } else {
          console.log('Database connection closed');
          db = null;
          resolve();
        }
      });
    } else {
      resolve();
    }
  });
}

module.exports = {
  getDatabase,
  initializeDatabase,
  closeDatabase
}; 
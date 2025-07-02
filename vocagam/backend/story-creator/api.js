require('dotenv').config();
// const { initializeDatabase } = require('./database/init');
// const storyRoutes = require('./routes/stories');
const storyRoutes = require('./routes/stories-supabase')

// Initialize database and start server
// async function startServer() {
//   try {
//     await initializeDatabase();
//     console.log('Story Database initialized successfully');
//   } catch (error) {
//     console.error('Failed to start server:', error);
//     process.exit(1);
//   }
// }

// startServer();

module.exports = {
    storyApiRoutes: storyRoutes
}
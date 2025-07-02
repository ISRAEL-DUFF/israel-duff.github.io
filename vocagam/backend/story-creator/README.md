# Polyglossia Story Backend Service

A Node.js backend service for handling story creation, storage, and retrieval for the Polyglossia language learning application.

## Features

- **Story Storage**: Save stories with associated images and audio assets
- **Asset Management**: Handle ZIP file uploads containing story assets
- **Database Storage**: SQLite database for story metadata and asset references
- **File Storage**: Organized file system storage for images and audio files
- **RESTful API**: Complete CRUD operations for stories
- **Security**: Rate limiting, CORS, and input validation
- **Error Handling**: Comprehensive error handling and logging

## API Endpoints

### POST `/api/stories/save-with-assets`
Save a story with its associated assets (images and audio).

**Request**: Multipart form data with:
- `story`: JSON file containing story metadata
- `assets`: ZIP file containing image and audio assets

**Response**:
```json
{
  "message": "Story saved successfully",
  "storyId": "uuid-string",
  "assetsCount": 6
}
```

### GET `/api/stories/list`
Get a list of all saved stories.

**Response**:
```json
{
  "stories": [
    {
      "id": "uuid-string",
      "title": "Story Title",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "assetCount": 6
    }
  ]
}
```

### GET `/api/stories/:id`
Get a specific story with all its assets.

**Response**:
```json
{
  "story": {
    "id": "uuid-string",
    "title": "Story Title",
    "scenes": [...],
    "assets": {
      "0": {
        "imageUrl": "/assets/uuid/image_0_uuid.png",
        "audioUrl": "/assets/uuid/audio_0_uuid.wav"
      }
    },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### DELETE `/api/stories/:id`
Delete a story and all its associated assets.

**Response**:
```json
{
  "message": "Story deleted successfully",
  "deletedAssets": 6
}
```

## Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

4. **Start the server**:
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3001` |
| `NODE_ENV` | Environment mode | `development` |
| `DB_PATH` | SQLite database path | `./data/stories.db` |
| `STORAGE_PATH` | File storage directory | `./uploads` |
| `MAX_FILE_SIZE` | Maximum file upload size | `50MB` |
| `JWT_SECRET` | JWT secret key | Required |
| `CORS_ORIGIN` | Allowed CORS origin | `https://www.eazilang.gleeze.com` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | `900000` (15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | `100` |
| `LOG_LEVEL` | Logging level | `info` |

### Database Schema

#### Stories Table
```sql
CREATE TABLE stories (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  scenes TEXT NOT NULL, -- JSON string of scenes
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### Assets Table
```sql
CREATE TABLE assets (
  id TEXT PRIMARY KEY,
  story_id TEXT NOT NULL,
  scene_index INTEGER NOT NULL,
  asset_type TEXT NOT NULL CHECK(asset_type IN ('image', 'audio')),
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE
);
```

## File Structure

```
backend/
├── server.js                 # Main server file
├── package.json             # Dependencies and scripts
├── env.example              # Environment variables template
├── database/
│   └── init.js              # Database initialization
├── middleware/
│   └── errorHandler.js      # Error handling middleware
├── routes/
│   └── stories.js           # Story API routes
├── services/
│   └── storyService.js      # Business logic for stories
├── data/                    # SQLite database files
└── uploads/                 # File storage directory
```

## Usage Examples

### Frontend Integration

The frontend sends a multipart form data request with:

1. **Story JSON file** containing:
   ```json
   {
     "title": "Story Title",
     "scenes": [
       {
         "greekText": "Greek text content",
         "englishTranslation": "English translation",
         "imagePrompt": "Image description"
       }
     ]
   }
   ```

2. **Assets ZIP file** containing:
   - `image_0.png` - Image for scene 0
   - `audio_0.wav` - Audio for scene 0
   - `image_1.png` - Image for scene 1
   - `audio_1.wav` - Audio for scene 1
   - etc.

### Example Frontend Code

```javascript
const formData = new FormData();
formData.append('story', new Blob([JSON.stringify(storyJson)], { type: 'application/json' }), 'story.json');
formData.append('assets', zipBlob, 'assets.zip');

const response = await fetch('/api/stories/save-with-assets', {
  method: 'POST',
  body: formData,
});

const result = await response.json();
console.log('Story saved with ID:', result.storyId);
```

## Security Features

- **Rate Limiting**: Prevents abuse with configurable limits
- **CORS Protection**: Configurable cross-origin resource sharing
- **Input Validation**: Comprehensive validation of all inputs
- **File Type Validation**: Only allows specific file types
- **File Size Limits**: Configurable maximum file sizes
- **SQL Injection Protection**: Parameterized queries
- **Error Handling**: Secure error responses without sensitive data

## Development

### Running Tests
```bash
npm test
```

### Database Reset
```bash
# Delete the database file and restart the server
rm data/stories.db
npm run dev
```

### Logs
The server uses Morgan for HTTP request logging and console logging for application events.

## Deployment

### Production Considerations

1. **Environment Variables**: Set all required environment variables
2. **Database**: Consider using a production database like PostgreSQL
3. **File Storage**: Consider using cloud storage (AWS S3, Google Cloud Storage)
4. **SSL/TLS**: Use HTTPS in production
5. **Process Manager**: Use PM2 or similar for process management
6. **Reverse Proxy**: Use Nginx or Apache as a reverse proxy
7. **Monitoring**: Implement application monitoring and logging

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

## Troubleshooting

### Common Issues

1. **File Upload Errors**: Check file size limits and storage directory permissions
2. **Database Errors**: Ensure the data directory exists and is writable
3. **CORS Errors**: Verify CORS_ORIGIN configuration matches your frontend domain
4. **Rate Limiting**: Check rate limit configuration if requests are being blocked

### Logs

Check the console output for detailed error messages and application logs.

## License

MIT License - see LICENSE file for details. 
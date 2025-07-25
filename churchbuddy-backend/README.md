# ChurchBuddy Backend

A Node.js/Express backend with SQLite database for the ChurchBuddy application, enabling cross-device synchronization and data persistence.

## Features

- ✅ **Cross-Device Sync**: Create content on laptop, view on tablet
- ✅ **Real-time Updates**: Changes sync across devices
- ✅ **Database Persistence**: SQLite database for reliable storage
- ✅ **Content Management**: Songs, sermons, slides, and content sync
- ✅ **RESTful API**: Clean, documented endpoints
- ✅ **Health Monitoring**: Built-in health checks

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Backend Server
```bash
# Development mode (with auto-restart)
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:5001`

### 3. Test the API
```bash
# Run basic API tests
node test-api.js

# Run cross-device functionality tests
node test-cross-device.js
```

## API Endpoints

### Health Check
- `GET /api/health` - Check server status

### Songs
- `GET /api/songs` - Get all songs
- `POST /api/songs` - Create new song
- `PUT /api/songs/:id` - Update song
- `DELETE /api/songs/:id` - Delete song

### Sermons
- `GET /api/sermons` - Get all sermons
- `POST /api/sermons` - Create new sermon
- `PUT /api/sermons/:id` - Update sermon
- `DELETE /api/sermons/:id` - Delete sermon

### Slides
- `GET /api/slides` - Get all slides
- `POST /api/slides` - Create/update slide
- `DELETE /api/slides/:id` - Delete slide

### Content Sync
- `GET /api/content/:storageKey` - Get content by storage key
- `POST /api/content` - Save content for cross-device sync

## Database Schema

### Songs Table
```sql
CREATE TABLE songs (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  slideIds TEXT,
  createdAt TEXT,
  updatedAt TEXT
);
```

### Sermons Table
```sql
CREATE TABLE sermons (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  slideIds TEXT,
  createdAt TEXT,
  updatedAt TEXT
);
```

### Slides Table
```sql
CREATE TABLE slides (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  html TEXT NOT NULL,
  orderNum INTEGER,
  createdAt TEXT,
  updatedAt TEXT
);
```

### Content Table
```sql
CREATE TABLE content (
  id TEXT PRIMARY KEY,
  itemId TEXT NOT NULL,
  itemType TEXT NOT NULL,
  content TEXT,
  storageKey TEXT NOT NULL,
  createdAt TEXT,
  updatedAt TEXT
);
```

## Cross-Device Functionality

### How It Works

1. **Device 1 (Laptop)**: Creates sermon/song and saves content
2. **Device 2 (Tablet)**: Loads sermon/song and retrieves content
3. **Real-time Sync**: Changes on one device appear on another
4. **Database Persistence**: All data stored in SQLite database

### Test Results

✅ **Laptop → Tablet**: Content sync working  
✅ **Tablet → Laptop**: Content sync working  
✅ **Real-time updates**: Working  
✅ **Database persistence**: Working  

## Frontend Integration

The frontend automatically:
- Connects to backend on startup
- Syncs content changes to database
- Loads data from database on connection
- Falls back to localStorage if backend unavailable

## Development

### Environment Variables
Create a `.env` file (optional):
```
PORT=5001
NODE_ENV=development
```

### Database Location
- Database file: `./churchbuddy.db`
- Automatically created on first run
- SQLite format for easy backup/restore

### Testing
```bash
# Test basic API functionality
node test-api.js

# Test cross-device functionality
node test-cross-device.js
```

## Production Deployment

1. **Environment**: Set `NODE_ENV=production`
2. **Port**: Configure `PORT` environment variable
3. **Database**: Ensure write permissions for SQLite file
4. **CORS**: Configure allowed origins for production domains

## Troubleshooting

### Backend Not Starting
- Check if port 5001 is available
- Ensure all dependencies are installed
- Check console for error messages

### Database Issues
- Verify write permissions in directory
- Check SQLite file exists: `./churchbuddy.db`
- Restart server to reinitialize database

### Frontend Connection Issues
- Verify backend is running on port 5001
- Check CORS configuration
- Ensure frontend API_BASE_URL is correct

## Performance

- **SQLite**: Fast, reliable local database
- **Connection Pooling**: Efficient database connections
- **JSON Storage**: Optimized for content sync
- **Caching**: Built-in browser caching support

## Security

- **Input Validation**: All inputs validated
- **SQL Injection Protection**: Parameterized queries
- **CORS**: Configured for frontend access
- **Error Handling**: Secure error responses 
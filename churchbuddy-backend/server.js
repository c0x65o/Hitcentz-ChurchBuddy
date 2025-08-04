const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Database setup
const dbPath = path.join(__dirname, 'churchbuddy.db');
const db = new sqlite3.Database(dbPath);

// Initialize database tables
const initDatabase = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Songs table
      db.run(`CREATE TABLE IF NOT EXISTS songs (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        slideIds TEXT,
        createdAt TEXT,
        updatedAt TEXT
      )`);

      // Sermons table
      db.run(`CREATE TABLE IF NOT EXISTS sermons (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        slideIds TEXT,
        createdAt TEXT,
        updatedAt TEXT
      )`);

      // Slides table
      db.run(`CREATE TABLE IF NOT EXISTS slides (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        html TEXT NOT NULL,
        orderNum INTEGER,
        createdAt TEXT,
        updatedAt TEXT
      )`);

      // Content table (for localStorage sync)
      db.run(`CREATE TABLE IF NOT EXISTS content (
        id TEXT PRIMARY KEY,
        itemId TEXT NOT NULL,
        itemType TEXT NOT NULL,
        content TEXT,
        storageKey TEXT NOT NULL,
        createdAt TEXT,
        updatedAt TEXT
      )`);

      console.log('Database initialized successfully');
      resolve();
    });
  });
};

// API Routes

// Get all songs
app.get('/api/songs', (req, res) => {
  db.all('SELECT * FROM songs ORDER BY createdAt DESC', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows.map(row => ({
      ...row,
      slideIds: row.slideIds ? JSON.parse(row.slideIds) : [],
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt)
    })));
  });
});

// Create new song
app.post('/api/songs', (req, res) => {
  const { id, title, description, slideIds } = req.body;
  const now = new Date().toISOString();
  
  db.run(
    'INSERT INTO songs (id, title, description, slideIds, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)',
    [id, title, description || '', JSON.stringify(slideIds || []), now, now],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ 
        id, 
        title, 
        description, 
        slideIds: slideIds || [],
        createdAt: new Date(now),
        updatedAt: new Date(now)
      });
    }
  );
});

// Update song
app.put('/api/songs/:id', (req, res) => {
  const { id } = req.params;
  const { title, description, slideIds } = req.body;
  const now = new Date().toISOString();
  
  db.run(
    'UPDATE songs SET title = ?, description = ?, slideIds = ?, updatedAt = ? WHERE id = ?',
    [title, description || '', JSON.stringify(slideIds || []), now, id],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ success: true, updatedAt: new Date(now) });
    }
  );
});

// Delete song
app.delete('/api/songs/:id', (req, res) => {
  const { id } = req.params;
  
  db.run('DELETE FROM songs WHERE id = ?', [id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ success: true });
  });
});

// Get all sermons
app.get('/api/sermons', (req, res) => {
  db.all('SELECT * FROM sermons ORDER BY createdAt DESC', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows.map(row => ({
      ...row,
      slideIds: row.slideIds ? JSON.parse(row.slideIds) : [],
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt)
    })));
  });
});

// Create new sermon
app.post('/api/sermons', (req, res) => {
  const { id, title, description, slideIds } = req.body;
  const now = new Date().toISOString();
  
  db.run(
    'INSERT INTO sermons (id, title, description, slideIds, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)',
    [id, title, description || '', JSON.stringify(slideIds || []), now, now],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ 
        id, 
        title, 
        description, 
        slideIds: slideIds || [],
        createdAt: new Date(now),
        updatedAt: new Date(now)
      });
    }
  );
});

// Update sermon
app.put('/api/sermons/:id', (req, res) => {
  const { id } = req.params;
  const { title, description, slideIds } = req.body;
  const now = new Date().toISOString();
  
  db.run(
    'UPDATE sermons SET title = ?, description = ?, slideIds = ?, updatedAt = ? WHERE id = ?',
    [title, description || '', JSON.stringify(slideIds || []), now, id],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ success: true, updatedAt: new Date(now) });
    }
  );
});

// Delete sermon
app.delete('/api/sermons/:id', (req, res) => {
  const { id } = req.params;
  
  db.run('DELETE FROM sermons WHERE id = ?', [id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ success: true });
  });
});

// Get all slides
app.get('/api/slides', (req, res) => {
  db.all('SELECT * FROM slides ORDER BY orderNum', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows.map(row => ({
      ...row,
      order: row.orderNum,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt)
    })));
  });
});

// Create/Update slide
app.post('/api/slides', (req, res) => {
  const { id, title, html, order } = req.body;
  const now = new Date().toISOString();
  
  db.run(
    'INSERT OR REPLACE INTO slides (id, title, html, orderNum, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)',
    [id, title, html, order, now, now],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ 
        id, 
        title, 
        html, 
        order,
        createdAt: new Date(now),
        updatedAt: new Date(now)
      });
    }
  );
});

// Delete slide
app.delete('/api/slides/:id', (req, res) => {
  const { id } = req.params;
  
  db.run('DELETE FROM slides WHERE id = ?', [id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ success: true });
  });
});

// Content sync endpoints (for localStorage sync)
app.get('/api/content/:storageKey', (req, res) => {
  const { storageKey } = req.params;
  
  db.get('SELECT * FROM content WHERE storageKey = ?', [storageKey], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(row ? { content: row.content } : { content: '' });
  });
});

app.post('/api/content', (req, res) => {
  const { itemId, itemType, content, storageKey } = req.body;
  const now = new Date().toISOString();
  
  db.run(
    'INSERT OR REPLACE INTO content (id, itemId, itemType, content, storageKey, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [`content-${Date.now()}`, itemId, itemType, content, storageKey, now, now],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ success: true });
    }
  );
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Initialize database and start server
initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 ChurchBuddy Backend running on port ${PORT}`);
    console.log(`📊 Database: ${dbPath}`);
    console.log(`🔗 API: http://localhost:${PORT}/api`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});

module.exports = app; 
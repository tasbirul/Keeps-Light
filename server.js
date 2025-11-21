import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import pool from './db.js';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// CORS configuration
app.use(cors());
app.use(bodyParser.json());

// Serve static files from public directory only (security fix)
app.use(express.static(path.join(__dirname, 'public')));

// Get all notes
app.get('/api/notes', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM notes ORDER BY is_pinned DESC, created_at DESC');
        // Convert is_pinned to boolean for frontend
        const notes = rows.map(note => ({
            ...note,
            is_pinned: !!note.is_pinned
        }));
        res.json(notes);
    } catch (error) {
        console.error('Error fetching notes:', error);
        res.status(500).json({ error: error.message });
    }
});

// Create a note
app.post('/api/notes', async (req, res) => {
    const { title, content, color, is_pinned } = req.body;
    try {
        const [result] = await pool.execute(
            'INSERT INTO notes (title, content, color, is_pinned) VALUES (?, ?, ?, ?)',
            [title, content, color || 'bg-default', is_pinned ? 1 : 0]
        );
        const [rows] = await pool.query('SELECT * FROM notes WHERE id = ?', [result.insertId]);
        res.status(201).json({ ...rows[0], is_pinned: !!rows[0].is_pinned });
    } catch (error) {
        console.error('Error creating note:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update a note
app.put('/api/notes/:id', async (req, res) => {
    const { id } = req.params;
    const { title, content, is_pinned, color } = req.body;
    try {
        await pool.execute(
            'UPDATE notes SET title = ?, content = ?, is_pinned = ?, color = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [title, content, is_pinned ? 1 : 0, color, id]
        );
        const [rows] = await pool.query('SELECT * FROM notes WHERE id = ?', [id]);
        res.json({ ...rows[0], is_pinned: !!rows[0].is_pinned });
    } catch (error) {
        console.error('Error updating note:', error);
        res.status(500).json({ error: error.message });
    }
});

// Delete a note
app.delete('/api/notes/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.execute('DELETE FROM notes WHERE id = ?', [id]);
        res.json({ message: 'Note deleted' });
    } catch (error) {
        console.error('Error deleting note:', error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

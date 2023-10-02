var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import express from 'express';
import sqlite3 from 'sqlite3';
import cors from 'cors';
const app = express();
const port = process.env.PORT || 3000;
app.use(cors());
app.use(express.json());
let db;
function initializeDatabase() {
    return __awaiter(this, void 0, void 0, function* () {
        db = new sqlite3.Database('mydatabase.db');
    });
}
initializeDatabase().catch((err) => {
    // Specify 'Error' type for 'err'
    console.error('Error opening the database:', err.message);
});
app.get('/api/tables', (req, res) => {
    db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
        // Specify types for 'err' and 'tables'
        if (err) {
            console.error(err);
            res.status(500).json({ error: 'Internal Server Error' });
            return;
        }
        const tableNames = tables
            .map((table) => table.name)
            .filter((name) => name !== 'sqlite_sequence');
        res.json(tableNames);
    });
});
app.get('/api/columns', (req, res) => {
    const { tableName } = req.query;
    db.all(`PRAGMA table_info(${tableName})`, (err, columns) => {
        // Specify types for 'err' and 'columns'
        if (err) {
            console.error(err.message);
            res.status(500).json({ error: 'Internal server error' });
            return;
        }
        if (columns.length === 0) {
            res.status(404).json({ error: 'Table not found' });
            return;
        }
        const columnNames = columns.map((column) => column.name);
        res.status(200).json(columnNames);
    });
});
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
app.post('/api/custom-query', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { query } = req.body;
    if (!query) {
        return res.status(400).json({ error: 'Query parameter is required.' });
    }
    try {
        const result = yield new Promise((resolve, reject) => {
            db.all(query, (err, rows) => {
                if (err)
                    reject(err);
                else
                    resolve(rows);
            });
        });
        res.json(result);
    }
    catch (err) {
        console.error('Error executing custom query:', err.message); // Type assertion
        res.status(500).json({ error: 'Internal Server Error' });
    }
}));

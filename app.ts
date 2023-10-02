import express, { Request, Response } from 'express';
import sqlite3 from 'sqlite3';
import cors from 'cors';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

let db: sqlite3.Database;

async function initializeDatabase() {
  db = new sqlite3.Database('mydatabase.db');
}

//TODO: interfaces instead of ANY!

initializeDatabase().catch((err: Error) => {
  // Specify 'Error' type for 'err'
  console.error('Error opening the database:', err.message);
});

app.get('/api/tables', (req: Request, res: Response) => {
  db.all(
    "SELECT name FROM sqlite_master WHERE type='table'",
    (err: Error | null, tables: any[]) => {
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
    },
  );
});

app.get('/api/columns', (req: Request, res: Response) => {
  const { tableName } = req.query as { tableName: string };

  db.all(
    `PRAGMA table_info(${tableName})`,
    (err: Error | null, columns: any[]) => {
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
    },
  );
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

app.post('/api/custom-query', async (req: Request, res: Response) => {
  const { query } = req.body;

  if (!query) {
    return res.status(400).json({ error: 'Query parameter is required.' });
  }

  try {
    const result = await new Promise((resolve, reject) => {
      db.all(query, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    res.json(result);
  } catch (err) {
    console.error('Error executing custom query:', (err as Error).message); // Type assertion
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

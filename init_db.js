import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const init = async () => {
    try {
        // Create connection without database selected first
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD
        });

        console.log('Connected to MySQL server.');

        // Read schema file
        const schema = fs.readFileSync(path.join(process.cwd(), 'schema.sql'), 'utf8');
        const statements = schema.split(';').filter(stmt => stmt.trim());

        for (const statement of statements) {
            if (statement.trim()) {
                await connection.query(statement);
                console.log('Executed:', statement.substring(0, 50) + '...');
            }
        }

        console.log('Database initialization completed successfully.');
        await connection.end();
    } catch (error) {
        console.error('Database initialization failed:', error);
    }
};

init();

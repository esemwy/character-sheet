const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbName = path.join(__dirname, 'data', 'characters.db');
console.log(dbName);
// Function to run a database operation (query or command) and automatically close the connection
function runDbOperation(operationCallback) {
    const db = new sqlite3.Database(dbName, (err) => {
        if (err) {
            console.error('Error opening database', err.message);
            return;
        }
        console.log('Connected to the SQLite database.');

        operationCallback(db);

        db.close((err) => {
            if (err) {
                console.error('Error closing database', err.message);
            }
            console.log('Database connection closed.');
        });
    });
}

// Initialize database and create table and index if they don't exist
function initializeDb() {
    runDbOperation((db) => {
        db.serialize(() => {
            db.run(`CREATE TABLE IF NOT EXISTS FormData (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                data JSON
            );`);

            db.run(`CREATE INDEX IF NOT EXISTS idx_character_name ON FormData (
                json_extract(data, '$."Text Field0"')
            );`);
        });
    });
}

// Function to insert or update form data
function upsertFormData(formData) {
    runDbOperation((db) => {
        const characterName = formData['Text Field0'];
        const dataStr = JSON.stringify(formData);
        
        // First, try to find an existing record by character name
        const findSql = `SELECT id FROM FormData WHERE json_extract(data, '$."Text Field0"') = ?`;
        db.get(findSql, [characterName], (err, row) => {
            if (err) {
                // Handle error in query
                console.error('Error finding record for update', err.message);
            } else if (row) {
                // Record exists, perform an update
                const updateSql = `UPDATE FormData SET data = ? WHERE id = ?`;
                db.run(updateSql, [dataStr, row.id], (updateErr) => {
                    if (updateErr) {
                        console.error('Error updating record', updateErr.message);
                    } else {
                        console.log(`Record updated successfully, ID: ${row.id}`);
                    }
                });
            } else {
                // No existing record found, perform an insert
                const insertSql = `INSERT INTO FormData (data) VALUES (?)`;
                db.run(insertSql, [dataStr], (insertErr) => {
                    if (insertErr) {
                        console.error('Error inserting new record', insertErr.message);
                    } else {
                        console.log(`New record inserted with ID: ${this.lastID}`);
                    }
                });
            }
        });
    });
}

// Function to query all records
function queryAll(callback) {
    runDbOperation((db) => {
        db.all(`SELECT * FROM FormData`, [], callback);
    });
}

// Function to query a record by "Text Field0"
function queryByCharacterName(characterName, callback) {
    runDbOperation((db) => {
        db.get(`SELECT * FROM FormData WHERE json_extract(data, '$."Text Field0"') = ?`, [characterName], callback);
    });
}

// Export functions
module.exports = {
    initializeDb,
    upsertFormData,
    queryAll,
    queryByCharacterName
};

// Initialize DB at require-time
initializeDb();

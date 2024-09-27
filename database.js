const Database = require('better-sqlite3');
const path = require('path');

const dbName = path.join(__dirname, 'data', 'characters.db');

// Function to run a database operation using callbacks (opens and closes the database)
function runDbOperation(callback) {
    try {
        const db = new Database(dbName); // Open the database
        return callback(db);             // Call the callback with the result
        db.close();                      // Close the database
    } catch (err) {
        console.error('Error during database operation:', err.stack);
    }
}

// Initialize the database (using callback)
function initializeDb(callback) {
    runDbOperation((db) => {
        db.exec(
            `CREATE TABLE IF NOT EXISTS FormData (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                pdf_id INTEGER,
                data JSON
            );`);
    });
}

// Initialize the SheetData table (using callback)
function initializeSheets(dataArray) {
    runDbOperation((db) => {
        db.exec(`DROP TABLE IF EXISTS SheetData`);
        db.exec(
            `CREATE TABLE SheetData (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                pdf_name TEXT UNIQUE NOT NULL,
                key_name TEXT NOT NULL,
                menu_item TEXT NOT NULL,
                save_message TEXT NOT NULL,
                image TEXT NOT NULL
            )`);

        const insertStmt = db.prepare(
            `INSERT INTO SheetData 
                (
                    pdf_name, key_name, menu_item, save_message, image
                ) 
            VALUES (?, ?, ?, ?, ?)`);
        const insertTransaction = db.transaction((dataArray) => {
            for (const data of dataArray) {
                insertStmt.run(...data);
            }
        });

        insertTransaction(dataArray);
    });
}

function querySheet(name, callback) {
    return runDbOperation((db) => {
        const findStmt = db.prepare(`SELECT * FROM SheetData WHERE pdf_name = ?`);
        const row = findStmt.get(name);
        return callback ? callback(row) : row;
    });
}

// Upsert form data (using callback)
function upsertFormData(sheet_name, formData) {
    const sheetData = querySheet(sheet_name);
    const field_name = sheetData.key_name;
    const field_value = formData[field_name];
    const result = runDbOperation((db) => {
        const dataStr = JSON.stringify(formData);
        const findStmt = db.prepare(`SELECT id FROM FormData WHERE json_extract(data, '$."${field_name}"') = ?`);
        const row = findStmt.get(field_value);

        if (row) {
            const updateStmt = db.prepare(`UPDATE FormData SET data = ? WHERE id = ?`);
            updateStmt.run(dataStr, row.id);
        } else {
            const insertStmt = db.prepare(`INSERT INTO FormData (pdf_id, data) VALUES (?, ?)`);
            insertStmt.run(id, dataStr);
        }
        return true; // Return a success indicator
    });
    return result ? `Saved ${field_value}...` : `Failed saving ${field_value}...`;
}

// Query all records (using callback)
function queryAll(callback) {
    runDbOperation((db) => {
        const stmt = db.prepare(`SELECT 
            FormData.id AS id, 
            FormData.data,
            FormData.pdf_id,
            SheetData.pdf_name, 
            SheetData.key_name, 
            SheetData.menu_item, 
            SheetData.save_message, 
            SheetData.image 
        FROM 
            FormData 
        JOIN 
            SheetData 
        ON 
            SheetData.id = FormData.pdf_id`);
        const rows = stmt.all();
        return callback ? callback(rows) : rows;
    });
}

// Synchronous function to query all rows in SheetData (remains synchronous)
function queryAllSheets(callback) {
    return runDbOperation((db) => {
        const rows = db.prepare(`SELECT * FROM SheetData`).all();
        return callback ? callback(rows) : rows;
    });
}

// Export functions
module.exports = {
    initializeDb,
    upsertFormData,
    queryAll,
    initializeSheets,
    queryAllSheets,
    querySheet,
};

// Initialize DB at require-time
initializeDb();

const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const db = require('./database');

const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname, 'public')));

// Middleware
app.use(bodyParser.json());

app.post('/save-pdf-data', (req, res) => {
    db.upsertFormData(req.body);
    res.json({status: 'success', message: 'Data received'});
});

app.get('/get-characters', (req, res) => {
  db.queryAll((err, characters) => {
      if (err) {
          console.error('Error fetching characters:', err);
          res.status(500).send('Error fetching characters');
          return;
      }
      // Assuming each character record's data is stored as a JSON string in the 'data' column
      const parsedCharacters = characters.map(character => ({
          id: character.id,
          data: JSON.parse(character.data)
      }));
      res.json(parsedCharacters);
  });
});


app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

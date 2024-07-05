const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const db = require('./database');

const app = express();
app.set('view engine', 'ejs');

const PORT = 3000;
let gSettingsById = {};
let gSettingsByName = {}
let settingsInitialized = false;

// Combined function to fetch settings and ensure they are initialized before handling requests
async function initializeAndEnsureSettings(req, res, next) {
    if (!settingsInitialized) {
        try {
            [gSettingsByName, gSettingsById] = await new Promise((resolve, reject) => {
                db.getSettings((err, settings) => {
                    if (err) {
                        return reject(err);
                    }
                    
                    const _settings_by_sheet = {};
                    const _settings_by_id = {};
                    
                    settings.forEach((result) => {
                        const _sheet_name = result.sheet_name;
                        const _id = result.id;
                        if (!_settings_by_sheet[_sheet_name]) {
                            _settings_by_sheet[_sheet_name] = { id: _id, key_map: {}, rkey_map: {} };
                        }
                        _settings_by_sheet[_sheet_name].key_map[result.original] = result.placeholder;
                        _settings_by_sheet[_sheet_name].rkey_map[result.placeholder] = result.original;

                        if (!_settings_by_id[_id]) {
                            _settings_by_id[_id] = { name: _sheet_name, key_map: {}, rkey_map: {} };
                        }
                        _settings_by_id[_id].key_map[result.original] = result.placeholder;
                        _settings_by_id[_id].rkey_map[result.placeholder] = result.original;

                    });
                    
                    resolve([_settings_by_sheet, _settings_by_id]);
                });
            });
            settingsInitialized = true;
        } catch (err) {
            console.error('Error fetching settings:', err);
            return res.status(500).send('Server initialization error');
        }
    }
    next();
}

// Apply the combined middleware function
app.use(initializeAndEnsureSettings);
app.use(express.static(path.join(__dirname, 'public')));

// Middleware
app.use(bodyParser.json());

app.post('/save-pdf-data', (req, res) => {
    const url = req.body.url;
    const formData = req.body.data;
    const sheet_name = path.basename(url);
    const config = gSettingsByName[sheet_name];
    db.upsertFormData(config.id, config.rkey_map, formData);
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
          pdf_id: character.pdf_id,
          data: JSON.parse(character.data)
      }));
      res.json(parsedCharacters);
  });
});


// app.get('/', (req, res) => {
//   res.sendFile(path.join(__dirname, 'public/index.html'));
// });

app.get('/sheet/:pdf', (req, res) => {
  const pdf = req.params.pdf;
  if (gSettingsByName[pdf]) {
    res.render('sheet', { pdf });
  }
  else {
    res.status(404).send('Sheet not found');
  }
});

app.get('/pdfScript.js', (req, res) => {
  res.set('Content-Type', 'application/javascript');
  res.render('pdfScript', {
    gSettingsById:   JSON.stringify(gSettingsById), 
    gSettingsByName: JSON.stringify(gSettingsByName) 
  });
});

app.get('/', (req, res) => {
  res.render('index', { settings: gSettingsById });

});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

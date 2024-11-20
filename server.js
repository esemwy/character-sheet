const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const db = require('./database');

function applyTemplate(template, data) {
  return new Function('r', `return \`${template}\`;`)(data);
}

const app = express();
app.set('view engine', 'ejs');

const PORT = 3000;

app.use(express.static(path.join(__dirname, 'public')));

// Middleware
app.use(bodyParser.json());


app.post('/save-pdf-data', (req, res) => {
  const url = req.body.url.substring(1);
  const formData = req.body.data;
  const sheet_name = path.basename(url);
  const template = db.querySheet(sheet_name);
  const message = applyTemplate(template.save_message, formData);
  db.upsertFormData(url, formData);
  res.json({status: 'success', message: message});
});

app.get('/get-characters/:pdf', (req, res) => {
  const pdf = req.params.pdf;
  const template = db.querySheet(pdf);

  db.queryAll((characters) => {
    // Assuming each character record's data is stored as a JSON string in the 'data' column
    const parsedCharacters = characters
    .filter(character => character.pdf_id === template.id)
    .map(character => {
        const parsedData = JSON.parse(character.data);
        return {
            id: character.id,
            pdf_name: character.pdf_name,
            key_name: character.key_name,
            image: character.image,
            menu_item: applyTemplate(character.menu_item, parsedData),
            save_message: applyTemplate(character.save_message, parsedData),
            data: parsedData
        };
    });


    res.json(parsedCharacters);
  });
});


app.get('/sheet/:pdf', (req, res) => {
  const pdf = req.params.pdf;
  if (db.querySheet(pdf)) {
    res.render('sheet', { pdf });
  }
  else {
    res.status(404).send('Sheet not found');
  }
});


app.get('/pdf/:filename', (req, res) => {
  const pdfDirectory = path.join(__dirname, 'pdfs');
  const filePath = path.join(pdfDirectory, req.params.filename);

  // Check if the file exists
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      return res.status(404).send('PDF not found');
    }

    // Stream the PDF to the response
    res.setHeader('Content-Type', 'application/pdf');
    const readStream = fs.createReadStream(filePath);
    readStream.pipe(res);
  });
});

app.get('/', (req, res) => {
  const settings = db.queryAllSheets((rows) => {
    return rows.reduce((dict, row) => {
        dict[row.pdf_name] = row.image;
        return dict; // Return the updated dictionary for the next iteration
    }, {}); // Start with an empty object as the initial value
  });

  res.render('index', { settings: settings });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

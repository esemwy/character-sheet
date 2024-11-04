const { initializeSheets, queryAll } = require('../database');

function applyTemplate(template, data) {
    return new Function('r', `return \`${template}\`;`)(data);
}

const sheetData = [
    [
      'Castles_and_Crusades.pdf',
      'Character Name',
      "${r['Character Name']} - ${r['Race']} ${r['Class']}",
      "Saved character ${r['Character Name']}...",
      'Castles_and_Crusades.jpg'
    ],
    [
      'Traveller.pdf',
      'Text Field0',
      "${r['Text Field0']} - ${r['Text Field1']} ${r['Text Field2']}",
      "Saved character ${r['Text Field0']}...",
      'Traveller.jpg'
    ],
    [
      'Traveller_Spacecraft_Record.pdf',
      'ship name',
      "${r['ship name']} - ${r['mass']} - ${r['Ship size']}D-tons",
      "Saved ship ${r['ship name']}...",
      'Traveller_Spacecraft_Record.jpg'
    ]
];
console.log(sheetData);
initializeSheets(sheetData);

// queryAll((err, characters) => {
//     if (err) {
//       console.error('Error fetching characters:', err);
//       res.status(500).send('Error fetching characters');
//       return;
//     }
//     const parsedCharacters = characters.map(character => {
//         const parsedData = JSON.parse(character.data);
//         return {
//             id: character.id,
//             pdf_name: character.pdf_name,
//             key_name: character.key_name,
//             menu_item: applyTemplate(character.menu_item, parsedData),
//             save_message: applyTemplate(character.save_message, parsedData)
//         };
//     });    
//     console.log(parsedCharacters);
// });
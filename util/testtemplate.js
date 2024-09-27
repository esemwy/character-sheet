const db = require('./database');

function applyTemplate(template, data) {
    return new Function('r', `return \`${template}\`;`)(data);
}

db.queryAll((characters) => {
    // Assuming each character record's data is stored as a JSON string in the 'data' column
    const parsedCharacters = characters.map(character => ({
        id: character.id,
        pdf_id: character.pdf_id,
        item: applyTemplate(character.menu_item, JSON.parse(character.data))
    }));
    console.log(parsedCharacters);
});

const images = db.queryAllSheets((rows) => {
    return rows.reduce((dict, row) => {
        dict[row.pdf_name] = row.image;
        return dict; // Return the updated dictionary for the next iteration
    }, {}); // Start with an empty object as the initial value
});

console.log(images);

const id_map = db.queryAllSheets((rows) => {
    return rows.reduce((dict, row) => {
        dict[row.pdf_name] = row.id;
        return dict; // Return the updated dictionary for the next iteration
    }, {}); // Start with an empty object as the initial value
});
console.log(id_map);
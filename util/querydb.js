const {queryAll, queryAllSheets, querySheet } = require('./database');

function applyTemplate(template, data) {
    return new Function('r', `return \`${template}\`;`)(data);
}

queryAll((characters) => {
    const parsedCharacters = characters.map(character => {
        const parsedData = JSON.parse(character.data);
        return {
            id: character.id,
            pdf_name: character.pdf_name,
            key_name: character.key_name,
            menu_item: applyTemplate(character.menu_item, parsedData),
            save_message: applyTemplate(character.save_message, parsedData),
            image: character.image
        };
    });    
    console.log(parsedCharacters);
});

function createSheetDictionary() {
    return queryAllSheets((rows) => {
        return rows.reduce((dict, row) => {
            dict[row.pdf_name] = {
                id: row.id,
                key_name: row.key_name,
                menu_item: row.menu_item,
                save_message: row.save_message,
                image: row.image,
            };
            return dict; // Return the updated dictionary for the next iteration
        }, {}); // Start with an empty object as the initial value
    });
}

// console.log(createSheetDictionary());
console.log(querySheet('Traveller.pdf'));

const images = queryAllSheets((rows) => {
    return rows.reduce((dict, row) => {
        dict[row.pdf_name] = row.image;
        return dict; // Return the updated dictionary for the next iteration
    }, {}); // Start with an empty object as the initial value
});

console.log(images);
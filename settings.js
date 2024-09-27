templates = {
    "1": {
        "key_name": 'Character Name', 
        "name": "Castles_and_Crusades.pdf",
        "menu_item": "${r['Character Name']} - ${r['Race']} ${r['Class']}",
        "save_message": "Saved character ${r['Character Name']}..."
    },
    "2": {
        "key_name": 'Text Field0', 
        "name": "Traveller.pdf",
        "menu_item": "${r['Text Field0']} - ${r['Text Field1']} ${r['Text Field2']}",
        "save_message": "Saved character ${r['Text Field0']}..."
    },
    "3": {
        "key_name": "ship name",
        "name": "Traveller_Spacecraft_Record.pdf",
        "menu_item": "${r['ship name']} - ${r['mass']} - ${r['Ship size']}D-tons",
        "save_message": "Saved ship ${r['ship name']}..."
    }
};

const id_map = Object.fromEntries(
    Object.entries(templates).map(([key, value]) => [
        value.name, key
    ])
);

module.exports = {
    gTemplates: templates,
    gIds: id_map
}
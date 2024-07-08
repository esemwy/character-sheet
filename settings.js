by_name = {
    'Castles_and_Crusades.pdf': {
        'id': 1,
        'key_map': {
            'Character Name': 'name', 
            'Race': 'race', 
            'Class': 'other'
        }
    },
   'Traveller.pdf': {
        'id': 2,
        'key_map': {
            'Text Field0': 'name', 
            'Text Field2': 'race', 
            'Text Field1': 'other'
        }
    },
   'Traveller_Spacecraft_Record.pdf': {
        'id': 3,
        'key_map': {
            'ship name': 'name', 
            'mass': 'race', 
            'ship ID': 'other'
        }
    }
};

// DO NOT EDIT BELOW THIS LINE
for (const [_name, setting] of Object.entries(by_name)) {
    by_name[_name].rkey_map = {};
    for (const [key,value] of Object.entries(setting.key_map)) {
        by_name[_name].rkey_map[value] = key;
    }
}
by_id = {};
for (const [key, value] of Object.entries(by_name)) {
    by_id[value.id] = {name: key, key_map: value.key_map, rkey_map: value.rkey_map}
}

module.exports = {
    gSettingsById: by_id,
    gSettingsByName: by_name
}
document.addEventListener('DOMContentLoaded', function() {
    // Override the openFile button
    const openFileButton = document.getElementById('openFile'); // Adjust this ID if necessary
    if (openFileButton) {
        // Remove the default click event listener by cloning the button
        const newButton = openFileButton.cloneNode(true);
        openFileButton.parentNode.replaceChild(newButton, openFileButton);

        // Now, add your custom event listener to the new button
        newButton.addEventListener('click', (event) => {
            event.preventDefault(); // Prevent any default action
            event.stopPropagation(); // Stop the event from propagating to other handlers

            // Your custom logic here, e.g., showing the modal to select a character
            console.log('Custom openFile action');
            fetchAndShowCharacters(); // Call your function to fetch characters and show the modal
        });
    }

    // Check if the toolbar exists and the saveFile button does not already exist
    const toolbar = document.getElementById('toolbarViewerRight');
    const existingSaveButton = document.getElementById('saveFile');
    if (toolbar && !existingSaveButton) {
        // Create the saveFile button
        const saveButton = document.createElement('button');
        saveButton.id = 'saveFile';
        saveButton.className = 'toolbarButton hiddenLargeView'; // Use the same classes as openFile for consistency
        saveButton.title = 'Save File';
        saveButton.tabIndex = 30; // Following the tabIndex of openFile for logical navigation order
        saveButton.style.backgroundImage = "url(/images/toolbarButton-saveFile.svg)";
        saveButton.style.width = "24px";
        saveButton.style.height = "24px";
        saveButton.style.backgroundRepeat = 'no-repeat';
        saveButton.style.backgroundPosition = 'center';
        saveButton.style.backgroundSize = '16px 16px';
        
        // Set the data-l10n-id attributes similar to the openFile button, but for save functionality
        saveButton.setAttribute('data-l10n-id', 'save_file');
        const span = document.createElement('span');
        span.setAttribute('data-l10n-id', 'save_file_label');
        span.textContent = 'Save'; // This can be localized similar to other viewer elements

        // Append the span to the button
        saveButton.appendChild(span);

        // Add the saveFile button to the toolbar
        toolbar.prepend(saveButton);

        // Add an event listener for the save functionality
        saveButton.addEventListener('click', function() {
            // Call the function to extract and log form data
            extractFormData().then(formData => {
                sendFormData(formData);
            }).catch(err => {
                console.error('Error extracting form data:', err);
            });
        });
    }
    injectModals();
});

function injectModals() {
    const modalHTML = `
        <div id="characterSelectModal" style="display:none; position:fixed; z-index:1000; left:0; top:0; width:100%; height:100%; overflow:auto; background-color:rgba(0,0,0,0.4);">
            <div style="background-color:#fefefe; margin:15% auto; padding:20px; border:1px solid #888; width:80%; max-width:600px;">
                <span id="closeModal" style="color:#aaa; float:right; font-size:28px; font-weight:bold; cursor:pointer;">&times;</span>
                <h2>Select a Character</h2>
                <div id="characterList">Loading...</div>
            </div>
        </div>
    
        <div id="characterSaveModal" style="display:none; position:fixed; z-index:1000; left:0; top:0; width:100%; height:100%; overflow:auto; background-color:rgba(0,0,0,0.4);">
            <div style="background-color:#fefefe; margin:15% auto; padding:20px; border:1px solid #888; width:80%; max-width:600px;">
                <span id="closeSaveModal" style="color:#aaa; float:right; font-size:28px; font-weight:bold; cursor:pointer;">&times;</span>
                <h2 id="characterSaveMessage">Character Saved</h2>
            </div>
        </div>`;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    // Close the modal when the close button is clicked
    document.getElementById('closeModal').onclick = () => {
        document.getElementById('characterSelectModal').style.display = 'none';
    };
}



async function extractFormData() {
    const pdfDocument = PDFViewerApplication.pdfDocument;
    const formData = {}; // Object to hold our form data

    // Ensure the PDF document is loaded
    if (!pdfDocument) {
        console.log('PDF document is not loaded yet.');
        return;
    }

    // Get the number of pages
    const numPages = pdfDocument.numPages;
    const modifiedValues = pdfDocument.annotationStorage.getAll();

    // Iterate through each page to find form fields
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        const page = await pdfDocument.getPage(pageNum);
        const annotations = await page.getAnnotations({ intent: 'display' });
        

        annotations.forEach((annotation) => {
            if (annotation.fieldType) {
                // Assuming the fieldName is unique across the document
                const value = modifiedValues[annotation.id] !== undefined ? modifiedValues[annotation.id].value : annotation.fieldValue;

                formData[annotation.fieldName] = value || '';
            }
        });
    }

    // Log the extracted form data
    console.log(formData);
    return formData;
}

function sendFormData(formData) {
    fetch('/save-pdf-data', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        const messageEl = document.getElementById('characterSaveMessage');
        messageEl.innerText = `Saved Character "${formData['Character Name']}"`
        document.getElementById('characterSaveModal').style.display = 'block';
        setTimeout(() => {
            document.getElementById('characterSaveModal').style.display = 'none';
        }, 1500);
        console.log('Success:', data);
    })
    .catch((error) => {
        console.error('Error posting form data:', error);
    });
}

function toOrdinal(n) {
    const s = ["th", "st", "nd", "rd"],
          v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function fetchAndShowCharacters() {
    // Fetch character data from the server
    fetch('/get-characters') // Adjust the endpoint as necessary
    .then(response => response.json())
    .then(data => {
        const listContainer = document.getElementById('characterList');
        listContainer.innerHTML = ''; // Clear previous content
        // Populate the modal with character data
        data.forEach(character => {
            const characterRace = character.data.Race ? character.data.Race+' ' : ' '
            const textLine = `${character.data['Character Name']} -- ${toOrdinal(character.data.Level)} level ${characterRace}${character.data.Class}`;
            const listItem = document.createElement('div');
            listItem.textContent =  textLine; // Adjust according to your data structure
            listItem.style.cursor = 'pointer';
            listItem.onclick = () => selectCharacter(character); // Implement character selection logic
            listContainer.appendChild(listItem);
        });
        // Show the modal
        document.getElementById('characterSelectModal').style.display = 'block';
    })
    .catch(error => console.error('Failed to fetch characters:', error));
}

function selectCharacter(character) {
    // Close the modal dialog
    document.getElementById('characterSelectModal').style.display = 'none';
    const characterData = character.data;
    // Assuming characterData contains the structured data needed for the form
    // And PDFViewerApplication is the global object provided by PDF.js
    const pdfDocument = PDFViewerApplication.pdfDocument;

    pdfDocument.getMetadata().then(() => {
        const numPages = pdfDocument.numPages;
        console.log(numPages,'pages');
        // Iterate through the form fields and set their values based on characterData
        for (let pageNum = 1; pageNum <= numPages; pageNum++) {
            pdfDocument.getPage(pageNum).then(page => {
                page.getAnnotations({ intent: 'display' }).then(annotations => {
                    annotations.forEach(annotation => {
                        if (annotation.fieldType && characterData[annotation.fieldName] !== "") {
                            const fieldId = annotation.id;
                            const fieldValue = characterData[annotation.fieldName];
                            console.log(fieldId, fieldValue);
                            const fieldInput = document.getElementById(fieldId);
                            if (fieldInput) {
                                if (fieldInput.type === 'checkbox') {
                                    if (fieldValue === 'On') fieldInput.checked = true;
                                    else if (fieldValue === 'Off') fieldValue.checked = false;
                                    else fieldInput.checked = fieldValue;
                                } else {
                                    fieldInput.value = fieldValue;
                                }
                            }

                            // Use annotationStorage to set the value
                            PDFViewerApplication.pdfDocument.annotationStorage.setValue(fieldId, { value: fieldValue });
                        }
                    });

                    // This line triggers the update of form fields in the viewer
                    PDFViewerApplication.eventBus.dispatch('updateviewarea', {
                        source: PDFViewerApplication,
                        location: {
                            pageNumber: pageNum // Ensure this is correctly specified
                        }
                    });
                    // PDFViewerApplication.pdfViewer.annotationLayer.render(viewer.viewport, 'display');

                    // PDFViewerApplication.eventBus.dispatch('renderannotationlayer', {
                    //     source: PDFViewerApplication,
                    //     pageNumber: PDFViewerApplication.pdfViewer.currentPageNumber,
                    // });
                });
            });
        }
    })
    .catch(error => console.error('Error processing character data:', error));
}

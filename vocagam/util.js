export function gameLanguage() {
  const lang = new URLSearchParams(window.location.search).get('lang') || "greek";
  return lang;
}

export function fisherYateShuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1)); // Random index from 0 to i
      [array[i], array[j]] = [array[j], array[i]]; // Swap elements
  }
}

// Function to randomly select 10 words
export function getRandomWords(list, count = 10) {
    // Shuffle the array using Fisher-Yates algorithm
    // let shuffled = list.slice().sort(() => Math.random() - 0.5);
    let shuffled = [...list]
    fisherYateShuffle(shuffled)

    // Select the first 'count' words
    return shuffled.slice(0, count);
}

export function generateSelectFromJson(jsonData) {
    // Create the select element
   // const select = document.createElement("select");
      const select = document.getElementById('text-groups');
  
    // Loop through the JSON data and create an option for each item
    jsonData.forEach(item => {
      const option = document.createElement("option");
      option.value = item;
      option.textContent = item
      select.appendChild(option);
    });
  
    // Add event listener for selection change
    select.addEventListener('change', (event) => {
      // Set the global variable to the value of the selected option
      selectedValue = event.target.value;
  
      resetGame();
      let selectedWords = getRandomWords(dataFile[selectedValue]);
      words = selectedWords;
      generateMatchingGame();
      console.log("Selected Word List: " + selectedValue);
    });
  
    // Append the select element to the body or any other container
  //   document.body.appendChild(select);
}

export function generateSelectBox(params) {
    console.log(params)
    if(!params.containerId) {
      console.error('No select container Id provided');
      return;
    }

    const idNum = Math.round(Math.random() * 1000);
    const selectStyle = params.style ?? {}

    // Add styles for the custom select
    const style = document.createElement('style');
    style.textContent = `
        .custom-select-${idNum} {
            position: relative;
            display: inline-block;
            width: 200px;
            ${selectStyle.textColor ? 'color:' + selectStyle.textColor : 'white'}
        }
        .select-box-${idNum} {
            cursor: pointer;
            padding: 10px;
            border: 1px solid #ccc;
            border-radius: 4px;
        }
        .options-${idNum} {
            display: none;
            position: absolute;
            background-color: ${selectStyle.backgroundColor ?? 'rgba(2, 42, 61, 0.9)'};
            border: 1px solid #ccc;
            border-radius: 4px;
            z-index: 1;
            width: 100%;
            max-height: 40vh;
            overflow-y: auto;
        }
        .options-${idNum}.show {
            display: block;
        }
        .option-${idNum} {
            padding: 10px;
            cursor: pointer;
        }
        .option-${idNum}:hover {
            background-color: #f1f1f1;
        }
        .selected-option-${idNum} {
          ${selectStyle.selectedTextColor ? 'color:' + selectStyle.selectedTextColor : 'white'}
        }
    `;
    document.head.appendChild(style);

    const selectOptionsId = 'select-options-' + idNum;

    function toggleSelect() {
      const options = document.getElementById(selectOptionsId);
      options.classList.toggle('show');
    }

    const items = params.items ?? []; // Add more languages as needed
    const container = document.getElementById(params.containerId);
    container.innerHTML = '';

    const customSelect = document.createElement('div');
    customSelect.className = 'custom-select' + `-${idNum}`;

    const selectBox = document.createElement('div');
    selectBox.className = 'select-box'+ `-${idNum}`;
    selectBox.onclick = toggleSelect;

    const selectedOption = document.createElement('div');
    selectedOption.className = 'selected-option' + `-${idNum}`;
    selectedOption.textContent = params.defaultSelectText ?? 'Select';
    selectBox.appendChild(selectedOption);

    const options = document.createElement('div');
    options.className = 'options' + `-${idNum}`;
    options.id = selectOptionsId

    items.forEach(item => {
        console.log(item)
        const option = document.createElement('div');
        option.className = 'option' + `-${idNum}`;
        let displayText = ''

        if(typeof item === 'string') {
          // option.textContent = item.charAt(0).toUpperCase() + item.slice(1);
          displayText = item.charAt(0).toUpperCase() + item.slice(1);
        } else if(typeof item === 'object') {
          // option.textContent = item.key.charAt(0).toUpperCase() + item.key.slice(1);
          displayText = item.key.charAt(0).toUpperCase() + item.key.slice(1);
        }

        option.textContent = displayText;
        option.onclick = () => {
          if(params.onSelect && typeof params.onSelect === 'function') {
            params.onSelect(item)
            selectedOption.textContent = displayText;
            // toggleSelect(); // Close the dropdown after selection
          }
        };
        options.appendChild(option);
    });

    selectBox.appendChild(options);
    customSelect.appendChild(selectBox);
    container.appendChild(customSelect);
}



// Function to show the menu
function showMenu(params) {
  console.log(params)
  const { itemText, targetElement, action } = params;
  // Create a menu element
  const menu = document.createElement('div');
  menu.className = 'context-menu';

  // Create the paragraph element
  const title = document.createElement('p');
  title.textContent = `Actions for ${itemText}`;
  menu.appendChild(title);

  // Create the "Perform Action" button
  const performButton = document.createElement('button');
  performButton.textContent = 'Add to list';
  performButton.onclick = function(ev) {
    if(action && typeof action === 'function') {
      action()
    }

    performAction()
  }; // Set the onclick handler
  menu.appendChild(performButton);

  // Create the "Close" button
  const closeButton = document.createElement('button');
  closeButton.textContent = 'Close';
  closeButton.onclick = closeMenu; // Set the onclick handler
  menu.appendChild(closeButton);

  // Position the menu near the target element
  const rect = targetElement.getBoundingClientRect();
  menu.style.position = 'absolute';
  menu.style.top = `${rect.bottom + window.scrollY}px`; // Adjust for scroll
  menu.style.left = `${rect.left}px`;
  
  document.body.appendChild(menu);

  // Remove the menu when clicking elsewhere
  // document.addEventListener('click', closeMenu, { once: true });
}

// Function to close the menu
function closeMenu() {
  const menu = document.querySelector('.context-menu');
  if (menu) {
      menu.remove();
  }
}

// Example action function
function performAction() {
  console.log("Action performed!");
  closeMenu(); // Close the menu after action
}


export function addContextMenu(params) {
  if(!params.div) {
    return;
  }

  // Variables to handle long press
  let pressTimer;
  let isLongPress = false;

  // Add event listeners for long press
  let mouseDown = () => {
    isLongPress = false; // Reset long press flag
    pressTimer = setTimeout(() => {
      console.log("Setting long press...")
        isLongPress = true; // Set long press flag
        // showMenu(params.item.text, params.div); // Call function to show menu
    }, 2000); // Adjust time for long press duration
  }
  let mouseUp = () => {
    clearTimeout(pressTimer);
    if(isLongPress) {
      console.log('Showing menu...', params.item)
      showMenu({
        itemText: params.item.text,
        targetElement: params.div,
        action: params.action
      });
    }
  }
  params.div.addEventListener('mousedown', mouseDown);
  params.div.addEventListener('mouseup', mouseUp);
  params.div.addEventListener('touchstart', (event) => {
    // event.preventDefault(); // Prevent default touch behavior
    mouseDown();
  });

  params.div.addEventListener('touchend', mouseUp);
  params.div.addEventListener('touchcancel', mouseUp);

  // params.div.addEventListener('mouseleave', () => {
  //     clearTimeout(pressTimer);
  //     if (isLongPress) {
  //         closeMenu(); // Close menu if mouse leaves while long press
  //     }
  // });

}


export function localDatabase(storageKey) {
  // const storageKey = 'jsonObjects'; // Key for localStorage

  // Function to generate a unique ID
  function generateId() {
      return '_' + Math.random().toString(36).substr(2, 9);
  }

  // Create a new object and store it in localStorage
  function createObject(data) {
      const objects = readObjects(); // Get existing objects
      const newObject = {
          id: generateId(),
          ...data // Spread the data into the new object
      };
      objects.push(newObject);
      localStorage.setItem(storageKey, JSON.stringify(objects));
      return newObject; // Return the newly created object
  }

  // Read all objects from localStorage
  function readObjects() {
      const storedData = localStorage.getItem(storageKey);
      return storedData ? JSON.parse(storedData) : []; // Return parsed objects or an empty array
  }

  // Update an existing object by ID
  function updateObject(id, updatedData) {
      const objects = readObjects();
      const index = objects.findIndex(obj => obj.id === id);
      if (index !== -1) {
          objects[index] = { ...objects[index], ...updatedData }; // Update the object
          localStorage.setItem(storageKey, JSON.stringify(objects));
          return objects[index]; // Return the updated object
      }
      return null; // Return null if not found
  }

  // Delete an object by ID
  function deleteObject(id) {
      const objects = readObjects();
      const updatedObjects = objects.filter(obj => obj.id !== id); // Filter out the object to delete
      localStorage.setItem(storageKey, JSON.stringify(updatedObjects));
      return updatedObjects; // Return the updated list of objects
  }

  return {
    add: createObject,
    remove: deleteObject,
    update: updateObject,
    getAll: readObjects
  }
}

//****** sound  ********/
export function audioSystem(filePath, volume = 1) {
  const audio = new Audio(filePath);

  function stopSound() {
    audio.pause(); // Pause the audio
    audio.currentTime = 0; // Reset the current time to the beginning
  }
  function isSoundPlaying() {
    return !audio.paused && audio.currentTime > 0 && audio.currentTime < audio.duration;
  }

  function playSound(option = {}) {
    const { playVolume } = option;

    if (isSoundPlaying()) {
      console.log("The audio is currently playing... stopping...");
      stopSound()
    }

    audio.volume = playVolume ?? volume; // Set the volume before playing
    console.log({
      filePath,
      volume,
      playVolume: audio.volume
    })
    audio.play()
  }


  return {
    play: playSound,
    stop: stopSound
  }
}

//********* Sort dynamic data sort by word frequency ***************/
export function filterAndSortByFrequency(words, minFrequency, maxFrequency) {
  return words
      .map(entry => {
          // Assign a default frequency of 1 if not defined
          entry.frequency = entry.frequency || 1;
          return entry;
      })
      .filter(entry => entry.frequency >= minFrequency && entry.frequency <= maxFrequency)
      .sort((a, b) => b.frequency - a.frequency); // Sort in descending order
}

export function filterDuplicates(data) {
  const seenWords = new Set();
  const filteredData = {};

  let totalWordCount = 0;
  let filteredWordCount = 0;

  const wordAndGroupName = {};

  // Helper function to merge meanings arrays
  function mergeMeanings(existingMeanings, newMeanings) {
    const merged = [...new Set([...existingMeanings, ...newMeanings])];
    return merged;
  }

  for(const groupName of Object.keys(data)) {
    filteredData[groupName] = [];

    for(const word of data[groupName]) {
      totalWordCount += 1;

      if (!seenWords.has(word.word)) {
        seenWords.add(word.word);
        filteredData[groupName].push(word);

        wordAndGroupName[word.word] = groupName;

        filteredWordCount += 1;
      } else {
        // Update the meanings in the existing word
        const prevGroupName = wordAndGroupName[word.word];
        const existingWord = filteredData[prevGroupName].find(w => w.word === word.word);

        if(existingWord) {
          existingWord.meanings = mergeMeanings(existingWord.meanings, word.meanings);
        }
      }
    }
  }

  console.log({
    totalWordCount,
    filteredWordCount
  })

  return filteredData;
}

export function filterDuplicatesAndDownload(fileUrl) {
  fetch(fileUrl)
    .then(response => response.json())
    .then(data => {
        // 2. Filter the data
        const filteredData = filterDuplicates(data);
        
        // 3. Create a download link for the filtered data
        const blob = new Blob([JSON.stringify(filteredData, null, 4)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'data1_filtered.json';
        a.click();
        URL.revokeObjectURL(url);
    })
    .catch(error => console.error('Error:', error));
}


// ***** COLOR MANIPULATION ********
function shadeColor(color, percent) {
  // Convert hex to RGB
  let r = parseInt(color.slice(1, 3), 16);
  let g = parseInt(color.slice(3, 5), 16);
  let b = parseInt(color.slice(5, 7), 16);

  // Adjust the RGB values
  r = Math.round(Math.min(255, Math.max(0, r + (r * percent))));
  g = Math.round(Math.min(255, Math.max(0, g + (g * percent))));
  b = Math.round(Math.min(255, Math.max(0, b + (b * percent))));

  // Convert back to hex
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).padStart(6, '0')}`;
}

// [0.2, 0.4, -0.2, -0.4, -0.6] , NEGATIVE values means darker shades
export function generateColorShades(color, listOfShadePercents = [0.3, -0.2]) {
  const colors = [];

  for(const p of listOfShadePercents) {
    colors.push(shadeColor(color, p));
  }

  return colors;
}

export function colorGenerator(availableColors) {
  // let colors = [...availableColors];
  let colors = [];

  for(const c of availableColors) {
    colors.push(c)
    colors.push(...generateColorShades(c))
  }

  fisherYateShuffle(colors);
  console.log({
    colors
  })

  let nextColorFn = function() {
      return colors.pop();
  }

  return nextColorFn
}

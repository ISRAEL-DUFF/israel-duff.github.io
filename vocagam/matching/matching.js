// import { getRandomWords } from '../util.js';
import { generateSelectBox, getRandomWords, colorGenerator, addContextMenu, localDatabase, audioSystem, gameLanguage } from '../util.js'; // Adjust the path as necessary


let words = [];
let currentIndex = 0;
let selectedPair = [];
let availableColors = ["#ffcc80", "#90caf9", "#a5d6a7", "#f48fb1", "#ffab91", "#b39ddb", "#64b5f6", "#ff8a65", "#ba68c8", "#ffd54f", "#4db6ac"];  // Unique colors
let timer;
let timeRemaining = 30;
let gameStarted = false;
let dataFile = {}
let currentLanguage = gameLanguage()
let database = localDatabase(`${currentLanguage}_difficult_words`)
let databaseSnapshot = localDatabase(`${currentLanguage}_snapshots`)
let savedWords = `${currentLanguage}_difficult_words`; // TODO: change for each language
let rightSound = audioSystem('../sounds/rightanswer.mp3')
let wrongSound = audioSystem('../sounds/wronganswer.mp3')
let gameEndSound = audioSystem('../sounds/match-finished.mp3')
let gameLayout = 'random' // or 'ordered' | 'random'

// Global variable to hold the selected value
let selectedValue = null;
let selectedDataSource = null;
let currentSnapshot = null;
let isSnapshot = true;
let nextCardColor = null;
let colorMap = {};
let wordCount = 6;
let matchCounts = 0;

function populateWords() {
    if(isSnapshot) {
        if(currentSnapshot) {
            words = getRandomWords(currentSnapshot.value.data, wordCount);
        }
        return;
    }

    if(selectedValue === null || selectedValue === savedWords) {
        words = getRandomWords(database.getAll(), wordCount)
    } else {
        words = getRandomWords(dataFile[selectedValue ?? "group1"], wordCount);
    }
}

function shuffleGame() {
    resetGame();
    populateWords()
    generateMatchingGame();
}

function getWordMeaning(entry) {
    const maxLength = 20;
    if (entry.meanings && entry.meanings.length > 0) {
        const randomMeaning = entry.meanings[Math.floor(Math.random() * entry.meanings.length)];
        return randomMeaning.length > maxLength ? randomMeaning.slice(0, maxLength) + "..." : randomMeaning;
    } else if(entry.meaning) {
        return entry.meaning.length > maxLength ? entry.meaning.slice(0, maxLength) + "..." : entry.meaning;
    }
}

function showAnimatedFlashcard(data) {
    const flashcardContainer = document.getElementById("flashcard-container")
    let meaning = '';

    if(data.word.meaning) {
        meaning = data.word.meaning;
    } else if(data.word.meanings && data.word.meanings.length > 0) {
        meaning = data.word.meanings.join(' | ')
    }

    const flashC = {
        greek: {
            all:  `
            <div class="flashcard-animation">
                <p style="color:#20e3fd">${data.word["word"]} | Root: ${data.word["root"]} (${data.word["partOfSpeech"]})</p>
                <p style='background-color: ${data.color}; color: white; border-radius: 10px; padding: 5px; font-size: 1.0em; font-weight: bold;'>${meaning}</p>
            </div>
            `,
            meaning: `
            <div class="flashcard-animation">
                <h4 style='color: ${data.color}'>${meaning}</h4>
            </div>
            `,
            word: `
            <div class="flashcard-animation">
                <p style="color:#20e3fd">Root: ${data.word["root"]}</p>
                <p style="color:#20e3fd">Part of Speech: ${data.word["partOfSpeech"]}</p>
            </div>
            `
        },
        hebrew: {
            all:  `
            <div class="flashcard-animation">
                <p style="color:#20e3fd">${data.word["word"]}${data.word["transliteration"] ? ' | ' + data.word["transliteration"] : ''}</p>
                <p>${data.word["partOfSpeech"]}</p>
                <p style='background-color: ${data.color}; color: white; border-radius: 10px; padding: 5px; font-size: 1.0em; font-weight: bold;'>${meaning}</p>
            </div>
            `,
            meaning: `
            <div class="flashcard-animation">
                <h4 style='color: ${data.color}'>${meaning}</h4>
            </div>
            `,
            word: `
            <div class="flashcard-animation">
                <p style="color:#20e3fd">${data.word["word"]}${data.word["transliteration"] ? ' | ' + data.word["transliteration"] : ''}</p>
                <p style="color:#20e3fd">${data.word["partOfSpeech"]}</p>
            </div>
            `
        },
        latin: {
            all:  `
            <div class="flashcard-animation">
                <p style="color:#20e3fd">${data.word["word"]} | ${data.word["inflection"]}</p>
                <p>${data.word["partOfSpeech"] ?? ''}</p>
                <p style='background-color: ${data.color}; color: white; border-radius: 10px; padding: 5px; font-size: 1.0em; font-weight: bold;'>${meaning}</p>
            </div>
            `,
            meaning: `
            <div class="flashcard-animation">
                <h4 style='color: ${data.color}'>${meaning}</h4>
            </div>
            `,
            word: `
            <div class="flashcard-animation">
                <p style="color:#20e3fd">${data.word["inflection"]}</p>
                <p style="color:#20e3fd">${data.word["partOfSpeech"] ?? ''}</p>
                <p style="color:#20e3fd"> ${data.word["semanticGroup"] ? 'Semantic Group: ' + data.word["semanticGroup"] : ''}</p>
            </div>
            `
        }
    }

    flashcardContainer.innerHTML = flashC[currentLanguage][data.type]
    
    // Add animation class to make the flashcard slide in
    const flashcard = flashcardContainer.querySelector('.flashcard-animation');
    setTimeout(() => {
        flashcard.classList.add('show');
    }, 100);
}

function clearAnimatedFlashcard() {
    const flashcardContainer = document.getElementById("flashcard-container")
    flashcardContainer.innerHTML = ``;
}

function updateProgress(value, max) {
    const progressBar = document.getElementById('game-progress');
    progressBar.value = value;

    if(max) {
        progressBar.max = max;
    }
}

// Add event listener to the restart button
document.getElementById("restartButton").addEventListener("click", () => {
    resetGame();
    generateMatchingGame();
});
document.getElementById("refreshButton").addEventListener("click", () => {
    console.log('Reshuffle...') 
    shuffleGame()
});
// JavaScript to handle popup menu
document.getElementById('popupButton').addEventListener('click', function() {
    const popupMenu = document.getElementById('popupMenu');
    popupMenu.style.display = 'flex'; // Show the popup
    setTimeout(() => {
        popupMenu.style.opacity = '1'; // Fade in
    }, 10); // Small delay to allow display to take effect
});

document.getElementById('closePopup').addEventListener('click', function() {
    const popupMenu = document.getElementById('popupMenu');
    popupMenu.style.opacity = '0'; // Fade out
    setTimeout(() => {
        popupMenu.style.display = 'none'; // Hide after fade out
    }, 500); // Match the duration of the CSS transition
});
document.getElementById("wordCountInput").addEventListener("input", (event) => {
    const newCount = parseInt(event.target.value, 10);
    if (!isNaN(newCount) && newCount > 0) {
        wordCount = newCount; // Update the wordCount variable
        console.log("Updated word count to:", wordCount);
    }
});

document.getElementById("updateWordCount").addEventListener("click", () => {
    console.log('update word count called')
    shuffleGame()
});

document.getElementById('saveSnapshot').addEventListener('click', function() {
    const itemNameContainer = document.getElementById('itemNameInput')
    const itemName = itemNameContainer.value;
    if (itemName && words.length > 0) {
        databaseSnapshot.add({
            name: itemName,
            data: words
        })
        document.getElementById('saveFeedback').innerText = 'Snapshot saved successfully!';
        itemNameContainer.value = ''
        populateSnapshotList()
    } else {
        document.getElementById('saveFeedback').innerText = 'Please enter snapshot name.';
    }
});

document.getElementById('deleteSnapshot').addEventListener('click', function() {
    if (currentSnapshot) {
        console.log(currentSnapshot)
        databaseSnapshot.remove(currentSnapshot.value.id);
        document.getElementById('saveFeedback').innerText = 'Snapshot removed successfully!';
        currentSnapshot =  null;
        isSnapshot = false;
        populateSnapshotList()
        setTimeout(() => {
            document.getElementById('saveFeedback').innerText = '';
        }, 2000)
    } else {
        document.getElementById('saveFeedback').innerText = 'Please choose.';
    }
});

function populateSnapshotList() {
    const snapshots = databaseSnapshot.getAll();

    generateSelectBox({
        containerId: 'snapshotListContainer',
        items: snapshots.map((d) => {
            console.log(d)
            return {
                key: d.name,
                value: d
            }
        }),
        onSelect: (event) => {
            // Set the global variable to the value of the selected option
            // selectedValue = event.target.value;
            console.log(event)
            currentSnapshot = event;
            isSnapshot = true;
        
            shuffleGame('snapshot')
            console.log("Selected Snapshot List: " + currentSnapshot);
          },
        style: {
            textColor: 'white',
            selectedTextColor: 'black',
            backgroundColor: '#8e44ad',
        },
        defaultSelectText: 'Select a snapshot'
    })
}

populateSnapshotList()


function loadData(data) {
    dataFile = data;
    const dataList = Object.keys(data);

    generateSelectBox({
        containerId: 'wordgroup-select-container',
        items: dataList,
        onSelect: (event) => {
            // Set the global variable to the value of the selected option
            selectedValue = event;
            isSnapshot = false;
        
            shuffleGame()
            console.log("Selected Word List: " + selectedValue);
          },
        style: {
            textColor: 'white',
            selectedTextColor: 'black',
            backgroundColor: '#8e44ad',
        },
        defaultSelectText: 'Select a word group'
    })
    
    let difficultWords = database.getAll()
    let selectedWords = difficultWords.length > 0 ? getRandomWords(difficultWords, wordCount) : getRandomWords(dataList[0] ? dataFile[dataList[0]] : [], wordCount);

    words = selectedWords;

    generateMatchingGame();
}

fetch(`../word-bank/${currentLanguage}/files.json`)  // Load vocabulary from a JSON file
    .then(response => response.json())
    .then(datasources => {
        const dataSourceList = [];

        for(const k of Object.keys(datasources)) {
            dataSourceList.push({
                key: k,
                value: datasources[k]
            })
        }

        generateSelectBox({
            containerId: 'datasource-select-container',
            items: dataSourceList,
            onSelect: (event) => {
                // Set the global variable to the value of the selected option
                selectedDataSource = event.value;
                isSnapshot = false;
            
                fetch(`../word-bank/${currentLanguage}/${selectedDataSource ?? dataSourceList[0].value}`)  // Load vocabulary from a JSON file
                .then(response => response.json())
                .then(loadData);
                console.log("Selected Datasource List: " + selectedDataSource);
            },
            style: {
                textColor: 'white',
                selectedTextColor: 'black',
                backgroundColor: '#8e44ad',
            },
            defaultSelectText: 'Select Data source'
        })

        fetch(`../word-bank/${currentLanguage}/${selectedDataSource ?? dataSourceList[0].value}`)  // Load vocabulary from a JSON file
        .then(response => response.json())
        .then(loadData);

    });

function generateMatchingGame() {
    const container = document.getElementById('match-game');
    container.innerHTML = '';
    let shuffledWords = [...words];
    shuffledWords.sort(() => Math.random() - 0.5);

    let pairs = [];
    if(gameLayout === 'ordered') {
        let tempPairWords = [];
        let tempPairMeanings = []
        shuffledWords.forEach(word => {
            tempPairWords.push({ text: word.word, value: word.word, word, isMeaning: false });
            tempPairMeanings.push({ text: getWordMeaning(word), value: word.word, word, isMeaning: true });
        });
        tempPairWords.sort(() => Math.random() - 0.5);
        tempPairMeanings.sort(() => Math.random() - 0.5);

        pairs = [...tempPairMeanings, ...tempPairWords];

    } else {
        shuffledWords.forEach(word => {
            pairs.push({ text: word.word, value: word.word, word, isMeaning: false });
            pairs.push({ text: getWordMeaning(word), value: word.word, word, isMeaning: true });
        });
        pairs.sort(() => Math.random() - 0.5);
    }
    


    pairs.forEach(item => {
        let div = document.createElement('div');
        div.className = 'match-item';

        if(!item.isMeaning && currentLanguage === 'latin') {
            div.style.border = '2.0px solid rgba(167, 35, 2, 0.98)'// '1px solid #b51f9e'
            // div.style.backgroundColor = '#c3d8e3fb';
        }

        div.textContent = item.text;
        div.dataset.value = item.value;
        div.onclick = () => {
            (function(d, w){
                selectMatch(d, w);
            })(div, item)
        };
        
        addContextMenu({
            div,
            item,
            action: () => {
                console.log({
                    toBeStored: item
                })
                if(item.word.id) {
                    database.remove(item.word.id)
                } else {
                    database.add(item.word)
                }
            }
        })
        container.appendChild(div);
    });

    // RESET state here
    selectedPair = [];
    nextCardColor = colorGenerator(availableColors);
    colorMap = {}
    matchCounts = 0;
    updateProgress(0, words.length);
    clearAnimatedFlashcard()
}

function selectMatch(element, wordData) {
    if (selectedPair.length == 1 && element === selectedPair[0]) {
        // TODO: unselect here
        return;
    }

    if (selectedPair.length < 2) {
        element.classList.add("selected");
        selectedPair.push(element);

        // display flashcard
        showAnimatedFlashcard({
            type: wordData.isMeaning ? 'meaning' : 'word',
            word: wordData.word,
            color: 'white'
        })
    }

    if (selectedPair.length === 2) {
        let [first, second] = selectedPair;

        if (first.dataset.value === second.dataset.value) {
            rightSound.play()
            matchCounts += 1;
            let assignedColor = colorMap[first.dataset.value];

            if (!assignedColor) {
                assignedColor = nextCardColor(); // Assign a unique color
                colorMap[first.dataset.value] = assignedColor;
            }

            first.classList.add("matched");
            second.classList.add("matched");

            first.style.backgroundColor = assignedColor;
            first.style.borderColor = assignedColor;
            second.style.backgroundColor = assignedColor;
            second.style.borderColor = assignedColor;

            
            showAnimatedFlashcard({
                type: 'all',
                word: wordData.word,
                color: assignedColor
            });
            updateProgress(matchCounts)

            if(matchCounts === words.length) {
                // game over, you have matched all words
                gameEndSound.play();
            }
        } else {
            wrongSound.play()
            selectedPair.forEach(el => {
                first.classList.remove("selected");
                second.classList.remove("selected");
                first.classList.add("unmatch-item");
                second.classList.add("unmatch-item");
            });
            setTimeout(() => {
                first.classList.remove("unmatch-item");
                second.classList.remove("unmatch-item");
                selectedPair = [];
            }, 500);

            clearAnimatedFlashcard()
        }

        selectedPair = [];
    }
}

function startTimedChallenge() {
    if (gameStarted) return;
    gameStarted = true;

    timer = setInterval(function() {
        timeRemaining--;
        document.getElementById('timer').textContent = timeRemaining;
        if (timeRemaining <= 0) {
            clearInterval(timer);
            alert('Time\'s up!');
            resetGame();
        }
    }, 1000);
}

function resetGame() {
    // timeRemaining = 30;
    // document.getElementById('timer').textContent = timeRemaining;

    //generateMatchingGame();
    // startTimedChallenge();

    // updateProgress(0, words.length)
    saveProgress();
}

function saveProgress() {
    const progress = {
        currentIndex: currentIndex,
        timeRemaining: timeRemaining,
        selectedPairs: selectedPair.length
    };
    localStorage.setItem('gameProgress', JSON.stringify(progress));
}

function checkForSavedProgress() {
    const savedProgress = localStorage.getItem('gameProgress');
    if (savedProgress) {
        const progress = JSON.parse(savedProgress);
        currentIndex = progress.currentIndex || 0;
        timeRemaining = progress.timeRemaining || 30;
        selectedPair = progress.selectedPairs || [];
        nextWord();
        generateMatchingGame();
        document.getElementById('timer').textContent = timeRemaining;
        // startTimedChallenge();
    }
}
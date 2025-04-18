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

// Global variable to hold the selected value
let selectedValue = null;
let currentSnapshot = null;
let isSnapshot = true;
let nextCardColor = null;
let colorMap = {};
let wordCount = 5;

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
    const itemNameContainer = document.getElementById('itemNameInput')
    const itemName = itemNameContainer.value;
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



fetch('../word-bank/greek/greek-words.json')  // Load vocabulary from a JSON file
    .then(response => response.json())
    .then(data => {
        dataFile = data;
        const dataList = Object.keys(data);

        // generateSelectFromJson(dataList);
        generateSelectBox({
            containerId: 'wordgroup-select-container',
            items: dataList,
            onSelect: (event) => {
                // Set the global variable to the value of the selected option
                // selectedValue = event.target.value;
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
        let selectedWords = difficultWords.length > 0 ? getRandomWords(difficultWords, wordCount) : getRandomWords(data.group1, wordCount);

        words = selectedWords;

        // checkForSavedProgress();
        generateMatchingGame();
        // startTimedChallenge();
    });

function generateMatchingGame() {
    const container = document.getElementById('match-game');
    container.innerHTML = '';
    let shuffledWords = [...words];
    shuffledWords.sort(() => Math.random() - 0.5);

    let pairs = [];
    shuffledWords.forEach(word => {
        pairs.push({ text: word.greek, value: word.greek, word });
        pairs.push({ text: word.meaning, value: word.greek, word });
    });

    pairs.sort(() => Math.random() - 0.5);

    pairs.forEach(item => {
        let div = document.createElement('div');
        div.className = 'match-item';
        div.textContent = item.text;
        div.dataset.value = item.value;
        div.onclick = () => selectMatch(div);
        
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

    nextCardColor = colorGenerator(availableColors);
    colorMap = {}
}

function selectMatch(element) {
    if (selectedPair.length == 1 && element === selectedPair[0]) {
        return;
    }

    if (selectedPair.length < 2) {
        element.classList.add("selected");
        selectedPair.push(element);
    }

    if (selectedPair.length === 2) {
        let [first, second] = selectedPair;

        if (first.dataset.value === second.dataset.value) {
            rightSound.play()
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
        } else {
            wrongSound.play()
            selectedPair.forEach(el => {
                // el.style.backgroundColor = 'red';
                // el.style.color = 'white';
                first.classList.remove("selected");
                second.classList.remove("selected");
                first.classList.add("unmatch-item");
                second.classList.add("unmatch-item");
            });
            setTimeout(() => {
                // first.classList.remove("selected");
                // second.classList.remove("selected");
                first.classList.remove("unmatch-item");
                second.classList.remove("unmatch-item");
                selectedPair = [];
            }, 500);
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

// Dark Mode Toggle Function
// const toggleButton = document.getElementById("toggleMode");
// toggleButton.addEventListener("click", () => {
//     document.body.classList.toggle("dark-mode");

//     // Save user preference in localStorage
//     if (document.body.classList.contains("dark-mode")) {
//         localStorage.setItem("theme", "dark");
//         toggleButton.textContent = "☀️ Light Mode";
//     } else {
//         localStorage.setItem("theme", "light");
//         toggleButton.textContent = "🌙 Dark Mode";
//     }
// });

// Check saved user preference
// function loadTheme() {
//     const savedTheme = localStorage.getItem("theme");
//     if (savedTheme === "dark") {
//         document.body.classList.add("dark-mode");
//         toggleButton.textContent = "☀️ Light Mode";
//     }
// }

// loadTheme();
import { getRandomWords, localDatabase } from "../util.js";
// const words = [
//     { "greek": "ἀγάπη", "meaning": "love" },
//     { "greek": "λόγος", "meaning": "word" },
//     { "greek": "πίστις", "meaning": "faith" },
//     { "greek": "χάρις", "meaning": "grace" },
//     { "greek": "ἁμαρτία", "meaning": "sin" }
// ];

let selectedWord = null;
let selectedMeaning = null;
let dataFile = {};
let words = [];
let database = localDatabase('difficult_words')
let savedWords = "savedGreekWords"; // TODO: change for each language
let selectedValue = null;



document.getElementById("refreshButton").addEventListener("click", () => {
    console.log('Reshuffle...')
    
    if(selectedValue === null || selectedValue === savedWords) {
        words = getRandomWords(database.getAll())
    } else {
        words = getRandomWords(dataFile[selectedValue ?? "group1"]);
    }

    startGame();
});


fetch('../word-bank/greek/greek-words.json')  // Load vocabulary from a JSON file
    .then(response => response.json())
    .then(data => {
        dataFile = data;
        const dataList = Object.keys(data);
        generateSelectFromJson(dataList);

        // words = data;
        let difficultWords = database.getAll()
        let selectedWords = difficultWords.length > 0 ? difficultWords : getRandomWords(data.group1);
        words = selectedWords;

        startGame()
    });

function generateSelectFromJson(jsonData) {
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
    
        // let selectedWords = getRandomWords(dataFile[selectedValue]);
        // words = selectedWords;
        if(selectedValue === null || selectedValue === savedWords) {
            words = getRandomWords(database.getAll())
        } else {
            words = getRandomWords(dataFile[selectedValue ?? "group1"]);
        }

        startGame();
    });
    
    // Append the select element to the body or any other container
    //   document.body.appendChild(select);
    }
    
    
// Function to randomly select 10 words
// function getRandomWords(list, count = 10) {
//     // Shuffle the array using Fisher-Yates algorithm
//     let shuffled = list.slice().sort(() => Math.random() - 0.5);
    
//     // Select the first 'count' words
//     return shuffled.slice(0, count);
// }

function shuffle(array) {
    return array.sort(() => Math.random() - 0.5);
}

function startGame() {
    const greekColumn = document.getElementById("greekColumn");
    const meaningColumn = document.getElementById("meaningColumn");

    // Clear previous content
    greekColumn.innerHTML = "";
    meaningColumn.innerHTML = "";

    // Shuffle words and meanings separately
    const shuffledWords = shuffle([...words]);
    const shuffledMeanings = shuffle([...words]);

    shuffledWords.forEach(wordObj => {
        const wordElement = document.createElement("div");
        wordElement.classList.add("word");
        wordElement.textContent = wordObj.greek;
        wordElement.dataset.value = wordObj.meaning;

        wordElement.addEventListener("click", function() {
            if (!selectedWord) {
                selectedWord = this;
                this.style.backgroundColor = "#f1c40f";
                this.style.color = "black";
            }
        });

        greekColumn.appendChild(wordElement);
    });

    shuffledMeanings.forEach(wordObj => {
        const meaningElement = document.createElement("div");
        meaningElement.classList.add("meaning");
        meaningElement.textContent = wordObj.meaning;
        meaningElement.dataset.value = wordObj.meaning;

        meaningElement.addEventListener("click", function() {
            if (selectedWord && !selectedMeaning) {
                selectedMeaning = this;
                this.style.backgroundColor = "#f1c40f";
                this.style.color = "black";

                checkMatch();
            }
        });

        meaningColumn.appendChild(meaningElement);
    });
}

function checkMatch() {
    if (selectedWord && selectedMeaning) {
        if (selectedWord.dataset.value === selectedMeaning.dataset.value) {
            selectedWord.classList.add("matched");
            selectedMeaning.classList.add("matched");
        } else {
            setTimeout(() => {
                selectedWord.style.backgroundColor = "white";
                selectedWord.style.color = "black";
                selectedMeaning.style.backgroundColor = "white";
                selectedMeaning.style.color = "black";
            }, 500);
        }

        selectedWord = null;
        selectedMeaning = null;
    }
}

startGame();
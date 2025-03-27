// import { getRandomWords } from '../util.js';

let words = [];
let currentIndex = 0;
let dataFile = {}


fetch('../greek-words.json')  // Load vocabulary from a JSON file
    .then(response => response.json())
    .then(data => {
        // words = data;

        dataFile = data;
        const dataList = Object.keys(data);
        generateSelectFromJson(dataList);

        let selectedWords = getRandomWords(data.group1);

        words = selectedWords;
    });

// function nextWord() {
//     if (words.length === 0) return;
//     currentIndex = Math.floor(Math.random() * words.length);
//     document.getElementById('flashcard').textContent = words[currentIndex].greek;
// }

document.getElementById("refreshButton").addEventListener("click", () => {
    let selectedWords = getRandomWords(dataFile[selectedValue ?? "group1"]);
    words = selectedWords;
    resetGame();
});

function getRandomWords(list, count = 10) {
    // Shuffle the array using Fisher-Yates algorithm
    let shuffled = list.slice().sort(() => Math.random() - 0.5);
    
    // Select the first 'count' words
    return shuffled.slice(0, count);
}

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
  
      resetGame();
      let selectedWords = getRandomWords(dataFile[selectedValue]);
      words = selectedWords;
      console.log("Selected Word List: " + selectedValue);
    });
  
    // Append the select element to the body or any other container
  //   document.body.appendChild(select);
  }

function createFlashcards() {
    const container = document.getElementById("flashcardContainer");
    container.innerHTML = "";

    words.forEach(word => {
        const flashcard = document.createElement("div");
        flashcard.classList.add("flashcard");

        const cardInner = document.createElement("div");
        cardInner.classList.add("card-inner");

        const front = document.createElement("div");
        front.classList.add("card-front");
        front.textContent = word.greek;

        const back = document.createElement("div");
        back.classList.add("card-back");
        back.textContent = word.meaning;

        cardInner.appendChild(front);
        cardInner.appendChild(back);
        flashcard.appendChild(cardInner);

        flashcard.addEventListener("click", function () {
            flashcard.classList.toggle("flipped");
        });

        container.appendChild(flashcard);
    });
}


function resetGame() {
    // timeRemaining = 30;
    // document.getElementById('timer').textContent = timeRemaining;
    createFlashcards();
    // startTimedChallenge();
    // saveProgress();
}

createFlashcards();

// document.getElementById('flashcard').addEventListener('click', function() {
//     if (words.length > 0) {
//         this.textContent = words[currentIndex].meaning;
//     }
// });

// Dark Mode Toggle Function
const toggleButton = document.getElementById("toggleMode");
toggleButton.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");

    // Save user preference in localStorage
    if (document.body.classList.contains("dark-mode")) {
        localStorage.setItem("theme", "dark");
        toggleButton.textContent = "☀️ Light Mode";
    } else {
        localStorage.setItem("theme", "light");
        toggleButton.textContent = "🌙 Dark Mode";
    }
});

// Check saved user preference
function loadTheme() {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
        document.body.classList.add("dark-mode");
        toggleButton.textContent = "☀️ Light Mode";
    }
}

loadTheme();

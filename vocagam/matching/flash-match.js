import { getRandomWords } from "../util.js";

let wordList = [];
let currentWordIndex = 0;
let streak = 0;
let gameTime = 60 * 2; // 2 minute
let timeRemaining = gameTime;
let timer;
let isGameRunning = false;
let isReviewMode = false;
let dataFile = [];
const correctSound = new Audio('../sounds/rightanswer.mp3');
const incorrectSound = new Audio('../sounds/wronganswer.mp3');

  fetch('../word-bank/greek/greek-core-list.json')  // Load vocabulary from a JSON file
    .then(response => response.json())
    .then(data => {
        dataFile = data;
        // const dataList = Object.keys(data);

        // generateSelectBox({
        //     containerId: 'wordgroup-select-container',
        //     items: dataList,
        //     onSelect: (event) => {
        //         // Set the global variable to the value of the selected option
        //         // selectedValue = event.target.value;
        //         selectedValue = event;
            
        //         shuffleGame()
        //         console.log("Selected Word List: " + selectedValue);
        //       },
        //     style: {
        //         textColor: 'white',
        //         selectedTextColor: 'black',
        //         backgroundColor: '#8e44ad',
        //     },
        //     defaultSelectText: 'Select a word group'
        // })
        
        wordList = getRandomWords(data);
    });
  
  const startButton = document.getElementById('start-button');
  const startReviewButton = document.getElementById('start-review-button');
  const flashcardContainer = document.getElementById('flashcard-container');
  const wordButtonsContainer = document.getElementById('word-buttons-container');
  const timeProgress = document.getElementById('time-progress');
  const timeRemainingSpan = document.getElementById('time-remaining');
  const streakCounter = document.getElementById('streak-counter');
  const feedbackContainer = document.getElementById('feedback');
  
  startButton.addEventListener('click', startGame);
  startReviewButton.addEventListener('click', startReview);

  function showFlashcard(word) {
    flashcardContainer.innerHTML = `
            <div class="flashcard">
                <h2>${word.DEFINITION}</h2>
                <p>Part of Speech: ${word["Part of Speech"]}</p>
                <p>Semantic Group: ${word["SEMANTIC GROUP"]}</p>
            </div>
    `;

    // Add animation class to make the flashcard slide in
    const flashcard = flashcardContainer.querySelector('.flashcard');
    setTimeout(() => {
        flashcard.classList.add('show');
    }, 100);
}
  
  function startGame() {
      if (isGameRunning) return;
  
      isGameRunning = true;
      isReviewMode = false;
      streak = 0;
      timeRemaining = gameTime;
      currentWordIndex = 0;
  
      streakCounter.textContent = `Streak: ${streak}`;
      timeRemainingSpan.textContent = timeRemaining;
      timeProgress.value = 100;
  
      startButton.disabled = true;
      startTimer();
      displayFlashcard();
  }

  function startReview() {
    endGame();
    isReviewMode = true;
    createWordReviewButtons()
  }
  
  function startTimer() {
      timer = setInterval(() => {
          timeRemaining--;
          timeRemainingSpan.textContent = timeRemaining;
          timeProgress.value = (timeRemaining / gameTime) * 100;
  
          if (timeRemaining <= 0) {
              endGame();
          }
      }, 1000);
  }
  
function displayFlashcard() {
    if (currentWordIndex < wordList.length) {
        const word = wordList[currentWordIndex];
        showFlashcard(word)

        createWordButtons(word);
    } else {
        endGame();
    }
}
  
function createWordButtons(correctWord) {
    const buttons = wordList.map(word => word.Headword);
    const shuffleButtons = buttons.sort(() => Math.random() - 0.5);
    
    wordButtonsContainer.innerHTML = '';
    shuffleButtons.forEach(word => {
        const button = document.createElement('button');
        button.textContent = word;
        button.addEventListener('click', () => checkAnswer(word, correctWord.Headword));

        // Add transition animation on button click
        button.addEventListener('click', () => {
            button.style.transform = 'scale(0.95)';
            setTimeout(() => {
                button.style.transform = 'scale(1)';
            }, 200);
        });

        wordButtonsContainer.appendChild(button);
    });
}
function createWordReviewButtons() {
    const sortedWords = [...wordList].sort(() => Math.random() - 0.5);
    // const buttons = sortedWords.map(word => word.Headword);
    // const shuffleButtons = buttons.sort(() => Math.random() - 0.5);
    
    wordButtonsContainer.innerHTML = '';
    let prevPressed;
    sortedWords.forEach(word => {
        const button = document.createElement('button');
        button.textContent = word.Headword;
        (function(w){
            button.addEventListener('click', () => {
                showFlashcard(w)
            });
        })(word)

        // Add transition animation on button click
        button.addEventListener('click', () => {
            button.style.transform = 'scale(0.95)';
            setTimeout(() => {
                button.style.transform = 'scale(1)';
                button.style.backgroundColor = 'green';

                if(prevPressed) {
                    prevPressed.style.backgroundColor = '#444'
                }
                prevPressed = button;
            }, 200);
        });

        wordButtonsContainer.appendChild(button);
    });

    showFlashcard(sortedWords[0])
}
  
function checkAnswer(selectedAnswer, correctAnswer) {
    // don't do anything when game isn't running
    if(isGameRunning) {
        if (selectedAnswer === correctAnswer) {
            streak++;
            correctSound.play();
            feedbackContainer.textContent = 'Correct!';
            feedbackContainer.classList.remove('incorrect-feedback');
            feedbackContainer.classList.add('correct-feedback');
        } else {
            streak = 0;
            incorrectSound.play();
            feedbackContainer.textContent = 'Incorrect!';
            feedbackContainer.classList.remove('correct-feedback');
            feedbackContainer.classList.add('incorrect-feedback');
        }
    
        streakCounter.textContent = `Streak: ${streak}`;
        
        // Hide feedback after 1 second
        setTimeout(() => {
            feedbackContainer.classList.add('feedback-hidden');
            setTimeout(() => {
                feedbackContainer.classList.remove('feedback-hidden');
                feedbackContainer.textContent = '';
            }, 300);
        }, 1000);
    
        currentWordIndex++;
        flashcardContainer.innerHTML = ''; // Clear current card
        displayFlashcard(); // Show next flashcard
    }

    
}
  
  function endGame() {
      clearInterval(timer);
      feedbackContainer.textContent = `Game Over! Your streak was: ${streak}`;
      startButton.disabled = false;
      isGameRunning = false;
  }
  
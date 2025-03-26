let words = [];
let currentIndex = 0;

fetch('./greek-words.json')  // Load vocabulary from a JSON file
    .then(response => response.json())
    .then(data => {
        words = data;
    });

function nextWord() {
    if (words.length === 0) return;
    currentIndex = Math.floor(Math.random() * words.length);
    document.getElementById('flashcard').textContent = words[currentIndex].greek;
}

document.getElementById('flashcard').addEventListener('click', function() {
    if (words.length > 0) {
        this.textContent = words[currentIndex].meaning;
    }
});
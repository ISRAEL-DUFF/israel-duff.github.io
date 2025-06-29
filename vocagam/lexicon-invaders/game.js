
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const urlParams = new URLSearchParams(window.location.search);
const gameMode = urlParams.get('mode') || 'auto'; // Default to auto
const currentLanguage = urlParams.get('lang') || 'greek'; // Default to Greek

canvas.width = 800;
canvas.height = 600;

const player = {
    x: canvas.width / 2 - 25,
    y: canvas.height - 60,
    width: 50,
    height: 50,
    color: 'blue',
    speed: 8,
    projectiles: []
};

const LIVES = 20;
const BASE_SPAWN_INTERVAL = 10000; // Base interval in milliseconds (10 seconds)

let rightPressed = false;
let leftPressed = false;
let spacePressed = false;

let vocabulary = [];
let fallingWords = [];
let targetWords = [];
let recycleBin = [];
let score = 0;
let lives = LIVES;
let level = 1;
let gameOver = false;
let spawnInterval; // This will hold the ID of the setInterval
const TARGET_WORD_COUNT = 5;
let manualSpeed = 1;

// Add speed slider for manual mode
if (gameMode === 'manual') {
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = 1;
    slider.max = 10;
    slider.value = 1;
    slider.id = 'speedSlider';
    slider.style.position = 'absolute';
    slider.style.top = '10px';
    slider.style.left = '10px';
    document.body.appendChild(slider);

    slider.addEventListener('input', (e) => {
        manualSpeed = parseInt(e.target.value, 10);
        startSpawning(); // Adjust spawn rate immediately when slider changes
    });
}

// Helper to get the correct vocabulary file path
function getVocabularyFilePath(lang) {
    switch (lang) {
        case 'greek':
            return '../word-bank/greek/greek_core_list.json';
        case 'hebrew':
            return '../word-bank/hebrew/hebrew_words_old_testament.json';
        case 'latin':
            return '../word-bank/latin/dcc_latin_core_words.json';
        default:
            return '../word-bank/greek/greek_core_list.json'; // Default to Greek
    }
}

// Helper to get the correct font for the language
function getFontForLanguage(lang) {
    switch (lang) {
        case 'greek':
            return '20px SBL_grk';
        case 'hebrew':
            return '20px SBL_Hbrw'; // Assuming SBL_Hbrw.ttf for Hebrew
        case 'latin':
            return '20px Arial'; // Latin can use a standard font
        default:
            return '20px SBL_grk';
    }
}

// Fetch Vocabulary Data
async function loadVocabulary() {
    try {
        const vocabFilePath = getVocabularyFilePath(currentLanguage);
        const response = await fetch(vocabFilePath);
        const data = await response.json();
        const allWords = Object.values(data).flat();

        const uniqueWords = [];
        const seenWords = new Set();
        for (const item of allWords) {
            if (!seenWords.has(item.word)) {
                seenWords.add(item.word);
                uniqueWords.push(item);
            }
        }

        // Shuffle the unique words and pick the first 30
        const shuffledWords = uniqueWords.sort(() => 0.5 - Math.random());
        const gameVocabulary = shuffledWords.slice(0, 30);

        vocabulary = gameVocabulary.map(item => ({
            word: item.word,
            definition: Array.isArray(item.meanings) ? item.meanings.join(', ').trim() : item.meanings.trim()
        }));

        console.log(`Vocabulary loaded successfully for ${currentLanguage} with 30 random words`);
        initGame(); // Call initGame to start the game
    } catch (error) {
        console.error("Error loading vocabulary:", error);
        ctx.fillStyle = 'red';
        ctx.font = '20px Arial';
        ctx.fillText('Failed to load vocabulary. Please refresh.', 10, 50);
    }
}

// Function to manage word spawning interval
function startSpawning() {
    if (spawnInterval) {
        clearInterval(spawnInterval);
    }
    let currentSpawnRate;
    if (gameMode === 'auto') {
        currentSpawnRate = BASE_SPAWN_INTERVAL / level; // More gradual increase
    } else { // Manual mode
        currentSpawnRate = BASE_SPAWN_INTERVAL / manualSpeed;
    }
    spawnInterval = setInterval(spawnWord, currentSpawnRate);
}


function spawnWord() {
    if (gameOver) return;

    let wordToSpawn = null;

    // 1. Prioritize words from the recycle bin (if any)
    if (recycleBin.length > 0 && Math.random() < 0.5) { // 50% chance to pick from recycle bin
        wordToSpawn = recycleBin.shift();
    }

    // 2. If no word from recycle bin, or if recycle bin wasn't chosen, try to spawn a target word
    if (!wordToSpawn && targetWords.length > 0) {
        const availableTargets = targetWords.filter(
            t => !fallingWords.some(f => f.word === t.word)
        );
        if (availableTargets.length > 0) {
            // Always pick a target if available and not already falling
            wordToSpawn = availableTargets[Math.floor(Math.random() * availableTargets.length)];
        }
    }

    // 3. If still no word (no recycle, no available target), pick a distractor
    if (!wordToSpawn) {
        const distractorPool = vocabulary.filter(
            v => !targetWords.some(t => t.word === v.word) && !fallingWords.some(f => f.word === v.word)
        );
        if (distractorPool.length > 0) {
            wordToSpawn = distractorPool[Math.floor(Math.random() * distractorPool.length)];
        }
    }

    if (!wordToSpawn) {
        // Failsafe if no word could be selected (e.g., all words are on screen)
        return;
    }

    let x;
    let validPosition = false;
    let attempts = 0;
    const maxAttempts = 20;

    while (!validPosition && attempts < maxAttempts) {
        x = Math.random() * (canvas.width - ctx.measureText(wordToSpawn.word).width);
        validPosition = true;
        for (const falling of fallingWords) {
            // Check for overlap only with words near the top
            if (falling.y < 50 && x < falling.x + ctx.measureText(falling.word).width && x + ctx.measureText(wordToSpawn.word).width > falling.x) {
                validPosition = false;
                break;
            }
        }
        attempts++;
    }

    if (!validPosition) return; // Don't spawn if no clear spot is found

    const speed = (gameMode === 'manual' ? manualSpeed : 1 + Math.random() * (level * 0.5)) * 0.5;

    fallingWords.push({
        ...wordToSpawn,
        x: x,
        y: 0,
        speed: speed
    });
}


function replenishTargetWords() {
    while (targetWords.length < TARGET_WORD_COUNT && vocabulary.length > 0) {
        const available = vocabulary.filter(v => 
            !targetWords.some(t => t.word === v.word) && 
            !fallingWords.some(f => f.word === v.word)
        );
        if (available.length === 0) break;

        const newWord = available[Math.floor(Math.random() * available.length)];
        targetWords.push(newWord);
    }
}

document.addEventListener('keydown', keyDownHandler, false);
document.addEventListener('keyup', keyUpHandler, false);
canvas.addEventListener('click', handleCanvasClick, false);

function keyDownHandler(e) {
    if (e.key == 'Right' || e.key == 'ArrowRight') rightPressed = true;
    else if (e.key == 'Left' || e.key == 'ArrowLeft') leftPressed = true;
    else if (e.code == 'Space') spacePressed = true;
}

function keyUpHandler(e) {
    if (e.key == 'Right' || e.key == 'ArrowRight') rightPressed = false;
    else if (e.key == 'Left' || e.key == 'ArrowLeft') leftPressed = false;
    else if (e.code == 'Space') spacePressed = false;
}

function handleCanvasClick(e) {
    if (gameOver) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        if (x > canvas.width / 2 - 75 && x < canvas.width / 2 + 75 && y > canvas.height / 2 + 20 && y < canvas.height / 2 + 60) {
            restartGame();
        }
    }
}

function fireProjectile() {
    if (player.projectiles.length < 5) {
        player.projectiles.push({ x: player.x + player.width / 2 - 2.5, y: player.y, width: 5, height: 10, color: 'red', speed: 7 });
    }
}

function drawPlayer() {
    ctx.beginPath();
    ctx.rect(player.x, player.y, player.width, player.height);
    ctx.fillStyle = player.color;
    ctx.fill();
    ctx.closePath();
}

function drawProjectiles() {
    for (const p of player.projectiles) {
        ctx.beginPath();
        ctx.rect(p.x, p.y, p.width, p.height);
        ctx.fillStyle = p.color;
        ctx.fill();
        ctx.closePath();
    }
}

function drawFallingWords() {
    ctx.fillStyle = '#00ffcc'; // Neon green for visibility
    ctx.font = getFontForLanguage(currentLanguage);
    for (const word of fallingWords) {
        ctx.fillText(word.word, word.x, word.y);
    }
}

function drawUI() {
    ctx.fillStyle = '#00ffcc'; // Neon green for visibility
    ctx.font = '20px Arial';
    ctx.fillText(`Score: ${score}`, 150, 20);
    ctx.fillText(`Lives: ${lives}`, canvas.width - 85, 20);
    if (gameMode === 'auto') {
        ctx.fillText(`Level: ${level}`, canvas.width / 2 - 30, 20);
    }

    ctx.font = 'bold 16px Arial';
    ctx.fillStyle = '#ff66cc'; // Neon pink for definitions
    ctx.fillText("Find words for:", 10, 50);
    ctx.font = '14px Arial';
    ctx.fillStyle = '#ffffff'; // White for definition list
    for (let i = 0; i < targetWords.length; i++) {
        const definitionText = `- ${targetWords[i].definition}`;
        ctx.fillText(definitionText, 10, 70 + (i * 20));
    }
}



function update() {
    if (gameOver) {
        // Stop the animation frame loop when game is over
        if (window.gameLoopId) {
            cancelAnimationFrame(window.gameLoopId);
            window.gameLoopId = null;
        }

        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'white';
        ctx.font = '50px Arial';
        ctx.fillText('GAME OVER', canvas.width / 2 - 150, canvas.height / 2);
        ctx.fillStyle = '#4CAF50';
        ctx.fillRect(canvas.width / 2 - 75, canvas.height / 2 + 20, 150, 40);
        ctx.fillStyle = 'white';
        ctx.font = '20px Arial';
        ctx.fillText('Restart', canvas.width / 2 - 35, canvas.height / 2 + 45);
        return;
    }

    if (gameMode === 'auto' && score >= level * 100) {
        level++;
        startSpawning(); // Adjust spawn rate when level changes
    }

    if (rightPressed && player.x < canvas.width - player.width) player.x += player.speed;
    else if (leftPressed && player.x > 0) player.x -= player.speed;

    if (spacePressed) {
        fireProjectile();
        spacePressed = false;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = player.projectiles.length - 1; i >= 0; i--) {
        player.projectiles[i].y -= player.projectiles[i].speed;
        if (player.projectiles[i].y < 0) player.projectiles.splice(i, 1);
    }
    drawProjectiles();

    for (let i = fallingWords.length - 1; i >= 0; i--) {
        const word = fallingWords[i];
        word.y += word.speed;

        const targetIndex = targetWords.findIndex(t => t.word === word.word);
        if (word.y > canvas.height) {
            if (targetIndex !== -1) {
                lives--;
                if (lives <= 0) gameOver = true;
                recycleBin.push(targetWords[targetIndex]);
                targetWords.splice(targetIndex, 1);
                replenishTargetWords();
            }
            fallingWords.splice(i, 1);
        }
    }
    drawFallingWords();

    for (let i = player.projectiles.length - 1; i >= 0; i--) {
        for (let j = fallingWords.length - 1; j >= 0; j--) {
            const p = player.projectiles[i];
            const w = fallingWords[j];

            if (p && w && p.x < w.x + ctx.measureText(w.word).width && p.x + p.width > w.x && p.y < w.y && p.y + p.height > w.y - 20) {
                const targetIndex = targetWords.findIndex(t => t.word === w.word);
                if (targetIndex !== -1) {
                    score += 10;
                    targetWords.splice(targetIndex, 1);
                    replenishTargetWords();
                } else {
                    lives--;
                    if (lives <= 0) gameOver = true;
                }
                fallingWords.splice(j, 1);
                player.projectiles.splice(i, 1);
                break;
            }
        }
    }

    drawPlayer();
    drawUI();

    window.gameLoopId = requestAnimationFrame(update);
}

function initGame() {
    // Clear any existing game loop or spawn interval
    if (window.gameLoopId) {
        cancelAnimationFrame(window.gameLoopId);
        window.gameLoopId = null;
    }
    if (spawnInterval) {
        clearInterval(spawnInterval);
        spawnInterval = null;
    }

    gameOver = false;
    score = 0;
    lives = LIVES;
    level = 1;
    player.x = canvas.width / 2 - 25;
    fallingWords = [];
    player.projectiles = [];
    targetWords = [];
    recycleBin = [];

    replenishTargetWords();

    // Start the spawning interval
    startSpawning();

    // Start the main game loop
    window.gameLoopId = requestAnimationFrame(update);
}

function startGame() {
    // This function is now primarily for resetting state, called by initGame
    // The actual game loop and spawning are managed by initGame
}

function restartGame() {
    initGame();
}

loadVocabulary();


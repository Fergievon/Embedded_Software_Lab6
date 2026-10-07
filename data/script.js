const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const wheel = document.getElementById("steeringWheel");
const angleDisplay = document.getElementById("angleVal");
const scoreDisplay = document.getElementById("scoreVal");
const gameOverOverlay = document.getElementById("gameOverOverlay");

// --- GAME STATE ---
let currentAngle = 90; // Center is 90 deg (0 = Left, 180 = Right)
let lastSentAngle = -1;
let score = 0;
let gameOver = false;
let roadOffset = 0;

// Player Car
const player = { x: 135, y: 280, width: 30, height: 50 };

// Obstacle Cars
let obstacles = [
    { x: 50, y: -100, speed: 3, color: '#ef4444' },
    { x: 180, y: -250, speed: 4, color: '#eab308' }
];

// --- SERVO API TRANSMITTER ---
function sendServoAngle(angle) {
    if (angle === lastSentAngle) return;
    lastSentAngle = angle;
    fetch(`/api/servo?angle=${angle}`).catch(() => {});
}

// --- STEERING CONTROLS ---
function setAngle(newAngle) {
    currentAngle = Math.max(0, Math.min(180, Math.round(newAngle)));
    angleDisplay.textContent = currentAngle;
    
    // Rotate visual steering wheel (-90deg to +90deg relative to center)
    const visualRotation = currentAngle - 90;
    wheel.style.transform = `rotate(${visualRotation}deg)`;
    
    sendServoAngle(currentAngle);
}

// Drag Wheel Logic
let isDragging = false;
let startX = 0;

const wheelContainer = document.querySelector(".wheel-container");

wheelContainer.addEventListener("mousedown", (e) => { isDragging = true; startX = e.clientX; });
window.addEventListener("mouseup", () => { isDragging = false; });
window.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    let deltaX = e.clientX - startX;
    startX = e.clientX;
    setAngle(currentAngle + deltaX * 0.8);
});

// Touch controls for Mobile
wheelContainer.addEventListener("touchstart", (e) => { isDragging = true; startX = e.touches[0].clientX; });
window.addEventListener("touchend", () => { isDragging = false; });
window.addEventListener("touchmove", (e) => {
    if (!isDragging) return;
    let deltaX = e.touches[0].clientX - startX;
    startX = e.touches[0].clientX;
    setAngle(currentAngle + deltaX * 0.8);
});

// Keyboard Controls (Left/Right Arrows or A/D)
window.addEventListener("keydown", (e) => {
    if (gameOver) return;
    if (e.key === "ArrowLeft" || e.key === "a") setAngle(currentAngle - 5);
    if (e.key === "ArrowRight" || e.key === "d") setAngle(currentAngle + 5);
});

// --- GAME LOOP ---
function update() {
    if (gameOver) return;

    // 1. Move Player Car based on Steering Angle
    // Angle 90 = no horizontal movement, <90 move left, >90 move right
    let steerVelocity = (currentAngle - 90) * 0.08;
    player.x += steerVelocity;
    player.x = Math.max(20, Math.min(canvas.width - player.width - 20, player.x));

    // 2. Animate Road
    roadOffset = (roadOffset + 5) % 40;

    // 3. Move & Reset Obstacles
    obstacles.forEach(obs => {
        obs.y += obs.speed;
        if (obs.y > canvas.height) {
            obs.y = -60;
            obs.x = 30 + Math.random() * (canvas.width - 90);
            score += 10;
            scoreDisplay.textContent = score;
        }

        // Collision Check
        if (player.x < obs.x + 30 && player.x + player.width > obs.x &&
            player.y < obs.y + 50 && player.y + player.height > obs.y) {
            endGame();
        }
    });

    render();
    requestAnimationFrame(update);
}

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Grass / Borders
    ctx.fillStyle = "#15803d";
    ctx.fillRect(0, 0, 20, canvas.height);
    ctx.fillRect(canvas.width - 20, 0, 20, canvas.height);

    // Draw Road
    ctx.fillStyle = "#334155";
    ctx.fillRect(20, 0, canvas.width - 40, canvas.height);

    // Draw Road Striping
    ctx.strokeStyle = "#f8fafc";
    ctx.lineWidth = 4;
    ctx.setLineDash([20, 20]);
    ctx.lineDashOffset = -roadOffset;
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();

    // Draw Player Car
    ctx.fillStyle = "#38bdf8";
    ctx.fillRect(player.x, player.y, player.width, player.height);

    // Draw Obstacles
    obstacles.forEach(obs => {
        ctx.fillStyle = obs.color;
        ctx.fillRect(obs.x, obs.y, 30, 50);
    });
}

function endGame() {
    gameOver = true;
    gameOverOverlay.classList.remove("hidden");
}

function resetGame() {
    gameOver = false;
    score = 0;
    scoreDisplay.textContent = "0";
    setAngle(90);
    player.x = 135;
    obstacles[0].y = -100;
    obstacles[1].y = -250;
    gameOverOverlay.classList.add("hidden");
    requestAnimationFrame(update);
}

// Start Game
requestAnimationFrame(update);
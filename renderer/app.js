// Canvas setup
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// Resize canvas to full screen
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Configuration
let config = { duration: 60, name: null, musicUrl: null, date: null, cake: '🎂', blowMode: false };
let partyStarted = false;
let candlesBlown = false;

// Load config from file
async function loadConfig() {
    try {
        if (window.electronAPI) {
            const configData = await window.electronAPI.getConfig();
            Object.assign(config, configData);
            console.log('Config loaded from Electron:', config);
        } else {
            // Fallback to fetch for web version
            const response = await fetch('../birthdayconfig.txt');
            const text = await response.text();
            const lines = text.split('\n');
            
            for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed.startsWith('name=')) {
                    config.name = trimmed.split('=', 2)[1];
                } else if (trimmed.startsWith('duration=')) {
                    const val = parseInt(trimmed.split('=', 2)[1]);
                    if (!isNaN(val)) config.duration = val;
                } else if (trimmed.startsWith('musicUrl=')) {
                    config.musicUrl = trimmed.split('=', 2)[1];
                } else if (trimmed.startsWith('date=')) {
                    config.date = trimmed.split('=', 2)[1];
                } else if (trimmed.startsWith('cake=')) {
                    config.cake = trimmed.split('=', 2)[1];
                } else if (trimmed.startsWith('blowMode=')) {
                    config.blowMode = trimmed.split('=', 2)[1] === 'true';
                }
            }
            console.log('Config loaded from file:', config);
        }
    } catch (e) {
        console.log('Could not load config, using defaults');
    }
}

// Check if today is the configured date
function shouldStartToday() {
    if (!config.date) {
        console.log('No date configured, starting today');
        return true;
    }
    
    const now = new Date();
    const currentDay = now.getDate();
    const currentMonth = now.getMonth() + 1;
    
    // Support both DD/MM and DD-MM formats
    const separator = config.date.includes('/') ? '/' : '-';
    const [configDay, configMonth] = config.date.split(separator).map(Number);
    
    console.log(`Config date: ${configDay}-${configMonth}, Current date: ${currentDay}-${currentMonth}`);
    
    if (currentDay === configDay && currentMonth === configMonth) {
        console.log('Date matches, starting today!');
        return true;
    }
    
    console.log('Date mismatch, not starting today');
    return false;
}

// Config panel
const configPanel = document.getElementById('config-panel');
const openConfigBtn = document.getElementById('open-config');
const closeConfigBtn = document.getElementById('close-config');
const startBtn = document.getElementById('start-btn');

openConfigBtn.addEventListener('click', () => {
    configPanel.classList.add('show');
});

closeConfigBtn.addEventListener('click', () => {
    configPanel.classList.remove('show');
});

startBtn.addEventListener('click', () => {
    const inputName = document.getElementById('name-input').value;
    const inputDuration = document.getElementById('duration-input').value;
    const inputMusicUrl = document.getElementById('music-url').value;
    const selectedCake = document.getElementById('cake-select').value;
    const blowMode = document.getElementById('blow-mode').checked;
    
    if (inputName) config.name = inputName;
    if (inputDuration) config.duration = parseInt(inputDuration) || 60;
    if (inputMusicUrl) config.musicUrl = inputMusicUrl;
    config.cake = selectedCake;
    config.blowMode = blowMode;
    
    configPanel.classList.remove('show');
    startParty();
});

// Start the party
function startParty() {
    if (partyStarted) return;
    partyStarted = true;
    
    // Update timer
    const timerEl = document.getElementById('timer');
    let remaining = config.duration;
    timerEl.textContent = remaining;
    
    const countdownInterval = setInterval(() => {
        remaining--;
        timerEl.textContent = remaining;
        if (remaining <= 0) {
            clearInterval(countdownInterval);
            closeParty();
        }
    }, 1000);
    
    // Play music
    playMusic();
    
    // Display name on cake if configured
    if (config.name) {
        displayNameOnCake(config.name);
    }
}

function closeParty() {
    alert('Happy Birthday! 🎂');
    window.location.reload();
}

// Music playback
async function playMusic() {
    const audio = document.getElementById('default-song');
    
    if (window.electronAPI) {
        // Electron version - get MP3 path from main process
        const mp3Path = await window.electronAPI.getMp3Path();
        if (mp3Path) {
            audio.src = mp3Path;
        }
    }
    
    if (config.musicUrl) {
        audio.src = config.musicUrl;
    }
    
    audio.volume = 0.5;
    
    // Try to play with user interaction
    audio.play().catch(e => {
        console.log('Audio autoplay blocked, waiting for user interaction');
        // Add click listener to play audio on first interaction
        const playOnInteraction = () => {
            audio.play().catch(err => console.log('Audio play failed:', err));
            document.removeEventListener('click', playOnInteraction);
        };
        document.addEventListener('click', playOnInteraction);
    });
}

// Display name on cake
function displayNameOnCake(name) {
    // Update the subtitle with the name
    const subtitle = document.querySelector('#birthday-text .subtitle');
    if (subtitle) {
        subtitle.textContent = `Van harte gefeliciteerd ${name}! 🎂`;
        subtitle.style.fontSize = '3rem';
        subtitle.style.fontWeight = 'bold';
        subtitle.style.color = '#fff';
        subtitle.style.textShadow = '3px 3px 6px rgba(0,0,0,0.9), 0 0 30px rgba(0,0,0,0.7)';
    }
    
    // Add a cake emoji and name display
    const birthdayText = document.getElementById('birthday-text');
    const cakeDiv = document.createElement('div');
    cakeDiv.id = 'cake-display';
    cakeDiv.style.cssText = `
        margin-top: 30px;
        padding: 20px 40px;
        background: rgba(255,255,255,0.15);
        backdrop-filter: blur(10px);
        border-radius: 20px;
        border: 3px solid rgba(255,255,255,0.3);
        box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        display: inline-block;
        animation: float-cake 3s ease-in-out infinite;
    `;
    
    cakeDiv.innerHTML = `
        <div id="cake-emoji" style="
            font-size: 5rem;
            margin-bottom: 10px;
            filter: drop-shadow(0 4px 8px rgba(0,0,0,0.3));
        ">${config.cake}</div>
        <div class="rainbow-name" style="
            font-size: 3rem;
            font-weight: 800;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(
                90deg,
                #ff0000,
                #ff7f00,
                #ffff00,
                #00ff00,
                #0000ff,
                #4b0082,
                #9400d3,
                #ff0000
            );
            background-size: 400% 100%;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            animation: rainbow 3s linear infinite;
            letter-spacing: 2px;
            text-transform: uppercase;
            text-shadow: 3px 3px 6px rgba(0,0,0,0.7);
        ">${name}</div>
        <div id="blow-hint" style="
            font-size: 1.2rem;
            color: #fff;
            margin-top: 20px;
            opacity: 0;
            transition: opacity 0.5s;
        ">🎤 Blaas op de kaarsen!</div>
    `;
    birthdayText.appendChild(cakeDiv);
    
    // Add animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes float-cake {
            0%, 100% { transform: translateY(0) scale(1); }
            50% { transform: translateY(-15px) scale(1.02); }
        }
        @keyframes rainbow {
            0% { background-position: 0% 50%; }
            100% { background-position: 400% 50%; }
        }
        @keyframes candle-flicker {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.8; transform: scale(0.95); }
        }
        .candle-out {
            animation: candle-out 0.5s forwards;
        }
        @keyframes candle-out {
            0% { opacity: 1; }
            100% { opacity: 0; transform: scale(0.5); }
        }
    `;
    document.head.appendChild(style);
    
    // Initialize blow feature if enabled
    if (config.blowMode) {
        initializeBlowFeature();
    }
}

// Microphone blow feature
function initializeBlowFeature() {
    const blowHint = document.getElementById('blow-hint');
    if (blowHint) {
        blowHint.style.opacity = '1';
    }
    
    // Request microphone access
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
            const audioContext = new AudioContext();
            const analyser = audioContext.createAnalyser();
            const microphone = audioContext.createMediaStreamSource(stream);
            microphone.connect(analyser);
            
            analyser.fftSize = 256;
            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            
            let blowCount = 0;
            const blowThreshold = 50;
            const requiredBlows = 3;
            
            function detectBlow() {
                analyser.getByteFrequencyData(dataArray);
                
                // Calculate average volume
                let sum = 0;
                for (let i = 0; i < dataArray.length; i++) {
                    sum += dataArray[i];
                }
                const average = sum / dataArray.length;
                
                // Detect blow (sudden loud sound)
                if (average > blowThreshold && !candlesBlown) {
                    blowCount++;
                    console.log('Blow detected! Count:', blowCount);
                    
                    if (blowCount >= requiredBlows) {
                        blowOutCandles();
                        candlesBlown = true;
                        blowCount = 0;
                    }
                }
                
                requestAnimationFrame(detectBlow);
            }
            
            detectBlow();
        })
        .catch(err => {
            console.log('Microphone access denied:', err);
            if (blowHint) {
                blowHint.textContent = '🎤 Microfoon niet beschikbaar';
            }
        });
}

function blowOutCandles() {
    const cakeEmoji = document.getElementById('cake-emoji');
    const blowHint = document.getElementById('blow-hint');
    
    if (cakeEmoji) {
        // Change cake emoji to show candles blown out
        const baseCake = config.cake.replace('🕯️', '').trim();
        cakeEmoji.textContent = baseCake + '💨';
        cakeEmoji.style.animation = 'candle-flicker 0.5s';
        
        setTimeout(() => {
            cakeEmoji.textContent = '🎉';
            // Add confetti burst
            for (let i = 0; i < 50; i++) {
                const conf = new Confetti();
                conf.x = canvas.width / 2;
                conf.y = canvas.height / 2;
                conf.vx = (Math.random() - 0.5) * 15;
                conf.vy = (Math.random() - 0.5) * 15 - 10;
                confettis.push(conf);
            }
        }, 500);
    }
    
    if (blowHint) {
        blowHint.textContent = '🎉 Gefeliciteerd!';
        setTimeout(() => {
            blowHint.style.opacity = '0';
        }, 2000);
    }
}

// Balloon class
class Balloon {
    constructor(id) {
        this.id = id;
        this.reset();
        this.popped = false;
    }
    
    reset() {
        this.x = Math.random() * canvas.width;
        this.y = canvas.height + 50;
        this.size = Math.random() * 30 + 30; // 30-60px
        this.vx = (Math.random() - 0.5) * 1; // -0.5 to 0.5
        this.vy = -(Math.random() * 1 + 1.5); // -1.5 to -2.5 (always up)
        this.sway = Math.random() * 0.02;
        this.swayOffset = Math.random() * Math.PI * 2;
        
        // Balloon colors
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#f0932b', '#eb4d4b', '#6c5ce7', '#fd79a8'];
        this.color = colors[Math.floor(Math.random() * colors.length)];
        
        this.active = true;
        this.popped = false;
        this.particles = [];
    }
    
    pop() {
        if (this.popped) return;
        this.popped = true;
        
        // Create pop particles
        for (let i = 0; i < 8; i++) {
            this.particles.push({
                x: this.x,
                y: this.y,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                size: Math.random() * 5 + 2,
                life: 30
            });
        }
        
        // Respawn after delay
        setTimeout(() => {
            this.reset();
        }, 2000);
    }
    
    isClicked(mouseX, mouseY) {
        const dx = mouseX - this.x;
        const dy = mouseY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < this.size && !this.popped;
    }
    
    update() {
        if (this.popped) {
            // Update pop particles
            this.particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.3; // gravity
                p.life--;
            });
            this.particles = this.particles.filter(p => p.life > 0);
            return;
        }
        
        // Move up
        this.y += this.vy;
        
        // Sway movement
        this.swayOffset += this.sway;
        this.x += Math.sin(this.swayOffset) * 0.5;
        
        // Check if off screen (top)
        if (this.y < -this.size - 50) {
            this.reset();
        }
        
        // Keep within horizontal bounds
        if (this.x < -50) this.x = canvas.width + 50;
        if (this.x > canvas.width + 50) this.x = -50;
    }
    
    draw() {
        if (!this.active) return;
        
        ctx.save();
        
        // Draw pop particles if popped
        if (this.popped) {
            this.particles.forEach(p => {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = this.color;
                ctx.globalAlpha = p.life / 30;
                ctx.fill();
            });
            ctx.globalAlpha = 1;
            ctx.restore();
            return;
        }
        
        // Draw balloon string
        ctx.beginPath();
        ctx.moveTo(this.x, this.y + this.size);
        ctx.quadraticCurveTo(
            this.x + Math.sin(this.swayOffset * 2) * 10,
            this.y + this.size + 15,
            this.x,
            this.y + this.size + 30
        );
        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        
        // Draw balloon body
        ctx.beginPath();
        ctx.ellipse(this.x, this.y, this.size, this.size * 1.2, 0, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        
        // Balloon shine
        ctx.beginPath();
        ctx.ellipse(this.x - this.size * 0.3, this.y - this.size * 0.4, this.size * 0.2, this.size * 0.3, -0.5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.fill();
        
        ctx.restore();
    }
}

// Confetti class
class Confetti {
    constructor() {
        this.reset();
    }
    
    reset() {
        this.x = Math.random() * canvas.width;
        this.y = -20;
        this.size = Math.random() * 8 + 4; // 4-12px
        this.vx = (Math.random() - 0.5) * 2; // -1 to 1
        this.vy = Math.random() * 2 + 1; // 1-3 (falling down)
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.1;
        
        // Confetti colors
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#f0932b', '#eb4d4b', '#6c5ce7', '#fd79a8', '#00b894', '#e17055'];
        this.color = colors[Math.floor(Math.random() * colors.length)];
        
        this.active = true;
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.rotation += this.rotationSpeed;
        
        // Air resistance
        this.vx *= 0.99;
        
        // Mark as inactive if off screen (bottom) to be removed
        if (this.y > canvas.height + 50) {
            this.active = false;
        }
        
        // Wrap horizontally
        if (this.x < -50) this.x = canvas.width + 50;
        if (this.x > canvas.width + 50) this.x = -50;
    }
    
    draw() {
        if (!this.active) return;
        
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        // Draw round confetti
        ctx.beginPath();
        ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        
        ctx.restore();
    }
}

// Create balloons and confetti
const balloons = [];
const confettis = [];

// Create 30 balloons
for (let i = 0; i < 30; i++) {
    const balloon = new Balloon(i);
    // Stagger start positions
    balloon.y = canvas.height + Math.random() * 500;
    balloons.push(balloon);
}

// Click handler for popping balloons
canvas.addEventListener('click', (e) => {
    if (!partyStarted) return;
    
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Check if clicked on a balloon
    let balloonPopped = false;
    for (let i = 0; i < balloons.length; i++) {
        if (balloons[i].isClicked(mouseX, mouseY)) {
            balloons[i].pop();
            balloonPopped = true;
            break; // Only pop one balloon per click
        }
    }
    
    // If no balloon clicked, create confetti at click position
    if (!balloonPopped) {
        for (let i = 0; i < 5; i++) {
            const conf = new Confetti();
            conf.x = mouseX;
            conf.y = mouseY;
            conf.vx = (Math.random() - 0.5) * 8;
            conf.vy = -Math.random() * 5;
            confettis.push(conf);
        }
    }
});

// Create 100 confetti pieces
for (let i = 0; i < 100; i++) {
    const conf = new Confetti();
    // Stagger start positions
    conf.y = -Math.random() * canvas.height;
    confettis.push(conf);
}

// Animation loop
function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Update and draw balloons
    for (let i = 0; i < balloons.length; i++) {
        balloons[i].update();
        balloons[i].draw();
    }
    
    // Update and draw confetti, remove inactive ones
    for (let i = confettis.length - 1; i >= 0; i--) {
        confettis[i].update();
        confettis[i].draw();
        if (!confettis[i].active) {
            confettis.splice(i, 1);
        }
    }
    
    requestAnimationFrame(animate);
}

// Start animation
animate();

// Load config and start party automatically
loadConfig().then(() => {
    // Check if today is the configured date
    if (shouldStartToday()) {
        // Auto-start after 1 second
        setTimeout(() => {
            startParty();
        }, 1000);
    } else {
        // Show message if not the right date
        const birthdayText = document.getElementById('birthday-text');
        birthdayText.innerHTML = `
            <h1>🎂</h1>
            <div class="subtitle" style="font-size: 1.5rem;">
                Kom terug op ${config.date} voor de verrassing!
            </div>
        `;
    }
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeParty();
    }
    if (e.key === ' ') {
        // Space to toggle music
        const audio = document.getElementById('default-song');
        if (audio) {
            if (audio.paused) audio.play();
            else audio.pause();
        }
    }
});

console.log('Happy Birthday Web App loaded!');
console.log('Click ⚙️ to configure, then Start!');
console.log('Press ESC to exit, SPACE to toggle music');
console.log('Click balloons to pop them!');

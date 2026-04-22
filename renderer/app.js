const { ipcRenderer } = require('electron');

// Canvas setup
const canvas = document.getElementById('animation-canvas');
const ctx = canvas.getContext('2d');

// Resize canvas to full screen
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Configuration
let config = { duration: 65, youtube: null, name: null };

// Receive config from main process
ipcRenderer.on('config', (event, receivedConfig) => {
    config = receivedConfig;
    console.log('Received config:', config);
    
    // Update countdown
    const timerEl = document.getElementById('timer');
    timerEl.textContent = config.duration;
    
    // Start countdown
    let remaining = config.duration;
    const countdownInterval = setInterval(() => {
        remaining--;
        timerEl.textContent = remaining;
        if (remaining <= 0) {
            clearInterval(countdownInterval);
        }
    }, 1000);
    
    // Play music
    playMusic();
    
    // Display name on cake if configured
    if (config.name) {
        displayNameOnCake(config.name);
    }
});

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

// Music playback
function playMusic() {
    if (config.youtube) {
        // Open YouTube URL
        ipcRenderer.send('open-youtube', config.youtube);
    } else {
        // Try to play MP3 directly in the app
        ipcRenderer.send('play-mp3-inline', '');
        
        // Play inline audio immediately
        setTimeout(() => {
            const audio = document.getElementById('default-song');
            if (audio) {
                audio.volume = 0.5;
                audio.play().catch(e => console.log('Audio play failed:', e));
            }
        }, 100);
    }
}

// Handle MP3 path for inline playback
ipcRenderer.on('mp3-path', (event, mp3Path) => {
    const audio = document.getElementById('default-song');
    if (audio) {
        audio.src = mp3Path;
        audio.volume = 0.5;
        audio.play().catch(e => console.log('Audio play failed:', e));
    }
});

// Handle MP3 not found
ipcRenderer.on('mp3-not-found', () => {
    const audio = document.getElementById('default-song');
    if (audio) {
        audio.volume = 0.3;
        audio.play().catch(e => console.log('Audio play failed:', e));
    }
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        ipcRenderer.send('quit-app');
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
        <div style="
            font-size: 5rem;
            margin-bottom: 10px;
            filter: drop-shadow(0 4px 8px rgba(0,0,0,0.3));
        ">🎂</div>
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
    `;
    document.head.appendChild(style);
}

console.log('Happy Birthday App loaded!');
console.log('Press ESC to exit, SPACE to toggle music');
console.log('Click balloons to pop them!');

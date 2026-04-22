const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { exec } = require('child_process');

// Keep a global reference of the window object
let mainWindow;

// Configuration
function readConfig() {
    // Check multiple locations for portable build compatibility
    const possiblePaths = [
        // Portable: Same folder as .exe
        path.join(path.dirname(process.execPath), 'birthdayconfig.txt'),
        // Portable: Resources folder
        path.join(process.resourcesPath, 'birthdayconfig.txt'),
        path.join(process.resourcesPath, 'app', 'birthdayconfig.txt'),
        // Development
        path.join(__dirname, 'birthdayconfig.txt'),
        path.join(app.getAppPath(), 'birthdayconfig.txt')
    ];
    
    let configFile = null;
    for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
            configFile = p;
            console.log('Found config at:', p);
            break;
        }
    }
    
    const config = { 'date': null, 'time': null, 'youtube': null, 'duration': 65, 'name': null };
    
    if (configFile) {
        try {
            const content = fs.readFileSync(configFile, 'utf8');
            const lines = content.split('\n');
            
            for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed.startsWith('date=')) {
                    config.date = trimmed.split('=', 2)[1];
                } else if (trimmed.startsWith('time=')) {
                    config.time = trimmed.split('=', 2)[1];
                } else if (trimmed.startsWith('youtube=')) {
                    config.youtube = trimmed.split('=', 2)[1];
                } else if (trimmed.startsWith('duration=')) {
                    const val = parseInt(trimmed.split('=', 2)[1]);
                    if (!isNaN(val)) config.duration = val;
                } else if (trimmed.startsWith('name=')) {
                    config.name = trimmed.split('=', 2)[1];
                }
            }
        } catch (e) {
            console.error('Error reading config:', e);
        }
    } else {
        console.log('No birthdayconfig.txt found, using defaults');
    }
    
    return config;
}

function shouldStartNow() {
    const config = readConfig();
    const now = new Date();
    
    // Check date if configured
    if (config.date) {
        // Support both DD/MM and DD-MM formats
        const separator = config.date.includes('/') ? '/' : '-';
        const [day, month] = config.date.split(separator).map(Number);
        const currentDay = now.getDate();
        const currentMonth = now.getMonth() + 1;
        
        console.log(`Config date: ${day}-${month}, Current date: ${currentDay}-${currentMonth}`);
        
        if (currentDay !== day || currentMonth !== month) {
            console.log('Date mismatch, not starting');
            return { shouldStart: false, config };
        }
    }
    
    // Check time if configured
    if (config.time) {
        const [hours, minutes] = config.time.split(':').map(Number);
        const currentHours = now.getHours();
        const currentMinutes = now.getMinutes();
        
        // Allow 1 minute window
        const currentTotal = currentHours * 60 + currentMinutes;
        const configTotal = hours * 60 + minutes;
        
        if (Math.abs(currentTotal - configTotal) > 1) {
            console.log('Time mismatch, not starting');
            return { shouldStart: false, config };
        }
    }
    
    return { shouldStart: true, config };
}

function createWindow() {
    const { shouldStart, config } = shouldStartNow();
    
    if (!shouldStart && !process.argv.includes('--force')) {
        console.log('Not the right time to start');
        app.quit();
        return;
    }
    
    // Create the browser window
    mainWindow = new BrowserWindow({
        width: 1920,
        height: 1080,
        fullscreen: true,
        alwaysOnTop: true,
        autoHideMenuBar: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true
        },
        icon: path.join(__dirname, 'assets/icon.ico'),
        show: false // Don't show until ready
    });
    
    // Load the app
    mainWindow.loadFile(path.join(__dirname, 'renderer/index.html'));
    
    // Show when ready
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        mainWindow.focus();
    });
    
    // Handle closed
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
    
    // Send config to renderer
    mainWindow.webContents.on('did-finish-load', () => {
        mainWindow.webContents.send('config', config);
    });
    
    // Auto-close after duration
    setTimeout(() => {
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.close();
        }
    }, config.duration * 1000);
}

// Note: We don't mute system volume anymore because it would also mute the birthday.mp3
// Instead, the birthday.mp3 will play at full volume and be the only sound

// IPC handlers
ipcMain.on('open-youtube', (event, url) => {
    shell.openExternal(url);
});

ipcMain.on('play-mp3', (event, mp3Path) => {
    // Find MP3 in various locations (portable build compatible)
    const possiblePaths = [
        mp3Path,
        // Portable: Same folder as .exe (first priority)
        path.join(path.dirname(process.execPath), 'birthday.mp3'),
        // Portable: Resources folder
        path.join(process.resourcesPath, 'birthday.mp3'),
        path.join(process.resourcesPath, 'app', 'birthday.mp3'),
        // Development
        path.join(__dirname, 'birthday.mp3'),
        path.join(os.homedir(), 'birthday.mp3')
    ];
    
    let foundPath = null;
    for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
            foundPath = p;
            break;
        }
    }
    
    if (foundPath) {
        // Use Windows default player
        exec(`start "" "${foundPath}"`, { windowsHide: true });
        console.log('Playing MP3:', foundPath);
    } else {
        console.log('MP3 not found, using default beep');
        event.reply('mp3-not-found');
    }
});

ipcMain.on('play-mp3-inline', (event) => {
    // Find MP3 and send path to renderer for inline playback
    const possiblePaths = [
        // Portable: Same folder as .exe (first priority)
        path.join(path.dirname(process.execPath), 'birthday.mp3'),
        // Portable: Resources folder
        path.join(process.resourcesPath, 'birthday.mp3'),
        path.join(process.resourcesPath, 'app', 'birthday.mp3'),
        // Development
        path.join(__dirname, 'birthday.mp3'),
        path.join(os.homedir(), 'birthday.mp3')
    ];
    
    let foundPath = null;
    for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
            foundPath = p;
            break;
        }
    }
    
    if (foundPath) {
        console.log('MP3 found for inline playback:', foundPath);
        event.reply('mp3-path', foundPath);
    } else {
        console.log('MP3 not found, using default beep');
        event.reply('mp3-not-found');
    }
});

ipcMain.on('quit-app', () => {
    app.quit();
});

// App event handlers
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// Handle squirrel events for Windows installer (optional)
// if (require('electron-squirrel-startup')) {
//     app.quit();
// }

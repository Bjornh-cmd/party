const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');

// App metadata for reduced false positives
app.setAppUserModelId('com.birthday.party');
app.setName('Happy Birthday Party');

// Path resolution for portable builds
function getConfigPath() {
    // Try multiple paths for portable compatibility
    const possiblePaths = [
        path.dirname(process.execPath), // Portable: same dir as exe
        path.join(path.dirname(process.execPath), 'resources'), // Portable: resources folder
        __dirname, // Development
        path.join(app.getAppPath(), 'resources'), // Asar resources
        process.resourcesPath // Production
    ];
    
    for (const p of possiblePaths) {
        const configPath = path.join(p, 'birthdayconfig.txt');
        if (fs.existsSync(configPath)) {
            console.log('Found config at:', configPath);
            return configPath;
        }
    }
    
    return path.join(__dirname, 'birthdayconfig.txt');
}

function getMp3Path() {
    const possiblePaths = [
        path.dirname(process.execPath),
        path.join(path.dirname(process.execPath), 'resources'),
        __dirname,
        path.join(app.getAppPath(), 'resources'),
        process.resourcesPath
    ];
    
    for (const p of possiblePaths) {
        const mp3Path = path.join(p, 'birthday.mp3');
        if (fs.existsSync(mp3Path)) {
            console.log('Found MP3 at:', mp3Path);
            return mp3Path;
        }
    }
    
    return path.join(__dirname, 'birthday.mp3');
}

function readConfig() {
    const configPath = getConfigPath();
    try {
        const content = fs.readFileSync(configPath, 'utf-8');
        const lines = content.split('\n');
        const config = {};
        
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('name=')) {
                config.name = trimmed.split('=', 2)[1];
            } else if (trimmed.startsWith('date=')) {
                config.date = trimmed.split('=', 2)[1];
            } else if (trimmed.startsWith('duration=')) {
                config.duration = parseInt(trimmed.split('=', 2)[1]);
            } else if (trimmed.startsWith('youtube=')) {
                config.youtube = trimmed.split('=', 2)[1];
            } else if (trimmed.startsWith('cake=')) {
                config.cake = trimmed.split('=', 2)[1];
            } else if (trimmed.startsWith('blowMode=')) {
                config.blowMode = trimmed.split('=', 2)[1] === 'true';
            }
        }
        
        return config;
    } catch (e) {
        console.log('Error reading config:', e);
        return {};
    }
}

function shouldStartNow() {
    const config = readConfig();
    
    if (!config.date) {
        return true; // No date configured, start anytime
    }
    
    const now = new Date();
    const currentDay = now.getDate();
    const currentMonth = now.getMonth() + 1;
    
    // Support both DD/MM and DD-MM formats
    const separator = config.date.includes('/') ? '/' : '-';
    const [configDay, configMonth] = config.date.split(separator).map(Number);
    
    return currentDay === configDay && currentMonth === configMonth;
}

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        fullscreen: true,
        frame: false,
        alwaysOnTop: true,
        backgroundColor: '#667eea',
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false,
            preload: path.join(__dirname, 'renderer', 'preload.js')
        }
    });

    // Check if should start
    if (!shouldStartNow()) {
        const config = readConfig();
        mainWindow.loadFile(path.join(__dirname, 'renderer', 'not-today.html'));
    } else {
        mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});

// IPC handlers
ipcMain.handle('get-config', () => {
    return readConfig();
});

ipcMain.handle('get-mp3-path', () => {
    return getMp3Path();
});

ipcMain.handle('open-youtube', (event, url) => {
    shell.openExternal(url);
});

ipcMain.handle('play-mp3-inline', () => {
    const mp3Path = getMp3Path();
    return mp3Path;
});

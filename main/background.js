const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    titleBarStyle: 'hiddenInset', // Gives that native Mac app feel
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false, // For simplicity in this demo phase
    },
  });

  // In development, Next.js runs on 3000
  const isDev = process.argv.includes('--dev');
  
  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    // mainWindow.webContents.openDevTools();
  } else {
    // In a real production build, we would load the exported static Next.js files
    // or run a local node server. For now, we assume Next.js is running.
    mainWindow.loadURL('http://localhost:3000');
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handler to read local directories for the Agentic UI Sidebar
ipcMain.handle('read-dir', async (event, dirPath) => {
  try {
    const fullPath = path.resolve(dirPath);
    const items = fs.readdirSync(fullPath, { withFileTypes: true });
    return items.map(item => ({
      name: item.name,
      isDirectory: item.isDirectory(),
      path: path.join(fullPath, item.name)
    }));
  } catch (err) {
    console.error('Error reading dir', err);
    return [];
  }
});

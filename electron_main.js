const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')

function createWindow() {
  // Create the browser window.
  const win = new BrowserWindow({
    width: 800,
    height: 600,

    frame: false,
    alwaysOnTop: true,
    transparent: true,
    hasShadow: false,
    resizable: false,

    webPreferences: {
      nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION,
      contextIsolation: true,
      webSecurity: false,
      preload: path.resolve(__dirname, './preload.js'),
    }
  })

  // win.loadURL('app://./index.html')
  // win.loadURL('http://aivtuber.stampchina.cn/')
  win.loadURL('http://127.0.0.1:8080/')


  ipcMain.on('set-ignore-mouse-events', (event, args) => {
    const webContents = event.sender;
    const win = BrowserWindow.fromWebContents(webContents);
    if (win) {
      win.setIgnoreMouseEvents(...args);
    }
  });

  ipcMain.on('drag-window', (event, args) => {
    const webContents = event.sender;
    const win = BrowserWindow.fromWebContents(webContents);
    if (win) {
      let [x, y] = win.getPosition();
      let [deltaX, deltaY] = args;
      win.setPosition(x + deltaX, y + deltaY);
    }
  });
}

app.on('ready', () => {
  createWindow();
})

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
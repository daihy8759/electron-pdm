import {
  app,
  BrowserWindow,
  globalShortcut,
  powerSaveBlocker,
} from 'electron';
import ipcMainSets from './ipcMainSets';

// 防止进入睡眠模式
const id = powerSaveBlocker.start('prevent-display-sleep');
console.log(powerSaveBlocker.isStarted(id));

process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = true;

let mainWindow = null;

let winURL = 'http://localhost:9080';

if (process.env.NODE_ENV === 'production') {
  winURL = `file://${__dirname}/index.html`;

  global.__static = require('path')
    .join(__dirname, '/static')
    .replace(/\\/g, '\\\\');
} else {
  require('electron-debug')({
    showDevTools: true,
  });
}

function installDevTools() {
  if (process.env.NODE_ENV === 'development') {
      require('devtron').install() //eslint-disable-line
      require('vue-devtools').install() //eslint-disable-line
  }
}

function createWindow() {
  const win = new BrowserWindow({
    height: 563,
    useContentSize: true,
    width: 1000,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegrationInWorker: true,
      webSecurity: false,
    },
  });

  win.setMenu(null);
  win.loadURL(winURL);

  win.on('closed', () => {
    mainWindow = null;
  });

  return win;
}

app.on('ready', () => {
  mainWindow = createWindow();
  ipcMainSets(mainWindow);

  installDevTools();
  // globalShortcut.register('Shift+1', () => {
  //   const win = BrowserWindow.getFocusedWindow();
  //   if (win) {
  //     win.webContents.openDevTools({ detach: true });
  //   }
  // });
});

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

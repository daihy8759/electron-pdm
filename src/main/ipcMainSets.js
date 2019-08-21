import { ipcMain } from 'electron';

export default (mainWindow) => {
  ipcMain.on('close', () => {
    if (mainWindow) {
      mainWindow.close();
    }
  });
};

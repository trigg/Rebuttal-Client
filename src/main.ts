import { app, BrowserWindow } from "electron";
import path from "path";
import keytar from 'keytar';

var window: any;

// Create the actual window
function createWindow() {
  window = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join('dist', 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    }
  })
  console.log("Window created");
}


// Prepare a window, or refresh it if called again
function createInstance() {
  if (window == null) {
    createWindow();
  }
  window.loadFile('../webapp/dist/index.html');
  console.log("Linked page");
  window.once('ready-to-show', () => {
    console.log("Showing...");
    window.show();
    window.setAutoHideMenuBar(true);
  });
}

// When all windows close, exit
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// When electron is ready, we create an instance
app.whenReady().then(() => {
  createInstance();
}).catch(err => {
  console.log(err);
});
const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require("path")
const keytar = require('keytar');
var url = app.commandLine.getSwitchValue('url');

var disableOverlay = false;
// Check for capabilities RE: Overlay
if (process.env.XDG_SESSION_TYPE) {
    console.log("Running in " + process.env.XDG_SESSION_TYPE);
    switch (process.env.XDG_SESSION_TYPE) {
        case 'wayland':
            disableOverlay = true;
            // Currently not working
            break;
        case 'x11':
            disableOverlay = !app.commandLine.hasSwitch('enable-transparent-visuals');
            break;
    }
}



var overlay;
var win;

function createOverlay() {
    var prim = screen.getPrimaryDisplay();
    overlay = new BrowserWindow({
        width: prim.bounds.width,
        height: prim.bounds.height,
        frame: false,
        transparent: true,
        focusable: false,
        alwaysOnTop: true,
        webPreferences: {
            preload: path.join(__dirname, 'overlay', 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
        }
    });
    overlay.loadFile('client/overlay.html');
    overlay.setAlwaysOnTop(true, 'screen');
    overlay.setIgnoreMouseEvents(true);


    overlay.setPosition(prim.bounds.x, prim.bounds.y);
    //overlay.setSize();
}

function createServerBrowser() {
    win = new BrowserWindow({
        width: 600,
        height: 400,
        webPreferences: {
            preload: path.join(__dirname, 'client', 'preload-browser.js'),
            nodeIntegration: false,
            contextIsolation: true,
        }
    })
    win.loadFile('client/browser.html');

    win.once('ready-to-show', () => {
        win.show();
        win.setAutoHideMenuBar(true);
    });
}

function prepareOverlay() {
    if (!disableOverlay) {
        ipcMain.on('overlayready', function (e, a) {
            console.log("Overlay ready");
        });
        ipcMain.on('clientready', function (e, a) {
            console.log("Client ready");
        });
        ipcMain.on('enableoverlay', function (e, a) {
            if (!overlay) {
                createOverlay();
            }
        });
        ipcMain.on('disableoverlay', function (e, a) {
            if (overlay) {
                overlay.close();
                overlay = null;
            }
        });
        ipcMain.on('userlist', function (e, a) {
            if (overlay) {
                overlay.webContents.send('userlist', a);
            }
        });

        ipcMain.on('talkstart', function (e, a) {
            if (overlay) {
                overlay.webContents.send('talkstart', a);
            }
        });

        ipcMain.on('talkstop', function (e, a) {
            if (overlay) {
                overlay.webContents.send('talkstop', a);
            }
        });


    } else {
        console.log("Overlay is not yet supported on this platform");
    }
    ipcMain.on('connectToServer', function (e, a) {
        var pass = null;
        if (a.user) {
            keytar.getPassword('Rebuttal-' + a.host, a.user).then(
                pass => {
                    startApp(a.host, a.user, pass);
                }).catch(err => {
                    console.log(err);
                });

            return;
        }
        startApp(a.host, null, null);
        lastwin.close();
    });
    ipcMain.on('savepassword', function (e, a) {
        keytar.setPassword('Rebuttal-' + a.server, a.email, a.password);
    });
    ipcMain.on('getServerAccounts', function (e, a) {
        console.log("Getting account for : " + a);
        console.log(a);
        keytar.findCredentials('Rebuttal-' + a).then(res => {
            var uList = [];
            res.forEach(acc => {
                uList.push(acc['account']);
            });
            win.webContents.send('setServerAccounts', { server: a, list: uList });
        }).catch(err => {
            console.log('Unable to find accounts for : ' + a);
            console.log(err);
            console.log("You most likely have not installed libsecret and gnome-keyring")
        });
    });
}

function startApp(url, username, password) {
    if (!win) {
        createWindow();
    }
    win.loadFile('public/index.html');
    win.once('ready-to-show', () => {
        if (password) {
            win.webContents.executeJavaScript('customUsername="' + username + '"; customPassword="' + password + '"')
        }
        win.webContents.executeJavaScript("customUrl = '" + url + "';console.log('" + url + "'); connect();");
        win.show();
        win.setAutoHideMenuBar(true);
    });
}

function createWindow() {
    win = new BrowserWindow({
        width: 600,
        height: 400,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
        }
    })
}

app.whenReady().then(() => {
    if (!url) {
        createServerBrowser();
    } else {
        startApp(url, null, null);
    }
    prepareOverlay();
}).catch(err => {
    console.log(err);
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

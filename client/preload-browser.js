const electron = require("electron");
const { contextBridge, ipcRenderer, desktopCapturer } = electron;

contextBridge.exposeInMainWorld(
    "ipc",
    {
        send: (channel, data) => {
            ipcRenderer.send(channel, data);
        },
        recv: (channel, func) => {
            ipcRenderer.on(channel, (event, ...args) => func(...args));
        }
    }
);

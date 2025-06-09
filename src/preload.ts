import { contextBridge, ipcRenderer, desktopCapturer } from 'electron';

export type ContextBridgeApi = {
    send: (channel: string, data: any) => void,
    recv: (channel: string, func: any) => void
}
const exposedApi: ContextBridgeApi = {
    send: (channel: any, data: any) => {
        ipcRenderer.send(channel, data);
    },
    recv: (channel: any, func: any) => {
        ipcRenderer.on(channel, (event: any, ...args: any) => func(...args));
    }
}
contextBridge.exposeInMainWorld("ipc", exposedApi);

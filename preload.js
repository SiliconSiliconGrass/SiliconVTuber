const { contextBridge, ipcRenderer } = require('electron');

console.log('preload!');

const setIgnoreMouseEvents = (arg1, arg2) => {
  ipcRenderer.send('set-ignore-mouse-events', [arg1, arg2]);
}

const dragWindow = (deltaX, deltaY) => {
  ipcRenderer.send('drag-window', [deltaX, deltaY]);
}

// 把一些功能暴露给网页用
contextBridge.exposeInMainWorld('electronAPI', {
    // 文件操作相关
    platform: process.platform,
    setIgnoreMouseEvents,
    dragWindow
  }
);
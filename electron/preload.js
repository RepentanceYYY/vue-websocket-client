// preload.js
import { contextBridge } from 'electron';
import net from 'net';

const clientArray = [];

function findClient(link) {
  return clientArray.find(c => c.link === link)?.socket || null;
}

function removeClient(link) {
  const removedSockets = clientArray.filter(c => c.link === link).map(c => c.socket);
  clientArray = clientArray.filter(c => c.link !== link);
  removedSockets.forEach(s => s.destroy());
  return removedSockets;
}

contextBridge.exposeInMainWorld('tcpClient', {
  getClient: (link, openEvent, dataEvent, closeEvent) => {
    const [host, portStr] = link.split(':');
    const port = Number(portStr);
    const socket = net.createConnection({ host, port }, () => {
      openEvent?.(link);
    });

    socket.on('data', data => dataEvent?.(link, data));
    socket.on('end', () => {
      removeClient(link);
      closeEvent?.(link);
    });

    clientArray.push({ link, socket });
    return link; // 返回 link 作为句柄
  },

  send: (link, data) => {
    const socket = findClient(link);
    if (socket) socket.write(data);
  },

  close: (link) => {
    removeClient(link);
  }
});

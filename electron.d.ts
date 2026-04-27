// 为preload.js中的方法声明类型

interface NetCreateConnectionOptions {
  host: string;
  port: number;
}

interface MyAPI {
  ping: () => void;
  net: {
    createConnection: (options: NetCreateConnectionOptions) => string; // 返回 link 句柄
  };
}

interface TcpClient {
  getClient: (
    link: string,
    openEvent?: (link: string) => void,
    dataEvent?: (link: string, data: string | Uint8Array) => void,
    closeEvent?: (link: string) => void
  ) => string; // 返回 link 句柄
  send: (link: string, data: string | Uint8Array) => void;
  close: (link: string) => void;
}

// 全局扩展 window
interface Window {
  myAPI: MyAPI;
  tcpClient: TcpClient;
}

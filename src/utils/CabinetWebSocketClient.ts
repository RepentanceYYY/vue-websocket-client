type EventHandler = (payload?: any) => void;

export class WebSocketClient {
    private ws: WebSocket | null = null;
    private url: string;

    private events: Map<string, EventHandler[]> = new Map();

    constructor(url: string) {
        this.url = url;
    }

    connect(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.ws = new WebSocket(this.url);

            this.ws.onopen = () => {
                this.emit('open');
                resolve();
            };

            this.ws.onerror = (err) => {
                this.emit('error', err);
                reject(err);
            };

            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);

                    console.log('收到消息', data);

                    // 如果服务端带 event 字段，就按 event 分发
                    if (data.event) {
                        this.emit(data.event, data);
                    }

                    // 同时给一个全局监听
                    this.emit('message', data);

                } catch (err) {
                    this.emit('error', err);
                }
            };

            this.ws.onclose = () => {
                this.emit('webSocketDisconnected');
                this.emit('close');
            };
        });
    }

    send(data: any) {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            throw new Error('WebSocket 未连接');
        }

        this.ws.send(JSON.stringify(data));
    }

    on(event: string, callback: EventHandler) {
        if (!this.events.has(event)) {
            this.events.set(event, []);
        }

        this.events.get(event)!.push(callback);
    }

    off(event: string, callback?: EventHandler) {
        if (!callback) {
            this.events.delete(event);
            return;
        }

        const list = this.events.get(event);
        if (!list) return;

        this.events.set(
            event,
            list.filter(fn => fn !== callback)
        );
    }

    private emit(event: string, payload?: any) {
        const list = this.events.get(event);
        if (!list) return;

        list.forEach(fn => fn(payload));
    }

    disconnect() {
        if (this.ws) {
            this.ws.close(1000, 'Client disconnected');
            this.ws = null;
        }
    }
}
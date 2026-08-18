import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';
import { CloudDatabase } from './db';

interface PairedClient {
  ws: WebSocket;
  deviceId: string;
  isHost: boolean;
}

export class RelayServer {
  private wss: WebSocketServer;
  private db: CloudDatabase;
  private clients = new Map<string, Set<PairedClient>>(); // deviceId -> clients

  constructor(server: Server, db: CloudDatabase) {
    this.db = db;
    this.wss = new WebSocketServer({ server, path: '/relay' });
    this.init();
  }

  private init() {
    this.wss.on('connection', (ws, req) => {
      let currentDeviceId: string | null = null;
      let clientRef: PairedClient | null = null;

      ws.on('message', (data) => {
        try {
          const msg = JSON.parse(data.toString());

          // 1. Auth & Join
          if (msg.type === 'auth') {
            const { sessionToken, deviceId, isHost } = msg;
            const session = sessionToken ? this.db.getSession(sessionToken) : null;
            const validDevice = deviceId && (isHost || session?.device_id);

            if (!validDevice) {
              ws.send(JSON.stringify({ type: 'error', message: 'Authentication failed' }));
              ws.close();
              return;
            }

            currentDeviceId = deviceId;
            clientRef = { ws, deviceId, isHost: !!isHost };

            if (!this.clients.has(deviceId)) {
              this.clients.set(deviceId, new Set());
            }
            this.clients.get(deviceId)!.add(clientRef);

            ws.send(JSON.stringify({ type: 'authenticated', deviceId }));
            return;
          }

          // 2. Broadcast / Relay to peers in same device channel
          if (currentDeviceId && this.clients.has(currentDeviceId)) {
            const peers = this.clients.get(currentDeviceId)!;
            for (const peer of peers) {
              if (peer.ws !== ws && peer.ws.readyState === WebSocket.OPEN) {
                peer.ws.send(JSON.stringify(msg));
              }
            }
          }
        } catch (err) {
          // ignore malformed frame
        }
      });

      ws.on('close', () => {
        if (currentDeviceId && clientRef && this.clients.has(currentDeviceId)) {
          this.clients.get(currentDeviceId)!.delete(clientRef);
          if (this.clients.get(currentDeviceId)!.size === 0) {
            this.clients.delete(currentDeviceId);
          }
        }
      });
    });
  }

  public close() {
    this.wss.close();
  }
}

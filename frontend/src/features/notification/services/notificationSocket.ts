import { Client, type IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import type { NotificationItem } from '../../../types/notification';

export interface NotificationSocketHandlers {
  onNotification?: (notification: NotificationItem) => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
  onError?: (message: string) => void;
}

export class NotificationSocketService {
  private client: Client | null = null;

  connect(token: string, handlers: NotificationSocketHandlers = {}) {
    this.disconnect();

    const baseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080').replace(/\/$/, '');
    const wsUrl = `${baseUrl}/ws?token=${encodeURIComponent(token)}`;

    const client = new Client({
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      webSocketFactory: () => new SockJS(wsUrl),
      onConnect: () => {
        handlers.onConnected?.();
        client.subscribe('/user/queue/notifications', (message: IMessage) => {
          try {
            const notification = JSON.parse(message.body) as NotificationItem;
            handlers.onNotification?.(notification);
          } catch {
            handlers.onError?.('Failed to read notification payload.');
          }
        });
      },
      onStompError: (frame) => {
        handlers.onError?.(frame.headers['message'] || 'WebSocket broker error');
      },
      onWebSocketError: () => {
        handlers.onError?.('WebSocket connection error');
      },
      onWebSocketClose: () => {
        handlers.onDisconnected?.();
      },
    });

    client.activate();
    this.client = client;
  }

  disconnect() {
    if (!this.client) {
      return;
    }

    if (this.client.active) {
      void this.client.deactivate();
    }

    this.client = null;
  }
}

export const notificationSocketService = new NotificationSocketService();
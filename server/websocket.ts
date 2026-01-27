import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { verifyToken, JWTPayload } from './authHelpers';

interface AuthenticatedWebSocket extends WebSocket {
  userId?: number;
  userRole?: string;
}

const clients = new Map<number, Set<AuthenticatedWebSocket>>();

export function setupWebSocket(server: any) {
  const wss = new WebSocketServer({ 
    server,
    path: '/ws'
  });

  wss.on('connection', async (ws: AuthenticatedWebSocket, req: IncomingMessage) => {
    console.log('[WebSocket] New connection attempt');

    // Extract token from query string or headers
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const token = url.searchParams.get('token') || req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      console.log('[WebSocket] No token provided, closing connection');
      ws.close(4001, 'Authentication required');
      return;
    }

    try {
      const user = verifyToken(token);
      if (!user) {
        console.log('[WebSocket] Invalid token, closing connection');
        ws.close(4002, 'Invalid token');
        return;
      }

      ws.userId = user.userId;
      ws.userRole = user.role;

      // Store client connection
      if (!clients.has(user.userId)) {
        clients.set(user.userId, new Set());
      }
      clients.get(user.userId)!.add(ws);

      console.log(`[WebSocket] User ${user.userId} (${user.role}) connected. Total clients: ${clients.size}`);

      // Send welcome message
      ws.send(JSON.stringify({
        type: 'connected',
        message: 'WebSocket connection established',
        timestamp: Date.now()
      }));

      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          console.log(`[WebSocket] Message from user ${ws.userId}:`, message);
          
          // Handle ping/pong for keepalive
          if (message.type === 'ping') {
            ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
          }
        } catch (error) {
          console.error('[WebSocket] Error parsing message:', error);
        }
      });

      ws.on('close', () => {
        if (ws.userId) {
          const userClients = clients.get(ws.userId);
          if (userClients) {
            userClients.delete(ws);
            if (userClients.size === 0) {
              clients.delete(ws.userId);
            }
          }
          console.log(`[WebSocket] User ${ws.userId} disconnected. Total clients: ${clients.size}`);
        }
      });

      ws.on('error', (error) => {
        console.error('[WebSocket] Error:', error);
      });

    } catch (error) {
      console.error('[WebSocket] Authentication error:', error);
      ws.close(4003, 'Authentication failed');
    }
  });

  return wss;
}

// Notification types
export interface Notification {
  type: 'deposit' | 'withdrawal' | 'kyc' | 'system';
  title: string;
  message: string;
  data?: any;
  timestamp: number;
}

// Send notification to specific user
export function notifyUser(userId: number, notification: Notification) {
  const userClients = clients.get(userId);
  if (userClients && userClients.size > 0) {
    const payload = JSON.stringify({
      ...notification,
      timestamp: notification.timestamp || Date.now()
    });

    userClients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    });

    console.log(`[WebSocket] Notification sent to user ${userId}:`, notification.type);
    return true;
  }
  return false;
}

// Send notification to all admin users
export function notifyAdmins(notification: Notification) {
  let sentCount = 0;
  
  clients.forEach((userClients, userId) => {
    userClients.forEach((client) => {
      if (client.userRole === 'admin' && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          ...notification,
          timestamp: notification.timestamp || Date.now()
        }));
        sentCount++;
      }
    });
  });

  console.log(`[WebSocket] Notification sent to ${sentCount} admin(s):`, notification.type);
  return sentCount > 0;
}

// Broadcast to all connected clients
export function broadcast(notification: Notification) {
  let sentCount = 0;
  
  clients.forEach((userClients) => {
    userClients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          ...notification,
          timestamp: notification.timestamp || Date.now()
        }));
        sentCount++;
      }
    });
  });

  console.log(`[WebSocket] Broadcast sent to ${sentCount} client(s):`, notification.type);
  return sentCount > 0;
}

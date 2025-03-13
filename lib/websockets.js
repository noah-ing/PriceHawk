import { Server as SocketIOServer } from 'socket.io';
import { prisma } from './db/prisma.js';
import { auth } from '../auth.js';
import crypto from 'crypto';

// Track active connections by user ID
const userConnections = {};

// Initialize WebSocket server
export function initializeWebSocketServer(httpServer) {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NEXTAUTH_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true
    },
    path: '/api/socket'
  });

  console.log("[WebSockets] Initializing WebSocket server");

  // Check authorization on connection
  io.use(async (socket, next) => {
    try {
      const cookie = socket.handshake.headers.cookie;
      
      if (!cookie) {
        return next(new Error('No cookie found'));
      }

      // Create a custom request object with the cookie
      const req = {
        headers: {
          cookie
        }
      };

      // Get session from auth
      const session = await auth();
      
      if (!session || !session.user || !session.user.id) {
        return next(new Error('Unauthorized'));
      }
      
      // Store user ID in socket data
      socket.data.userId = session.user.id;
      socket.data.userEmail = session.user.email;
      
      return next();
    } catch (error) {
      console.error("[WebSockets] Authentication error:", error);
      return next(new Error('Internal server error'));
    }
  });

  // Handle new connections
  io.on('connection', (socket) => {
    const userId = socket.data.userId;
    
    console.log(`[WebSockets] User connected: ${userId}`);
    
    // Add user connection to tracking
    if (!userConnections[userId]) {
      userConnections[userId] = [];
    }
    
    userConnections[userId].push({
      userId,
      socketId: socket.id,
      timestamp: new Date()
    });
    
    // Set up user-specific room
    socket.join(`user:${userId}`);
    
    // Set up event handlers
    setupEventHandlers(socket, io);
    
    // Remove connection on disconnect
    socket.on('disconnect', () => {
      console.log(`[WebSockets] User disconnected: ${userId}`);
      
      if (userConnections[userId]) {
        userConnections[userId] = userConnections[userId].filter(
          conn => conn.socketId !== socket.id
        );
        
        if (userConnections[userId].length === 0) {
          delete userConnections[userId];
        }
      }
    });
  });

  // Setup system-level event broadcasting
  setupSystemEvents(io);

  return io;
}

// Set up socket event handlers
function setupEventHandlers(socket, io) {
  const userId = socket.data.userId;
  
  // Handle subscription to product updates
  socket.on('subscribe:product', async (productId) => {
    console.log(`[WebSockets] User ${userId} subscribed to product ${productId}`);
    socket.join(`product:${productId}`);
    
    try {
      // Send initial product data
      const product = await prisma.product.findUnique({
        where: { id: productId },
        include: {
          priceHistory: {
            orderBy: { timestamp: 'desc' },
            take: 1
          }
        }
      });
      
      if (product) {
        socket.emit('product:data', product);
      }
    } catch (error) {
      console.error(`[WebSockets] Error fetching product data: ${error}`);
    }
  });
  
  // Handle unsubscription from product updates
  socket.on('unsubscribe:product', (productId) => {
    console.log(`[WebSockets] User ${userId} unsubscribed from product ${productId}`);
    socket.leave(`product:${productId}`);
  });
  
  // Handle custom markup settings
  socket.on('set:markup', async (data) => {
    try {
      const { productId, markupPercentage } = data;
      
      // Use raw SQL query as a workaround until Prisma client is properly updated
      const query = `
        INSERT INTO "UserProductSettings" ("id", "userId", "productId", "markupPercentage", "createdAt", "updatedAt")
        VALUES (
          '${crypto.randomUUID()}', 
          '${userId}', 
          '${productId}', 
          ${markupPercentage}, 
          CURRENT_TIMESTAMP, 
          CURRENT_TIMESTAMP
        )
        ON CONFLICT ("userId", "productId") 
        DO UPDATE SET 
          "markupPercentage" = ${markupPercentage},
          "updatedAt" = CURRENT_TIMESTAMP
      `;
      
      // Execute the raw query
      await prisma.$executeRawUnsafe(query);
      
      // Confirm setting was saved
      socket.emit('markup:updated', { productId, markupPercentage });
      
    } catch (error) {
      console.error(`[WebSockets] Error saving markup settings: ${error}`);
      socket.emit('error', { message: 'Failed to save markup settings' });
    }
  });
}

// Set up system-level events
function setupSystemEvents(io) {
  // Price update event handler for cron job to call
  global.emitPriceUpdate = async (productId, newPrice, oldPrice) => {
    try {
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { userId: true }
      });
      
      if (product) {
        // Emit to product room
        io.to(`product:${productId}`).emit('price:updated', {
          productId,
          newPrice,
          oldPrice,
          timestamp: new Date()
        });
        
        // Also emit to user room
        io.to(`user:${product.userId}`).emit('price:updated', {
          productId,
          newPrice,
          oldPrice,
          timestamp: new Date()
        });
        
        console.log(`[WebSockets] Price update emitted for product ${productId}`);
      }
    } catch (error) {
      console.error(`[WebSockets] Error emitting price update: ${error}`);
    }
  };
  
  // Alert triggered event
  global.emitAlertTriggered = async (alertId, productId, userId) => {
    try {
      io.to(`user:${userId}`).emit('alert:triggered', {
        alertId,
        productId,
        timestamp: new Date()
      });
      
      console.log(`[WebSockets] Alert triggered event emitted for alert ${alertId}`);
    } catch (error) {
      console.error(`[WebSockets] Error emitting alert event: ${error}`);
    }
  };
}

// Export active connections for monitoring
export function getActiveConnections() {
  const connections = Object.values(userConnections).flat();
  return {
    totalConnections: connections.length,
    uniqueUsers: Object.keys(userConnections).length,
    connections
  };
}

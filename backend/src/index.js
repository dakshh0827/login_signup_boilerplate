// Load environment variables FIRST - before any other imports
import './config/env.js';

// NOW import other modules (after env vars are loaded)
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import passport from './config/passport.js';
import { generalLimiter } from './middlewares/rateLimiter.js';

// Import routes
import authRoutes from './routes/auth.js';
import oauthRoutes from './routes/OAuth.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// CORS configuration
const allowedOrigins = [
  "http://localhost:5173"
  // add your current tunnel URLs here
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, origin); // ✅ send back the actual origin
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
app.use(generalLimiter);

// Passport middleware
app.use(passport.initialize());

// Debug middleware (remove in production)
app.use((req, res, next) => {
  console.log(`🔍 ${req.method} ${req.originalUrl}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    env_status: {
      google_oauth: !!process.env.GOOGLE_CLIENT_ID,
      github_oauth: !!process.env.GITHUB_CLIENT_ID
    }
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/auth/oauth', oauthRoutes);

// 404 handler
app.use((req, res) => {
  console.log('❌ 404 - Route not found:', req.method, req.originalUrl);
  res.status(404).json({
    success: false,
    message: 'Route not found',
    requestedRoute: req.originalUrl,
    method: req.method
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  
  // Prisma duplicate entry error
  if (err.code === 'P2002') {
    return res.status(400).json({
      success: false,
      message: 'Duplicate entry. This record already exists.',
    });
  }
  
  // JWT-related errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
    });
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired',
    });
  }
  
  // Fallback error
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 OAuth routes available at: /auth/oauth/*`);
  console.log(`📍 Auth routes available at: /api/auth/*`);
});

export default app;
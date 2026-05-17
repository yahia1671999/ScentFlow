import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import useragent from "express-useragent";
import apiRoutes from "./src/server/routes.js";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Trust proxy for accurate IP identification behind AI Studio reverse proxy
  app.set('trust proxy', 1);

  // Security Headers
  app.use(helmet({
    contentSecurityPolicy: false, // Vite handles CSP in development
  }));

  // CORS Configuration
  const allowedOrigins = [
    process.env.CLIENT_URL,
    process.env.APP_URL
  ].filter(Boolean) as string[];

  app.use(cors({
    origin: (origin, callback) => {
      // Allow internal same-origin requests (origin is undefined)
      if (!origin) return callback(null, true);
      
      const isAllowed = 
        allowedOrigins.length === 0 || 
        allowedOrigins.includes("*") || 
        allowedOrigins.some(ao => origin.startsWith(ao)) ||
        origin.endsWith('.run.app') || 
        origin.endsWith('.google.com');

      if (isAllowed) {
        callback(null, true);
      } else {
        console.warn(`CORS blocked request from origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true
  }));

  // JSON Body limit
  app.use(express.json({ limit: "1mb" }));
  
  // User Agent parser for audit logs
  app.use(useragent.express());

  // Rate Limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // Limit each IP to 500 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests, please try again later." }
  });
  app.use("/api/", limiter);

  // API Routes
  app.use("/api", apiRoutes);

  // Health Check
  app.get("/health", (req, res) => res.json({ status: "ok", timestamp: new Date().toISOString() }));

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
});

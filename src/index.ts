import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import routes from "./routes";
import mongoose from "mongoose";

// Load environment variables
dotenv.config();

const app: express.Application = express();

// CORS configuration
app.use(
  cors({
    origin: "*",
    methods: "*",
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);
app.use(express.json());

// Register all API routes (auth, user, news)
app.use("/", routes);

// Welcome & API info route as Main route
app.get("/", (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "application/json");
  const data = {
    message: "Welcome to News Aggregator API Backend",
    api: [
      {
        name: "Kompas",
        all: "/kompas",
        section: [
          "/kompas/megapolitan",
          "/kompas/regional",
          "/kompas/nasional",
          "/kompas/global",
          "/kompas/money",
          "/kompas/bola",
          "/kompas/tekno",
          "/kompas/lifestyle",
          "/kompas/health",
          "/kompas/otomotif",
        ],
        detail: "/kompas/:category/:slug",
      },
    ],
  };
  res.json(data);
});

// Health Route
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "OK", data: "Alive and well!" });
});

const PORT = process.env.PORT || 3000;

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("MONGODB_URI environment variable is not defined");
} else {
  mongoose
    .connect(MONGODB_URI)
    .then(() => {
      console.log("Connected to MongoDB successfully");
    })
    .catch((err) => {
      console.error("Database connection failed:", err);
    });
}

// Only listen if not running on Vercel
if (!process.env.VERCEL) {
  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`API listening on http://0.0.0.0:${PORT}/`);
  });
}

export default app;

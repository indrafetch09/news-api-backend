import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import routes from "./routes";

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
  })
);
app.use(express.json());

// Main Router
app.use("/", routes);

// Welcome & API info route
app.get("/", (_req, res) => {
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

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/news-api-backend";

// Connect to MongoDB and start the server
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB successfully");
    app.listen(Number(PORT), "0.0.0.0", () => {
      console.log(`API listening on http://0.0.0.0:${PORT}/`);
    });
  })
  .catch((err) => {
    console.error("Database connection failed:", err);
    process.exit(1);
  });

export default app;

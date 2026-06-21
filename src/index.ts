import express from "express";
import cors from "cors";
import { getData, getDetail } from "./scraper/kompas-scrape";

const app: express.Application = express();

const options = [
  cors({
    origin: "*",
    methods: "*",
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
];

app.use(options);
app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.setHeader("Content-Type", "application/json");
  const data = {
    message: "",
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
        detail: "/kompas/:slug",
      },
    ],
  };
  console.log(data);
  res.json(data);
});

app.get("/kompas", async (_req, res) => {
  const result = await getData("");
  res.setHeader("Content-Type", "application/json");
  if (!result) {
    return res.status(500).json({ message: "Failed to fetch data" });
  }
  res.json(result);
});

app.get("/kompas/:cat", async (req, res) => {
  const result = await getData(req.params.cat);
  res.setHeader("Content-Type", "application/json");
  if (!result) {
    return res.status(500).json({ message: "Failed to fetch data" });
  }
  res.json(result);
});

app.get("/kompas/:category/:slug", async (req, res) => {
  const result = await getDetail(req.params.category, req.params.slug);
  res.setHeader("Content-Type", "application/json");
  if (!result) {
    return res.status(500).json({ message: "Failed to fetch data" });
  }
  res.json(result);
});

const PORT = 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Api listening on http://0.0.0.0:${PORT}/`);
});

export default app;

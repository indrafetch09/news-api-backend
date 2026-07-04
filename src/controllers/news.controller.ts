import { Request, Response } from "express";
import { getData, getDetail } from "../scraper/kompas-scrape";

// Get all news
export const getKompasNews = async (_req: Request, res: Response) => {
  try {
    const result = await getData("");
    res.setHeader("Content-Type", "application/json");
    if (!result) {
      return res.status(500).json({ message: "Failed to fetch data" });
    }
    return res.json(result);
  } catch (error: any) {
    return res
      .status(500)
      .json({ message: error.message || "Failed to fetch news" });
  }
};

// Get news by category
export const getKompasCategoryNews = async (req: Request, res: Response) => {
  try {
    const { cat } = req.params;
    const result = await getData(typeof cat === "string" ? cat : "");
    res.setHeader("Content-Type", "application/json");
    if (!result) {
      return res.status(500).json({ message: "Failed to fetch data" });
    }
    return res.json(result);
  } catch (error: any) {
    return res
      .status(500)
      .json({ message: error.message || "Failed to fetch category news" });
  }
};

// Get news detail
export const getKompasNewsDetail = async (req: Request, res: Response) => {
  try {
    const { category, slug } = req.params;
    if (typeof category !== "string" || typeof slug !== "string") {
      return res.status(400).json({
        message: "Category and slug are required and must be strings",
      });
    }
    const result = await getDetail(category, slug);
    res.setHeader("Content-Type", "application/json");
    if (!result) {
      return res.status(500).json({ message: "Failed to fetch data" });
    }
    return res.json(result);
  } catch (error: any) {
    return res
      .status(500)
      .json({ message: error.message || "Failed to fetch news detail" });
  }
};

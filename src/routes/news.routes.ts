import { Router } from "express";
import {
  getKompasNews,
  getKompasCategoryNews,
  getKompasNewsDetail,
} from "../controllers/news.controller";

const router = Router();

router.get("/kompas", getKompasNews);
router.get("/kompas/:cat", getKompasCategoryNews);
router.get("/kompas/:category/:slug", getKompasNewsDetail);

export default router;

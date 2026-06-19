import axios from "axios";
import * as cheerio from "cheerio";
import moment from "moment";
import type { AnyNode } from "domhandler";

moment.locale("id");

interface NewsArticle {
  title: string;
  image_thumbnail?: string;
  image_full?: string;
  time: string;
  link: string;
  slug: string;
}

interface DetailArticle {
  title: string;
  content: string;
  image?: string;
  time: string;
  media: { type: string; url: string }[];
}

function getDateFromTimeAgo(text: string): string {
  const fields = { hours: 0, minutes: 0, seconds: 0 };
  const patterns = [
    { pattern: /^(\d+) (detik? yang lalu)/, key: "seconds" as const },
    { pattern: /^(\d+) (menit? yang lalu)/, key: "minutes" as const },
    { pattern: /^(\d+) (jam? yang lalu)/, key: "hours" as const },
    {
      pattern: /^(\d+) (jam? dan) (\d+) (menit? yang lalu)/,
      keys: ["hours", "minutes"] as const,
    },
  ];

  for (const p of patterns) {
    const m = text.match(p.pattern);
    if (!m) continue;
    if ("keys" in p) {
      fields.hours = Number(m[1]);
      fields.minutes = Number(m[3]);
    } else {
      fields[p.key] = Number(m[1]);
    }
  }

  return moment()
    .subtract(fields.hours, "hours")
    .subtract(fields.minutes, "minutes")
    .subtract(fields.seconds, "seconds")
    .format("YYYY-MM-DD");
}

function getImgSrc(
  $: cheerio.CheerioAPI,
  parent: AnyNode,
  selector: string,
): string | undefined {
  return (
    $(`${selector}, img`, parent).attr("data-src") ??
    $(`${selector}, img`, parent).attr("src") ??
    undefined
  );
}

function cleanImg(url: string | undefined): string | undefined {
  return url?.replace(/crops.*data/, "data").replace("crops/", "");
}

function extractSlug(link: string): string | null {
  try {
    const url = new URL(link);
    if (url.hostname !== "www.kompas.com") return null;
    const parts = url.hostname.split(".");
    const slug = link.replace(`https:${url.hostname}`, "");
    if (parts.length > 1 && parts[0] !== "www") return parts[0] + slug;
    return slug.replace(/\/$/, "");
  } catch {
    return null;
  }
}

function formatTime(text: string): string {
  const t = text.trim().replace("WIB", " ");
  const m = moment(t, "dd/MMMM/YYYY, hh:mm");
  return m.isValid() ? m.format("YYYY-MM-DD hh:mm") : t;
}

interface LayoutConfig {
  selector: string;
  title: string;
  image: string;
  time: string;
  link: string;
  relativeTime?: boolean;
}
const layouts: LayoutConfig[] = [
  {
    selector: ".article__list.clearfix:not(.article__list--video)",
    title: ".article__list__title h3 a",
    image: ".article__list__asset .article__asset a",
    time: ".article__date",
    link: ".article__list__title h3 a",
  },
  {
    selector: ".article__wrap__grid--flex .article__grid",
    title: ".article__box h3.article__title a",
    image: ".article__asset a",
    time: ".article__date",
    link: ".article__box h3.article__title a",
  },
  {
    selector: ".trenLatest__item.clearfix",
    title: ".trenLatest__box h3.trenLatest__title a",
    image: ".trenLatest__img a",
    time: ".tren__date",
    link: ".trenLatest__box h3.trenLatest__title a",
  },
  {
    selector: ".articleList .articleItem",
    title: ".articleTitle",
    image: ".articleItem-img",
    time: ".articlePost-date",
    link: ".article-link",
  },
  {
    selector: ".wSpec-list .wSpec-item",
    title: ".wSpec-title",
    image: ".wSpec-img",
    time: ".wSpec-subtitle span",
    link: ".wSpec-item a",
    relativeTime: true,
  },
];

// Parsing
function parseArticle(
  $: cheerio.CheerioAPI,
  elem: AnyNode,
  cfg: LayoutConfig,
): NewsArticle | null {
  const title = $(cfg.title, elem).text().replace("/n", " ").trim();
  const rawImg = getImgSrc($, elem, cfg.image);
  if (!title || !rawImg) return null;

  const link = $(cfg.link, elem).attr("href");
  if (!link) return null;

  const slug = extractSlug(link);
  if (!slug) return null;

  const rawTime = $(cfg.time, elem).text().trim().replace("WIB", "");
  const time = cfg.relativeTime
    ? getDateFromTimeAgo(rawTime)
    : formatTime(rawTime);

  return {
    title,
    image_thumbnail: rawImg,
    image_full: cleanImg(rawImg),
    time,
    link,
    slug,
  };
}

// function for get article data from category
export async function getData(category: string): Promise<NewsArticle[]> {
  const urls = category.toLocaleLowerCase()
    ? [`https://${category}.kompas.com`, `https://kompas.com/${category}`]
    : [`https://kompas.com`];

  let html: string;
  try {
    const { data } = await axios.get(urls[0]);
    html = data;
  } catch (error: any) {
    if (error?.code === "ENOTFOUND" && urls[1]) {
      const { data } = await axios.get(urls[1]);
      html = data;
    } else {
      throw error;
    }
  }
  const $ = cheerio.load(html);
  for (const cfg of layouts) {
    const items = $(cfg.selector);
    if (items.length === 0) continue;
    return items
      .map((_, elem) => parseArticle($, elem, cfg))
      .get()
      .filter(Boolean) as NewsArticle[];
  }
  return [];
}

// function for get detail article
export async function getDetail(
  category: string,
  slug: string,
): Promise<DetailArticle | null> {
  const notSubDomain = ["global", "baca"];
  const base = notSubDomain.includes(category.toLocaleLowerCase())
    ? [`https://${category}.kompas.com`, `https://kompas.com/${category}`]
    : [`https://kompas.com`];
  const url = `${base}/${slug}?page=all`;

  const { data } = await axios.get(url);
  const $ = cheerio.load(data);
  const article = $(".container.clearfix", data);

  const title = $("h1.read__title", article).text().replace("\n", "").trim();
  const contentEl = $(".read__content", article);
  $("script", contentEl).remove();
  const content = contentEl.text().replace("\n", "").trim();

  const image = cleanImg($("img.read__image", article).attr("src") ?? "");
  const timeEl = $("time.read__time", article);
  const rawTime = timeEl.text().trim().replace("WIB", "").replace("-", "");
  const time = formatTime(rawTime);

  const media: { type: string; url: string }[] = [];

  $("iframe", contentEl).each((_, elem) => {
    media.push({ type: "iframe", url: $(elem).attr("src") ?? "" });
  });

  $("img", contentEl).each((_, elem) => {
    media.push({ type: "img", url: $(elem).attr("src") ?? "" });
  });

  $("article a", contentEl).each((_, elem) => {
    media.push({ type: "link", url: $(elem).attr("href") ?? "" });
  });

  return {
    title,
    content,
    image,
    time,
    media,
  };
}

export default { getData, getDetail };

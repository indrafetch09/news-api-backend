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
    { pattern: /^(\d+) (detik? yang lalu)/, mappings: { seconds: 1 } },
    { pattern: /^(\d+) (menit? yang lalu)/, mappings: { minutes: 1 } },
    { pattern: /^(\d+) (jam? yang lalu)/, mappings: { hours: 1 } },
    {
      pattern: /^(\d+) (jam? dan) (\d+) (menit? yang lalu)/,
      mappings: { hours: 1, minutes: 3 },
    },
  ];

  for (const p of patterns) {
    const m = text.match(p.pattern);
    if (!m) continue;
    for (const [key, index] of Object.entries(p.mappings)) {
      fields[key as keyof typeof fields] = Number(m[index]);
    }
    break;
  }

  return moment()
    .subtract(fields.seconds, "seconds")
    .subtract(fields.minutes, "minutes")
    .subtract(fields.hours, "hours")
    .format("YYYY-MM-DD");
}

function getImgSrc(
  $: cheerio.CheerioAPI,
  parent: AnyNode,
  selector: string,
): string | undefined {
  const el = $(selector, parent);
  const img = el.is("img") ? el : el.find("img");
  return img.attr("data-src") ?? img.attr("src") ?? undefined;
}

function cleanImg(url: string | undefined): string | undefined {
  return url?.replace(/crops.*data/, "data").replace("crops/", "");
}

// Extract slug
function extractSlug(link: string): string | null {
  try {
    const url = new URL(link);
    if (!url.hostname.endsWith("kompas.com")) return null;
    const parts = url.hostname.split(".");
    let slug = link.replace(`https://${url.hostname}`, "");
    if (parts.length > 1 && parts[0] !== "www") {
      return parts[0] + slug;
    }
    if (slug.startsWith("/")) {
      slug = slug.slice(1);
    }
    return slug.replace(/\/$/, "");
  } catch {
    return null;
  }
}

function formatTime(text: string): string {
  const t = text
    .trim()
    .replace("WIB", "")
    .replace(/^[\s,:-]+/, "")
    .trim();
  const m = moment(t, [
    "DD/MM/YYYY, HH:mm",
    "DD MMMM YYYY, HH:mm",
    "DD/MMMM/YYYY, HH:mm",
    "dd/MMMM/YYYY, hh:mm",
  ]);
  return m.isValid() ? m.format("YYYY-MM-DD HH:mm") : t;
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
  const baseUrl = "https://www.kompas.com";
  let urls =
    `https://${category.toLocaleLowerCase()}.kompas.com` ||
    `https://www.kompas.com/${category.toLowerCase()}`;

  if (category === "") {
    urls = baseUrl;
  }

  let result: string;

  try {
    const { data } = await axios.get(urls);
    result = data;
  } catch (error: any) {
    if (error?.code === "ENOTFOUND") {
      const fallbackUrl = `https://www.kompas.com/${category.toLowerCase()}`;
      const { data } = await axios.get(fallbackUrl);
      result = data;
    } else {
      throw error;
    }
  }

  const $ = cheerio.load(result);
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
  const catLower = category.toLowerCase();

  let url: string;
  if (!catLower || catLower === "www") {
    url = `https://www.kompas.com/${slug}?page=all`;
  } else if (notSubDomain.includes(catLower)) {
    url = `https://www.kompas.com/${slug}?page=all`;
  } else {
    const prefix = `${catLower}/`;
    const cleanSlug = slug.startsWith(prefix)
      ? slug.slice(prefix.length)
      : slug;
    url = `https://${catLower}.kompas.com/${cleanSlug}?page=all`;
  }

  let result: DetailArticle | null = null;
  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);

    const _element_article = $(".container.clearfix");
    const title = $("h1.read__title", _element_article);
    const content = $(".read__content", _element_article);
    $("script", content).remove();

    const image = cleanImg($(".cover-photo img", _element_article).attr("src"));
    const timeEl = $(".read__time", _element_article);
    $("a", timeEl).remove();
    const rawTime = timeEl.text().trim().replace("WIB", "").replace("-", "");
    const time = formatTime(rawTime);

    const media: { type: string; url: string }[] = [];

    $("iframe", content).each((_, elem) => {
      media.push({
        type: "embed",
        url: $(elem).attr("src") ?? "",
      });
    });

    $("img", content).each((_, elem) => {
      if ($(elem).closest(".lihatjg").length <= 0) {
        media.push({
          type: "image",
          url: $(elem).attr("src") ?? "",
        });
      }
    });

    $("article", content).each((_, elem) => {
      media.push({
        type: "article",
        url: $("a", elem).attr("href") ?? "",
      });
    });

    result = {
      title: title.text().replace("\n", "").trim(),
      content: content.text().replace("\n", "").trim(),
      image: image,
      time: time,
      media: media,
    };
  } catch (error) {
    console.error(error);
  }
  return result;
}

export default { getData: getData, getDetail: getDetail };

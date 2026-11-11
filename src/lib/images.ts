import type { RaceType } from "./types";

/**
 * Curated photos from Unsplash (Unsplash License: free for commercial use, no permission needed).
 * Images are hot-linked from Unsplash's CDN at the exact size requested (see unsplashLoader),
 * as Unsplash recommends — nothing is re-hosted. `page` is the short id for the credit link.
 */
export interface Photo {
  id: string;
  page: string;
  alt: string;
}

const p = (id: string, page: string, alt: string): Photo => ({ id, page, alt });

export const TRAIL_PHOTOS: Photo[] = [
  p("1718248028293-934f04a578db", "-UYedjT31zY", "Runner bật nhảy trên đường mòn"),
  p("1504025468847-0e438279542c", "XFneC_rHR48", "Runner chạy trên sống núi"),
  p("1518214598173-1666bc921d66", "CVvFVQ_-oUg", "Runner trên đỉnh đồi"),
  p("1530143311094-34d807799e8f", "GYr9A2CPMhY", "Runner chạy trên núi"),
  p("1594882645126-14020914d58d", "I1EWTM5mFEM", "Bóng runner trên đường mòn đá"),
  p("1498581444814-7e44d2fbe0e2", "nmWQ2SKvj5M", "Runner trên đường mòn đất nâu"),
  p("1760715651666-c3e408bfdda7", "aN30srK3lVY", "Người đeo balo trên đường mòn vùng núi"),
  p("1531737212413-667205e1cda7", "3VK6Urf2vE8", "Toàn cảnh núi Sapa nhìn từ trên cao"),
  p("1732098407342-6b6a05e3da3d", "98g7OAwlWy0", "Sườn đồi xanh mướt vùng cao"),
  p("1712432142102-660663b65fce", "BZDac0cXPg4", "Thung lũng giữa núi rừng Tây Bắc"),
  p("1609412058473-c199497c3c5d", "PeRt3uMmjYM", "Ruộng bậc thang mùa lúa chín"),
  p("1480996408299-fc0e830b5db1", "3QFQOxGCVmE", "Núi xanh nhìn từ trên cao"),
  p("1570366583862-f91883984fde", "9r2yeRccyls", "Ruộng bậc thang và bản làng"),
  p("1731119347526-a51ad22763cd", "HobTanxdqMI", "Thung lũng xanh nhìn từ trên cao"),
];

export const ROAD_PHOTOS: Photo[] = [
  p("1590333748338-d629e4564ad9", "Y0woUmyxGrw", "Đoàn runner trên đường nhựa"),
  p("1613936360976-8f35cf0e5461", "QDv-uBc-poY", "Runner trên đường đua marathon"),
  p("1452626038306-9aae5e071dd3", "NPFu4GfFZ7E", "Runner chạy trên đường phố"),
  p("1581889470536-467bdbe30cd0", "7DCZgKyp8vw", "Runner trên đường nhựa"),
  p("1682367905664-e36b30f15b19", "ynym_ftLYdE", "Đông đảo runner chạy trên phố"),
  p("1667781838690-5f32ea0ccea6", "1xx1hq2RJts", "Nhóm runner tham gia giải"),
  p("1744706908605-ac30eb45f98c", "TVTwrKyM0ik", "Runner đang tăng tốc"),
  p("1727094141271-9bea5bc8c757", "NUkrKjQXRgE", "Runner chạy qua đài phun nước"),
  p("1583417319070-4a69db38a482", "wUk2U5Wirxg", "Thành phố về đêm"),
  p("1536086845112-89de23aa4772", "eilpDNi_pV4", "Toà nhà trong thành phố"),
  p("1592982349770-f69bc160dce3", "mHY_kASO_Q4", "Cao ốc thành phố"),
  p("1521019795854-14e15f600980", "soYzQJvctKI", "Cao ốc bên sông"),
  p("1771992797585-2fdcf801ca62", "XngJzIpvQec", "Thành phố biển và các đảo"),
  p("1602646994030-464f98de5e5c", "6p2AkWAIC8E", "Thành phố nhìn từ trên cao"),
];

export const HERO_PHOTO = TRAIL_PHOTOS[1];

const UNSPLASH = "https://images.unsplash.com/photo-";
export const photoUrl = (ph: Photo) => `${UNSPLASH}${ph.id}`;
export const creditUrl = (ph: Photo) => `https://unsplash.com/photos/${ph.page}?utm_source=kbib&utm_medium=referral`;

function hash(s: string) {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h;
}

/** Stable photo per race: organizer's own cover if set, otherwise picked from the pool by race id. */
export function racePhoto(type: RaceType, seed: string, coverUrl?: string): { src: string; alt: string; credit: string | null } {
  if (coverUrl) return { src: coverUrl, alt: "", credit: null };
  const pool = type === "trail" ? TRAIL_PHOTOS : ROAD_PHOTOS;
  const ph = pool[hash(seed) % pool.length];
  return { src: photoUrl(ph), alt: ph.alt, credit: creditUrl(ph) };
}

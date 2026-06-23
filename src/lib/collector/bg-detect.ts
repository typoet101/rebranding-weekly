/**
 * Detect whether a thumbnail image has a white or transparent background.
 *
 * Used to mark logo / banner thumbnails with imageFit="contain" so the card
 * renders them with side padding instead of cropping. Runs server-side so
 * it bypasses the CORS issues that block our client-side fallback for many
 * news CDNs.
 */
import sharp from "sharp";

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const TIMEOUT_MS = 12000;

/**
 * Returns true if the image's 4 corners are all near-white (RGB ≥ 240) or
 * mostly transparent (alpha < 16). Returns false on any decode/network error
 * — caller should treat unknown as "not blank" and leave imageFit unchanged.
 */
export async function hasBlankBackground(url: string): Promise<boolean> {
  if (!url || !url.startsWith("http")) return false;

  let buf: Buffer;
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "image/*,*/*;q=0.8" },
      signal: controller.signal,
      redirect: "follow",
    });
    clearTimeout(t);
    if (!res.ok) return false;
    const ct = res.headers.get("content-type") || "";
    if (!ct.startsWith("image/")) return false;
    const ab = await res.arrayBuffer();
    buf = Buffer.from(ab);
  } catch {
    return false;
  }

  try {
    const img = sharp(buf);
    const meta = await img.metadata();
    const w = meta.width ?? 0;
    const h = meta.height ?? 0;
    if (w < 30 || h < 30) return false;

    // Aspect-ratio shortcut: very wide (>1.65) or very tall (<0.6) thumbnails
    // are almost always banners / brand graphics, not editorial photos. The
    // card crop is 4:3, so a 16:9 banner loses ~30% of its content under
    // object-cover — better to letterbox it via contain even if the bg isn't
    // white. News article photos are typically 4:3 or 3:2 (well inside 0.6–1.65).
    const aspect = w / h;
    if (aspect > 1.65 || aspect < 0.6) return true;

    // Sample 8 patches around the perimeter (4 corners + 4 edge midpoints).
    // Logos often have a brand-colored stripe along ONE edge while the rest of
    // the canvas is white — strict 4-corner detection would reject those.
    // Accept if ≥5 of the 8 perimeter samples are white or transparent. Photos
    // rarely satisfy that threshold (they have content along most edges).
    const inset = Math.max(4, Math.min(16, Math.floor(Math.min(w, h) * 0.02)));
    const patch = 6;
    const channels = meta.channels ?? 3;
    const hasAlpha = channels === 4;

    const midX = Math.floor(w / 2 - patch / 2);
    const midY = Math.floor(h / 2 - patch / 2);
    const samples: Array<[number, number]> = [
      [inset, inset],                              // TL
      [w - inset - patch, inset],                  // TR
      [inset, h - inset - patch],                  // BL
      [w - inset - patch, h - inset - patch],      // BR
      [midX, inset],                               // top-mid
      [midX, h - inset - patch],                   // bottom-mid
      [inset, midY],                               // left-mid
      [w - inset - patch, midY],                   // right-mid
    ];

    let blank = 0;
    for (const [left, top] of samples) {
      const region = await img
        .clone()
        .extract({ left, top, width: patch, height: patch })
        .raw()
        .toBuffer();
      let rs = 0, gs = 0, bs = 0, as = 0;
      const px = patch * patch;
      for (let i = 0; i < region.length; i += channels) {
        rs += region[i];
        gs += region[i + 1];
        bs += region[i + 2];
        if (hasAlpha) as += region[i + 3];
      }
      const r = rs / px, g = gs / px, b = bs / px;
      const a = hasAlpha ? as / px : 255;

      if (a < 16 || (r > 240 && g > 240 && b > 240)) blank++;
    }
    return blank >= 5;
  } catch {
    return false;
  }
}

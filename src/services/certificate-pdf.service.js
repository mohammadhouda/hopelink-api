import { PDFDocument, rgb, StandardFonts, degrees } from "pdf-lib";
import supabase from "../config/Supabase.config.js";
import { v4 as uuidv4 } from "uuid";

const CERTIFICATES_BUCKET = "documents";

/* ── Color palette ───────────────────────────────────────── */
const COLORS = {
  primary: rgb(0.04, 0.4, 0.18),       // deep emerald #0A6B2E
  primaryLight: rgb(0.06, 0.55, 0.28),  // lighter emerald
  accent: rgb(0.77, 0.64, 0.29),        // gold #C4A34A
  accentLight: rgb(0.85, 0.75, 0.45),   // light gold
  dark: rgb(0.12, 0.12, 0.14),          // near black
  body: rgb(0.3, 0.3, 0.33),            // body text
  muted: rgb(0.5, 0.5, 0.53),           // muted text
  light: rgb(0.7, 0.7, 0.72),           // light text
  border: rgb(0.82, 0.82, 0.84),        // border
  bg: rgb(0.98, 0.98, 0.97),            // off-white bg
  white: rgb(1, 1, 1),
};

/* ── Helper: center text ─────────────────────────────────── */
function centerX(text, font, size, pageWidth) {
  return (pageWidth - font.widthOfTextAtSize(text, size)) / 2;
}

/* ── Helper: draw decorative corner ──────────────────────── */
function drawCorner(page, x, y, size, flipX, flipY, color) {
  const dx = flipX ? -1 : 1;
  const dy = flipY ? -1 : 1;

  // L-shaped corner bracket
  page.drawLine({
    start: { x, y },
    end: { x: x + size * dx, y },
    color,
    thickness: 2,
  });
  page.drawLine({
    start: { x, y },
    end: { x, y: y + size * dy },
    color,
    thickness: 2,
  });

  // Small inner accent
  page.drawLine({
    start: { x: x + 4 * dx, y: y + 4 * dy },
    end: { x: x + (size * 0.5) * dx, y: y + 4 * dy },
    color,
    thickness: 1,
  });
  page.drawLine({
    start: { x: x + 4 * dx, y: y + 4 * dy },
    end: { x: x + 4 * dx, y: y + (size * 0.5) * dy },
    color,
    thickness: 1,
  });
}

/* ── Helper: draw ornamental divider ─────────────────────── */
function drawDivider(page, cx, y, halfWidth, color) {
  // Center diamond
  const d = 3;
  page.drawLine({ start: { x: cx - d, y }, end: { x: cx, y: y + d }, color, thickness: 1.2 });
  page.drawLine({ start: { x: cx, y: y + d }, end: { x: cx + d, y }, color, thickness: 1.2 });
  page.drawLine({ start: { x: cx + d, y }, end: { x: cx, y: y - d }, color, thickness: 1.2 });
  page.drawLine({ start: { x: cx, y: y - d }, end: { x: cx - d, y }, color, thickness: 1.2 });

  // Lines extending from diamond
  page.drawLine({
    start: { x: cx - d - 8, y },
    end: { x: cx - halfWidth, y },
    color,
    thickness: 0.75,
  });
  page.drawLine({
    start: { x: cx + d + 8, y },
    end: { x: cx + halfWidth, y },
    color,
    thickness: 0.75,
  });

  // Small dots at ends
  [cx - halfWidth, cx + halfWidth].forEach((dotX) => {
    page.drawCircle({ x: dotX, y, size: 1.5, color });
  });
}

/* ══════════════════════════════════════════════════════════ */
/*  GENERATE CERTIFICATE                                     */
/* ══════════════════════════════════════════════════════════ */
export async function generateCertificatePdf({
  volunteerName,
  charityName,
  opportunityTitle,
  startDate,
  endDate,
  issuedAt,
  verificationCode,
}) {
  const pdfDoc = await PDFDocument.create();

  // Set metadata
  pdfDoc.setTitle(`Certificate of Appreciation — ${volunteerName}`);
  pdfDoc.setAuthor("Hope Link Platform");
  pdfDoc.setSubject(`Volunteer Certificate for ${opportunityTitle}`);
  pdfDoc.setCreator("Hope Link");

  const page = pdfDoc.addPage([842, 595]); // A4 landscape
  const { width, height } = page.getSize();
  const cx = width / 2;

  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontItalic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
  const fontTimesRoman = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  const fontTimesItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanBoldItalic);

  // ── Background fill
  page.drawRectangle({
    x: 0, y: 0,
    width, height,
    color: COLORS.white,
  });

  // ── Outer border
  const m = 24;
  page.drawRectangle({
    x: m, y: m,
    width: width - m * 2,
    height: height - m * 2,
    borderColor: COLORS.accent,
    borderWidth: 2.5,
  });

  // ── Inner border
  const m2 = 34;
  page.drawRectangle({
    x: m2, y: m2,
    width: width - m2 * 2,
    height: height - m2 * 2,
    borderColor: COLORS.border,
    borderWidth: 0.5,
  });

  // ── Decorative corners (gold)
  const cornerSize = 40;
  const cm = 42;
  drawCorner(page, cm, height - cm, cornerSize, false, true, COLORS.accent);     // top-left
  drawCorner(page, width - cm, height - cm, cornerSize, true, true, COLORS.accent);  // top-right
  drawCorner(page, cm, cm, cornerSize, false, false, COLORS.accent);              // bottom-left
  drawCorner(page, width - cm, cm, cornerSize, true, false, COLORS.accent);       // bottom-right

  // ── Top: "HOPE LINK" small branding
  const brandText = "HOPE LINK";
  page.drawText(brandText, {
    x: centerX(brandText, fontBold, 9, width),
    y: height - 62,
    size: 9,
    font: fontBold,
    color: COLORS.muted,
  });

  // ── Top divider
  drawDivider(page, cx, height - 78, 60, COLORS.accent);

  // ── Title: "Certificate"
  const titleText = "Certificate";
  page.drawText(titleText, {
    x: centerX(titleText, fontTimesRoman, 48, width),
    y: height - 130,
    size: 48,
    font: fontTimesRoman,
    color: COLORS.primary,
  });

  // ── Subtitle: "OF APPRECIATION"
  const subtitleText = "OF APPRECIATION";
  page.drawText(subtitleText, {
    x: centerX(subtitleText, fontBold, 14, width),
    y: height - 155,
    size: 14,
    font: fontBold,
    color: COLORS.accent,
  });

  // ── Divider below subtitle
  drawDivider(page, cx, height - 175, 100, COLORS.accentLight);

  // ── "This certificate is proudly presented to"
  const presentedText = "This certificate is proudly presented to";
  page.drawText(presentedText, {
    x: centerX(presentedText, fontItalic, 12, width),
    y: height - 210,
    size: 12,
    font: fontItalic,
    color: COLORS.muted,
  });

  // ── Volunteer name (large, prominent)
  const nameSize = volunteerName.length > 25 ? 30 : 36;
  const nameWidth = fontTimesItalic.widthOfTextAtSize(volunteerName, nameSize);
  page.drawText(volunteerName, {
    x: cx - nameWidth / 2,
    y: height - 255,
    size: nameSize,
    font: fontTimesItalic,
    color: COLORS.dark,
  });

  // ── Name underline (gold)
  const lineHalf = Math.max(nameWidth / 2 + 20, 120);
  page.drawLine({
    start: { x: cx - lineHalf, y: height - 265 },
    end: { x: cx + lineHalf, y: height - 265 },
    color: COLORS.accent,
    thickness: 1.5,
  });
  // Subtle shadow line
  page.drawLine({
    start: { x: cx - lineHalf + 10, y: height - 267 },
    end: { x: cx + lineHalf - 10, y: height - 267 },
    color: COLORS.border,
    thickness: 0.5,
  });

  // ── "For outstanding volunteer service with"
  const serviceText = "For outstanding volunteer service with";
  page.drawText(serviceText, {
    x: centerX(serviceText, fontRegular, 12, width),
    y: height - 300,
    size: 12,
    font: fontRegular,
    color: COLORS.body,
  });

  // ── Charity name
  const charitySize = charityName.length > 30 ? 18 : 22;
  page.drawText(charityName, {
    x: centerX(charityName, fontBold, charitySize, width),
    y: height - 330,
    size: charitySize,
    font: fontBold,
    color: COLORS.primary,
  });

  // ── Opportunity title
  const oppText = `"${opportunityTitle}"`;
  const oppSize = oppText.length > 50 ? 10 : 12;
  page.drawText(oppText, {
    x: centerX(oppText, fontItalic, oppSize, width),
    y: height - 355,
    size: oppSize,
    font: fontItalic,
    color: COLORS.body,
  });

  // ── Date range
  const formatDate = (d) =>
    d
      ? new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
      : "N/A";

  const periodText = `${formatDate(startDate)}  —  ${formatDate(endDate)}`;
  page.drawText(periodText, {
    x: centerX(periodText, fontRegular, 10, width),
    y: height - 378,
    size: 10,
    font: fontRegular,
    color: COLORS.muted,
  });

  // ── Bottom divider
  drawDivider(page, cx, height - 405, 140, COLORS.accent);

  // ── Footer section: two columns
  const footerY = 75;

  // Left: Issued date
  const issueDateFormatted = new Date(issuedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  page.drawText("Date Issued", {
    x: 120,
    y: footerY + 28,
    size: 8,
    font: fontBold,
    color: COLORS.muted,
  });
  page.drawLine({
    start: { x: 90, y: footerY + 22 },
    end: { x: 230, y: footerY + 22 },
    color: COLORS.border,
    thickness: 0.5,
  });
  page.drawText(issueDateFormatted, {
    x: 105,
    y: footerY + 6,
    size: 10,
    font: fontRegular,
    color: COLORS.dark,
  });

  // Center: Hope Link seal
  const sealY = footerY + 15;
  page.drawCircle({
    x: cx,
    y: sealY,
    size: 22,
    borderColor: COLORS.primary,
    borderWidth: 2,
  });
  page.drawCircle({
    x: cx,
    y: sealY,
    size: 18,
    borderColor: COLORS.accent,
    borderWidth: 0.75,
  });
  const hlText = "HL";
  page.drawText(hlText, {
    x: cx - fontBold.widthOfTextAtSize(hlText, 14) / 2,
    y: sealY - 5,
    size: 14,
    font: fontBold,
    color: COLORS.primary,
  });

  // Right: Platform signature
  page.drawText("Hope Link Platform", {
    x: width - 235,
    y: footerY + 28,
    size: 8,
    font: fontBold,
    color: COLORS.muted,
  });
  page.drawLine({
    start: { x: width - 250, y: footerY + 22 },
    end: { x: width - 110, y: footerY + 22 },
    color: COLORS.border,
    thickness: 0.5,
  });
  page.drawText("Authorized Platform", {
    x: width - 230,
    y: footerY + 6,
    size: 10,
    font: fontRegular,
    color: COLORS.dark,
  });

  // ── Verification code (bottom center, small)
  if (verificationCode) {
    const verifyText = `Verification: ${verificationCode}`;
    page.drawText(verifyText, {
      x: centerX(verifyText, fontRegular, 7, width),
      y: m + 10,
      size: 7,
      font: fontRegular,
      color: COLORS.light,
    });
  }

  // ── Serialize
  const pdfBytes = await pdfDoc.save();

  // ── Upload to Supabase
  const filename = `certificates/cert-${uuidv4()}.pdf`;
  const { error } = await supabase.storage
    .from(CERTIFICATES_BUCKET)
    .upload(filename, pdfBytes, {
      contentType: "application/pdf",
      upsert: false,
    });

  if (error) throw new Error(`Failed to upload certificate PDF: ${error.message}`);

  const { data } = supabase.storage.from(CERTIFICATES_BUCKET).getPublicUrl(filename);
  return data.publicUrl;
}
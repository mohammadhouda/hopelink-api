import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import supabase from "../config/Supabase.config.js";
import { v4 as uuidv4 } from "uuid";

const CERTIFICATES_BUCKET = "documents";

/**
 * Generate a professional certificate PDF and upload it to Supabase.
 * Returns the public URL of the uploaded PDF.
 */
export async function generateCertificatePdf({
  volunteerName,
  charityName,
  opportunityTitle,
  startDate,
  endDate,
  issuedAt,
}) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([842, 595]); // A4 landscape
  const { width, height } = page.getSize();

  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontItalic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  // ── Border
  const borderWidth = 6;
  const margin = 30;
  page.drawRectangle({
    x: margin,
    y: margin,
    width: width - margin * 2,
    height: height - margin * 2,
    borderColor: rgb(0.13, 0.59, 0.95), // blue accent
    borderWidth,
  });

  // Inner border
  page.drawRectangle({
    x: margin + 10,
    y: margin + 10,
    width: width - (margin + 10) * 2,
    height: height - (margin + 10) * 2,
    borderColor: rgb(0.8, 0.8, 0.85),
    borderWidth: 1,
  });

  // ── Title
  page.drawText("CERTIFICATE", {
    x: width / 2 - 120,
    y: height - 130,
    size: 42,
    font: fontBold,
    color: rgb(0.13, 0.59, 0.95),
  });

  page.drawText("OF APPRECIATION", {
    x: width / 2 - 110,
    y: height - 175,
    size: 22,
    font: fontRegular,
    color: rgb(0.3, 0.3, 0.35),
  });

  // ── Divider line
  page.drawLine({
    start: { x: width / 2 - 100, y: height - 195 },
    end: { x: width / 2 + 100, y: height - 195 },
    color: rgb(0.13, 0.59, 0.95),
    thickness: 1.5,
  });

  // ── Body text
  const centerY = height / 2 + 20;

  page.drawText("This certificate is proudly presented to", {
    x: width / 2 - 120,
    y: centerY + 60,
    size: 14,
    font: fontRegular,
    color: rgb(0.4, 0.4, 0.45),
  });

  // Volunteer name (prominent)
  const nameWidth = fontBold.widthOfTextAtSize(volunteerName, 32);
  page.drawText(volunteerName, {
    x: width / 2 - nameWidth / 2,
    y: centerY + 15,
    size: 32,
    font: fontBold,
    color: rgb(0.1, 0.1, 0.15),
  });

  // Underline for name
  page.drawLine({
    start: { x: width / 2 - nameWidth / 2 - 10, y: centerY + 5 },
    end: { x: width / 2 + nameWidth / 2 + 10, y: centerY + 5 },
    color: rgb(0.13, 0.59, 0.95),
    thickness: 1.5,
  });

  page.drawText("For outstanding volunteer service with", {
    x: width / 2 - 130,
    y: centerY - 30,
    size: 14,
    font: fontRegular,
    color: rgb(0.4, 0.4, 0.45),
  });

  // Charity name
  const charityWidth = fontBold.widthOfTextAtSize(charityName, 20);
  page.drawText(charityName, {
    x: width / 2 - charityWidth / 2,
    y: centerY - 60,
    size: 20,
    font: fontBold,
    color: rgb(0.13, 0.59, 0.95),
  });

  // ── Opportunity details
  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "N/A";

  page.drawText(`Opportunity: ${opportunityTitle}`, {
    x: width / 2 - 140,
    y: centerY - 110,
    size: 12,
    font: fontItalic,
    color: rgb(0.35, 0.35, 0.4),
  });

  page.drawText(`Period: ${formatDate(startDate)} — ${formatDate(endDate)}`, {
    x: width / 2 - 140,
    y: centerY - 135,
    size: 12,
    font: fontItalic,
    color: rgb(0.35, 0.35, 0.4),
  });

  // ── Footer — issue date
  const issueDate = new Date(issuedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  page.drawText(`Issued on: ${issueDate}`, {
    x: width / 2 - 50,
    y: margin + 45,
    size: 11,
    font: fontRegular,
    color: rgb(0.5, 0.5, 0.55),
  });

  // ── Serialize
  const pdfBytes = await pdfDoc.save();

  // ── Upload to Supabase
  const filename = `certificate-${uuidv4()}.pdf`;
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

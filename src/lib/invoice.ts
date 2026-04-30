import { jsPDF } from "jspdf";

// Load an image URL as base64
async function toBase64(url: string): Promise<string> {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Brand colors (RGB)
const RED   = [229, 9, 20]   as const;
const BLACK = [17,  17, 17]  as const;
const GRAY  = [100, 100, 100] as const;
const LIGHT = [245, 245, 245] as const;

export async function generateInvoicePDF(booking: any) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = 210; // page width

  /* ─── HEADER ─── */
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, W, 48, "F");

  // Add a thin red line at the very top for branding
  doc.setFillColor(...RED);
  doc.rect(0, 0, W, 2, "F");

  // Try to embed logo
  try {
    const logoBase64 = await toBase64("/brand-logo.png");
    // Place logo on the left side of the header
    doc.addImage(logoBase64, "PNG", 12, 8, 36, 32);
  } catch {
    // Fallback: text logo
    doc.setTextColor(...RED);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("GymDate", 14, 28);
  }

  // "INVOICE" label on the right
  doc.setTextColor(...BLACK);
  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  doc.text("INVOICE", W - 14, 30, { align: "right" });

  doc.setFontSize(9);
  doc.setTextColor(...GRAY);
  doc.setFont("helvetica", "normal");
  doc.text("Official Payment Receipt", W - 14, 38, { align: "right" });

  /* ─── META ROW ─── */
  let y = 58;
  doc.setTextColor(...BLACK);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text(`Invoice ID:`, 14, y);
  doc.setFont("helvetica", "normal");
  doc.text(`INV-${booking.id.slice(0, 8).toUpperCase()}`, 40, y);

  doc.setFont("helvetica", "bold");
  doc.text(`Date:`, W - 70, y);
  doc.setFont("helvetica", "normal");
  doc.text(new Date(booking.created_at || Date.now()).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }), W - 56, y);

  /* ─── DIVIDER ─── */
  y += 8;
  doc.setDrawColor(...RED);
  doc.setLineWidth(0.6);
  doc.line(14, y, W - 14, y);
  y += 10;

  /* ─── TWO-COLUMN: Customer | Subscription ─── */
  const colLeft = 14;
  const colRight = 112;

  // Section headers
  doc.setFillColor(...RED);
  doc.rect(colLeft, y - 4, 88, 7, "F");
  doc.rect(colRight, y - 4, 84, 7, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("CUSTOMER DETAILS", colLeft + 3, y + 0.5);
  doc.text("SUBSCRIPTION DETAILS", colRight + 3, y + 0.5);

  y += 10;

  // Customer details
  doc.setTextColor(...GRAY);
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  const customerLines = [
    ["Name",  booking.customer_name  || "N/A"],
    ["Email", booking.customer_email || "N/A"],
    ["Phone", booking.customer_phone || "N/A"],
  ];
  customerLines.forEach(([label, value]) => {
    doc.setFont("helvetica", "bold");
    doc.text(`${label}:`, colLeft, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...BLACK);
    doc.text(value, colLeft + 16, y);
    doc.setTextColor(...GRAY);
    y += 7;
  });

  // Subscription details (reset y to top of right column)
  y -= 21;
  const subLines = [
    ["Gym",      booking.gyms?.name || "N/A"],
    ["Plan",     booking.plan_name  || "N/A"],
    ["Start",    new Date(booking.start_date).toLocaleDateString("en-IN")],
    ["End",      new Date(booking.end_date).toLocaleDateString("en-IN")],
  ];
  subLines.forEach(([label, value]) => {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...GRAY);
    doc.text(`${label}:`, colRight, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...BLACK);
    doc.text(value, colRight + 14, y);
    y += 7;
  });

  y += 8;

  /* ─── BILLING TABLE ─── */
  // Table header
  doc.setFillColor(...BLACK);
  doc.rect(14, y, W - 28, 8, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.text("DESCRIPTION", 18, y + 5.5);
  doc.text("DURATION", 115, y + 5.5);
  doc.text("AMOUNT", W - 18, y + 5.5, { align: "right" });

  y += 8;

  // Table row
  doc.setFillColor(...LIGHT);
  doc.rect(14, y, W - 28, 10, "F");
  doc.setTextColor(...BLACK);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`${booking.plan_name} at ${booking.gyms?.name || "Gym"}`, 18, y + 6.5);

  const start = new Date(booking.start_date).toLocaleDateString("en-IN");
  const end   = new Date(booking.end_date).toLocaleDateString("en-IN");
  doc.text(`${start} – ${end}`, 115, y + 6.5);
  doc.text(`INR ${booking.amount || booking.total_price}`, W - 18, y + 6.5, { align: "right" });

  y += 10;

  /* ─── TOTAL ─── */
  doc.setFillColor(...RED);
  doc.rect(14, y, W - 28, 12, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("TOTAL PAID", 18, y + 8);
  doc.text(`INR ${booking.amount || booking.total_price}`, W - 18, y + 8, { align: "right" });

  y += 20;

  /* ─── STATUS BADGE ─── */
  doc.setFillColor(34, 197, 94); // green
  doc.roundedRect(14, y, 30, 8, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("PAID", 18, y + 5.5);

  y += 20;

  /* ─── FOOTER ─── */
  doc.setDrawColor(...RED);
  doc.setLineWidth(0.5);
  doc.line(14, y, W - 14, y);
  y += 6;

  doc.setFontSize(7.5);
  doc.setTextColor(...GRAY);
  doc.setFont("helvetica", "normal");
  doc.text("Thank you for choosing GymDate — India's Smart Gym Network.", W / 2, y, { align: "center" });
  doc.text("This is a computer-generated invoice and does not require a physical signature.", W / 2, y + 5, { align: "center" });

  doc.setTextColor(...RED);
  doc.setFont("helvetica", "bold");
  doc.text("www.gymdate.in", W / 2, y + 11, { align: "center" });

  /* ─── SAVE ─── */
  doc.save(`GymDate_Invoice_${booking.id.slice(0, 8).toUpperCase()}.pdf`);
}

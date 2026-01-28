import jsPDF from "jspdf";

interface SwingData {
  id: string;
  classification: string;
  gameReadiness: number;
  contactSpeedEstimate: string;
  timingGapFrames: number | null;
  diagnoses: string[];
  aiExplanation: string;
  createdAt: string;
}

function formatClassification(classification: string): string {
  const map: Record<string, string> = {
    connected_sequence: "Connected Sequence",
    early_commit: "Early Commit",
    arm_dominant_swing: "Arm Dominant",
    simultaneous_start: "Simultaneous Start",
    insufficient_data: "Insufficient Data",
  };
  return map[classification] || classification;
}

function formatDiagnosis(diagnosis: string): string {
  return diagnosis
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function getReadinessLabel(score: number): string {
  if (score <= 30) return "Needs game-speed adjustment";
  if (score <= 60) return "Limited game readiness";
  if (score <= 80) return "Competitive readiness";
  return "Advanced readiness";
}

export async function exportSwingToPDF(swing: SwingData, playerName?: string): Promise<void> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let y = 20;

  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 45, "F");

  doc.setTextColor(56, 189, 248);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("Late-Decision Swing Analysis", margin, y + 8);

  doc.setTextColor(148, 163, 184);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Swing Mechanics Report", margin, y + 18);

  y = 55;

  doc.setDrawColor(51, 65, 85);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);

  y += 15;

  doc.setTextColor(30, 41, 59);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Analysis Details", margin, y);

  y += 10;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);

  const details = [
    ["Date:", new Date(swing.createdAt).toLocaleDateString("en-US", { 
      year: "numeric", 
      month: "long", 
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })],
    ["Player:", playerName || "Anonymous"],
    ["Analysis ID:", swing.id.substring(0, 8) + "..."],
  ];

  details.forEach(([label, value]) => {
    doc.setFont("helvetica", "bold");
    doc.text(label, margin, y);
    doc.setFont("helvetica", "normal");
    doc.text(value, margin + 35, y);
    y += 7;
  });

  y += 10;

  doc.setFillColor(240, 253, 244);
  doc.roundedRect(margin, y, pageWidth - 2 * margin, 35, 3, 3, "F");

  doc.setTextColor(22, 163, 74);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Game Readiness Score", margin + 10, y + 12);

  doc.setFontSize(28);
  doc.text(`${swing.gameReadiness}/100`, margin + 10, y + 28);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(34, 197, 94);
  doc.text(getReadinessLabel(swing.gameReadiness), margin + 70, y + 28);

  y += 45;

  doc.setFillColor(239, 246, 255);
  doc.roundedRect(margin, y, (pageWidth - 2 * margin) / 2 - 5, 30, 3, 3, "F");

  doc.setTextColor(37, 99, 235);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("SWING TYPE", margin + 5, y + 8);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(formatClassification(swing.classification), margin + 5, y + 20);

  const rightBoxX = margin + (pageWidth - 2 * margin) / 2 + 5;
  doc.setFillColor(254, 243, 199);
  doc.roundedRect(rightBoxX, y, (pageWidth - 2 * margin) / 2 - 5, 30, 3, 3, "F");

  doc.setTextColor(180, 83, 9);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("CONTACT SPEED", rightBoxX + 5, y + 8);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(swing.contactSpeedEstimate, rightBoxX + 5, y + 20);

  y += 40;

  if (swing.timingGapFrames !== null) {
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Timing Analysis", margin, y);

    y += 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);

    const timingText = swing.timingGapFrames > 0
      ? `Hips lead hands by ${swing.timingGapFrames} frames (${Math.round(swing.timingGapFrames / 30 * 1000)}ms)`
      : swing.timingGapFrames < 0
      ? `Hands lead hips by ${Math.abs(swing.timingGapFrames)} frames (${Math.round(Math.abs(swing.timingGapFrames) / 30 * 1000)}ms)`
      : "Simultaneous hip and hand movement";

    doc.text(timingText, margin, y);
    y += 15;
  }

  if (swing.diagnoses && swing.diagnoses.length > 0) {
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Key Observations", margin, y);

    y += 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);

    swing.diagnoses.forEach((diagnosis) => {
      doc.text(`• ${formatDiagnosis(diagnosis)}`, margin + 5, y);
      y += 7;
    });

    y += 8;
  }

  if (swing.aiExplanation) {
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Coach's Analysis", margin, y);

    y += 8;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);

    const lines = doc.splitTextToSize(swing.aiExplanation, pageWidth - 2 * margin);
    
    lines.forEach((line: string) => {
      if (y > doc.internal.pageSize.getHeight() - 30) {
        doc.addPage();
        y = 20;
      }
      doc.text(line, margin, y);
      y += 5;
    });
  }

  const footerY = doc.internal.pageSize.getHeight() - 15;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);

  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text("Generated by Late-Decision Swing Analysis™ • torquebattrainer.com", margin, footerY);
  doc.text("Instructional feedback only", pageWidth - margin - 40, footerY);

  const filename = `swing-analysis-${new Date(swing.createdAt).toISOString().split("T")[0]}.pdf`;
  doc.save(filename);
}

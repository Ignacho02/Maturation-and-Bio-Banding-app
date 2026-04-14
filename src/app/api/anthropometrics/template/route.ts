import * as XLSX from "xlsx";
import { NextResponse } from "next/server";

const headers = [
  "Name",
  "Sex",
  "Age Group",
  "Team",
  "Position",
  "Club",
  "Data Collection Date",
  "DOB",
  "Stature (cm)",
  "Body Mass (kg)",
  "Sitting Height (cm)",
  "Mother Height (cm)",
  "Father Height (cm)",
];

export async function GET() {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet([
    headers,
    [
      "Sample Athlete",
      "male",
      "U14",
      "U14 Boys",
      "Winger",
      "Arenas Performance Lab",
      "2026-03-18",
      "2012-02-14",
      157.4,
      46.3,
      81.5,
      165,
      178,
    ],
  ]);

  XLSX.utils.book_append_sheet(workbook, worksheet, "Anthropometrics");
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="maduration-template.xlsx"',
    },
  });
}

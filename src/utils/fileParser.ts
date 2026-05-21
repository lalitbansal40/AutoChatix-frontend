import * as XLSX from "xlsx";

const looksLikePhone = (s: string) => /^[+\d][\d\s\-().]{5,}$/.test(s.trim());

// ── VCF / vCard ──────────────────────────────────────────────────────────────

function parseVCard(content: string): string[] {
  const phones: string[] = [];
  const cards = content.split(/BEGIN:VCARD/i).filter((c) => /END:VCARD/i.test(c));

  for (const card of cards) {
    const lines = card.split(/\r?\n/);
    const cardPhones: string[] = [];

    for (const line of lines) {
      if (line.toUpperCase().startsWith("TEL")) {
        const phone = line.replace(/^TEL[^:]*:/i, "").replace(/\s/g, "");
        if (phone) cardPhones.push(phone);
      }
    }

    // Fallback: check N: or FN: if no TEL lines
    if (!cardPhones.length) {
      for (const line of lines) {
        const upper = line.toUpperCase();
        if (upper.startsWith("FN:") || upper.startsWith("N:")) {
          const val = line.replace(/^[^:]+:/i, "").replace(/;/g, " ").trim();
          if (looksLikePhone(val)) cardPhones.push(val);
        }
      }
    }

    phones.push(...cardPhones);
  }

  return phones;
}

// ── CSV ───────────────────────────────────────────────────────────────────────

function parseCsv(text: string): string[] {
  const phones: string[] = [];
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (!lines.length) return [];

  const strip = (s: string) => s.trim().replace(/^["']|["']$/g, "");

  const headers = lines[0].split(",").map(strip).map((h) => h.toLowerCase());
  const phoneColIdx = headers.findIndex((h) =>
    /phone|mobile|tel|number|contact/.test(h)
  );

  if (phoneColIdx >= 0) {
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",").map(strip);
      const phone = cols[phoneColIdx] || "";
      if (looksLikePhone(phone)) phones.push(phone);
    }
  } else {
    // No recognizable header — scan every cell in every row
    for (const line of lines) {
      const cols = line.split(",").map(strip);
      for (const col of cols) {
        if (looksLikePhone(col)) {
          phones.push(col);
          break;
        }
      }
    }
  }

  return phones;
}

// ── XLSX / XLS ────────────────────────────────────────────────────────────────

function parseXlsx(buffer: ArrayBuffer): string[] {
  const wb = XLSX.read(buffer, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, any>>(ws, { defval: "" });

  if (!rows.length) return [];

  const phones: string[] = [];
  const sampleRow = rows[0];
  const phoneKey = Object.keys(sampleRow).find((k) =>
    /phone|mobile|tel|number|contact/i.test(k)
  );

  for (const row of rows) {
    if (phoneKey) {
      const phone = String(row[phoneKey] ?? "").trim();
      if (looksLikePhone(phone)) phones.push(phone);
    } else {
      for (const val of Object.values(row)) {
        if (looksLikePhone(String(val))) {
          phones.push(String(val).trim());
          break;
        }
      }
    }
  }

  return phones;
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function parseFileToPhones(file: File): Promise<string[]> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";

  if (ext === "vcf" || ext === "vcard") {
    const text = await file.text();
    return parseVCard(text);
  }

  if (ext === "csv") {
    const text = await file.text();
    return parseCsv(text);
  }

  if (ext === "xlsx" || ext === "xls") {
    const buffer = await file.arrayBuffer();
    return parseXlsx(buffer);
  }

  return [];
}

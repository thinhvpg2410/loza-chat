const OFFICE_EMBED = "https://view.officeapps.live.com/op/embed.aspx?src=";
const PDF_GVIEW = "https://docs.google.com/gview?embedded=true&url=";

function extLower(fileName: string): string {
  const i = fileName.lastIndexOf(".");
  return i >= 0 ? fileName.slice(i).toLowerCase() : "";
}

/** PDF / Word / Excel / PowerPoint (and common spreadsheet extensions). */
export function isDocumentPreviewable(fileName: string, mime?: string): boolean {
  const ext = extLower(fileName);
  const m = (mime ?? "").toLowerCase();
  if (m.includes("pdf") || ext === ".pdf") return true;
  if (
    [".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".csv", ".odt", ".ods", ".odp"].some(
      (e) => ext === e,
    )
  ) {
    return true;
  }
  return (
    m.includes("wordprocessingml") ||
    m.includes("spreadsheetml") ||
    m.includes("presentationml") ||
    m === "application/msword" ||
    m === "application/vnd.ms-excel" ||
    m === "application/vnd.ms-powerpoint" ||
    m.includes("opendocument")
  );
}

/**
 * URL to load in iframe / WebView: direct HTTPS PDF, Google viewer for non-HTTPS PDF,
 * Microsoft Office Online embed for spreadsheets/docs/slides.
 * Office/Google viewers need the file URL to be reachable from the internet (HTTPS).
 */
export function buildDocumentPreviewEmbedUrl(
  fileUrl: string,
  fileName: string,
  mime?: string,
): string {
  const ext = extLower(fileName);
  const m = (mime ?? "").toLowerCase();
  const isPdf = m.includes("pdf") || ext === ".pdf";
  if (isPdf) {
    if (fileUrl.startsWith("https://")) return fileUrl;
    return `${PDF_GVIEW}${encodeURIComponent(fileUrl)}`;
  }
  return `${OFFICE_EMBED}${encodeURIComponent(fileUrl)}`;
}

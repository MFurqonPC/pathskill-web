// Format tanggal ISO dari backend ("2026-07-30T00:00:00.000000Z") jadi
// bentuk singkat yang enak dibaca ("30 Jul 2026"). Fallback ke string
// aslinya kalau ternyata bukan tanggal valid, biar tidak silent-fail.
export function formatDueDate(dueDate: string) {
  const date = new Date(dueDate);
  if (Number.isNaN(date.getTime())) return dueDate;
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Status urgensi tenggat, dipakai untuk styling (mis. merah kalau lewat
 * atau H-1). "none" kalau dueDate tidak valid/tidak ada.
 */
export function getDueDateUrgency(
  dueDate: string | null | undefined
): "overdue" | "urgent" | "normal" | "none" {
  if (!dueDate) return "none";
  const date = new Date(dueDate);
  if (Number.isNaN(date.getTime())) return "none";

  const now = new Date();
  const diffDays = Math.ceil(
    (date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays < 0) return "overdue";
  if (diffDays <= 1) return "urgent";
  return "normal";
}
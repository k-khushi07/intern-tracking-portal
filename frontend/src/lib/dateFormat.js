export function formatDmy(value) {
  if (!value) return "";
  const raw = String(value).trim();
  if (!raw) return "";

  let date;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const [yyyy, mm, dd] = raw.split("-").map((part) => Number(part));
    if (!yyyy || !mm || !dd) return "";
    date = new Date(yyyy, mm - 1, dd);
  } else {
    date = new Date(raw);
  }

  if (Number.isNaN(date.getTime())) return "";
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

export function formatDmyTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${formatDmy(date)} ${hours}:${minutes}`;
}

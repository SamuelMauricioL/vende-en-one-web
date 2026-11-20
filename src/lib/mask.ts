const VISIBLE = 3;
const STARS = "***";

export function maskName(name: string): string {
  const value = name.trim();
  if (!value) return "";
  return `${value.slice(0, VISIBLE)}${STARS}`;
}

export function maskEmail(email: string): string {
  const value = email.trim();
  const at = value.lastIndexOf("@");
  if (at <= 0 || at === value.length - 1) return "";

  const local = value.slice(0, at);
  const domain = value.slice(at + 1);
  return `${local.slice(0, VISIBLE)}${STARS}@${domain}`;
}

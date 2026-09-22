// Shared display formatting, so every table and stat card agrees on the same
// shape ("2,500 KES", "Sep 20") the wireframe draws.

export function formatAmount(amount: number, currency: string): string {
  return `${amount.toLocaleString("en-US", { maximumFractionDigits: 2 })} ${currency}`;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

const METHOD_LABEL: Record<string, string> = {
  mobile_money: "Mobile Money",
  card: "Card",
};

export function formatMethod(method: string): string {
  return METHOD_LABEL[method] ?? method;
}

const DESTINATION_LABEL: Record<string, string> = {
  bank: "Bank",
  mobile_wallet: "M-Pesa",
};

export function formatDestination(type: string, details: string | undefined): string {
  const label = DESTINATION_LABEL[type] ?? type;
  if (!details) return label;
  const tail = details.length > 4 ? details.slice(-4) : details;
  return `${label} ****${tail}`;
}

export function capitalize(value: string): string {
  return value.length === 0 ? value : value[0].toUpperCase() + value.slice(1);
}

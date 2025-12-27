export default function classifySeller(html: string): string {
  const lowered = html.toLowerCase();

  if (lowered.includes("dealer") || lowered.includes("dealership")) {
    return "dealer";
  }

  if (lowered.includes("private seller") || lowered.includes("owner")) {
    return "private";
  }

  return "unknown";
}

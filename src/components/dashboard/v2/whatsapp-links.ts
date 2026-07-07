export type WhatsappCommunityLink = {
  href: string;
  title: string;
  description: string;
};

export const WHATSAPP_COMMUNITY_LINKS: WhatsappCommunityLink[] = [
  {
    href: "https://chat.whatsapp.com/Es7D3UnFObZ1H8ZxBSrZZo",
    title: "Canada CEC Applicants 2026",
    description: "Connect with CEC applicants tracking AOR to PPR timelines.",
  },
  {
    href: "https://chat.whatsapp.com/FqRucf5PG4N16Rx587ljPX",
    title: "PR/AOR Tracker 2026 | Canada",
    description: "Broader PR and AOR tracker community for Canada immigration.",
  },
];

export const WHATSAPP_LINKS_AUTO_DISMISS_KEY = "aortrack_wa_links_auto_dismiss";

export function shouldAutoOpenWhatsappLinks(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(WHATSAPP_LINKS_AUTO_DISMISS_KEY) !== "1";
}

export function setWhatsappLinksAutoDismiss(dismiss: boolean): void {
  if (typeof window === "undefined") return;
  if (dismiss) {
    localStorage.setItem(WHATSAPP_LINKS_AUTO_DISMISS_KEY, "1");
  } else {
    localStorage.removeItem(WHATSAPP_LINKS_AUTO_DISMISS_KEY);
  }
}

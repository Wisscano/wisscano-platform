import { MessageCircle } from "lucide-react";

export function Footer({ whatsappNumber, companyName }: { whatsappNumber: string; companyName: string }) {
  return (
    <div className="border-t border-wc-line">
      <div className="max-w-[1180px] mx-auto px-6 py-8 flex justify-between flex-wrap gap-4">
        <span className="font-mono text-xs text-wc-textMute">© {new Date().getFullYear()} {companyName}</span>
        <a
          href={`https://wa.me/${whatsappNumber}`}
          target="_blank"
          rel="noopener noreferrer"
          className="font-body text-[13px] text-wc-textSoft no-underline flex items-center gap-1.5 hover:text-wc-text"
        >
          <MessageCircle size={14} />
          Prefer to talk directly? Talk to Wisscano on WhatsApp →
        </a>
      </div>
    </div>
  );
}

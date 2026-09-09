import Link from "next/link";
import { logoutAdmin } from "@/actions/auth";
import {
  LayoutDashboard, Tags, PackageSearch, Wrench, GalleryHorizontal, Images,
  ClipboardList, FolderOpen, Settings, Search, Globe2, FileText, FileStack,
  Users, Truck, History, LogOut, Rocket,
} from "lucide-react";

const LINKS = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/procurement-requests", label: "Procurement Requests", icon: ClipboardList },
  { href: "/admin/highlights", label: "Highlights", icon: Rocket },
  { href: "/admin/brands", label: "Brands", icon: Tags },
  { href: "/admin/what-we-source", label: "What We Source", icon: PackageSearch },
  { href: "/admin/services", label: "Services", icon: Wrench },
  { href: "/admin/showcase", label: "Showcase", icon: Images },
  { href: "/admin/carousels", label: "Carousels", icon: GalleryHorizontal },
  { href: "/admin/media", label: "Media Library", icon: FolderOpen },
  { href: "/admin/documents", label: "Documents", icon: FileText },
  { href: "/admin/document-types", label: "Document Types", icon: FileStack },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/suppliers", label: "Suppliers", icon: Truck },
  { href: "/admin/markets", label: "Markets", icon: Globe2 },
  { href: "/admin/seo", label: "SEO", icon: Search },
  { href: "/admin/site-settings", label: "Site Settings", icon: Settings },
  { href: "/admin/audit-log", label: "Audit Log", icon: History },
];

export function AdminNav() {
  return (
    <aside className="w-[240px] shrink-0 border-r border-wc-line min-h-screen p-4 hidden md:block">
      <div className="font-display font-extrabold text-sm tracking-tight px-2 mb-6">WISSCANO ADMIN</div>
      <nav className="flex flex-col gap-0.5">
        {LINKS.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className="flex items-center gap-2.5 px-2.5 py-2 rounded text-[13.5px] text-wc-textSoft hover:bg-wc-panelAlt hover:text-wc-text no-underline">
            <Icon size={15} /> {label}
          </Link>
        ))}
      </nav>
      <form action={logoutAdmin} className="mt-6 px-2.5">
        <button type="submit" className="flex items-center gap-2 text-[13px] text-wc-textMute hover:text-wc-text bg-transparent border-none cursor-pointer p-0">
          <LogOut size={14} /> Log out
        </button>
      </form>
    </aside>
  );
}

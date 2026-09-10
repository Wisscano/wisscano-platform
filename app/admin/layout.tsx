import { AdminNav } from "@/components/admin/admin-nav";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-wc-bg">
      <AdminNav />
      <main className="flex-1 p-8 max-w-[1200px]">{children}</main>
    </div>
  );
}
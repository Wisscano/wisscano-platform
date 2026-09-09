import type { Metadata } from "next";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { getSiteSettings } from "@/lib/queries";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    title: "About Wisscano Technologies",
    description: "Wisscano Technologies is an international ICT procurement agency and technology solutions provider — sourcing computing, networking, security and infrastructure technology on request.",
    path: "/about",
  });
}

export default async function AboutPage() {
  const settings = await getSiteSettings();
  return (
    <div className="min-h-screen">
      <Nav />
      <main className="max-w-[820px] mx-auto px-6 py-14">
        <p className="font-mono text-xs text-wc-textMute">About</p>
        <h1 className="font-display font-extrabold text-4xl mt-3">Technology procurement, without the guesswork.</h1>

        {settings?.acronymExpansion && (
          <p className="font-mono text-[13px] text-wc-cyan mt-4">
            WISSCANO — {settings.acronymExpansion}
          </p>
        )}

        <p className="font-body text-[16px] text-wc-textSoft mt-5 leading-relaxed">
          Wisscano Technologies is a technology procurement and solutions company. Rather than maintaining
          a fixed online inventory, Wisscano sources ICT, IoT, systems, software, cloud, AI and network
          technology from a broad ecosystem of manufacturers and suppliers — matched to what each customer
          actually needs.
        </p>
        <p className="font-body text-[16px] text-wc-textSoft mt-4 leading-relaxed">
          Customers don&apos;t need to know the exact product, brand, or specification. They describe the
          requirement — in plain language, with a document, or with a bill of materials — and Wisscano&apos;s
          procurement team handles sourcing, comparison, quotation and delivery.
        </p>
        <p className="font-body text-[16px] text-wc-textSoft mt-4 leading-relaxed">
          Wisscano serves individuals, businesses, institutions and organizations — both one-off purchases
          and ongoing institutional or project-based procurement.
        </p>
        <p className="font-body text-[16px] text-wc-textSoft mt-4 leading-relaxed">
          Procurement operations are coordinated from Nairobi, Kenya. Wisscano's sourcing reach is built to
          extend across East Africa, the wider African market, and international suppliers as requirements
          call for it — the platform is architected for that growth rather than limited to a single market.
        </p>
      </main>
      <Footer whatsappNumber={settings?.whatsappNumber || "254119834490"} companyName={settings?.companyName || "Wisscano Technologies"} />
    </div>
  );
}

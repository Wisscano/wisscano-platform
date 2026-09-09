import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { getServiceBySlug, getPublishedServices, getSiteSettings } from "@/lib/queries";
import { buildMetadata, serviceJsonLd, breadcrumbJsonLd } from "@/lib/seo";
import { ArrowUpRight } from "lucide-react";

export async function generateStaticParams() {
  const services = await getPublishedServices();
  return services.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const service = await getServiceBySlug(slug);
  if (!service) return {};
  return buildMetadata({
    title: service.seoTitle || service.name,
    description: service.seoDescription || service.description || `${service.name}, delivered by Wisscano Technologies.`,
    path: `/services/${service.slug}`,
  });
}

export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [service, settings] = await Promise.all([getServiceBySlug(slug), getSiteSettings()]);
  if (!service) notFound();

  const ld = serviceJsonLd(service);
  const crumbs = breadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Services", path: "/#services" },
    { name: service.name, path: `/services/${service.slug}` },
  ]);

  return (
    <div className="min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbs) }} />
      <Nav />
      <nav aria-label="Breadcrumb" className="max-w-[1180px] mx-auto px-6 pt-8 font-mono text-xs text-wc-textMute">
        <Link href="/" className="hover:text-wc-cyan">Home</Link> / <Link href="/#services" className="hover:text-wc-cyan">Services</Link> / <span className="text-wc-textSoft">{service.name}</span>
      </nav>

      <main className="max-w-[1180px] mx-auto px-6 py-10">
        <p className="font-mono text-xs text-wc-textMute">Service</p>
        <h1 className="font-display font-extrabold text-4xl mt-3">{service.name}</h1>
        <p className="font-body text-[16px] text-wc-textSoft mt-4 max-w-[640px] leading-relaxed">
          {service.description || `${service.name} delivered by Wisscano's technology solutions team.`}
        </p>
        {service.detailedContent && (
          <p className="font-body text-[14.5px] text-wc-textSoft mt-4 max-w-[640px] leading-relaxed">{service.detailedContent}</p>
        )}
        <div className="mt-8"><Link href="/#request"><Button>Request {service.name} <ArrowUpRight size={16} /></Button></Link></div>
      </main>

      <Footer whatsappNumber={settings?.whatsappNumber || "254119834490"} companyName={settings?.companyName || "Wisscano Technologies"} />
    </div>
  );
}

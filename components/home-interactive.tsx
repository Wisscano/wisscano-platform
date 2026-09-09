"use client";

import { useRef, useState } from "react";
import { RequestBar, type RequestBarContext } from "@/components/request-bar";
import { Marquee } from "@/components/marquee";
import { BrandCard } from "@/components/brand-card";
import { CategoryCard } from "@/components/category-card";
import { ServiceCard } from "@/components/service-card";

type Brand = { id: string; name: string; slug: string; logoUrl: string | null; altText: string | null };
type Category = { id: string; name: string; slug: string; icon: string | null; blurb: string | null };
type Service = { id: string; name: string; slug: string; icon: string | null };
type CarouselCfg = { direction: "left" | "right"; speedPxPerSec: number; active: boolean };

/**
 * Single client boundary holding the state shared between the Request Bar
 * and all three carousels (§5: clicking a carousel item must populate the
 * bar). Data is fetched server-side in app/page.tsx and passed in as
 * props — this component owns interactivity only, not data fetching.
 */
export function HomeInteractive({
  brands, categories, services, brandsCfg, sourceCfg, servicesCfg,
}: {
  brands: Brand[]; categories: Category[]; services: Service[];
  brandsCfg: CarouselCfg; sourceCfg: CarouselCfg; servicesCfg: CarouselCfg;
}) {
  const [context, setContext] = useState<RequestBarContext | null>(null);
  const requestRef = useRef<HTMLDivElement>(null);

  function select(type: RequestBarContext["type"], id: string, label: string) {
    setContext({ type, id, label });
    requestRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  return (
    <>
      <div id="request" className="mt-12">
        <RequestBar context={context} onClearContext={() => setContext(null)} scrollTargetRef={requestRef} />
      </div>

      <section id="brands" aria-labelledby="brands-heading" className="py-8">
        <div className="max-w-[1180px] mx-auto px-6">
          <h2 id="brands-heading" className="font-mono text-xs text-wc-textMute">Brands we source</h2>
        </div>
        <div className="mt-3.5">
          <Marquee
            items={brands}
            itemKey={(b, i) => `${b.id}-${i}`}
            direction={brandsCfg.direction}
            speedPxPerSec={brandsCfg.speedPxPerSec}
            active={brandsCfg.active}
            renderItem={(b) => (
              <BrandCard name={b.name} slug={b.slug} logoUrl={b.logoUrl} altText={b.altText} onSelect={() => select("brand", b.id, b.name)} />
            )}
          />
        </div>
      </section>

      <section id="what-we-source" aria-labelledby="source-heading" className="py-8">
        <div className="max-w-[1180px] mx-auto px-6">
          <h2 id="source-heading" className="font-mono text-xs text-wc-textMute">What we source</h2>
        </div>
        <div className="mt-3.5">
          <Marquee
            items={categories}
            itemKey={(c, i) => `${c.id}-${i}`}
            direction={sourceCfg.direction}
            speedPxPerSec={sourceCfg.speedPxPerSec}
            active={sourceCfg.active}
            gap={14}
            renderItem={(c) => (
              <CategoryCard name={c.name} slug={c.slug} icon={c.icon} blurb={c.blurb} onSelect={() => select("category", c.id, c.name)} />
            )}
          />
        </div>
      </section>

      <section id="services" aria-labelledby="services-heading" className="py-8">
        <div className="max-w-[1180px] mx-auto px-6">
          <h2 id="services-heading" className="font-mono text-xs text-wc-textMute">Our services</h2>
        </div>
        <div className="mt-3.5">
          <Marquee
            items={services}
            itemKey={(s, i) => `${s.id}-${i}`}
            direction={servicesCfg.direction}
            speedPxPerSec={servicesCfg.speedPxPerSec}
            active={servicesCfg.active}
            renderItem={(s) => <ServiceCard name={s.name} slug={s.slug} icon={s.icon} onSelect={() => select("service", s.id, s.name)} />}
          />
        </div>
      </section>
    </>
  );
}

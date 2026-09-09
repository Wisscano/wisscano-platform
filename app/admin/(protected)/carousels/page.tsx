import { listCarouselConfigs } from "@/actions/admin/carousels";
import { CarouselConfigRow } from "@/components/admin/carousel-config-row";

export default async function AdminCarouselsPage() {
  const configs = await listCarouselConfigs();
  return (
    <div>
      <h1 className="font-display font-bold text-2xl">Carousels</h1>
      <p className="font-body text-[13.5px] text-wc-textSoft mt-1.5">Direction, speed and active state for each of the three homepage carousels (§6-8).</p>
      <div className="flex flex-col gap-4 mt-6">
        {configs.map((c) => <CarouselConfigRow key={c.type} config={c} />)}
        {configs.length === 0 && <p className="font-body text-[13.5px] text-wc-textMute">Run the seed script to create the three default carousel configs.</p>}
      </div>
    </div>
  );
}

import Image from "next/image";

const GRADIENTS = [
  "linear-gradient(140deg, #0C1526 0%, #14213B 60%, #1B2E52 100%)",
  "linear-gradient(140deg, #0C1526 0%, #12233F 55%, #16305A 100%)",
  "linear-gradient(140deg, #0C1526 0%, #101F38 55%, #1A2748 100%)",
  "linear-gradient(140deg, #0C1526 0%, #132339 55%, #17324F 100%)",
];

export function ShowcasePanel({
  title, subtitle, imageUrl, altText, index,
}: { title: string; subtitle?: string | null; imageUrl?: string | null; altText?: string | null; index: number }) {
  return (
    <div
      className="relative border border-wc-line rounded-md min-h-[240px] p-6 flex flex-col justify-end overflow-hidden"
      style={{ background: imageUrl ? undefined : GRADIENTS[index % GRADIENTS.length] }}
    >
      {imageUrl && (
        <Image src={imageUrl} alt={altText ?? title} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover opacity-70" />
      )}
      <div className="relative">
        <div className="font-display font-bold text-[19px] text-wc-text">{title}</div>
        {subtitle && <div className="font-body text-[13.5px] text-wc-textSoft mt-1.5 max-w-[260px] leading-snug">{subtitle}</div>}
      </div>
    </div>
  );
}

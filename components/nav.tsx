import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Nav() {
  return (
    <div className="border-b border-wc-line sticky top-0 bg-wc-bg/92 backdrop-blur-sm z-20">
      <div className="max-w-[1180px] mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-[30px] h-[30px] border-[1.5px] border-wc-blue rounded flex items-center justify-center">
            <div className="w-2.5 h-2.5 bg-wc-cyan rounded-sm" />
          </div>
          <span className="font-display font-extrabold text-base tracking-tight">WISSCANO</span>
        </Link>
        <div className="hidden md:flex gap-6 text-[13.5px]">
          <Link href="/procurement" className="text-wc-textSoft hover:text-wc-text">What We Source</Link>
          <Link href="/#brands" className="text-wc-textSoft hover:text-wc-text">Brands</Link>
          <Link href="/#services" className="text-wc-textSoft hover:text-wc-text">Services</Link>
          <Link href="/about" className="text-wc-textSoft hover:text-wc-text">About</Link>
        </div>
        <Link href="/#request">
          <Button className="px-4 py-2.5 text-[13.5px]">Request Procurement</Button>
        </Link>
      </div>
    </div>
  );
}

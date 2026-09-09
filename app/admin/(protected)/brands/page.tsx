import { BrandForm } from "@/components/admin/brand-form";

export default function NewBrandPage() {
  return (
    <div>
      <h1 className="font-display font-bold text-2xl">New brand</h1>
      <div className="mt-6"><BrandForm /></div>
    </div>
  );
}

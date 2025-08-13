"use client";

import PriceSearch from "@/components/PriceSearch";

export default function Page() {
  return (
    <div className="mx-auto max-w-md p-4">
      <h2 className="text-base font-semibold mb-3">Precios</h2>
      <PriceSearch />
    </div>
  );
}

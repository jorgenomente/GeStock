import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";

export default function Page() {
  return (
    <>
      <Header title="Pedidos" />
      <main className="mx-auto max-w-md p-4">
        <h2 className="text-base font-semibold">Pedidos programados (placeholder)</h2>
      </main>
      <BottomNav />
    </>
  );
}

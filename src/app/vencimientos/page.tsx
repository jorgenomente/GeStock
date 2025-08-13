import Header from "../../components/Header";
import BottomNav from "../../components/BottomNav";

export default function Page() {
  return (
    <>
      <Header title="Vencimientos" />
      <main className="mx-auto max-w-md p-4">
        <h2 className="text-base font-semibold">Alertas de vencimiento (placeholder)</h2>
      </main>
      <BottomNav />
    </>
  );
}

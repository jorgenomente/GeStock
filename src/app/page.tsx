export default function Page() {
  return (
    <>
      <div className="bg-blue-500 text-white p-4 rounded-lg mb-4">
        TEST Tailwind
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-neutral-200 p-3">
          <p className="text-xs text-neutral-500">Ventas de hoy</p>
          <p className="text-2xl font-semibold">$0</p>
        </div>
        <div className="rounded-lg border border-neutral-200 p-3">
          <p className="text-xs text-neutral-500">Stock crítico</p>
          <p className="text-2xl font-semibold">0</p>
        </div>
        <div className="rounded-lg border border-neutral-200 p-3">
          <p className="text-xs text-neutral-500">Tareas</p>
          <p className="text-2xl font-semibold">0</p>
        </div>
        <div className="rounded-lg border border-neutral-200 p-3">
          <p className="text-xs text-neutral-500">Facturas próximas</p>
          <p className="text-2xl font-semibold">0</p>
        </div>
      </div>

      <div className="rounded-lg border border-neutral-200 p-4 mt-3">
        <p className="text-sm text-neutral-600">Gráfico semanal (placeholder)</p>
        <div className="mt-3 h-24 bg-neutral-100 rounded" />
      </div>
    </>
  );
}

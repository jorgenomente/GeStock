"use client";

import { useEffect, useMemo, useState, useDeferredValue } from "react";
import Papa from "papaparse";
import Fuse from "fuse.js";

/** ===== Tipos ===== */
type Row = Record<string, unknown> & {
  itemCode?: string;
  name?: string;
  Nombre?: string;
  producto?: string;
  Producto?: string;
  barcode?: string;
  price?: string | number;
  lastUpdated?: string;
};

type RowEx = {
  itemCode?: string;
  name: string;        // nombre final, garantizado
  barcode?: string;
  lastUpdated?: string;
  _kAll: string;       // texto normalizado para fallback
};

/** ===== Constantes ===== */
const PUBLIC_CSV = "/products.csv";

/** ===== Helpers ===== */
const norm = (s: unknown) =>
  String(s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

function pickName(r: Row): string {
  return (
    (r.name as string) ||
    (r.Nombre as string) ||
    (r.producto as string) ||
    (r.Producto as string) ||
    ""
  );
}

// Dedupe por nombre normalizado. Si hay fecha, se queda con el más reciente.
function dedupeByName(rows: RowEx[]): RowEx[] {
  const m = new Map<string, RowEx>();
  for (const r of rows) {
    const key = norm(r.name);
    if (!key) continue;
    const prev = m.get(key);
    if (!prev) {
      m.set(key, r);
    } else {
      const dNew = r.lastUpdated ? Date.parse(r.lastUpdated) : NaN;
      const dPrev = prev.lastUpdated ? Date.parse(prev.lastUpdated) : NaN;
      if (!isNaN(dNew) && (isNaN(dPrev) || dNew >= dPrev)) m.set(key, r);
    }
  }
  return Array.from(m.values());
}

/** ===== Página ===== */
export default function Page() {
  return <LabelMakerPage />;
}

/** ===== Componente principal ===== */
function LabelMakerPage() {
  const [all, setAll] = useState<RowEx[]>([]);
  const [loaded, setLoaded] = useState(0);

  const [q, setQ] = useState("");
  const dq = useDeferredValue(q); // query diferida => input fluido

  const [selectedNames, setSelectedNames] = useState<string[]>([]);

  // Cargar CSV (tolerante a encabezados) + dedupe por nombre
  useEffect(() => {
    Papa.parse(PUBLIC_CSV, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: ({ data }) => {
        const rowsRaw = (data as Row[])
          .map((r) => {
            const name = pickName(r);
            const itemCode = (r.itemCode as string) || "";
            const barcode = (r.barcode as string) || "";
            const lastUpdated = (r.lastUpdated as string) || "";
            const _kAll = norm([name, itemCode, barcode].join(" "));
            return { name, itemCode, barcode, lastUpdated, _kAll };
          })
          .filter((r) => r.name);

        const rows = dedupeByName(rowsRaw);
        setAll(rows);
        setLoaded(rows.length);
      },
      error: () => {
        setAll([]);
        setLoaded(0);
      },
    });
  }, []);

  // Fuse (búsqueda principal)
  const fuse = useMemo(
    () =>
      new Fuse(all, {
        keys: ["name", "itemCode", "barcode"],
        threshold: 0.4,
        ignoreLocation: true,
        includeScore: false,
      }),
    [all]
  );

  // Resultados — rápidos y sin congelar la UI
  const results = useMemo(() => {
    const qn = norm(dq);
    if (qn.length < 2) return all.slice(0, 30); // muestra una muestra con consulta corta

    const words = qn.split(" ").filter(Boolean);
    const expr = { $and: words } as any;

    let hits = fuse.search(expr).map((r) => r.item);

    // Fallback si Fuse no trae nada
    if (hits.length === 0) {
      hits = all.filter((r) => words.every((w) => r._kAll.includes(w)));
    }

    return hits.slice(0, 50);
  }, [dq, fuse, all]);

  // Acciones lista
  const addName = (name: string | undefined) => {
    if (!name) return;
    setSelectedNames((s) => [...s, String(name)]);
  };
  const removeAt = (idx: number) =>
    setSelectedNames((s) => s.filter((_, i) => i !== idx));
  const updateAt = (idx: number, newName: string) =>
    setSelectedNames((s) => s.map((n, i) => (i === idx ? newName : n)));
  const clearAll = () => setSelectedNames([]);
  const handlePrint = () => window.print();

  // Exportar CSV: 3 columnas => name, $, price (con comillas forzadas)
  const exportCSV = () => {
    const rows = selectedNames.map((n) => ({ name: n, ["$"]: "$", price: "" }));
    const csv = Papa.unparse(rows, {
      quotes: true,      // fuerza comillas en cada celda (evita dividir columnas por comas)
      newline: "\r\n",
      header: true,
      columns: ["name", "$", "price"] as any,
    });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "etiquetas_nombres.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Descargar Apps Script que formatea Google Sheets
  const downloadAppsScript = () => {
    const code = `function onOpen(){
  SpreadsheetApp.getUi().createMenu('Etiquetas')
    .addItem('Aplicar formato','applyFormat')
    .addToUi();
}
function applyFormat(){
  const sh = SpreadsheetApp.getActiveSheet();
  if (!sh) return;
  const lastRow = Math.max(sh.getLastRow(), 2);
  // Anchos: A=400px, B=15px, C=100px
  sh.setColumnWidths(1, 1, 400);
  sh.setColumnWidths(2, 1, 15);
  sh.setColumnWidths(3, 1, 100);
  // Encabezados
  sh.getRange(1,1,1,3).setBackground('#f0f0f0').setFontWeight('bold');
  // Columna A (desde fila 2): fondo negro, blanco, Roboto Mono 14
  const rangeA = sh.getRange(2,1,lastRow-1,1);
  rangeA.setBackground('#000000')
        .setFontColor('#ffffff')
        .setFontFamily('Roboto Mono')
        .setFontSize(14);
  // Columna B: centrado
  const rangeB = sh.getRange(2,2,lastRow-1,1);
  rangeB.setHorizontalAlignment('center');
  // Filas congeladas
  sh.setFrozenRows(1);
}`;
    const blob = new Blob([code], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "formatear_hoja.gs";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-3xl p-4 print:p-0">
      {/* Controles (ocultos al imprimir) */}
      <div className="print:hidden space-y-4">
        <div className="flex items-end justify-between">
          <h1 className="text-xl font-semibold">Generador de etiquetas</h1>
          <div className="text-xs text-gray-500">
            Cargados: <b>{loaded}</b> · {dq !== q ? "Buscando…" : <>Resultados: <b>{results.length}</b></>} · Lista:{" "}
            <b>{selectedNames.length}</b>
          </div>
        </div>

        {/* Fila 1: buscador solo */}
        <div className="flex">
          <label htmlFor="label-search" className="sr-only">
            Buscar producto
          </label>
          <input
            id="label-search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nombre (también por código o barcode si existen)…"
            className="w-full rounded-xl border px-3 py-2 outline-none focus:ring"
            autoComplete="off"
          />
        </div>

        {/* Fila 2: botones */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            onClick={clearAll}
            className="rounded-xl border px-3 py-2 w-full"
            title="Vaciar la lista seleccionada"
          >
            Limpiar lista
          </button>

          <button
            onClick={exportCSV}
            className="rounded-xl border px-3 py-2 w-full disabled:opacity-50"
            disabled={!selectedNames.length}
            title="CSV con 3 columnas: name, $, price"
          >
            Exportar CSV
          </button>

          <button
            onClick={downloadAppsScript}
            className="rounded-xl border px-3 py-2 w-full"
            title="Descarga un Apps Script para dar formato en Google Sheets"
          >
            Descargar Script Sheets
          </button>

          <button
            onClick={handlePrint}
            className="rounded-xl bg-black text-white px-3 py-2 w-full disabled:opacity-50"
            disabled={!selectedNames.length}
          >
            Imprimir
          </button>
        </div>

        {/* Resultados (sin duplicados) */}
        <ul className="max-h-64 overflow-auto rounded-xl border divide-y">
          {results.length === 0 && (
            <li className="px-3 py-2 text-sm text-gray-500">
              No hay coincidencias. Probá con menos palabras o sin acentos.
            </li>
          )}
          {results.map((r, i) => (
            <li
              key={`${r.name}-${i}`}
              className="flex items-center justify-between gap-3 px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{r.name}</p>
                {(r.itemCode || r.barcode) && (
                  <p className="text-xs text-gray-500 truncate">
                    {r.itemCode} {r.barcode ? `· ${r.barcode}` : ""}
                  </p>
                )}
              </div>
              <button
                onClick={() => addName(r.name)}
                className="shrink-0 rounded-lg border px-2 py-1 text-sm"
              >
                Agregar
              </button>
            </li>
          ))}
        </ul>

        {/* Lista editable (numerada, continua) */}
        <div>
          <div className="mb-2 text-sm text-gray-600">
            Lista ({selectedNames.length}) · Se imprime en una sola columna hacia abajo
          </div>
          <div className="rounded-xl border divide-y max-h-80 overflow-auto">
            {selectedNames.length === 0 && (
              <div className="px-3 py-2 text-sm text-gray-500">
                Sin elementos. Agregá desde el buscador.
              </div>
            )}
            {selectedNames.map((n, idx) => (
              <div key={`sel-${idx}`} className="flex items-start gap-2 px-3 py-2">
                <span className="mt-1 text-xs text-gray-500 w-6 shrink-0 tabular-nums">
                  {idx + 1}.
                </span>
                <div
                  className="min-h-[1.75rem] flex-1 rounded-md border px-2 py-1 bg-white"
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => updateAt(idx, e.currentTarget.innerText.trim())}
                  onKeyDown={(e) => {
                    // Enter confirma; Shift+Enter agrega salto de línea
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      (e.target as HTMLElement).blur();
                    }
                  }}
                >
                  {n}
                </div>
                <button
                  onClick={() => removeAt(idx)}
                  className="text-gray-500 hover:text-black px-2"
                  aria-label={`Quitar ${n}`}
                  title="Quitar"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* (Impresión opcional; si luego querés exportar PDF con fondo negro, lo reactivamos)
      <style jsx global>{`
        @media print {
          @page { size: A4; margin: 10mm; }
        }
      `}</style>
      */}
    </div>
  );
}

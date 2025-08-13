"use client";

import { useEffect, useMemo, useState } from "react";
import Papa, { ParseResult } from "papaparse";

type Row = {
  itemCode?: string;
  name?: string;
  barcode?: string;
  price?: string | number;
  lastUpdated?: string;
  [k: string]: unknown;
};
type RowEx = Row & { _kName: string; _kCode: string; _kBarcode: string };

const STORAGE_KEY = "gestock:precios:v1";
const PUBLIC_CSV = "/products.csv";

// ---------- helpers ----------
const norm = (s: unknown) =>
  String(s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const fmt = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(n);

const toNum = (v: unknown) => {
  const s = String(v ?? "")
    .replace(/[^\d,.-]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
};

const keyOf = (r: Row) =>
  (r.itemCode && String(r.itemCode).trim()) ||
  (r.barcode && String(r.barcode).trim()) ||
  (r.name && String(r.name).trim()) ||
  "SIN-CLAVE";

function aggregateMax(data: RowEx[]): RowEx[] {
  const acc: Record<string, RowEx> = {};
  for (const row of data) {
    const key = keyOf(row);
    const price = toNum(row.price);
    const saved = acc[key];
    const savedPrice = saved ? toNum(saved.price) : -Infinity;
    if (!saved || price > savedPrice) acc[key] = row;
  }
  return Object.values(acc);
}

const normalizeRow = (r: Row): RowEx => {
  const row: RowEx = {
    itemCode: r.itemCode ?? "",
    name: r.name ?? "",
    barcode: r.barcode ?? "",
    price: r.price ?? "0",
    lastUpdated: r.lastUpdated ?? "",
    _kName: "",
    _kCode: "",
    _kBarcode: "",
    ...r,
  };
  row._kName = norm(row.name);
  row._kCode = norm(row.itemCode);
  row._kBarcode = norm(row.barcode);
  return row;
};

// ---------- componente ----------
export default function PriceSearch() {
  const [rows, setRows] = useState<RowEx[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const cached = JSON.parse(raw) as RowEx[];
        setRows(
          cached.map((r) => ({
            ...r,
            _kName: r._kName ?? norm(r.name),
            _kCode: r._kCode ?? norm(r.itemCode),
            _kBarcode: r._kBarcode ?? norm(r.barcode),
          }))
        );
        return;
      }
    } catch {}

    Papa.parse<Row>(PUBLIC_CSV, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (res: ParseResult<Row>) => {
        const cleaned = res.data.map(normalizeRow);
        const agg = aggregateMax(cleaned);
        setRows(agg);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(agg));
        } catch {}
      },
      error: (err) => {
        console.warn("No se pudo cargar /products.csv:", err?.message || err);
      },
    });
  }, []);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    Papa.parse<Row>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res: ParseResult<Row>) => {
        const cleaned = res.data.map(normalizeRow);
        const agg = aggregateMax(cleaned);
        setRows(agg);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(agg));
        } catch {}
      },
      error: (err) => setError(err.message),
    });
  }

  function clearAll() {
    setRows([]);
    setQuery("");
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }

  // búsqueda por tokens (orden libre, sin acentos, multicampo)
  const tokens = useMemo(() => {
    const q = norm(query);
    return q ? q.split(" ").filter(Boolean) : [];
  }, [query]);

  const filtered = useMemo(() => {
    if (!tokens.length) return rows;
    return rows.filter((r) =>
      tokens.every(
        (t) => r._kName.includes(t) || r._kCode.includes(t) || r._kBarcode.includes(t)
      )
    );
  }, [rows, tokens]);

  return (
    <div className="space-y-3">
      <input
        // usar text para evitar sugerencias del SO y del navegador
        type="text"
        inputMode="search"
        placeholder="🔎 Buscar por nombre, código o barcode… (p. ej. 'keto bastoni' o '779…')"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="none"
        spellCheck={false}
        enterKeyHint="search"
        disabled={!rows.length}
      />

      <div className="flex items-center gap-2">
        <label className="block">
          <span className="text-sm text-neutral-600">
            {rows.length ? "Reemplazar CSV" : "Subir CSV de precios"}
          </span>
          <input type="file" accept=".csv" onChange={handleFile} className="mt-1 block w-full text-sm" />
        </label>
        {rows.length > 0 && (
          <button
            onClick={clearAll}
            className="h-9 px-3 rounded-md border border-neutral-300 text-sm hover:bg-neutral-50"
          >
            Limpiar
          </button>
        )}
      </div>

      {error && <p className="text-sm text-red-600">Error al leer el archivo: {error}</p>}

      {rows.length > 0 && (
        <div className="rounded-lg border border-neutral-200 overflow-hidden">
          <div className="p-3 text-sm text-neutral-600">
            {filtered.length} productos (precio MÁXIMO por producto) — mostrando 50
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50">
                <tr className="text-left">
                  <th className="px-3 py-2">Nombre</th>
                  <th className="px-3 py-2">Precio</th>
                  <th className="px-3 py-2">Última actualización</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 50).map((r, i) => (
                  <tr key={i} className="border-t border-neutral-200">
                    <td className="px-3 py-2">{r.name || "—"}</td>
                    <td className="px-3 py-2 whitespace-nowrap font-medium">
                      {fmt(toNum(r.price))}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">{r.lastUpdated || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length > 50 && (
            <div className="p-3 text-xs text-neutral-500">
              Mostrando 50 de {filtered.length}. Usa la búsqueda para afinar.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Boxes,
  Truck,
  FileText,
  CheckSquare,
  Clock,
  DollarSign,
  Tag as TagIcon, // ← import del ícono
} from "lucide-react";

const items = [
  { href: "/", label: "Dashboard", Icon: Home },
  { href: "/ventas-stock", label: "Stock", Icon: Boxes },
  { href: "/pedidos", label: "Pedidos", Icon: Truck },
  { href: "/facturas", label: "Facturas", Icon: FileText },
  { href: "/tareas", label: "Tareas!!!", Icon: CheckSquare },
  { href: "/vencimientos", label: "Vtos", Icon: Clock },
  { href: "/precios", label: "Precios", Icon: DollarSign },
  { href: "/labels", label: "Etiquetas", Icon: TagIcon }, // ← nuevo item
] as const;

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegación inferior"
      className="
        fixed inset-x-0 bottom-0 z-50
        border-t border-neutral-200 dark:border-neutral-800
        bg-white/85 dark:bg-neutral-950/80
        backdrop-blur-md
        supports-[backdrop-filter]:bg-white/60
        dark:supports-[backdrop-filter]:bg-neutral-950/60
        pb-[env(safe-area-inset-bottom)]
      "
    >
      <ul className="mx-auto max-w-md grid grid-cols-8">{/* ahora 8 items */}
        {items.map(({ href, label, Icon }) => {
          const active = pathname === href;
          const base =
            "flex-1 flex flex-col items-center justify-center gap-1 py-2 text-[11px] sm:text-xs transition-colors";
          const colors = active
            ? "text-emerald-600 dark:text-emerald-400"
            : "text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white";
          const iconCls = active ? "h-5 w-5 stroke-2" : "h-5 w-5 opacity-80";
          const labelCls = active ? "font-medium leading-none" : "leading-none";

          return (
            <li key={href} className="flex">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`${base} ${colors}`}
              >
                <Icon aria-hidden="true" className={iconCls} />
                <span className={labelCls}>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

// src/components/Header.tsx
export default function Header({ title = "GeStock" }: { title?: string }) {
  return (
    <header className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-neutral-200">
      <div className="mx-auto max-w-md px-4 py-3">
        <h1 className="text-lg font-semibold">{title}</h1>
      </div>
    </header>
  );
}
import "./globals.css";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen">
        <div className="mx-auto max-w-md min-h-screen flex flex-col">
<Header />

          <main className="flex-1 pb-16 px-4 pt-4">{children}</main>
          <BottomNav />
        </div>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";
import "./foundation.css";

export const metadata: Metadata = {
  title: "InstaBook",
  description: "Criação, planejamento e publicação de conteúdo para Instagram com IA.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}

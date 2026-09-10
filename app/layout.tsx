import "./globals.css";
import { TechField } from "@/components/tech-field";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-wc-bg">
        <TechField />
        {children}
      </body>
    </html>
  );
}
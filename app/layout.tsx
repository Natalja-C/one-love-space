import type { Metadata } from "next";
import { Figtree, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import SiteNavigation from "./components/SiteNavigation";

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
});
const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["cyrillic", "latin"],
  weight: ["300", "500"],
});

export const metadata: Metadata = {
  title: "One Love Space",
  description:
    "Платформа для медитации, самонаблюдения и осознанной заботы о себе.",
};

export default function RootLayout({
  children,
}: LayoutProps<"/">) {
  return (
<html
  lang="ru"
  className={`${figtree.variable} ${cormorant.variable} h-full antialiased`}
>
<body>
  <SiteNavigation />
  {children}
</body>
    </html>
  );
}
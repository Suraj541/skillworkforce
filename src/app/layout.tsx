import "./globals.css";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "SkillForge AI", description: "Visual skill management and workflow composition." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }

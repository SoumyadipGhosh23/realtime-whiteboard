"use client";
import dynamic from "next/dynamic";
import { useTheme } from "next-themes";

const TldrawEditor = dynamic(() => import("../components/TldrawEditor"), {
  loading: () => <div>Loading editor...</div>,
  ssr: false,
});

export default function Home() {
  const { theme } = useTheme();
  return (
    <div>
      <TldrawEditor key={theme} isDarkMode={theme === "dark"} />
    </div>
  );
}

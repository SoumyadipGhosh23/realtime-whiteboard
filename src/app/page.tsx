import dynamic from "next/dynamic";

const TldrawEditor = dynamic(() => import("../components/TldrawEditor"), {
  loading: () => <div>Loading editor...</div>,
});

export default function Home() {
  return (
    <div>
      <TldrawEditor />
    </div>
  );
}

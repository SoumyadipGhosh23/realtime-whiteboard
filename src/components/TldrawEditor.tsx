'use client';

import { Tldraw } from "tldraw";
import "tldraw/tldraw.css";

export default function TldrawEditor() {
  return (
    <div style={{ position: "fixed", inset: 0, marginTop: '3rem' }}>
      <Tldraw />
    </div>
  );
}

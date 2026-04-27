"use client";

import dynamic from "next/dynamic";

// Dynamic import with ssr:false keeps the server-rendered layout clean.
// ScrollProgressBar uses window + useState — it must never run on the server.
const ScrollProgressBar = dynamic(
  () =>
    import("@/components/ui/animations").then((m) => ({
      default: m.ScrollProgressBar,
    })),
  { ssr: false }
);

export function ClientScrollBar() {
  return <ScrollProgressBar />;
}

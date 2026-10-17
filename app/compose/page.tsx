import { Suspense } from "react";
import type { Metadata } from "next";

import { Composer } from "./composer";

export const metadata: Metadata = { title: "Composer · Site Rebuilder" };

export default function ComposePage() {
  // useSearchParams (for ?site=) needs a Suspense boundary.
  return (
    <Suspense>
      <Composer />
    </Suspense>
  );
}

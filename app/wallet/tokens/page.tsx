"use client";

import PiePage from "@/app/_shared/page";
import { Suspense } from "react";

export default function WalletTokensPage() {
  return (
    <Suspense fallback={<></>}>
      <PiePage />
    </Suspense>
  );
}

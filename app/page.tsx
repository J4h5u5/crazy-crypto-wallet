"use client";

import PiePage from "@/app/_shared/page";
import { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import { loadStoredWallet } from "@/lib/wallet/crypto";

function HomeGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  useEffect(() => {
    const wallet = loadStoredWallet();
    if (wallet) {
      router.replace("/wallet/unlock");
    }
  }, [router]);
  return <>{children}</>;
}

export default function HomePage() {
  return (
    <Suspense fallback={<></>}>
      <HomeGuard>
        <PiePage />
      </HomeGuard>
    </Suspense>
  );
}

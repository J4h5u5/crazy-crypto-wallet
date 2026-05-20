"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { PieTelegramRoot } from "@swarm.ing/pieui";
import "@/piecomponents/registry";
import { usePathname, useSearchParams } from "next/navigation";

export default function PiePage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();

  useEffect(() => {
    const webApp = window.Telegram?.WebApp;
    webApp?.expand();
    webApp?.disableVerticalSwipes?.();
  }, []);

  useEffect(() => {
    const backButton = window.Telegram?.WebApp?.BackButton;
    if (!backButton) return;

    const slashCount = (pathname.match(/\//g) || []).length;
    const historyState = window.history.state as { idx?: number } | null;
    const hasHistory =
      typeof historyState?.idx === "number"
        ? historyState.idx > 0
        : window.history.length > 1;
    const showBack = slashCount > 1 && hasHistory;

    const handleBack = () => router.back();

    if (showBack) {
      backButton.onClick(handleBack);
      backButton.show();
    } else {
      backButton.offClick(handleBack);
      backButton.hide();
    }

    return () => {
      backButton.offClick(handleBack);
      backButton.hide();
    };
  }, [router, pathname]);

  return (
    <PieTelegramRoot
      location={{ pathname, search }}
      config={{
        apiServer: process.env.PIE_API_SERVER!,
        centrifugeServer: process.env.PIE_CENTRIFUGE_SERVER!,
        enableRenderingLog: true,
        pageProcessor: "telegram",
      }}
      onNavigate={(url) => router.push(url)}
      fallback={<></>}
    />
  );
}

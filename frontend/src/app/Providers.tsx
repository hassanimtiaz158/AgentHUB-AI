"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/layout";
import { ProjectStoreProvider } from "@/lib/store";
import { DemoProvider } from "@/lib/demo-player";
import { ToastProvider } from "@/components/Toast";
import { ThemeProvider } from "@/app/ThemeProvider";

function DemoAndToast({ children }: { children: React.ReactNode }) {
  const params = useSearchParams();
  const isDemo = params.get("demo") != null;
  return (
    <DemoProvider isDemo={isDemo}>
      <ToastProvider>{children}</ToastProvider>
    </DemoProvider>
  );
}

function DemoAndToastSuspended({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={children}>
      <DemoAndToast>{children}</DemoAndToast>
    </Suspense>
  );
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <ProjectStoreProvider>
        <DemoAndToastSuspended>
          <AppShell>{children}</AppShell>
        </DemoAndToastSuspended>
      </ProjectStoreProvider>
    </ThemeProvider>
  );
}

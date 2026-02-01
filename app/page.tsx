"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to dashboard page on load
    router.push("/dashboard");
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">Orbit SDR</h1>
        <p className="text-sm text-gray-500">Grok-powered Sales Development Representative system</p>
      </div>
    </div>
  );
}

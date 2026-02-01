'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to chat page on load
    router.push('/chat');
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">AI RAG Assistant</h1>
        <p className="text-muted-foreground mt-2">Redirecting...</p>
      </div>
    </div>
  );
}

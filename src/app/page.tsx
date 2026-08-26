'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { demoStorage } from '@/lib/supabase';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const user = demoStorage.getUser();
    if (user && user.ship_id) {
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen theme-login flex items-center justify-center text-cyan-300 font-mono text-sm">
      Initializing BlueGuard Maritime System...
    </div>
  );
}

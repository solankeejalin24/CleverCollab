'use client';

import { useEffect } from 'react';
import { useClerk } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

export default function SignOutPage() {
  const { signOut } = useClerk();
  const router = useRouter();
  
  useEffect(() => {
    signOut().then(() => {
      router.push('/');
    });
  }, [signOut, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-xl font-semibold mb-2">Signing out...</h1>
        <p className="text-muted-foreground">Please wait while we sign you out.</p>
      </div>
    </div>
  );
} 
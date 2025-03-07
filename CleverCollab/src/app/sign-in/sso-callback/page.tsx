'use client';

import { AuthenticateWithRedirectCallback } from '@clerk/nextjs';

export default function SSOCallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <AuthenticateWithRedirectCallback />
    </div>
  );
} 
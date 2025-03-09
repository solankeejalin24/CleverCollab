"use client"

import { AuthenticateWithRedirectCallback } from "@clerk/nextjs"

export default function SSOCallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-pulse text-muted-foreground">Completing authentication...</div>
      <AuthenticateWithRedirectCallback />
    </div>
  )
}


'use client';

import { SignIn } from "@clerk/nextjs";
import { useTheme } from "next-themes";

export default function SignInPage() {
  const { theme } = useTheme();
  
  return (
    <div className="flex items-center justify-center min-h-screen py-12">
      <SignIn
        appearance={{
          elements: {
            formButtonPrimary: 
              "bg-primary text-primary-foreground hover:bg-primary/90",
            card: "bg-background border border-border shadow-sm",
          }
        }}
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
      />
    </div>
  );
} 
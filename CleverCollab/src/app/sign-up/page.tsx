'use client';

import { SignUp } from "@clerk/nextjs";
import { useTheme } from "next-themes";

export default function SignUpPage() {
  const { theme } = useTheme();
  
  return (
    <div className="flex items-center justify-center min-h-screen py-12">
      <SignUp
        appearance={{
          elements: {
            formButtonPrimary: 
              "bg-primary text-primary-foreground hover:bg-primary/90",
            card: "bg-background border border-border shadow-sm",
          }
        }}
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
      />
    </div>
  );
} 
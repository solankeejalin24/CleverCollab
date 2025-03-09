"use client"

import { SignIn } from "@clerk/nextjs"
import { useTheme } from "@/components/ThemeProvider"
import { Logo } from "@/components/Logo"

export default function SignInPage() {
  const { theme } = useTheme()

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] py-12">
      <div className="mb-8">
        <Logo size="large" />
      </div>

      <div className="w-full max-w-md px-4">
        <div className="relative">
          {/* Decorative background elements */}
          <div className="absolute -z-10 inset-0 bg-gradient-to-br from-primary/10 via-background to-secondary/10 rounded-xl blur-xl opacity-50"></div>

          <SignIn
            appearance={{
              elements: {
                formButtonPrimary: "bg-primary text-primary-foreground hover:bg-primary/90",
                card: "bg-background border border-border shadow-sm",
                headerTitle: "text-foreground",
                headerSubtitle: "text-muted-foreground",
                formFieldLabel: "text-foreground",
                formFieldInput: "bg-background border-input text-foreground",
                footerActionLink: "text-primary hover:text-primary/90",
                identityPreviewText: "text-foreground",
                identityPreviewEditButton: "text-primary hover:text-primary/90",
                formFieldAction: "text-primary hover:text-primary/90",
                formFieldErrorText: "text-destructive",
                socialButtonsBlockButton: "border-border text-foreground hover:bg-muted",
                socialButtonsBlockButtonText: "text-foreground",
                otpCodeFieldInput: "bg-background border-input text-foreground",
                dividerLine: "bg-border",
                dividerText: "text-muted-foreground",
              },
              layout: {
                socialButtonsVariant: "iconButton",
                socialButtonsPlacement: "bottom",
              },
              variables: {
                borderRadius: "var(--radius)",
                colorPrimary: "#0091FF", // Using a hex color instead of HSL variable
                colorBackground: "transparent",
                fontFamily: "var(--font-sans)",
                fontSize: "16px",
              },
            }}
            routing="path"
            path="/sign-in"
            signUpUrl="/sign-up"
          />
        </div>
      </div>
    </div>
  )
} 
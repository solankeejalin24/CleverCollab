import Image from "next/image"
import Link from "next/link"

interface LogoProps {
  className?: string
  size?: "small" | "large"
}

export function Logo({ className = "", size = "small" }: LogoProps) {
  const dimensions = size === "small" ? { width: 120, height: 30 } : { width: 240, height: 60 }

  return (
    <Link href="/" className={className}>
      <Image
        src="/lib/logo-transparent-png.png"
        alt="Clever Collab"
        {...dimensions}
        className="dark:brightness-200"
        priority
      />
    </Link>
  )
}


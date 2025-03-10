import Image from "next/image"
import Link from "next/link"
import logo from "./../../public/logo.svg"

interface LogoProps {
  className?: string
  size?: "small" | "large"
}

export function Logo({ className = "", size = "small" }: LogoProps) {
  const dimensions = size === "small" ? { width: 240, height: 30 } : { width: 650, height: 60 }

  return (
    <Link href="/" className={className}>
      <Image
        src={logo}
        alt="Clever Collab"
        {...dimensions}
        // className="dark:brightness-200"
        priority
      />
    </Link>
  )
}


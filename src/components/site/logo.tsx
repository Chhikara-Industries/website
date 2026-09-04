import Image from "next/image"

import { cn } from "@/lib/utils"

export function Logo({
  className,
  imageClassName,
}: {
  className?: string
  imageClassName?: string
}) {
  return (
    <span className={cn("inline-flex items-center", className)}>
      <Image
        src="/logo.png"
        alt="Chhikara Industries"
        width={160}
        height={40}
        priority
        className={cn("h-8 w-auto object-contain", imageClassName)}
      />
    </span>
  )
}

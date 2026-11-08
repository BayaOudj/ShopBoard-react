import { useState } from 'react'
import type { ImgHTMLAttributes } from 'react'

export function SafeImage({
  src,
  alt = '',
  className,
  ...props
}: ImgHTMLAttributes<HTMLImageElement>) {
  const [failed, setFailed] = useState<string>()
  if (!src || failed === src) {
    return (
      <div
        className={className}
        role={alt ? 'img' : undefined}
        aria-label={alt || undefined}
        aria-hidden={!alt || undefined}
      >
        Photo unavailable
      </div>
    )
  }
  return (
    <img
      {...props}
      className={className}
      src={src}
      alt={alt}
      onError={() => setFailed(src)}
    />
  )
}

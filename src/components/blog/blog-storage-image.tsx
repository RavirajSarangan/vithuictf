import Image from "next/image";
import { isStorageUrl } from "@/lib/storage/public-url";

interface BlogStorageImageProps {
  src: string;
  alt: string;
  fill?: boolean;
  priority?: boolean;
  className?: string;
  sizes?: string;
}

/** Blog images from Supabase are already optimized WebP — skip Next.js optimizer. */
export function BlogStorageImage({
  src,
  alt,
  fill,
  priority,
  className,
  sizes,
}: BlogStorageImageProps) {
  return (
    <Image
      src={src}
      alt={alt}
      fill={fill}
      priority={priority}
      className={className}
      sizes={sizes}
      unoptimized={isStorageUrl(src)}
    />
  );
}

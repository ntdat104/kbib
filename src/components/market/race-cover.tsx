"use client";

import Image, { type ImageLoader } from "next/image";
import { racePhoto } from "@/lib/images";
import type { RaceType } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Requests exactly the rendered width from Unsplash's imgix CDN; other URLs pass through. */
const unsplashLoader: ImageLoader = ({ src, width, quality }) =>
  src.startsWith("https://images.unsplash.com/")
    ? `${src}?w=${width}&q=${quality ?? 70}&auto=format&fit=crop`
    : src;

export function RaceCover({ type, seed, label, coverUrl, className, priority, sizes = "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" }: {
  type: RaceType;
  seed: string;
  label?: string;
  coverUrl?: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
}) {
  const ph = racePhoto(type, seed, coverUrl);
  return (
    <Image
      loader={unsplashLoader}
      src={ph.src}
      alt={label ?? ph.alt}
      fill
      sizes={sizes}
      priority={priority}
      className={cn("bg-brand-100 object-cover", className)}
    />
  );
}

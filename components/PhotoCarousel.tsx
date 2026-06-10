"use client";

import { useState } from "react";
import Image from "next/image";

interface PhotoCarouselProps {
  photos: string[];
  title: string;
}

export default function PhotoCarousel({ photos, title }: PhotoCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (!photos || photos.length === 0) {
    return (
      <div className="aspect-square w-full rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12">
          <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-gray-50 border border-gray-200">
        <Image
          src={photos[activeIndex]}
          alt={`${title} - image ${activeIndex + 1}`}
          fill
          className="object-cover"
          priority
        />
      </div>

      {/* Thumbnails */}
      {photos.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {photos.map((photo, index) => (
            <button
              key={index}
              onClick={() => setActiveIndex(index)}
              className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                activeIndex === index ? "border-brand-green ring-2 ring-brand-green/20" : "border-transparent opacity-70 hover:opacity-100"
              }`}
            >
              <Image src={photo} alt="" fill className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
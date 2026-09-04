'use client';

import { useState } from 'react';

interface PropertyGalleryProps {
  images: { imageUrl: string; sortOrder: number }[];
  title: string;
}

export function PropertyGallery({ images, title }: PropertyGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="overflow-hidden rounded-2xl bg-slate-100 p-2 shadow-card">
        <div className="aspect-video w-full flex items-center justify-center bg-slate-50 rounded-xl">
          <svg className="h-16 w-16 text-slate-300" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 21h18M3.75 3h16.5M4.5 3v18m15-18v18" />
          </svg>
        </div>
      </div>
    );
  }

  const activeImage = images[activeIndex] ?? images[0];

  function handlePrev() {
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  }

  function handleNext() {
    setActiveIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-white p-2 shadow-card space-y-2">
      {/* Ảnh chính */}
      <div className="group relative aspect-video w-full overflow-hidden rounded-xl bg-slate-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={activeImage.imageUrl}
          alt={`${title} - ảnh ${activeIndex + 1}`}
          decoding="async"
          className="h-full w-full object-cover transition-all duration-200"
          style={{ willChange: 'transform', transform: 'translateZ(0)' }}
        />

        {/* Nút Previous / Next khi có nhiều hơn 1 ảnh */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Ảnh trước"
              onClick={handlePrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm opacity-0 transition-opacity duration-150 group-hover:opacity-100 hover:bg-black/70 active:scale-95"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
            <button
              type="button"
              aria-label="Ảnh tiếp theo"
              onClick={handleNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm opacity-0 transition-opacity duration-150 group-hover:opacity-100 hover:bg-black/70 active:scale-95"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </>
        )}

        {/* Chỉ số ảnh badge */}
        {images.length > 1 && (
          <div className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 21h18M3.75 3h16.5M4.5 3v18m15-18v18" />
            </svg>
            <span>{activeIndex + 1} / {images.length}</span>
          </div>
        )}
      </div>

      {/* Dải thumbnail tương tác */}
      {images.length > 1 && (
        <div className="grid grid-cols-5 gap-1.5">
          {images.slice(0, 5).map((img, idx) => (
            <button
              key={img.imageUrl}
              type="button"
              onClick={() => setActiveIndex(idx)}
              className={`relative aspect-square overflow-hidden rounded-lg transition-all active:scale-95 ${
                idx === activeIndex
                  ? 'ring-2 ring-brand ring-offset-1 opacity-100'
                  : 'opacity-70 hover:opacity-100'
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.imageUrl}
                alt=""
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover"
              />
              {idx === 4 && images.length > 5 && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-xs font-bold text-white">
                  +{images.length - 5}
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

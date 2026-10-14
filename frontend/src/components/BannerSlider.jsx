import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";

import banner1 from "../assets/banner-1-fr.jpg";
import banner2 from "../assets/banner-2-fr.jpg";
import banner3 from "../assets/banner-3-en.jpg";

const banners = [
  { id: 1, img: banner3, alt: "Banner 1", link: "/collection" },
  { id: 2, img: banner2, alt: "Banner 2", link: "/collection" },
  { id: 3, img: banner1, alt: "Banner 3", link: "/collection" },
];

export default function BannerSlider() {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // Défilement automatique (toutes les 4 secondes)
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % banners.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [isPaused]);

  const prevSlide = () => {
    setCurrent((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setCurrent((prev) => (prev + 1) % banners.length);
  };

  // Swipe mobile
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 50) {
      if (diff > 0) nextSlide();
      else prevSlide();
    }
  };

  return (
    <section
      className="relative w-full overflow-hidden select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="max-w-[1920px] mx-auto relative overflow-hidden">
        {/* Conteneur du carrousel */}
        <div
          className="flex transition-transform duration-700 ease-out"
          style={{ transform: `translateX(-${current * 100}%)` }}
        >
          {banners.map((item, index) => (
            <div key={item.id} className="w-full min-w-full shrink-0">
              <Link to={item.link} className="block w-full">
                {/* Pas de max-h ni object-cover : l'image garde son ratio */}
                <img
                  src={item.img}
                  alt={item.alt}
                  className="block w-full h-auto"
                  draggable={false}
                  loading={index === 0 ? "eager" : "lazy"}
                />
              </Link>
            </div>
          ))}
        </div>

        {/* Flèches (tablette et desktop) */}
        <button
          type="button"
          onClick={prevSlide}
          aria-label="Previous slide"
          className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/30 hover:bg-black/60 text-white items-center justify-center backdrop-blur-sm transition-all hover:scale-105 active:scale-95 z-10"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <button
          type="button"
          onClick={nextSlide}
          aria-label="Next slide"
          className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/30 hover:bg-black/60 text-white items-center justify-center backdrop-blur-sm transition-all hover:scale-105 active:scale-95 z-10"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* Puces */}
        <div className="absolute bottom-3 sm:bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
          {banners.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setCurrent(index)}
              aria-label={`Go to slide ${index + 1}`}
              className={`h-2 sm:h-2.5 rounded-full transition-all duration-300 ${
                current === index
                  ? "w-7 sm:w-9 bg-[#e63946] shadow-md"
                  : "w-2 sm:w-2.5 bg-white/70 hover:bg-white"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
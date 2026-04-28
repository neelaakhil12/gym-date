import React from "react";
import Image from "next/image";

interface CityCardProps {
  city: {
    name: string;
    image: string;
    is_coming_soon?: boolean;
  };
}

const CityCard: React.FC<CityCardProps> = ({ city }) => {
  return (
    <div className={`relative h-64 rounded-2xl overflow-hidden group ${city.is_coming_soon ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
      {/* City Image - blurred if coming soon */}
      <Image
        src={city.image}
        alt={city.name}
        fill
        className={`object-cover transition-transform duration-700 group-hover:scale-110 ${city.is_coming_soon ? 'blur-sm scale-105' : ''}`}
      />

      {/* Standard gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

      {/* Coming Soon overlay */}
      {city.is_coming_soon && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px]">
          <span className="bg-white/10 border border-white/30 text-white text-xs font-black uppercase tracking-[0.25em] px-4 py-2 rounded-full backdrop-blur-sm mb-2 animate-pulse">
            Coming Soon
          </span>
        </div>
      )}

      {/* City Name */}
      <div className="absolute bottom-6 left-6">
        <h4 className="text-white text-xl font-bold">{city.name}</h4>
        {!city.is_coming_soon && (
          <div className="h-1 w-0 bg-primary transition-all duration-300 group-hover:w-full mt-1" />
        )}
      </div>
    </div>
  );
};

export default CityCard;

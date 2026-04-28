import React from "react";
import Image from "next/image";

interface CityCardProps {
  city: {
    name: string;
    image: string;
  };
}

const CityCard: React.FC<CityCardProps> = ({ city }) => {
  return (
    <div className="relative h-64 rounded-2xl overflow-hidden cursor-pointer group">
      <Image
        src={city.image}
        alt={city.name}
        fill
        className="object-cover transition-transform duration-700 group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      <div className="absolute bottom-6 left-6">
        <h4 className="text-white text-xl font-bold">{city.name}</h4>
        <div className="h-1 w-0 bg-primary transition-all duration-300 group-hover:w-full mt-1" />
      </div>
    </div>
  );
};

export default CityCard;

import React from "react";
import Image from "next/image";
import { Star, MapPin, Percent } from "lucide-react";

import Link from "next/link";

interface GymCardProps {
  gym: any;
  onBuyNow?: (gym: any) => void;
}

const GymCard: React.FC<GymCardProps> = ({ gym, onBuyNow }) => {
  return (
    <div className="relative h-full">
      <Link href={`/gym/${gym.id}`} className="block h-full">
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 card-hover group cursor-pointer h-full flex flex-col">
          {/* Image Section */}
          <div className="relative h-56 w-full bg-gray-100 flex-shrink-0">
            <img
              src={gym.image || "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=800"}
              alt={gym.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            
            <div className="absolute top-4 right-4 flex flex-col gap-2 items-end">
              <span className="bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-secondary shadow-sm">
                ₹{gym.price_per_day} / DAY
              </span>
              <span className={(gym.status || "").toLowerCase() === "open" 
                ? "bg-green-500 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm" 
                : "bg-red-500 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm"
              }>
                {gym.status || "Closed"}
              </span>
            </div>
          </div>

          {/* Content Section */}
          <div className="p-5 flex-grow flex flex-col">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-secondary group-hover:text-primary transition-colors line-clamp-1">
                  {gym.name}
                </h3>
                {gym.has_offer && (
                  <div className="bg-primary text-white text-[8px] font-black px-1.5 py-0.5 rounded shadow-sm flex items-center space-x-1 shrink-0">
                    <Percent className="w-2 h-2" />
                    <span>{gym.offer_percentage}% OFF</span>
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-1 bg-yellow-50 px-2 py-0.5 rounded-lg shrink-0">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span className="text-xs font-bold text-yellow-700">{gym.rating}</span>
              </div>
            </div>

            <div className="flex items-center space-x-1 text-gray-500 mb-4">
              <MapPin className="h-4 w-4" />
              <span className="text-xs truncate">{gym.location}</span>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              {(gym.amenities || gym.tags || []).slice(0, 3).map((tag: string) => (
                <span
                  key={tag}
                  className="text-[10px] font-semibold text-gray-400 border border-gray-200 px-2 py-0.5 rounded-md"
                >
                  {tag}
                </span>
              ))}
            </div>

            <div className="mt-auto">
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onBuyNow?.(gym);
                }}
                className="w-full py-3 bg-secondary text-white rounded-xl font-black text-xs hover:bg-primary transition-all shadow-lg shadow-secondary/10"
              >
                BUY NOW
              </button>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default GymCard;

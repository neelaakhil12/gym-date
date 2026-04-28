import React from "react";
import { CircleCheck } from "lucide-react";

interface PricingCardProps {
  plan: {
    name: string;
    price: string;
    features: string[];
    buttonText: string;
    popular: boolean;
  };
}

const PricingCard: React.FC<PricingCardProps> = ({ plan }) => {
  return (
    <div
      className={`relative p-8 rounded-3xl transition-all duration-300 ${
        plan.popular
          ? "bg-secondary text-white shadow-2xl scale-105 z-10"
          : "bg-white text-secondary border border-gray-100 hover:border-primary/20 hover:shadow-lg"
      }`}
    >
      {plan.popular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-white px-4 py-1 rounded-full text-xs font-bold tracking-wider uppercase whitespace-nowrap">
          Most Popular
        </div>
      )}

      <div className="mb-8">
        <h3 className={`text-xl font-bold mb-2 ${plan.popular ? "text-white" : "text-secondary"}`}>
          {plan.name}
        </h3>
        <div className="flex items-baseline">
          <span className="text-4xl font-black">{plan.price}</span>
          <span className={`ml-2 text-sm ${plan.popular ? "text-gray-400" : "text-gray-500"}`}>
            / per pack
          </span>
        </div>
      </div>

      <ul className="space-y-4 mb-8">
        {plan.features.map((feature, idx) => (
          <li key={idx} className="flex items-center space-x-3">
            <div className={`p-1 rounded-full ${plan.popular ? "bg-primary" : "bg-primary/10"}`}>
              <CircleCheck className={`h-3 w-3 ${plan.popular ? "text-white" : "text-primary"}`} />
            </div>
            <span className={`text-sm ${plan.popular ? "text-gray-300" : "text-gray-600"}`}>
              {feature}
            </span>
          </li>
        ))}
      </ul>

      <button
        className={`w-full py-4 rounded-xl text-sm font-bold transition-all transform active:scale-95 ${
          plan.popular
            ? "bg-primary text-white hover:bg-primary-dark"
            : "bg-gray-50 text-secondary border border-gray-100 hover:bg-primary hover:text-white hover:border-primary"
        }`}
      >
        {plan.buttonText}
      </button>
    </div>
  );
};

export default PricingCard;

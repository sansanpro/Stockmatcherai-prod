import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

import showcaseSwipe from "@/assets/showcase-swipe-stocks.png";
import showcaseAiMatch from "@/assets/showcase-ai-match.png";
import showcaseInvest from "@/assets/showcase-invest-smartly.png";
import showcasePersonal from "@/assets/showcase-personal-investor.png";
import showcaseMatches from "@/assets/showcase-personalized-matches.png";
import showcaseInsights from "@/assets/showcase-realtime-insights.png";

const screenshots = [
  { src: showcaseSwipe, alt: "Swipe through stocks like a dating app" },
  { src: showcaseAiMatch, alt: "AI-powered stock matching" },
  { src: showcaseInvest, alt: "Invest smartly with AI assistant" },
  { src: showcasePersonal, alt: "Your personal investor dashboard" },
  { src: showcaseMatches, alt: "Personalized stock matches with details" },
  { src: showcaseInsights, alt: "Real-time stock insights and data" },
];

const ScreenshotShowcase = () => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const scrollAmount = 320;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <section className="py-20 md:py-32 bg-background overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            See It In Action
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            A glimpse of your personalized stock matching experience
          </p>
        </div>

        {/* Navigation buttons */}
        <div className="hidden md:flex justify-end gap-2 mb-6 max-w-7xl mx-auto">
          <Button
            variant="outline"
            size="icon"
            onClick={() => scroll("left")}
            className="rounded-full"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => scroll("right")}
            className="rounded-full"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        {/* Scrollable gallery */}
        <div
          ref={scrollRef}
          className="flex gap-6 overflow-x-auto pb-6 snap-x snap-mandatory scrollbar-hide"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {screenshots.map((shot, i) => (
            <div
              key={i}
              className="flex-shrink-0 snap-center first:ml-4 last:mr-4 md:first:ml-0 md:last:mr-0"
            >
              <div className="w-[280px] md:w-[320px] rounded-2xl overflow-hidden shadow-2xl shadow-primary/10 border border-border/50 transition-transform hover:scale-[1.02]">
                <img
                  src={shot.src}
                  alt={shot.alt}
                  className="w-full h-auto"
                  loading="lazy"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ScreenshotShowcase;

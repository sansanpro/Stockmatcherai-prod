import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

import showcaseHook from "@/assets/showcase-invest-in-what-you-believe.jpg";
import showcaseCauses from "@/assets/showcase-pick-your-causes.jpg";
import showcaseQuestion from "@/assets/showcase-one-question-at-a-time.jpg";
import showcaseReveal from "@/assets/showcase-see-who-is-working.jpg";
import showcaseCard from "@/assets/showcase-story-first-card.jpg";
import showcaseLikes from "@/assets/showcase-keep-your-likes.jpg";
import showcaseAskAi from "@/assets/showcase-ask-ai.jpg";

// Made from the real app by scripts/make-screenshots.mjs
const screenshots = [
  { src: showcaseHook, alt: "StockMatcherAI: invest in what you believe in" },
  { src: showcaseCauses, alt: "Pick the causes you care about" },
  { src: showcaseQuestion, alt: "Onboarding asks simple questions, one at a time" },
  { src: showcaseReveal, alt: "See how many companies are working on your causes" },
  { src: showcaseCard, alt: "A company card: its story, proof with a source, things to know and the numbers" },
  { src: showcaseLikes, alt: "Your likes, with the causes each company works on" },
  { src: showcaseAskAi, alt: "Ask AI about any company or investing term" },
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

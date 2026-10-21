import { useState } from 'react';
import { Share2 } from 'lucide-react';
import { toast } from 'sonner';
import type { CauseInfo } from '@/lib/matchFeed';
import { track } from '@/lib/analytics';

const SITE_URL = 'https://stockmatcherai.com';

// "I invest in what I believe in" card from the reveal, shareable as text and a link
const ValuesCard = ({ causes }: { causes: CauseInfo[] }) => {
  const [sharing, setSharing] = useState(false);
  const text = `I invest in what I believe in: ${causes.map(c => c.label).join(' · ')}. Find companies that match your values on StockMatcher.`;

  const share = async () => {
    setSharing(true);
    try {
      if (navigator.share) {
        await navigator.share({ title: 'What I invest in', text, url: SITE_URL });
        track('values_card_shared', { method: 'share_sheet', causes: causes.map(c => c.id) });
      } else {
        await navigator.clipboard.writeText(`${text} ${SITE_URL}`);
        toast.success('Copied. Paste it anywhere to share.');
        track('values_card_shared', { method: 'clipboard', causes: causes.map(c => c.id) });
      }
    } catch (error) {
      // Closing the share sheet isn't an error worth showing
      if ((error as Error)?.name !== 'AbortError') toast.error("Couldn't open sharing on this device.");
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="rounded-3xl p-5 bg-gradient-to-br from-primary via-purple-600 to-pink-500 shadow-2xl shadow-primary/30 text-white">
      <p className="text-xs uppercase tracking-widest text-white/70 font-semibold">My values card</p>
      <p className="text-xl font-bold mt-2 leading-snug">I invest in what I believe in:</p>
      <div className="flex flex-wrap gap-2 mt-3">
        {causes.map(c => (
          <span key={c.id} className="px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm text-sm font-semibold">
            <span aria-hidden>{c.icon}</span> {c.label}
          </span>
        ))}
      </div>
      <div className="flex items-center justify-between mt-5">
        <span className="text-sm font-bold text-white/80">StockMatcher</span>
        <button
          type="button"
          onClick={share}
          disabled={sharing}
          className="min-h-[44px] px-4 rounded-full bg-white text-purple-700 font-semibold text-sm flex items-center gap-2 active:scale-95 transition-transform disabled:opacity-60"
        >
          <Share2 className="w-4 h-4" /> Share
        </button>
      </div>
    </div>
  );
};

export default ValuesCard;

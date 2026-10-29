import type { ReactNode } from 'react';
import { BadgeCheck, Scale, AlertTriangle } from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import CompanyLogo from '@/components/values/CompanyLogo';
import Disclaimer from '@/components/values/Disclaimer';
import { RISK_WORDS } from '@/components/values/KeyNumbers';
import type { StockRecommendation } from '@/types/stock-matcher';

interface CompareSheetProps {
  pair: [StockRecommendation, StockRecommendation] | null;
  onClose: () => void;
}

// Premium: two liked companies side by side, one row per topic, so proof, things to know and
// cautions line up and carry equal weight. No verdict and no "winner": the user decides.
const Row = ({ title, icon, tone, children }: { title: string; icon?: ReactNode; tone?: string; children: [ReactNode, ReactNode] }) => (
  <section className="border-t border-line pt-3">
    <h3 className={`text-[0.6875rem] font-semibold uppercase tracking-wide flex items-center gap-1 mb-2 ${tone ?? 'text-ink-soft'}`}>{icon} {title}</h3>
    <div className="grid grid-cols-2 gap-3 text-sm text-ink leading-snug">
      <div className="min-w-0">{children[0]}</div>
      <div className="min-w-0">{children[1]}</div>
    </div>
  </section>
);

const none = (text: string) => <p className="text-ink-soft">{text}</p>;

const CompareSheet = ({ pair, onClose }: CompareSheetProps) => {
  const both = <T,>(f: (s: StockRecommendation) => T): [T, T] => (pair ? [f(pair[0]), f(pair[1])] : [null, null] as [T, T]);

  return (
    <Sheet open={!!pair} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent side="bottom" className="h-[92vh] p-0 rounded-t-3xl bg-surface flex flex-col">
        <div className="px-5 pt-5 pb-3 border-b border-line">
          <SheetTitle className="text-lg font-bold text-ink">Side by side</SheetTitle>
          <SheetDescription className="text-xs text-ink-soft">The same facts for both, so you can see where they differ.</SheetDescription>
        </div>
        {pair && (
          <div className="flex-1 overflow-y-auto px-5 pb-6 space-y-3">
            <div className="grid grid-cols-2 gap-3 pt-4 pb-1 sticky top-0 bg-surface z-10">
              {pair.map(s => (
                <div key={s.ticker} className="min-w-0">
                  <CompanyLogo src={s.logoUrl} name={s.companyName} ticker={s.ticker} className="w-10 h-10" />
                  <p className="font-bold text-ink leading-tight mt-2 line-clamp-2">{s.companyName}</p>
                  <p className="text-xs text-ink-soft">{s.ticker}</p>
                </div>
              ))}
            </div>
            <Row title="Your causes">
              {both(s => (s.matchedCauses?.length
                ? <ul className="space-y-1">{s.matchedCauses.map(c => <li key={c.cause}><span aria-hidden>{c.icon}</span> {c.label}</li>)}</ul>
                : none('—')))}
            </Row>
            <Row title="What it does">
              {both(s => <p>{s.missionStory || s.whyItFits || '—'}</p>)}
            </Row>
            <Row title="Proof" tone="text-positive" icon={<BadgeCheck className="w-3.5 h-3.5" aria-hidden />}>
              {both(s => s.proof ? (
                <p>{s.proof}{' '}
                  {s.proofSourceUrl && <a href={s.proofSourceUrl} target="_blank" rel="noopener noreferrer" className="font-semibold underline text-positive whitespace-nowrap">Source ↗</a>}
                </p>
              ) : none('No proof on file yet.'))}
            </Row>
            <Row title="Things to know" tone="text-info" icon={<Scale className="w-3.5 h-3.5" aria-hidden />}>
              {both(s => s.thingsToKnow?.length
                ? <ul className="space-y-1.5 list-disc pl-4">{s.thingsToKnow.map(t => <li key={t}>{t}</li>)}</ul>
                : none('—'))}
            </Row>
            <Row title="Big swings" tone="text-caution" icon={<AlertTriangle className="w-3.5 h-3.5" aria-hidden />}>
              {both(s => s.caution ? (
                <p><span className="font-semibold">{s.caution.headline}</span>{s.caution.reason ? ` ${s.caution.reason}` : ''}</p>
              ) : none('No big-swing caution right now.'))}
            </Row>
            <Row title="How much the price moves">
              {both(s => { const r = RISK_WORDS[s.riskLevel] ?? RISK_WORDS.medium; return <p><span aria-hidden>{r.emoji}</span> {r.text}</p>; })}
            </Row>
            <Row title="Past year">
              {both(s => <p>{s.oneYearReturn >= 0 ? 'Up' : 'Down'} {Math.abs(s.oneYearReturn).toFixed(1)}%</p>)}
            </Row>
            <p className="text-xs text-ink-soft pt-3">Past moves don't tell you what happens next.</p>
            <Disclaimer className="pt-2" />
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default CompareSheet;

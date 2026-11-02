// Sits behind the clock and notch on screens whose content scrolls with no header above it, so text
// never runs under the status bar. Fades out just below it. tone matches the screen's background at
// the top: 'base' for plain screens, 'glow' for .bg-daybreak ones. Phones only.
const StatusBarBackdrop = ({ tone = 'base' }: { tone?: 'base' | 'glow' }) => {
  const color = tone === 'glow' ? '--primary-tint' : '--base';
  return (
    <div
      aria-hidden
      data-status-backdrop
      className="fixed top-0 inset-x-0 z-30 pointer-events-none md:hidden"
      style={{
        height: 'calc(env(safe-area-inset-top) + 0.75rem)',
        background: `linear-gradient(to bottom, rgb(var(${color})) calc(100% - 0.75rem), rgb(var(${color}) / 0) 100%)`,
      }}
    />
  );
};

export default StatusBarBackdrop;

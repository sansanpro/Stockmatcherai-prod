// The educational disclaimer every screen carries (the design brief's rule)
const Disclaimer = ({ className = '' }: { className?: string }) => (
  <p className={`text-center text-xs text-ink-soft ${className}`}>Educational only, not investment advice.</p>
);

export default Disclaimer;

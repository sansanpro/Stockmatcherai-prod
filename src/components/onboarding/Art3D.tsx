interface Art3DProps {
  src: string;
  size?: number; // px
  delay?: number; // ms before it spins in
  className?: string;
}

// A piece of 3D art that spins in, then floats and tilts over a soft shadow.
// Give it a new key to replay the entrance (e.g. per question).
const Art3D = ({ src, size = 128, delay = 0, className = '' }: Art3DProps) => {
  // Two animations each (entrance, then the loop that starts 0.9s later)
  const timing = delay ? { animationDelay: `${delay}ms, ${delay + 900}ms` } : undefined;
  return (
    <div className={`flex flex-col items-center ${className}`} aria-hidden>
      <img
        src={src}
        alt=""
        draggable={false}
        className="art-3d select-none pointer-events-none drop-shadow-[0_14px_18px_rgb(var(--primary-deep)/0.18)]"
        style={{ width: size, height: size, ...timing }}
      />
      <div
        className="art-3d-shadow rounded-[50%] bg-ink/25 blur-[6px]"
        style={{ width: size * 0.5, height: Math.max(6, size * 0.08), marginTop: size * 0.06, ...timing }}
      />
    </div>
  );
};

export default Art3D;

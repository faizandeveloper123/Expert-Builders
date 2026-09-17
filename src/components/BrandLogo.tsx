import brandMark from '../assets/expert-builders-mark.png';

interface BrandLogoProps {
  className?: string;
  wordmark?: boolean;
  wordmarkColor?: string;
  chip?: boolean;
}

function BrandLogo({ className = '', chip = true }: BrandLogoProps) {
  if (!chip) {
    return (
      <img
        src={brandMark}
        alt="Expert Builders & Developers"
        className={`${className} object-contain`}
        aria-label="Expert Builders & Developers"
      />
    );
  }
  return (
    <span
      className={`inline-flex items-center justify-center rounded-2xl bg-white overflow-hidden ${className}`}
    >
      <img
        src={brandMark}
        alt="Expert Builders & Developers"
        className="h-[80%] max-w-[80%] object-contain"
        aria-label="Expert Builders & Developers"
      />
    </span>
  );
}

export default BrandLogo;
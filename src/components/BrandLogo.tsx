import brandLogo from '../assets/expert-builders-logo.jpeg';

interface BrandLogoProps {
  className?: string;
  wordmark?: boolean;
  wordmarkColor?: string;
}

function BrandLogo({ className }: BrandLogoProps) {
  return (
    <img
      src={brandLogo}
      alt="Expert Builders & Developers"
      className={`${className ?? ''} object-contain`}
      aria-label="Expert Builders & Developers"
    />
  );
}

export default BrandLogo;
import hifiLogo from '../assets/hifi-logo.jfif';

interface YadeaLogoProps {
  className?: string;
  wordmark?: boolean;
  wordmarkColor?: string;
}

function YadeaLogo({ className }: YadeaLogoProps) {
  return (
    <img
      src={hifiLogo}
      alt="Agency"
      className={`${className ?? ''} aspect-square object-cover rounded-full`}
      aria-label="Agency"
    />
  );
}

export default YadeaLogo;

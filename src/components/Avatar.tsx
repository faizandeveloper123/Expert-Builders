interface AvatarProps {
  initials: string;
  color: string;
  size?: string;
  image?: string;
  alt?: string;
}

function Avatar({ initials, color, size = 'w-7 h-7', image, alt }: AvatarProps) {
  const base = `${size} rounded-full flex items-center justify-center flex-shrink-0`;

  if (image) {
    return (
      <img
        src={image}
        alt={alt ?? initials}
        className={`${base} object-cover border border-slate-200`}
      />
    );
  }

  return (
    <div className={`${base} ${color} text-[10px] font-bold`} aria-hidden="true">
      {initials}
    </div>
  );
}
export default Avatar;

interface TagProps {
  label: string;
}

function Tag({ label }: TagProps) {
  return (
    <span className="px-1.5 py-px rounded-full bg-slate-100 text-slate-600 text-[10px] border border-slate-200 whitespace-nowrap">
      {label}
    </span>
  );
}

export default Tag;

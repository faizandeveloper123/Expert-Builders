import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode, SyntheticEvent } from 'react';
import {
  FaAnglesUp,
  FaArrowRight,
  FaBars,
  FaBorderAll,
  FaChevronDown,
  FaChevronUp,
  FaCircleCheck,
  FaDesktop,
  FaEye,
  FaFire,
  FaHeart,
  FaMagnifyingGlass,
  FaMobileScreenButton,
  FaRegCircleQuestion,
  FaRegClone,
  FaRegClock,
  FaRegFolder,
  FaRegHeart,
  FaShareNodes,
  FaSliders,
  FaStar,
  FaTabletScreenButton,
  FaXmark,
} from 'react-icons/fa6';

export interface TemplateField {
  label: string;
  type: string;
  placeholder?: string;
  required: boolean;
}

export interface FormTemplate {
  id: string;
  title: string;
  category: string;
  color: string;
  colorHex: string;
  trending: boolean;
  recentlyAdded: boolean;
  rating: string;
  popularity: number;
  createdAt: string;
  isFavorite: boolean;
  isMine?: boolean;
  isShared?: boolean;
  image: string;
  accentColor: string;
  headerText: string;
  headerFont?: string;
  headerColor?: string;
  columns?: 1 | 2;
  elements: TemplateField[];
}

/**
 * Storage for templates the user creates/saves from the form editor
 * ("My templates"). Persisted in localStorage so saved forms survive reloads.
 */
export const USER_TEMPLATES_KEY = 'evee_user_templates_v1';

export function loadUserTemplates(): FormTemplate[] {
  try {
    const raw = localStorage.getItem(USER_TEMPLATES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveTemplateToLibrary(template: FormTemplate): void {
  const list = loadUserTemplates().filter((t) => t.id !== template.id);
  list.unshift(template);
  try {
    localStorage.setItem(USER_TEMPLATES_KEY, JSON.stringify(list));
  } catch {
    /* ignore storage quota errors */
  }
}

export function removeTemplateFromLibrary(id: string): void {
  try {
    localStorage.setItem(USER_TEMPLATES_KEY, JSON.stringify(loadUserTemplates().filter((t) => t.id !== id)));
  } catch {
    /* ignore */
  }
}

/** Yadea-branded header image (orange gradient + scooter mark) as a data URI. */
export function buildYadeaHeaderImage(title: string) {
  const safeTitle = title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='800' height='300'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0%' stop-color='#EB5F1B'/><stop offset='100%' stop-color='#7c2d12'/></linearGradient></defs><rect width='800' height='300' fill='url(#g)'/><circle cx='96' cy='260' r='48' fill='none' stroke='rgba(255,255,255,0.18)' stroke-width='2'/><circle cx='96' cy='260' r='72' fill='none' stroke='rgba(255,255,255,0.10)' stroke-width='2'/><g stroke='#fff' stroke-width='6' stroke-linecap='round' fill='none' opacity='0.92'><circle cx='590' cy='232' r='30'/><circle cx='735' cy='232' r='30'/><path d='M590 232 L707 226'/><path d='M698 226 L698 132'/><path d='M678 132 L720 132'/><path d='M698 132 L660 170'/><path d='M678 132 L642 168'/></g><text x='330' y='118' fill='#fff' font-family='Arial, sans-serif' font-size='34' font-weight='800' text-anchor='middle'>${safeTitle}</text><text x='330' y='152' fill='rgba(255,255,255,0.75)' font-family='Arial, sans-serif' font-size='15' text-anchor='middle'>Join the Yadea family</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

const TEMPLATES: FormTemplate[] = [
  {
    id: '1',
    title: 'Auto Dealer Contact Us',
    category: 'Automotive',
    color: 'Blue',
    colorHex: '#3b82f6',
    trending: true,
    recentlyAdded: false,
    rating: '4.9',
    popularity: 98,
    createdAt: '2026-08-01',
    isFavorite: false,
    isMine: true,
    image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=600&q=80',
    accentColor: 'bg-slate-900',
    headerText: 'FIND YOUR PERFECT RIDE!',
    elements: [
      { label: 'First Name', type: 'text', placeholder: 'Enter first name', required: false },
      { label: 'Last Name', type: 'text', placeholder: 'Enter last name', required: false },
      { label: 'Email', type: 'email', placeholder: 'your@email.com', required: true },
      { label: 'Vehicle of Interest', type: 'text', placeholder: 'e.g. Honda Civic', required: false },
      { label: 'Comments', type: 'textarea', placeholder: 'Tell us what you are looking for...', required: false },
      { label: 'SUBMIT NOW', type: 'button', placeholder: 'SUBMIT NOW', required: false },
    ],
  },
  {
    id: '2',
    title: 'Flooring Quote - Classic',
    category: 'Creative',
    color: 'Orange',
    colorHex: '#f97316',
    trending: true,
    recentlyAdded: true,
    rating: '4.8',
    popularity: 85,
    createdAt: '2026-08-08',
    isFavorite: false,
    image: 'https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?auto=format&fit=crop&w=600&q=80',
    accentColor: 'bg-amber-700',
    headerText: 'Get Your Free Flooring Quote',
    elements: [
      { label: 'Full Name', type: 'text', placeholder: 'Enter full name', required: true },
      { label: 'Phone Number', type: 'phone', placeholder: '+1 (555) 000-0000', required: true },
      { label: 'Email Address', type: 'email', placeholder: 'your@email.com', required: false },
      { label: 'Flooring Type', type: 'single_dropdown', placeholder: 'Select flooring type', required: false },
      { label: 'Square Footage', type: 'number', placeholder: '0', required: false },
      { label: 'GET MY FREE QUOTE', type: 'button', placeholder: 'GET MY FREE QUOTE', required: false },
    ],
  },
  {
    id: '3',
    title: 'Workout Blueprint & Fitness',
    category: 'Beauty & Fashion',
    color: 'Yellow',
    colorHex: '#eab308',
    trending: false,
    recentlyAdded: true,
    rating: '5.0',
    popularity: 92,
    createdAt: '2026-08-05',
    isFavorite: false,
    isShared: true,
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=600&q=80',
    accentColor: 'bg-yellow-500',
    headerText: 'LETS BUILD YOUR WORKOUT BLUEPRINT',
    elements: [
      { label: 'Name', type: 'text', placeholder: 'Enter your name', required: true },
      { label: 'Fitness Goal', type: 'single_dropdown', placeholder: 'Select your goal', required: false },
      { label: 'Current Weight', type: 'number', placeholder: 'lbs', required: false },
      { label: 'Weekly Availability', type: 'single_dropdown', placeholder: 'Select availability', required: false },
      { label: 'BUILD MY PLAN', type: 'button', placeholder: 'BUILD MY PLAN', required: false },
    ],
  },
  {
    id: '4',
    title: 'Carpentry & Woodwork Lead',
    category: 'Business Coaching',
    color: 'Orange',
    colorHex: '#f97316',
    trending: false,
    recentlyAdded: true,
    rating: '4.7',
    popularity: 76,
    createdAt: '2026-08-07',
    isFavorite: false,
    isShared: true,
    image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=600&q=80',
    accentColor: 'bg-amber-900',
    headerText: 'Custom Woodworking Estimate',
    elements: [
      { label: 'Contact Person', type: 'text', placeholder: 'Enter contact name', required: true },
      { label: 'Project Scope', type: 'textarea', placeholder: 'Describe your project...', required: false },
      { label: 'Timeline', type: 'single_dropdown', placeholder: 'Select timeline', required: false },
      { label: 'Budget Range', type: 'single_dropdown', placeholder: 'Select budget', required: false },
      { label: 'REQUEST ESTIMATE', type: 'button', placeholder: 'REQUEST ESTIMATE', required: false },
    ],
  },
  {
    id: '5',
    title: 'Financial Advisory Intake',
    category: 'Financial',
    color: 'Green',
    colorHex: '#22c55e',
    trending: false,
    recentlyAdded: true,
    rating: '4.9',
    popularity: 94,
    createdAt: '2026-08-02',
    isFavorite: false,
    image: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80',
    accentColor: 'bg-emerald-700',
    headerText: 'Plan Your Financial Future Today',
    elements: [
      { label: 'Name', type: 'text', placeholder: 'Enter full name', required: true },
      { label: 'Annual Income', type: 'number', placeholder: '0.00', required: false },
      { label: 'Investment Goals', type: 'textarea', placeholder: 'Describe your goals...', required: false },
      { label: 'Best Time to Call', type: 'single_dropdown', placeholder: 'Select a time', required: false },
      { label: 'SCHEDULE CONSULTATION', type: 'button', placeholder: 'SCHEDULE CONSULTATION', required: false },
    ],
  },
  {
    id: '6',
    title: 'Beauty Salon Appointment',
    category: 'Beauty & Fashion',
    color: 'Purple',
    colorHex: '#a855f7',
    trending: false,
    recentlyAdded: false,
    rating: '4.6',
    popularity: 81,
    createdAt: '2026-07-28',
    isFavorite: false,
    image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=600&q=80',
    accentColor: 'bg-purple-600',
    headerText: 'Book Your Glam Hour',
    elements: [
      { label: 'Full Name', type: 'text', placeholder: 'Enter full name', required: true },
      { label: 'Service Required', type: 'single_dropdown', placeholder: 'Select service', required: false },
      { label: 'Preferred Date', type: 'date', placeholder: 'MM/DD/YYYY', required: false },
      { label: 'Stylist', type: 'text', placeholder: 'Preferred stylist', required: false },
      { label: 'BOOK APPOINTMENT', type: 'button', placeholder: 'BOOK APPOINTMENT', required: false },
    ],
  },
  {
    id: 'dealership-registration',
    title: 'Dealership Registration',
    category: 'Automotive',
    color: 'Orange',
    colorHex: '#EB5F1B',
    trending: true,
    recentlyAdded: true,
    rating: '5.0',
    popularity: 96,
    createdAt: '2026-08-20',
    isFavorite: false,
    isMine: true,
    image: buildYadeaHeaderImage('DEALERSHIP REGISTRATION'),
    accentColor: 'bg-[#EB5F1B]',
    headerText: 'DEALERSHIP REGISTRATION',
    elements: [
      { label: 'Name', type: 'text', placeholder: 'Enter your full name', required: true },
      { label: 'Phone', type: 'phone', placeholder: '+92 300 0000000', required: true },
      { label: 'Email', type: 'email', placeholder: 'your@email.com', required: true },
      { label: 'Dealership Code', type: 'text', placeholder: 'Enter dealership code', required: false },
      { label: 'Whatsapp', type: 'phone', placeholder: '+92 300 0000000', required: false },
      { label: 'City', type: 'text', placeholder: 'Enter your city', required: false },
      { label: 'Area', type: 'text', placeholder: 'Enter your area', required: false },
      { label: 'SUBMIT NOW', type: 'button', placeholder: 'SUBMIT NOW', required: false },
    ],
  },
];

const CATEGORIES: { name: string; count: number }[] = [
  { name: 'Automotive', count: 17 },
  { name: 'Beauty & Fashion', count: 17 },
  { name: 'Business Coaching', count: 14 },
  { name: 'Creative', count: 17 },
  { name: 'Financial', count: 15 },
];

const EXTRA_CATEGORIES: { name: string; count: number }[] = [
  { name: 'Real Estate', count: 20 },
  { name: 'Healthcare', count: 8 },
];

const COLORS: { name: string; dot: string; box: string }[] = [
  { name: 'Red', dot: 'bg-red-500', box: 'text-red-600' },
  { name: 'Orange', dot: 'bg-orange-500', box: 'text-orange-500' },
  { name: 'Yellow', dot: 'bg-yellow-400', box: 'text-yellow-500' },
  { name: 'Green', dot: 'bg-green-500', box: 'text-green-500' },
  { name: 'Cyan', dot: 'bg-cyan-400', box: 'text-cyan-500' },
  { name: 'Blue', dot: 'bg-blue-600', box: 'text-blue-600' },
  { name: 'Purple', dot: 'bg-purple-500', box: 'text-purple-600' },
  { name: 'Magenta', dot: 'bg-pink-500', box: 'text-pink-600' },
];

const COLOR_COUNTS: Record<string, number> = {
  Red: 5,
  Orange: 35,
  Yellow: 6,
  Green: 9,
  Cyan: 15,
  Blue: 33,
  Purple: 3,
  Magenta: 5,
};

export function buildTemplateFallbackImage(colorHex: string, title: string) {
  const safeTitle = title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='600' height='800'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0%' stop-color='${colorHex}'/><stop offset='100%' stop-color='#0f172a'/></linearGradient></defs><rect width='600' height='800' fill='url(#g)'/><text x='50%' y='46%' fill='rgba(255,255,255,0.95)' font-family='Arial, sans-serif' font-size='26' font-weight='700' text-anchor='middle'>${safeTitle}</text><rect x='70' y='540' width='460' height='64' rx='8' fill='rgba(255,255,255,0.3)'/><text x='50%' y='580' fill='#fff' font-family='Arial, sans-serif' font-size='18' font-weight='600' text-anchor='middle'>Start Here</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function buildFallbackImage(title: string) {
  const safeTitle = title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='800' height='300'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0%' stop-color='#2563eb'/><stop offset='100%' stop-color='#0f172a'/></linearGradient></defs><rect width='800' height='300' fill='url(#g)'/><text x='50%' y='50%' fill='rgba(255,255,255,0.95)' font-family='Arial, sans-serif' font-size='30' font-weight='700' text-anchor='middle'>${safeTitle}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function handleTemplateImageError(e: SyntheticEvent<HTMLImageElement>, template: FormTemplate) {
  const img = e.currentTarget;
  img.onerror = null;
  img.src = buildTemplateFallbackImage(template.colorHex, template.headerText);
}

export function handleImageError(e: SyntheticEvent<HTMLImageElement>, title: string) {
  const img = e.currentTarget;
  img.onerror = null;
  img.src = buildFallbackImage(title);
}

type FilterType = 'all' | 'my' | 'shared' | 'fav';
type SortOption = 'recent' | 'popular';
type ViewMode = 'grid' | 'list';
type DeviceMode = 'desktop' | 'tablet' | 'mobile';

interface TemplateLibraryProps {
  open: boolean;
  onClose: () => void;
  onUseTemplate: (template: FormTemplate) => void;
}

const NAV_ITEMS: { key: FilterType; label: string; icon: ReactNode }[] = [
  { key: 'all', label: 'All templates', icon: <FaRegClone className="text-sm" /> },
  { key: 'my', label: 'My templates', icon: <FaRegFolder className="text-sm" /> },
  { key: 'shared', label: 'Shared with me', icon: <FaShareNodes className="text-sm" /> },
  { key: 'fav', label: 'Favorites', icon: <FaRegHeart className="text-sm" /> },
];

export default function TemplateLibrary({ open, onClose, onUseTemplate }: TemplateLibraryProps) {
  const [templates, setTemplates] = useState<FormTemplate[]>(TEMPLATES);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [sortOption, setSortOption] = useState<SortOption>('recent');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showSidebar, setShowSidebar] = useState(true);
  const [showMoreCategories, setShowMoreCategories] = useState(false);
  const [showTags, setShowTags] = useState(false);
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [preview, setPreview] = useState<FormTemplate | null>(null);
  const [previewDevice, setPreviewDevice] = useState<DeviceMode>('desktop');
  const [previewTarget, setPreviewTarget] = useState<'window' | 'newtab'>('window');
  const sortMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) {
      setPreview(null);
      setPreviewTarget('window');
    } else {
      setTemplates(() => [...TEMPLATES, ...loadUserTemplates()]);
    }
  }, [open]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(e.target as Node)) {
        setSortMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (preview) setPreview(null);
        else onClose();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, preview, onClose]);

  const toggleCategory = (name: string) =>
    setSelectedCategories((prev) => (prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name]));

  const toggleColor = (name: string) =>
    setSelectedColors((prev) => (prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name]));

  const toggleFavorite = (id: string) =>
    setTemplates((prev) => prev.map((t) => (t.id === id ? { ...t, isFavorite: !t.isFavorite } : t)));

  const clearAll = () => {
    setSearchQuery('');
    setSelectedCategories([]);
    setSelectedColors([]);
    setSortOption('recent');
    setFilterType('all');
  };

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return templates.filter((t) => {
      const matchesSearch = !q || t.title.toLowerCase().includes(q) || t.category.toLowerCase().includes(q);
      const matchesCat = selectedCategories.length === 0 || selectedCategories.includes(t.category);
      const matchesColor = selectedColors.length === 0 || selectedColors.includes(t.color);
      let matchesType = true;
      if (filterType === 'fav') matchesType = t.isFavorite;
      if (filterType === 'my') matchesType = !!t.isMine;
      if (filterType === 'shared') matchesType = !!t.isShared;
      return matchesSearch && matchesCat && matchesColor && matchesType;
    });
  }, [templates, searchQuery, selectedCategories, selectedColors, filterType]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    if (sortOption === 'popular') arr.sort((a, b) => b.popularity - a.popularity);
    else arr.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return arr;
  }, [filtered, sortOption]);

  const trendingList = sorted.filter((t) => t.trending);
  const recentList = sorted.filter((t) => t.recentlyAdded);

  const activeFilterCount =
    selectedCategories.length + selectedColors.length + (searchQuery.trim() ? 1 : 0);

  const activeFilterLabel = filterType === 'my' ? 'My templates' : filterType === 'shared' ? 'Shared with me' : filterType === 'fav' ? 'Favorites' : 'All templates';

  const setDevice = (d: DeviceMode) => setPreviewDevice(d);

  const openPreviewInNewTab = (t: FormTemplate) => {
    const encoded = encodeURIComponent(JSON.stringify(t));
    const url = `/template-preview.html?template=${encoded}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const navBtnClass = (key: FilterType) =>
    key === filterType
      ? 'w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg bg-blue-50 text-blue-600 font-semibold border border-blue-100'
      : 'w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-medium';

  const fieldInput = (f: TemplateField) => {
    if (f.type === 'textarea') {
      return (
        <textarea
          rows={2}
          disabled
          placeholder={f.placeholder || `Enter ${f.label.toLowerCase()}...`}
          className="w-full border border-slate-300 rounded px-3 py-1.5 text-xs bg-slate-50 text-slate-500 resize-none"
        />
      );
    }
    if (f.type === 'single_dropdown' || f.type === 'multi_dropdown') {
      return (
        <select disabled className="w-full border border-slate-300 rounded px-3 py-1.5 text-xs bg-slate-50 text-slate-500">
          <option>{f.placeholder || 'Select an option'}</option>
          <option>Option 1</option>
          <option>Option 2</option>
        </select>
      );
    }
    if (f.type === 'checkbox') {
      return (
        <label className="flex items-center space-x-2 text-xs text-slate-600">
          <input type="checkbox" disabled className="rounded border-slate-300" />
          <span>{f.label}</span>
        </label>
      );
    }
    return (
      <input
        type="text"
        disabled
        placeholder={f.placeholder || `Enter ${f.label.toLowerCase()}...`}
        className="w-full border border-slate-300 rounded px-3 py-1.5 text-xs bg-slate-50 text-slate-500"
      />
    );
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-[2px] p-2 sm:p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl h-[92vh] max-h-[850px] flex flex-col overflow-hidden relative border border-slate-200 evee-pop">
        <button
          onClick={onClose}
          title="Close"
          className="absolute top-3 right-3 z-30 w-7 h-7 bg-slate-900 hover:bg-slate-800 text-white rounded-full flex items-center justify-center text-xs shadow-md transition"
        >
          <FaXmark />
        </button>

        <div className="px-6 py-3.5 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
          <h2 className="text-base font-bold text-slate-900 tracking-tight">Template library</h2>
          <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
            {activeFilterLabel} · {filtered.length} template{filtered.length === 1 ? '' : 's'}
          </span>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Left sidebar */}
          {showSidebar && (
            <aside className="w-56 sm:w-64 bg-slate-50 border-r border-slate-200 flex flex-col overflow-y-auto p-4 text-xs space-y-5 transition-all duration-300 shrink-0">
              <div className="space-y-1">
                {NAV_ITEMS.map((item) => (
                  <button key={item.key} onClick={() => setFilterType(item.key)} className={navBtnClass(item.key)}>
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>

              <hr className="border-slate-200" />

              <div>
                <div className="flex items-center justify-between text-slate-800 font-semibold mb-2">
                  <span>Browse categories</span>
                  <FaAnglesUp className="text-[10px] text-slate-400" />
                </div>
                <div className="space-y-1.5 text-slate-600">
                  {CATEGORIES.map((cat) => (
                    <label key={cat.name} className="flex items-center justify-between cursor-pointer hover:text-slate-900">
                      <span className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={selectedCategories.includes(cat.name)}
                          onChange={() => toggleCategory(cat.name)}
                          className="category-checkbox rounded text-blue-600 border-slate-300 focus:ring-0"
                        />
                        <span>{cat.name}</span>
                      </span>
                      <span className="text-slate-400 text-[11px]">{cat.count}</span>
                    </label>
                  ))}
                  {showMoreCategories &&
                    EXTRA_CATEGORIES.map((cat) => (
                      <label key={cat.name} className="flex items-center justify-between cursor-pointer hover:text-slate-900">
                        <span className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={selectedCategories.includes(cat.name)}
                            onChange={() => toggleCategory(cat.name)}
                            className="category-checkbox rounded text-blue-600 border-slate-300 focus:ring-0"
                          />
                          <span>{cat.name}</span>
                        </span>
                        <span className="text-slate-400 text-[11px]">{cat.count}</span>
                      </label>
                    ))}
                </div>
                <button
                  onClick={() => setShowMoreCategories((v) => !v)}
                  className="text-blue-600 font-semibold mt-2 inline-flex items-center text-[11px] hover:underline"
                >
                  {showMoreCategories ? (
                    <>
                      Show less <FaChevronUp className="ml-1 text-[10px]" />
                    </>
                  ) : (
                    <>
                      Show more <FaChevronDown className="ml-1 text-[10px]" />
                    </>
                  )}
                </button>
              </div>

              <hr className="border-slate-200" />

              <div>
                <div
                  className="flex items-center justify-between text-slate-800 font-semibold cursor-pointer py-1"
                  onClick={() => setShowTags((v) => !v)}
                >
                  <span>Tags</span>
                  <FaChevronDown className={`text-[10px] text-slate-400 transition-transform ${showTags ? 'rotate-180' : ''}`} />
                </div>
                {showTags && (
                  <div className="mt-2 space-y-1 pl-1 text-[11px] text-slate-500">
                    {['Lead Gen', 'Contact', 'Quote', 'Booking'].map((tag) => (
                      <span
                        key={tag}
                        className="inline-block bg-slate-200 px-2 py-0.5 rounded cursor-pointer hover:bg-blue-100 hover:text-blue-600 mb-1"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <hr className="border-slate-200" />

              <div className="bg-blue-50/60 border border-blue-100 rounded-lg p-3 text-center space-y-1.5">
                <div className="flex items-center justify-center space-x-1 text-slate-700 font-semibold text-[11px]">
                  <span>Brand board colors</span>
                  <FaRegCircleQuestion className="text-slate-400 text-[10px]" />
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  You do not have any brand colors added yet.
                </p>
                <a href="#" className="inline-block text-[11px] text-blue-600 font-semibold hover:underline">
                  Get started
                </a>
              </div>

              <div>
                <div className="text-slate-800 font-semibold mb-2">Colors</div>
                <div className="space-y-1.5 text-slate-600">
                  {COLORS.map((col) => (
                    <label key={col.name} className="flex items-center justify-between cursor-pointer hover:text-slate-900">
                      <span className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={selectedColors.includes(col.name)}
                          onChange={() => toggleColor(col.name)}
                          className="color-checkbox rounded border-slate-300 focus:ring-0"
                        />
                        <span className={`w-2.5 h-2.5 rounded-full ${col.dot} inline-block`} />
                        <span>{col.name}</span>
                      </span>
                      <span className="text-slate-400 text-[11px]">{COLOR_COUNTS[col.name] ?? 0}</span>
                    </label>
                  ))}
                </div>
              </div>
            </aside>
          )}

          {/* Main content */}
          <main className="flex-1 bg-white flex flex-col overflow-y-auto p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-slate-100 shrink-0">
              <div className="flex items-center space-x-3">
                <span className="font-semibold text-slate-800 text-sm">Forms</span>
                <button
                  onClick={() => setShowSidebar((v) => !v)}
                  className="flex items-center space-x-1.5 bg-white border border-slate-200 text-slate-700 text-xs px-3 py-1.5 rounded-md shadow-sm hover:bg-slate-50 active:scale-95 transition"
                >
                  <FaSliders className="text-[11px] text-slate-500" />
                  <span>Filters</span>
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative w-48 sm:w-64">
                  <FaMagnifyingGlass className="absolute left-3 top-2.5 text-xs text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search templates..."
                    className="w-full bg-white text-xs border border-slate-200 rounded-md pl-8 pr-3 py-1.5 focus:outline-none focus:border-blue-500 text-slate-800"
                  />
                </div>

                <div className="relative inline-block text-left" ref={sortMenuRef}>
                  <button
                    onClick={() => setSortMenuOpen((v) => !v)}
                    className="bg-white border border-slate-200 text-xs rounded-md px-3 py-1.5 text-slate-700 hover:bg-slate-50 flex items-center space-x-2 focus:outline-none"
                  >
                    {sortOption === 'popular' ? (
                      <span className="flex items-center space-x-1.5">
                        <FaFire className="text-amber-500 text-xs" />
                        <span>Most Popular</span>
                      </span>
                    ) : (
                      <span className="flex items-center space-x-1.5">
                        <FaRegClock className="text-blue-500 text-xs" />
                        <span>Most recent</span>
                      </span>
                    )}
                    <FaChevronDown className="text-[10px] text-slate-400 ml-1" />
                  </button>
                  <div
                    className={`${
                      sortMenuOpen ? '' : 'hidden'
                    } absolute right-0 mt-1 w-44 bg-white border border-slate-200 rounded-md shadow-lg z-30 py-1 text-xs`}
                  >
                    <button
                      onClick={() => {
                        setSortOption('recent');
                        setSortMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-blue-50 flex items-center space-x-2 text-slate-700"
                    >
                      <FaRegClock className="text-blue-500 w-4" />
                      <span className="font-medium">Most recent</span>
                    </button>
                    <button
                      onClick={() => {
                        setSortOption('popular');
                        setSortMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-blue-50 flex items-center space-x-2 text-slate-700 border-t border-slate-100"
                    >
                      <FaFire className="text-amber-500 w-4" />
                      <span className="font-medium">Most Popular</span>
                    </button>
                  </div>
                </div>

                <div className="flex border border-slate-200 rounded-md overflow-hidden bg-slate-50 p-0.5">
                  <button
                    onClick={() => setViewMode('grid')}
                    title="Grid View"
                    className={`p-1 px-2 text-xs rounded ${viewMode === 'grid' ? 'bg-white shadow-xs text-slate-800' : 'text-slate-400 hover:text-slate-700'}`}
                  >
                    <FaBorderAll />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    title="List View"
                    className={`p-1 px-2 text-xs rounded ${viewMode === 'list' ? 'bg-white shadow-xs text-slate-800' : 'text-slate-400 hover:text-slate-700'}`}
                  >
                    <FaBars />
                  </button>
                </div>
              </div>
            </div>

            {/* Active filter badges */}
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-3 text-xs">
                <span className="text-slate-400 font-medium">Active Filters:</span>
                <div className="flex flex-wrap gap-1.5">
                  {searchQuery.trim() && (
                    <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                      Query: &quot;{searchQuery.trim()}&quot;
                    </span>
                  )}
                  {selectedCategories.map((c) => (
                    <span key={c} className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
                      {c}
                    </span>
                  ))}
                  {selectedColors.map((col) => (
                    <span key={col} className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                      {col}
                    </span>
                  ))}
                </div>
                <button onClick={clearAll} className="text-blue-600 hover:underline text-[11px] ml-2">
                  Clear all
                </button>
              </div>
            )}

            {sorted.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-16 text-center">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-xl mb-3 border border-slate-200">
                  <FaMagnifyingGlass />
                </div>
                <h4 className="text-sm font-semibold text-slate-800">No templates found</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">
                  We couldn&apos;t find any templates matching your search or active filters.
                </p>
                <button
                  onClick={clearAll}
                  className="mt-4 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-500 transition"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="mt-6 space-y-8">
                {trendingList.length > 0 && (
                  <section>
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4">
                      Top trending this week
                    </h3>
                    <div
                      className={
                        viewMode === 'grid'
                          ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6'
                          : 'flex flex-col space-y-3'
                      }
                    >
                      {trendingList.map((t) =>
                        viewMode === 'grid' ? (
                          <TemplateCard key={t.id} template={t} onPreview={setPreview} onUse={onUseTemplate} onToggleFavorite={toggleFavorite} />
                        ) : (
                          <TemplateListRow key={t.id} template={t} onPreview={setPreview} onUse={onUseTemplate} onToggleFavorite={toggleFavorite} />
                        )
                      )}
                    </div>
                  </section>
                )}

                {recentList.length > 0 && (
                  <section>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Recently added
                      </h3>
                    </div>
                    <div
                      className={
                        viewMode === 'grid'
                          ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6'
                          : 'flex flex-col space-y-3'
                      }
                    >
                      {recentList.map((t) =>
                        viewMode === 'grid' ? (
                          <TemplateCard key={t.id} template={t} onPreview={setPreview} onUse={onUseTemplate} onToggleFavorite={toggleFavorite} />
                        ) : (
                          <TemplateListRow key={t.id} template={t} onPreview={setPreview} onUse={onUseTemplate} onToggleFavorite={toggleFavorite} />
                        )
                      )}
                    </div>
                  </section>
                )}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Preview modal */}
      {preview && (
        <div className="fixed inset-0 z-[70] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[90vh] max-h-[820px] flex flex-col overflow-hidden evee-pop">
            <div className="p-3.5 border-b border-slate-200 flex flex-wrap items-center justify-between bg-slate-900 text-white gap-3 shrink-0">
              <div>
                <h3 className="font-bold text-sm">{preview.title}</h3>
                <p className="text-[11px] text-slate-300">{preview.category} · {preview.color}</p>
              </div>

              {/* Preview target toggle: In this window / Open in new tab */}
              <div className="flex items-center bg-slate-800 p-1 rounded-lg border border-slate-700 space-x-1">
                <button
                  onClick={() => setPreviewTarget('window')}
                  className={`px-3 py-1 text-xs rounded-md font-medium flex items-center space-x-1.5 transition ${
                    previewTarget === 'window' ? 'bg-blue-600 text-white shadow' : 'text-slate-300 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  <FaDesktop className="text-xs" />
                  <span>In this window</span>
                </button>
                <button
                  onClick={() => setPreviewTarget('newtab')}
                  className={`px-3 py-1 text-xs rounded-md font-medium flex items-center space-x-1.5 transition ${
                    previewTarget === 'newtab' ? 'bg-blue-600 text-white shadow' : 'text-slate-300 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  <FaArrowRight className="text-xs" />
                  <span>Open in new tab</span>
                </button>
              </div>

              <div className="flex items-center space-x-1.5">
                {/* Device switcher - only when previewing in this window */}
                {previewTarget === 'window' && (
                  <div className="flex items-center bg-slate-800 p-1 rounded-lg border border-slate-700 space-x-1">
                    {(
                      [
                        { key: 'desktop' as DeviceMode, label: 'Desktop', icon: <FaDesktop className="text-xs" /> },
                        { key: 'tablet' as DeviceMode, label: 'Tablet', icon: <FaTabletScreenButton className="text-xs" /> },
                        { key: 'mobile' as DeviceMode, label: 'Mobile', icon: <FaMobileScreenButton className="text-xs" /> },
                      ]
                    ).map((d) => (
                      <button
                        key={d.key}
                        onClick={() => setDevice(d.key)}
                        className={`px-3 py-1 text-xs rounded-md font-medium flex items-center space-x-1.5 transition ${
                          previewDevice === d.key
                            ? 'bg-blue-600 text-white shadow'
                            : 'text-slate-300 hover:text-white hover:bg-slate-700'
                        }`}
                      >
                        {d.icon}
                        <span>{d.label}</span>
                      </button>
                    ))}
                  </div>
                )}
                <button
                  onClick={() => setPreview(null)}
                  className="text-slate-300 hover:text-white w-7 h-7 flex items-center justify-center rounded-full hover:bg-slate-800"
                >
                  <FaXmark />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-slate-200/80 flex justify-center items-start">
              {previewTarget === 'window' ? (
                <div
                  className="bg-white rounded-lg shadow-xl border border-slate-300 overflow-hidden flex flex-col transition-all duration-300 my-auto"
                  style={{ width: previewDevice === 'mobile' ? '375px' : previewDevice === 'tablet' ? '640px' : '720px', maxWidth: '100%' }}
                >
                  <div className="h-40 bg-slate-800 relative flex items-center justify-center text-white p-4 text-center">
                    <img
                      src={preview.image}
                      onError={(e) => handleTemplateImageError(e, preview)}
                      alt={preview.headerText}
                      loading="lazy"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40" />
                    <h4 className="relative z-10 font-bold text-lg uppercase tracking-wide">
                      {preview.headerText}
                    </h4>
                  </div>
                  <div className="p-6 space-y-4 flex-1">
                    <p className="text-xs text-slate-500">
                      Please fill out the form below to get started immediately.
                    </p>
                    <div className="space-y-3">
                      {preview.elements.map((f) =>
                        f.type === 'button' ? (
                          <button
                            key={f.label}
                            className={`w-full py-2.5 mt-2 ${preview.accentColor} text-white font-bold text-xs rounded shadow uppercase`}
                          >
                            {f.label}
                          </button>
                        ) : (
                          <div key={f.label}>
                            <label className="block text-xs font-medium text-slate-700 mb-1">
                              {f.label}
                              {f.required && <span className="text-rose-500">*</span>}
                            </label>
                            {fieldInput(f)}
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-center space-y-4 my-auto">
                  <div className="w-16 h-16 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 text-2xl">
                    <FaArrowRight />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Open preview in a new tab</h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      This will open a standalone preview page of &quot;{preview.title}&quot; in a separate browser tab where you can also switch between desktop, tablet and mobile views.
                    </p>
                  </div>
                  <button
                    onClick={() => openPreviewInNewTab(preview)}
                    className="px-5 py-2.5 bg-blue-600 text-white text-xs font-semibold rounded-md hover:bg-blue-500 shadow flex items-center space-x-2"
                  >
                    <FaArrowRight className="text-[10px]" />
                    <span>Open in new tab</span>
                  </button>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-200 bg-white flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-500">
                <FaCircleCheck className="text-emerald-500 mr-1 inline" /> Ready to customize
              </span>
              <div className="space-x-2">
                <button
                  onClick={() => setPreview(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-xs rounded-md font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => onUseTemplate(preview)}
                  className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-md hover:bg-blue-500 shadow flex items-center space-x-1.5"
                >
                  <span>Use Template</span>
                  <FaArrowRight className="text-[10px]" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface CardProps {
  template: FormTemplate;
  onPreview: (t: FormTemplate) => void;
  onUse: (t: FormTemplate) => void;
  onToggleFavorite: (id: string) => void;
}

function TemplateCard({ template: t, onPreview, onUse, onToggleFavorite }: CardProps) {
  return (
    <div className="group flex flex-col cursor-pointer relative">
      <div className="relative w-full aspect-[3/4] bg-slate-100 border border-slate-200 rounded-lg overflow-hidden shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(t.id);
          }}
          title="Favorite"
          className="absolute top-2 right-2 z-20 w-7 h-7 rounded-full bg-white/90 hover:bg-white shadow flex items-center justify-center transition-all transform hover:scale-110"
        >
          {t.isFavorite ? (
            <FaHeart className="text-rose-500" />
          ) : (
            <FaRegHeart className="text-slate-500 hover:text-rose-500" />
          )}
        </button>

        <div className="w-full h-full bg-white flex flex-col p-3 overflow-hidden select-none">
          <div className="w-full h-28 rounded mb-3 border border-slate-100 relative overflow-hidden bg-slate-200 shrink-0">
            <img
              src={t.image}
              onError={(e) => handleTemplateImageError(e, t)}
              alt={t.headerText}
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/30" />
            <span className="absolute inset-0 z-10 flex items-center justify-center text-center text-white text-[10px] font-bold uppercase tracking-wider p-2">
              {t.headerText}
            </span>
          </div>

          <div className="space-y-2 flex-1">
            {t.elements.slice(0, 3).map((f) => (
              <div key={f.label}>
                <div className="text-[8px] text-slate-400 font-medium mb-0.5">{f.label} *</div>
                <div className="w-full h-4 bg-slate-50 border border-slate-200 rounded" />
              </div>
            ))}
            <div className={`w-full h-6 ${t.accentColor} rounded text-white text-[8px] flex items-center justify-center font-bold mt-2`}>
              SUBMIT NOW
            </div>
          </div>
        </div>

        <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center space-y-2 p-4 z-10">
          <button
            onClick={() => onPreview(t)}
            className="w-full py-2 bg-white text-slate-900 font-bold text-xs rounded shadow hover:bg-slate-100 transition transform scale-95 group-hover:scale-100 flex items-center justify-center space-x-1.5"
          >
            <FaEye className="text-slate-600" />
            <span>Preview Template</span>
          </button>
          <button
            onClick={() => onUse(t)}
            className="w-full py-2 bg-blue-600 text-white font-bold text-xs rounded shadow hover:bg-blue-500 transition transform scale-95 group-hover:scale-100 flex items-center justify-center space-x-1.5"
          >
            <FaCircleCheck />
            <span>Use Template</span>
          </button>
        </div>
      </div>

      <div className="mt-2.5 flex items-center justify-between">
        <h4 className="text-xs font-semibold text-slate-800 group-hover:text-blue-600 transition truncate">
          {t.title}
        </h4>
        <span className="flex items-center text-amber-500 text-[11px] font-semibold shrink-0 ml-2">
          <FaStar className="text-[10px] mr-0.5" />
          {t.rating}
        </span>
      </div>
    </div>
  );
}

function TemplateListRow({ template: t, onPreview, onUse, onToggleFavorite }: CardProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 flex items-center justify-between hover:shadow-md transition">
      <div className="flex items-center space-x-4 min-w-0">
        <div className="w-16 h-16 rounded bg-slate-200 border border-slate-200 relative overflow-hidden shrink-0">
          <img
            src={t.image}
            onError={(e) => handleTemplateImageError(e, t)}
            alt={t.headerText}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>
        <div className="min-w-0">
          <h4 className="text-xs font-bold text-slate-900 truncate">{t.title}</h4>
          <div className="flex items-center space-x-2 text-[11px] text-slate-500 mt-1">
            <span>{t.category}</span>
            <span>•</span>
            <span className="flex items-center text-amber-500">
              <FaStar className="text-[10px] mr-1" />
              {t.rating}
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-2 shrink-0">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(t.id);
          }}
          title="Favorite"
          className="w-7 h-7 rounded-full border border-slate-200 text-slate-500 hover:text-rose-500 flex items-center justify-center transition"
        >
          {t.isFavorite ? <FaHeart className="text-rose-500" /> : <FaRegHeart />}
        </button>
        <button
          onClick={() => onPreview(t)}
          className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition"
        >
          Preview
        </button>
        <button
          onClick={() => onUse(t)}
          className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded transition flex items-center space-x-1"
        >
          <span>Use</span>
          <FaArrowRight className="text-[9px]" />
        </button>
      </div>
    </div>
  );
}

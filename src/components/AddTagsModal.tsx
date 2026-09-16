import { useEffect, useMemo, useRef, useState } from 'react';
import { FaMagnifyingGlass, FaPlus, FaXmark } from 'react-icons/fa6';
import type { Contact } from '../types';
import Avatar from './Avatar';
import { api } from '../api';

interface AddTagsModalProps {
  selectedContacts: Contact[];
  onClose: () => void;
  onSave: (tags: string[]) => void;
}

const DEFAULT_TAG_OPTIONS = ['follow-up', 'hello', 'high priority', 'warm lead'];

const inputCls =
  'w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition';
const labelCls = 'block text-[11px] font-semibold text-slate-700 mb-1.5';
const outlineBtnCls =
  'px-4 py-2 border border-slate-300 rounded-md text-xs font-semibold text-slate-700 hover:bg-slate-50 transition whitespace-nowrap';
const primaryBtnCls =
  'px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-md shadow-sm transition whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed';

function AddTagsModal({ selectedContacts, onClose, onSave }: AddTagsModalProps) {
  const [actionName, setActionName] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagQuery, setTagQuery] = useState('');
  const [tagMenuOpen, setTagMenuOpen] = useState(false);
  const [errors, setErrors] = useState<{ actionName?: string; tags?: string }>({});
  const [availableTags, setAvailableTags] = useState<string[]>(DEFAULT_TAG_OPTIONS);
  const tagInputRef = useRef<HTMLInputElement>(null);

  // Merge server-side tags with the selected contacts' existing tags so the
  // selector always reflects every tag already in the workspace.
  useEffect(() => {
    let active = true;
    api
      .listTags()
      .then((res) => {
        if (!active) return;
        setAvailableTags((prev) => [
          ...new Set([...DEFAULT_TAG_OPTIONS, ...res.data.map((t) => t.name), ...prev]),
        ]);
      })
      .catch(() => {});
    const fromContacts = new Set(selectedContacts.flatMap((c) => c.tags ?? []));
    if (fromContacts.size > 0) {
      setAvailableTags((prev) => [...new Set([...prev, ...fromContacts])]);
    }
    return () => {
      active = false;
    };
  }, [selectedContacts]);

  // Close the modal on Escape without losing state.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const filteredTags = useMemo(() => {
    const q = tagQuery.trim().toLowerCase();
    if (!q) return availableTags;
    return availableTags.filter((t) => t.toLowerCase().includes(q));
  }, [availableTags, tagQuery]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => {
      const next = prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag];
      if (next.length > 0) setErrors((e) => ({ ...e, tags: undefined }));
      return next;
    });
  };

  const createTag = (raw: string) => {
    const tag = raw.trim();
    if (!tag) return;
    if (!availableTags.includes(tag)) setAvailableTags((prev) => [...prev, tag]);
    if (!selectedTags.includes(tag)) {
      setSelectedTags((prev) => [...prev, tag]);
      setErrors((e) => ({ ...e, tags: undefined }));
    }
    setTagQuery('');
  };

  const openMenu = () => {
    setTagMenuOpen((v) => {
      const next = !v;
      if (next) {
        setTagQuery('');
        setTimeout(() => tagInputRef.current?.focus(), 0);
      }
      return next;
    });
  };

  const submit = () => {
    const next: { actionName?: string; tags?: string } = {};
    if (!actionName.trim()) next.actionName = 'Enter a name for the action';
    if (selectedTags.length === 0) next.tags = 'Select at least one tag';
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    onSave(selectedTags);
  };

  return (
    <div
      className="fixed inset-0 z-[70] bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center p-3 sm:p-4 evee-fade-in"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="animate-pop w-[560px] max-w-full max-h-[90vh] bg-white rounded-xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-start justify-between flex-shrink-0">
          <div>
            <h3 className="font-bold text-slate-800 text-base">Add tags</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Specified tags will get added to all the selected contacts
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition" aria-label="Close">
            <FaXmark className="text-lg" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <div>
            <label className={labelCls}>Add tags to following contacts</label>
            <div className="flex items-center -space-x-2">
              {selectedContacts.map((c) => (
                <span key={c.id} title={c.name} className="relative inline-block rounded-full ring-2 ring-white">
                  <Avatar initials={c.initials} color={c.avatarColor} image={c.image} size="w-8 h-8" />
                </span>
              ))}
            </div>
          </div>

          <div>
            <label className={labelCls}>
              Action name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={actionName}
              onChange={(e) => {
                setActionName(e.target.value);
                if (e.target.value.trim()) setErrors((prev) => ({ ...prev, actionName: undefined }));
              }}
              placeholder="Enter a description for the action"
              className={`${inputCls} ${
                errors.actionName ? 'border-red-500 focus:border-red-500 focus:ring-red-100' : ''
              }`}
            />
            {errors.actionName && <p className="mt-1 text-[11px] text-red-500">{errors.actionName}</p>}
          </div>

          <div>
            <label className={labelCls}>
              Tags <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={openMenu}
                className={`w-full min-h-[38px] px-3 py-2 bg-white border rounded-md text-xs text-left flex items-center justify-between gap-2 transition ${
                  errors.tags
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                }`}
              >
                {selectedTags.length === 0 ? (
                  <span className="text-slate-400">Select tags</span>
                ) : (
                  <span className="flex flex-wrap items-center gap-1.5">
                    {selectedTags.map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center gap-1 bg-blue-50 text-blue-600 border border-blue-200 rounded-full px-2 py-0.5 text-[10px] font-medium"
                      >
                        {t}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleTag(t);
                          }}
                          className="hover:text-red-500"
                          title={`Remove ${t}`}
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                  </span>
                )}
                <FaXmark
                  className={`text-[10px] text-slate-400 transition-transform ${tagMenuOpen ? 'rotate-45' : ''}`}
                />
              </button>

              {tagMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      setTagMenuOpen(false);
                    }}
                    aria-hidden="true"
                  />
                  <div className="absolute left-0 right-0 top-full mt-1 z-20 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden">
                    <div className="p-2 border-b border-slate-100 relative">
                      <FaMagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-[11px] pointer-events-none" />
                      <input
                        ref={tagInputRef}
                        type="text"
                        value={tagQuery}
                        onChange={(e) => setTagQuery(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            createTag(tagQuery);
                          }
                        }}
                        placeholder="Search / create tags"
                        className="w-full pl-7 pr-8 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs focus:outline-none focus:border-blue-500 placeholder-slate-400"
                      />
                      <button
                        type="button"
                        onClick={() => createTag(tagQuery)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-md bg-blue-600 text-white hover:bg-blue-700 transition"
                        title="Create tag"
                      >
                        <FaPlus className="text-[9px]" />
                      </button>
                    </div>

                    <div className="max-h-48 overflow-y-auto p-2">
                      {tagQuery.trim() &&
                        !availableTags.some((t) => t.toLowerCase() === tagQuery.trim().toLowerCase()) && (
                          <button
                            type="button"
                            onClick={() => createTag(tagQuery)}
                            className="w-full text-left px-2.5 py-1.5 mb-1 text-xs text-blue-600 hover:bg-blue-50 rounded-md flex items-center gap-1.5 font-medium"
                          >
                            <FaPlus className="text-[10px]" />
                            Create &quot;{tagQuery.trim()}&quot;
                          </button>
                        )}
                      {filteredTags.length === 0 ? (
                        <div className="px-3 py-2 text-xs text-slate-400">No tags found</div>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {filteredTags.map((tag) => {
                            const selected = selectedTags.includes(tag);
                            return (
                              <button
                                key={tag}
                                type="button"
                                onClick={() => toggleTag(tag)}
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-medium transition ${
                                  selected
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : 'bg-white text-slate-600 border-slate-200 hover:border-blue-400 hover:text-blue-600'
                                }`}
                              >
                                {tag}
                                {selected && <FaXmark className="text-[9px]" />}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
            {errors.tags && <p className="mt-1 text-[11px] text-red-500">{errors.tags}</p>}
            {selectedTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {selectedTags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 border border-slate-200 rounded-full px-2 py-0.5 text-[10px] font-medium"
                  >
                    {t}
                    <button type="button" onClick={() => toggleTag(t)} className="hover:text-red-500">
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-3.5 border-t border-slate-200 bg-white flex items-center justify-end gap-3 flex-shrink-0">
          <button onClick={onClose} className={outlineBtnCls}>
            Cancel
          </button>
          <button onClick={submit} className={primaryBtnCls}>
            Add tags
          </button>
        </div>
      </div>
    </div>
  );
}

export default AddTagsModal;

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FaArrowLeft,
  FaBars,
  FaCopy,
  FaMagnifyingGlass,
  FaPlus,
  FaRegPenToSquare,
  FaRegTrashCan,
  FaShareNodes,
  FaXmark,
} from 'react-icons/fa6';
import { api, type ApiSmartList, type ApiStaffUser } from '../api';
import { useAuth } from '../auth';

interface ManageSmartListsPageProps {
  onNotify: (msg: string) => void;
  onBack: () => void;
  onListsChanged?: () => void;
}

interface EditTarget {
  list: ApiSmartList | null;
  name: string;
}

interface ShareTarget {
  list: ApiSmartList;
  sharedAll: boolean;
  selected: Set<number>;
}

const inputCls =
  'w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-slate-800 bg-white';

function ManageSmartListsPage({ onNotify, onBack, onListsChanged }: ManageSmartListsPageProps) {
  const { user } = useAuth();
  const userId = user?.id ?? 0;

  const [lists, setLists] = useState<ApiSmartList[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<EditTarget>({ list: null, name: '' });
  const [shareOpen, setShareOpen] = useState(false);
  const [shareTarget, setShareTarget] = useState<ShareTarget | null>(null);
  const [staff, setStaff] = useState<ApiStaffUser[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const toggleSelect = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const loadLists = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.listSmartLists(userId);
      setLists(res.data);
    } catch (err) {
      onNotify(`Failed to load smart lists: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  }, [userId, onNotify]);

  useEffect(() => {
    void loadLists();
  }, [loadLists]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return lists;
    return lists.filter((l) => l.name.toLowerCase().includes(q));
  }, [lists, search]);

  const allFilteredSelected = filtered.length > 0 && filtered.every((l) => selected.has(l.id));

  const toggleSelectAll = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) filtered.forEach((l) => next.delete(l.id));
      else filtered.forEach((l) => next.add(l.id));
      return next;
    });
  };

  const openCreate = () => {
    setEditTarget({ list: null, name: '' });
    setEditOpen(true);
  };

  const openEdit = (list: ApiSmartList) => {
    setEditTarget({ list, name: list.name });
    setEditOpen(true);
  };

  const saveEdit = async () => {
    const name = editTarget.name.trim();
    if (!name) {
      onNotify('Please enter a list name');
      return;
    }
    try {
      if (editTarget.list) {
        await api.updateSmartList(editTarget.list.id, {
          user_id: userId,
          name,
          filters: editTarget.list.filters,
          sort_by: editTarget.list.sort_by,
          fields: editTarget.list.fields,
          members: editTarget.list.members,
          dealer_id: editTarget.list.dealer_id,
          shared_all: editTarget.list.shared_all,
          shared_user_ids: editTarget.list.shared_user_ids,
        });
        onNotify(`Smart list renamed to "${name}"`);
      } else {
        await api.createSmartList({ user_id: userId, name, shared_all: false });
        onNotify(`Created smart list "${name}"`);
      }
      setEditOpen(false);
      await loadLists();
      onListsChanged?.();
    } catch (err) {
      onNotify((err as Error).message);
    }
  };

  const duplicate = async (list: ApiSmartList) => {
    try {
      await api.duplicateSmartList(list.id, userId);
      onNotify(`Duplicated "${list.name}"`);
      await loadLists();
      onListsChanged?.();
    } catch (err) {
      onNotify((err as Error).message);
    }
  };

  const remove = async (list: ApiSmartList) => {
    if (!window.confirm(`Delete smart list "${list.name}"?`)) return;
    try {
      await api.deleteSmartList(list.id, userId);
      onNotify(`Deleted "${list.name}"`);
      await loadLists();
      onListsChanged?.();
    } catch (err) {
      onNotify((err as Error).message);
    }
  };

  const bulkRemove = async () => {
    const targets = [...selected];
    if (targets.length === 0) return;
    if (!window.confirm(`Delete ${targets.length} selected smart list${targets.length === 1 ? '' : 's'}?`)) return;
    let ok = 0;
    for (const id of targets) {
      try {
        await api.deleteSmartList(id, userId);
        ok++;
      } catch {
        /* keep going */
      }
    }
    onNotify(`Deleted ${ok} smart list${ok === 1 ? '' : 's'}`);
    setSelected(new Set());
    await loadLists();
    onListsChanged?.();
  };

  const openShare = async (list: ApiSmartList) => {
    try {
      const res = await api.listStaff();
      setStaff(res.data.filter((s) => s.id !== userId));
      setShareTarget({
        list,
        sharedAll: list.shared_all,
        selected: new Set(list.shared_user_ids),
      });
      setShareOpen(true);
    } catch (err) {
      onNotify(`Failed to load staff: ${(err as Error).message}`);
    }
  };

  const assignSharedLeads = async (list: ApiSmartList, targetIds: number[]) => {
    const dealers = new Set<number>();
    for (const sid of targetIds) {
      const s = staff.find((x) => x.id === sid);
      if (!s) continue;
      const dealerId =
        s.user_type === 'Dealer' ? s.id : s.user_type === 'Follower' ? s.manager_id : null;
      if (dealerId && dealerId > 0) dealers.add(dealerId);
    }

    for (const dealerId of dealers) {
      let assigned = 0;
      if (list.members.length > 0) {
        try {
          const res = await api.assignLeadsToDealer({ dealer_id: dealerId, contact_ids: list.members });
          assigned = res.data.assigned;
        } catch {
          assigned = 0;
        }
      }
      await api
        .createNotification({
          staff_ids: [dealerId],
          type: 'smartlist',
          title: 'New leads assigned',
          detail: `${assigned} lead(s) from smart list "${list.name}" assigned to you`,
        })
        .catch(() => undefined);
    }
    return dealers.size;
  };

  const saveShare = async () => {
    if (!shareTarget) return;
    try {
      await api.updateSmartList(shareTarget.list.id, {
        user_id: userId,
        name: shareTarget.list.name,
        filters: shareTarget.list.filters,
        sort_by: shareTarget.list.sort_by,
        fields: shareTarget.list.fields,
        members: shareTarget.list.members,
        dealer_id: shareTarget.list.dealer_id,
        shared_all: shareTarget.sharedAll,
        shared_user_ids: [...shareTarget.selected],
      });

      const targets = [...shareTarget.selected];
      if (targets.length > 0) {
        await assignSharedLeads(shareTarget.list, targets);
      }

      const shareLabel =
        shareTarget.sharedAll || targets.length > 0
          ? `Shared "${shareTarget.list.name}" with ${
              shareTarget.sharedAll ? 'all users' : `${targets.length} user${targets.length === 1 ? '' : 's'}`
            }`
          : `Share settings saved for "${shareTarget.list.name}"`;
      onNotify(shareLabel);
      setShareOpen(false);
      await loadLists();
      onListsChanged?.();
    } catch (err) {
      onNotify((err as Error).message);
    }
  };

  const toggleShareUser = (id: number) => {
    setShareTarget((prev) => {
      if (!prev) return prev;
      const next = new Set(prev.selected);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { ...prev, selected: next };
    });
  };

  const toggleShareAllUsers = () => {
    setShareTarget((prev) => {
      if (!prev) return prev;
      const allSelected =
        staff.length > 0 && staff.every((s) => prev.selected.has(s.id));
      const next = new Set<number>();
      if (!allSelected) staff.forEach((s) => next.add(s.id));
      return { ...prev, selected: next };
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] text-slate-800 select-none">
      {/* Page header */}
      <header className="bg-white border-b border-slate-200 px-4 md:px-6 py-2.5 flex items-center justify-between shadow-sm flex-shrink-0">
        <div className="text-sm font-semibold text-slate-700">Smart Lists</div>
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center space-x-1.5 transition"
          >
            <FaArrowLeft className="text-xs" />
            <span>Back</span>
          </button>
        </div>
      </header>

      {/* Page title */}
      <div className="px-4 md:px-6 py-4 flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Manage smart lists</h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md shadow-sm transition-all hover:shadow"
        >
          <FaPlus />
          <span>Create Smart List</span>
        </button>
      </div>

      {/* Card */}
      <div className="mx-4 md:mx-6 bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden mb-6 flex-1 flex flex-col">
        {/* Filter bar */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-4 flex-wrap">
          <div className="relative w-full sm:w-64">
            <FaMagnifyingGlass className="absolute left-3 top-2.5 text-xs text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search smart list"
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all placeholder-slate-400"
            />
          </div>
        </div>

        {/* Bulk selection bar */}
        {selected.size > 0 && (
          <div className="px-4 py-2.5 bg-blue-50/70 border-b border-blue-100 flex items-center justify-between gap-3 flex-wrap">
            <span className="text-xs font-semibold text-blue-700">
              {selected.size} smart list{selected.size === 1 ? '' : 's'} selected
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelected(new Set())}
                className="px-3 py-1.5 text-xs text-slate-600 border border-slate-300 bg-white hover:bg-slate-50 font-medium rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={bulkRemove}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-md shadow-xs transition-colors"
              >
                <FaRegTrashCan className="text-xs" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-xs text-slate-500">
              Loading smart lists...
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-xs text-slate-500 gap-1">
              <p className="text-sm font-semibold text-slate-700">No smart lists found</p>
              <p className="text-[11px]">Create a smart list to get started.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={allFilteredSelected}
                      onChange={toggleSelectAll}
                      title={allFilteredSelected ? 'Deselect all' : 'Select all'}
                      className="row-checkbox"
                    />
                  </th>
                  <th className="py-3 px-4 w-28">Type</th>
                  <th className="py-3 px-4">Smart list name</th>
                  <th className="py-3 px-4">Shared with</th>
                  <th className="py-3 px-4 text-right pr-6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {filtered.map((list) => (
                  <tr
                    key={list.id}
                    className={`transition-colors group ${
                      selected.has(list.id) ? 'bg-blue-50/40' : 'hover:bg-slate-50/80'
                    }`}
                  >
                    <td className="py-3 px-4 text-center">
                      <input
                        type="checkbox"
                        checked={selected.has(list.id)}
                        onChange={() => toggleSelect(list.id)}
                        className="row-checkbox"
                      />
                    </td>
                    <td className="py-3 px-4">
                      {list.dealer_name ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-semibold">
                          Dealer
                        </span>
                      ) : (
                        <span className="text-slate-400">--</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900">
                      {list.name}
                      {list.dealer_name && (
                        <span className="ml-2 text-[10px] text-slate-400 font-normal">
                          → {list.dealer_name}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          list.shared_all
                            ? 'bg-blue-100 text-blue-700'
                            : list.shared_user_ids.length > 0
                            ? 'bg-indigo-100 text-indigo-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {list.shared_all
                          ? 'All users'
                          : list.shared_user_ids.length > 0
                          ? `${list.shared_user_ids.length} user${list.shared_user_ids.length === 1 ? '' : 's'}`
                          : 'Private'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right pr-6">
                      <div className="flex items-center justify-end space-x-3 text-slate-400">
                        <button
                          onClick={() => duplicate(list)}
                          title="Duplicate / Copy"
                          className="hover:text-slate-700 transition-colors"
                        >
                          <FaCopy />
                        </button>
                        <button
                          onClick={() => openShare(list)}
                          title="Share Smart List"
                          className="hover:text-slate-700 transition-colors"
                        >
                          <FaShareNodes />
                        </button>
                        <button
                          onClick={() => openEdit(list)}
                          title="Edit"
                          className="hover:text-slate-700 transition-colors"
                        >
                          <FaRegPenToSquare />
                        </button>
                        <button
                          onClick={() => remove(list)}
                          title="Delete"
                          className="hover:text-red-600 transition-colors"
                        >
                          <FaRegTrashCan />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-end text-xs text-slate-500 gap-6">
          <div className="flex items-center gap-2">
            <span>Rows per page</span>
            <select className="bg-white border border-slate-300 text-slate-700 rounded px-2 py-0.5 focus:outline-none focus:border-emerald-500">
              <option value="20" selected>
                20
              </option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>
          <div>
            1 - {filtered.length} of {filtered.length}
          </div>
          <div className="flex items-center space-x-1">
            <button disabled className="px-2.5 py-1 text-slate-300 rounded border border-slate-200 cursor-not-allowed">
              Previous
            </button>
            <button className="px-2.5 py-1 bg-white border border-blue-500 text-blue-600 font-semibold rounded shadow-xs">
              1
            </button>
            <button disabled className="px-2.5 py-1 text-slate-300 rounded border border-slate-200 cursor-not-allowed">
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Create / Edit modal */}
      {editOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 border border-slate-200">
            <div className="flex items-center justify-between pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                  <FaBars />
                </div>
                <h3 className="text-sm font-bold text-slate-800">
                  {editTarget.list ? `Edit smart list "${editTarget.list.name}"` : 'Create smart list'}
                </h3>
              </div>
              <button onClick={() => setEditOpen(false)} className="text-slate-400 hover:text-slate-600">
                <FaXmark className="text-sm" />
              </button>
            </div>
            <div className="mt-2 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Smart list name
                </label>
                <input
                  type="text"
                  value={editTarget.name}
                  onChange={(e) => setEditTarget((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Rawalpindi"
                  className={inputCls}
                  autoFocus
                />
              </div>
            </div>
            <div className="mt-6 flex items-center justify-end space-x-2">
              <button
                onClick={() => setEditOpen(false)}
                className="px-4 py-1.5 text-xs text-slate-600 border border-slate-300 bg-white hover:bg-slate-50 font-medium rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                className="px-4 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold rounded-md shadow-xs transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share modal */}
      {shareOpen && shareTarget && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 border border-slate-200">
            <div className="flex items-center justify-between pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                  <FaBars />
                </div>
                <h3 className="text-sm font-bold text-slate-800">
                  Share "{shareTarget.list.name}" with
                </h3>
              </div>
              <button onClick={() => setShareOpen(false)} className="text-slate-400 hover:text-slate-600">
                <FaXmark className="text-sm" />
              </button>
            </div>

            <div className="mt-2 p-3 bg-blue-50/70 border border-blue-100 rounded-lg text-[11px] text-blue-600 space-y-1">
              <div className="flex items-center gap-1.5">
                <FaPlus className="text-[9px]" />
                <span>Global lists are shared with all users</span>
              </div>
              <div className="flex items-center gap-1.5">
                <FaPlus className="text-[9px]" />
                <span>Only admins can change global list settings</span>
              </div>
              <div className="flex items-center gap-1.5">
                <FaPlus className="text-[9px]" />
                <span>Only admins can modify filters for global lists</span>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <label className="flex items-center gap-2 text-xs font-normal text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={shareTarget.sharedAll}
                  onChange={() =>
                    setShareTarget((prev) =>
                      prev ? { ...prev, sharedAll: !prev.sharedAll } : prev
                    )
                  }
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span>Share with all users</span>
              </label>

              <div className="pl-2 space-y-1.5 pt-1 border-t border-slate-100">
                <label className="flex items-center justify-between text-xs text-slate-700 cursor-pointer py-1 hover:bg-slate-50 px-1 rounded">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={
                        staff.length > 0 && staff.every((s) => shareTarget.selected.has(s.id))
                      }
                      onChange={toggleShareAllUsers}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="font-semibold">Select all users</span>
                  </div>
                </label>
                {staff.map((s) => (
                  <label
                    key={s.id}
                    className="flex items-center justify-between text-xs text-slate-700 cursor-pointer py-1 hover:bg-slate-50 px-1 rounded"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={shareTarget.selected.has(s.id)}
                        onChange={() => toggleShareUser(s.id)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>
                        {s.full_name}{' '}
                        <span className="text-slate-400">
                          ({s.user_type === 'Admin' ? 'Admin' : s.user_type === 'Dealer' ? 'Dealer' : 'Follower'})
                        </span>
                      </span>
                    </div>
                  </label>
                ))}
                {staff.length === 0 && (
                  <p className="px-1 py-2 text-xs text-slate-400">No other users to share with.</p>
                )}
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end space-x-2">
              <button
                onClick={() => setShareOpen(false)}
                className="px-4 py-1.5 text-xs text-slate-600 border border-slate-300 bg-white hover:bg-slate-50 font-medium rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveShare}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md shadow-xs transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageSmartListsPage;
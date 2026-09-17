import { useCallback, useEffect, useState } from 'react';
import type { IconType } from 'react-icons';
import {
  FaArrowsRotate,
  FaCalculator,
  FaCircleInfo,
  FaClock,
  FaClockRotateLeft,
  FaComment,
  FaDiagramProject,
  FaDollarSign,
  FaDownload,
  FaEnvelope,
  FaEye,
  FaKey,
  FaListUl,
  FaKeyboard,
  FaLocationDot,
  FaMagnifyingGlass,
  FaPaperPlane,
  FaPhone,
  FaStar,
  FaPeopleArrows,
  FaPlus,
  FaReceipt,
  FaRegCalendar,
  FaRegCalendarCheck,
  FaRegFileLines,
  FaRegPenToSquare,
  FaRegSquareCheck,
  FaRegTrashCan,
  FaRegUser,
  FaRotate,
  FaUserPlus,
  FaUpRightFromSquare,
  FaWandMagicSparkles,
  FaWhatsapp,
  FaXmark,
} from 'react-icons/fa6';
import { api, documentFileUrl, type Appointment, type ContactDocument, type Note, type Opportunity, type TaskItem } from '../api';
import { logActivity, loadContactActivities, useContactActivities, type ActivityEntry, type ActivityType } from '../data/activityLog';
import AddOpportunityModal, { type OpportunityFormData } from './AddOpportunityModal';
import BookAppointmentModal from './BookAppointmentModal';
import NewBookingModal from './NewBookingModal';
import UploadDocumentsModal from './UploadDocumentsModal';
import {
  AddCompanyDrawer,
  AssociationsDrawer,
  CreateTaskNoteDrawer,
  NotesDrawer,
  TasksDrawer,
  type Company,
} from './RightSidebarDrawers';

type PanelId = 'activity' | 'associations' | 'opportunities' | 'tasks' | 'notes' | 'appointments' | 'documents' | 'payments' | 'ai';

interface RightSidebarProps {
  contactId: number;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  panel: string | null;
  onTogglePanel: (panel: string) => void;
  onClosePanel: () => void;
  onNotify: (msg: string) => void;
  className?: string;
}

interface DockItem {
  id: PanelId;
  label: string;
  icon: IconType;
}

interface DocumentItem {
  id: number;
  name: string;
  size: number;
  mime: string;
  tab: 'internal' | 'sent' | 'received';
  uploadedAt: string;
}

const DOCUMENT_MAX_BYTES = 10 * 1024 * 1024;

const formatDocSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error(`Could not read ${file.name}`));
    reader.readAsDataURL(file);
  });

const mapDocuments = (rows: ContactDocument[]): DocumentItem[] =>
  rows.map((d) => ({
    id: d.id,
    name: d.name,
    size: Number(d.size) || 0,
    mime: d.mime,
    tab: d.tab === 'sent' || d.tab === 'received' ? d.tab : 'internal',
    uploadedAt: d.created_at
      ? new Date(d.created_at).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : '',
  }));

const dockItems: DockItem[] = [
  { id: 'activity', label: 'Activity', icon: FaClockRotateLeft },
  { id: 'associations', label: 'Associations', icon: FaDiagramProject },
  { id: 'opportunities', label: 'Opportunities', icon: FaPeopleArrows },
  { id: 'tasks', label: 'Tasks', icon: FaRegSquareCheck },
  { id: 'notes', label: 'Notes', icon: FaRegPenToSquare },
  { id: 'appointments', label: 'Appointments', icon: FaRegCalendar },
  { id: 'documents', label: 'Documents', icon: FaRegFileLines },
  { id: 'payments', label: 'Payments', icon: FaDollarSign },
  { id: 'ai', label: 'AI Assistant', icon: FaWandMagicSparkles },
];

function PanelHeader({
  title,
  sub,
  right,
  onClose,
}: {
  title: string;
  sub?: string;
  right?: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="px-4 py-3 bg-white border-b border-slate-200 flex items-center justify-between flex-shrink-0">
      <div className="flex items-center space-x-2">
        <h3 className="font-bold text-slate-800 text-sm">{title}</h3>
        {sub && <span className="text-slate-400 text-xs font-normal">{sub}</span>}
      </div>
      <div className="flex items-center space-x-2 text-xs text-slate-400">
        {right}
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition ml-1">
          <FaXmark className="text-sm" />
        </button>
      </div>
    </div>
  );
}

function EmptyState({
  icon,
  title,
  desc,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-4 my-auto">
      <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 text-xl mb-3 shadow-sm">
        {icon}
      </div>
      <h4 className="font-bold text-slate-700 text-xs mb-1">{title}</h4>
      <p className="text-[11px] text-slate-500 mb-4 leading-relaxed max-w-[220px]">{desc}</p>
      {children}
    </div>
  );
}

const ACTIVITY_META: Record<ActivityType, { icon: React.ReactNode; className: string }> = {
  form: { icon: <FaRegFileLines className="text-[11px]" />, className: 'bg-blue-100 text-blue-600 border-blue-200' },
  email: { icon: <FaEnvelope className="text-[10px]" />, className: 'bg-sky-100 text-sky-600 border-sky-200' },
  whatsapp: { icon: <FaWhatsapp className="text-[11px]" />, className: 'bg-emerald-100 text-emerald-600 border-emerald-200' },
  sms: { icon: <FaComment className="text-[11px]" />, className: 'bg-green-100 text-green-600 border-green-200' },
  call: { icon: <FaPhone className="text-[10px]" />, className: 'bg-slate-100 text-slate-600 border-slate-200' },
  contact: { icon: <FaUserPlus className="text-[10px]" />, className: 'bg-purple-100 text-purple-600 border-purple-200' },
  delete: { icon: <FaRegTrashCan className="text-[10px]" />, className: 'bg-rose-100 text-rose-600 border-rose-200' },
  smartlist: { icon: <FaListUl className="text-[10px]" />, className: 'bg-indigo-100 text-indigo-600 border-indigo-200' },
  task: { icon: <FaRegSquareCheck className="text-[10px]" />, className: 'bg-slate-100 text-slate-600 border-slate-200' },
  note: { icon: <FaRegPenToSquare className="text-[10px]" />, className: 'bg-amber-100 text-amber-600 border-amber-200' },
  appointment: { icon: <FaRegCalendar className="text-[10px]" />, className: 'bg-sky-100 text-sky-600 border-sky-200' },
  document: { icon: <FaRegFileLines className="text-[10px]" />, className: 'bg-amber-100 text-amber-700 border-amber-200' },
  opportunity: { icon: <FaPeopleArrows className="text-[10px]" />, className: 'bg-purple-100 text-purple-600 border-purple-200' },
  company: { icon: <FaDiagramProject className="text-[10px]" />, className: 'bg-teal-100 text-teal-600 border-teal-200' },
  comment: { icon: <FaEye className="text-[10px]" />, className: 'bg-amber-100 text-amber-600 border-amber-200' },
  review: { icon: <FaStar className="text-[10px]" />, className: 'bg-yellow-100 text-yellow-600 border-yellow-200' },
};

const dayLabel = (ts: number) => {
  const d = new Date(ts);
  const today = new Date();
  const startOfDay = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diffDays = Math.round((startOfDay(today) - startOfDay(d)) / 86400000);
  if (diffDays <= 0) return 'TODAY';
  if (diffDays === 1) return 'YESTERDAY';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();
};

const timeLabel = (ts: number) => {
  const d = new Date(ts);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    const diffMin = Math.max(1, Math.round((now.getTime() - ts) / 60000));
    if (diffMin < 60) return `${diffMin} min ago`;
    return `${Math.round(diffMin / 60)} hr ago`;
  }
  return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
};

/** Full, detailed date & time, e.g. "Aug 14, 2026, 03:45 PM". */
const fullTimeLabel = (ts: number) =>
  new Date(ts).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

const groupActivities = (list: ActivityEntry[]) => {
  const groups: { label: string; items: ActivityEntry[] }[] = [];
  for (const a of list) {
    const label = dayLabel(a.createdAt);
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.items.push(a);
    else groups.push({ label, items: [a] });
  }
  return groups;
};

function RightSidebar({
  contactId,
  contactName,
  contactEmail,
  contactPhone,
  panel,
  onTogglePanel,
  onClosePanel,
  onNotify,
  className,
}: RightSidebarProps) {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [opps, setOpps] = useState<Opportunity[]>([]);
  const [appts, setAppts] = useState<Appointment[]>([]);
  const [loaded, setLoaded] = useState<Record<string, boolean>>({});

  const [apptTab, setApptTab] = useState<'upcoming' | 'past'>('past');
  const [docTab, setDocTab] = useState('all');
  const [payTab, setPayTab] = useState('invoices');
  const [apptAddMenu, setApptAddMenu] = useState(false);
  const [payAddMenu, setPayAddMenu] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const activityList = useContactActivities(contactId);
  const [companies, setCompanies] = useState<Company[]>([
    {
      id: 1,
      name: 'Expert Builders & Developers',
      phone: '+92 333 5702065',
      email: 'evee@gmail.com',
      website: 'evee.com',
      address: '',
      state: '',
      city: '',
      description: '',
      postalCode: '',
      country: 'Pakistan',
    },
  ]);
  const [companyDrawerOpen, setCompanyDrawerOpen] = useState(false);
  const [taskNoteDrawer, setTaskNoteDrawer] = useState<{ mode: 'task' | 'note'; open: boolean }>({
    mode: 'task',
    open: false,
  });

  const [oppModalOpen, setOppModalOpen] = useState(false);
  const [apptModalOpen, setApptModalOpen] = useState(false);

  const [aiMessages, setAiMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([]);
  const [aiInput, setAiInput] = useState('');

  const load = useCallback(
    async (kind: 'tasks' | 'notes' | 'opportunities' | 'appointments' | 'activity' | 'documents') => {
      try {
        if (kind === 'activity') {
          await loadContactActivities(contactId);
        }
        if (kind === 'tasks') setTasks((await api.listTasks(contactId)).data);
        if (kind === 'notes') setNotes((await api.listNotes(contactId)).data);
        if (kind === 'opportunities') setOpps((await api.listOpportunities(contactId)).data);
        if (kind === 'appointments') setAppts((await api.listAppointments(contactId)).data);
        if (kind === 'documents') setDocuments(mapDocuments((await api.listDocuments(contactId)).data));
      } catch (err) {
        onNotify(`Failed to load ${kind}: ${(err as Error).message}`);
      } finally {
        setLoaded((prev) => ({ ...prev, [kind]: true }));
      }
    },
    [contactId, onNotify]
  );

  useEffect(() => {
    if (!panel) return;
    if (
      ['tasks', 'notes', 'opportunities', 'appointments', 'activity', 'documents'].includes(panel) &&
      !loaded[panel]
    ) {
      load(panel as 'tasks' | 'notes' | 'opportunities' | 'appointments' | 'activity' | 'documents');
    }
  }, [panel, loaded, load]);

  const openAddTask = () => setTaskNoteDrawer({ mode: 'task', open: true });

  const openAddNote = () => setTaskNoteDrawer({ mode: 'note', open: true });

  const submitTaskNote = async (
    title: string,
    description: string,
    options?: { dueDate?: string; color?: string; attachments?: string[]; associatedTo?: string }
  ) => {
    try {
      if (taskNoteDrawer.mode === 'task') {
        await api.createTask(contactId, { title, status: 'Pending', due_date: options?.dueDate || 'Today, 5:00 PM' });
        await load('tasks');
        onNotify('Task added successfully!');
        logActivity({ type: 'task', title: 'Task created', detail: title, contactId });
      } else {
        await api.createNote(contactId, {
          title,
          content: description || title,
          note_color: options?.color || '',
          attachments: options?.attachments ?? [],
          associated_to: options?.associatedTo || '',
        });
        await load('notes');
        onNotify('Note added successfully!');
        logActivity({ type: 'note', title: 'Note added', detail: title, contactId });
      }
      setTaskNoteDrawer((prev) => ({ ...prev, open: false }));
    } catch (err) {
      onNotify(`Failed to save: ${(err as Error).message}`);
    }
  };

  const saveCompany = (c: Omit<Company, 'id'>) => {
    setCompanies((prev) => [...prev, { ...c, id: Date.now() }]);
    setCompanyDrawerOpen(false);
    onNotify('Company added successfully!');
    logActivity({ type: 'company', title: 'Company added', detail: c.name, contactId });
  };

  const removeCompany = (id: number) => {
    setCompanies((prev) => prev.filter((c) => c.id !== id));
    onNotify('Association removed');
  };

  const deleteTask = async (id: number) => {
    try {
      await api.deleteTask(id);
      await load('tasks');
      onNotify('Task removed');
      logActivity({ type: 'delete', title: 'Task deleted', detail: tasks.find((t) => t.id === id)?.title, contactId });
    } catch (err) {
      onNotify(`Failed to delete task: ${(err as Error).message}`);
    }
  };

  const deleteNote = async (id: number) => {
    try {
      await api.deleteNote(id);
      await load('notes');
      onNotify('Note deleted');
      logActivity({ type: 'delete', title: 'Note deleted', detail: notes.find((n) => n.id === id)?.title, contactId });
    } catch (err) {
      onNotify(`Failed to delete note: ${(err as Error).message}`);
    }
  };

  const saveOpportunity = async (data: OpportunityFormData) => {
    await api.createOpportunity(contactId, {
      name: data.name,
      pipeline: data.pipeline,
      stage: data.stage,
      status: data.status,
      value: data.value,
      business_name: data.business_name,
      source: data.source,
      expected_close_date: data.expected_close_date,
      tags: data.tags,
    });
    await load('opportunities');
    setOppModalOpen(false);
    onNotify('Opportunity created successfully!');
    logActivity({ type: 'opportunity', title: 'Opportunity created', detail: data.name, contactId });
  };

  const deleteOpportunity = async (id: number) => {
    try {
      await api.deleteOpportunity(id);
      await load('opportunities');
      onNotify('Opportunity deleted');
      logActivity({ type: 'delete', title: 'Opportunity deleted', detail: opps.find((o) => o.id === id)?.name, contactId });
    } catch (err) {
      onNotify(`Failed to delete opportunity: ${(err as Error).message}`);
    }
  };

  const saveAppointment = async (data: Record<string, string>) => {
    await api.createAppointment(contactId, {
      title: data.title,
      calendar: data.calendar,
      host: data.user,
      date: data.date,
      start_time: data.start_time,
      end_time: data.end_time,
      location: data.location,
      status: data.status,
      notes: data.notes,
      category: 'past',
    });
    await load('appointments');
    setApptModalOpen(false);
    setApptAddMenu(false);
    setApptTab('past');
    onNotify('Appointment booked successfully and saved in Past Appointments!');
    logActivity({ type: 'appointment', title: 'Appointment booked', detail: `${data.title} for ${contactName}`, contactId });
  };

  const deleteAppointment = async (id: number) => {
    try {
      await api.deleteAppointment(id);
      await load('appointments');
      onNotify('Appointment deleted');
      logActivity({ type: 'delete', title: 'Appointment deleted', detail: appts.find((a) => a.id === id)?.title, contactId });
    } catch (err) {
      onNotify(`Failed to delete appointment: ${(err as Error).message}`);
    }
  };

  const commitDocs = async (files: File[]) => {
    if (files.length === 0) return;
    const oversized = files.filter((f) => f.size > DOCUMENT_MAX_BYTES);
    if (oversized.length > 0) {
      onNotify(`Skipped (max 10 MB): ${oversized.map((f) => f.name).join(', ')}`);
    }
    const accepted = files.filter((f) => f.size <= DOCUMENT_MAX_BYTES);
    if (accepted.length === 0) return;

    try {
      for (const file of accepted) {
        const data = await readFileAsDataUrl(file);
        await api.createDocument(contactId, {
          name: file.name,
          size: file.size,
          mime: file.type || 'application/octet-stream',
          tab: 'internal',
          data,
        });
      }
      await load('documents');
      onNotify(`Uploaded ${accepted.length} document${accepted.length === 1 ? '' : 's'}`);
      logActivity({
        type: 'document',
        title: `Document${accepted.length === 1 ? '' : 's'} uploaded`,
        detail: accepted.map((d) => d.name).join(', '),
        contactId,
      });
    } catch (err) {
      onNotify(`Upload failed: ${(err as Error).message}`);
    }
  };

  const handleModalUpload = (files: File[]) => {
    setUploadModalOpen(false);
    void commitDocs(files);
  };

  const removeDoc = async (id: number) => {
    const target = documents.find((d) => d.id === id);
    try {
      await api.deleteDocument(id);
      await load('documents');
      onNotify('Document removed');
      logActivity({ type: 'delete', title: 'Document removed', detail: target?.name, contactId });
    } catch (err) {
      onNotify(`Failed to delete document: ${(err as Error).message}`);
    }
  };

  const openDoc = (id: number) => {
    window.open(documentFileUrl(id), '_blank', 'noopener,noreferrer');
  };

  const downloadDoc = (doc: DocumentItem) => {
    const link = document.createElement('a');
    link.href = documentFileUrl(doc.id, true);
    link.download = doc.name;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const [rentalModalOpen, setRentalModalOpen] = useState(false);

  const createRental = () => {
    setApptAddMenu(false);
    setRentalModalOpen(true);
  };

  const saveRental = async (data: {
    title: string;
    calendar: string;
    host: string;
    date: string;
    start_time: string;
    end_time: string;
    location: string;
    status: string;
    notes: string;
    category: string;
  }) => {
    try {
      await api.createAppointment(contactId, {
        title: data.title,
        calendar: data.calendar,
        host: data.host,
        date: data.date,
        start_time: data.start_time,
        end_time: data.end_time,
        location: data.location,
        status: data.status,
        notes: data.notes,
        category: data.category,
      });
      await load('appointments');
      setApptTab('past');
      onNotify('Rental booking created successfully in Past Appointments');
      logActivity({ type: 'appointment', title: 'Rental booked', detail: `${data.title} for ${contactName}`, contactId });
    } catch (err) {
      onNotify(`Failed to create rental: ${(err as Error).message}`);
    }
  };

  const sendAiPrompt = () => {
    const text = aiInput.trim();
    if (!text) return;
    setAiMessages((prev) => [...prev, { role: 'user', text }]);
    setAiInput('');
    window.setTimeout(() => {
      setAiMessages((prev) => [
        ...prev,
        { role: 'ai', text: `Processing your request: "${text}". Action updated on CRM contact details!` },
      ]);
    }, 600);
  };

  const filteredAppts = appts.filter((a) => a.category === apptTab);

  const formatDate = (d: string) => {
    if (!d) return '';
    const parts = d.split('-');
    if (parts.length === 3) {
      const dateObj = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
    return d;
  };

  const tabCls = (active: boolean) =>
    `py-1 rounded ${active ? 'text-slate-800 bg-white shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'} text-center transition truncate`;

  const renderPanels = () => {
    switch (panel) {
      case 'activity': {
        const activityGroups = groupActivities(activityList);
        return (
          <div className="flex flex-col h-full">
            <PanelHeader
              title="Activity"
              sub={`(${activityList.length})`}
              onClose={onClosePanel}
              right={
                <button
                  title="Refresh"
                  onClick={() => onNotify(`${activityList.length} activity entries`)}
                >
                  <FaArrowsRotate className="text-xs" />
                </button>
              }
            />
            <div className="flex-1 overflow-y-auto p-4 text-xs">
              {activityList.length === 0 ? (
                <p className="text-[11px] text-slate-400 text-center py-12">
                  No activity yet. Actions you take across the CRM will appear here.
                </p>
              ) : (
                <div className="space-y-4">
                  {activityGroups.map((group, gi) => (
                    <div key={gi}>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                        {group.label}
                      </div>
                      <div className="space-y-3">
                        {group.items.map((a) => {
                          const meta = ACTIVITY_META[a.type] ?? ACTIVITY_META.contact;
                          return (
                            <div key={a.id} className="flex items-start space-x-2.5">
                              <div
                                className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 border ${meta.className}`}
                              >
                                {meta.icon}
                              </div>
                              <div className="flex-1 space-y-0.5 min-w-0">
                                <div className="font-bold text-slate-800 text-[11px]">{a.title}</div>
                                {a.detail && (
                                  <p className="text-slate-600 text-[11px] whitespace-pre-line break-words">{a.detail}</p>
                                )}
                                <span className="text-[10px] text-slate-400 block text-right">
                                  {a.type === 'form' ? fullTimeLabel(a.createdAt) : timeLabel(a.createdAt)}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      }

      case 'associations':
        return (
          <AssociationsDrawer
            companies={companies}
            onClose={onClosePanel}
            onOpenAddCompany={() => setCompanyDrawerOpen(true)}
            onNotify={onNotify}
            onRemoveCompany={removeCompany}
          />
        );

      case 'opportunities':
        return (
          <div className="flex flex-col h-full">
            <PanelHeader
              title="Opportunities"
              onClose={onClosePanel}
              right={
                <button
                  onClick={() => setOppModalOpen(true)}
                  className="text-slate-600 hover:text-blue-600 font-semibold flex items-center gap-1 transition"
                >
                  <FaPlus className="text-[10px]" /> Add
                </button>
              }
            />
            <div className="flex-1 overflow-y-auto p-4 flex flex-col">
              {opps.length === 0 ? (
                <EmptyState
                  icon={<FaPeopleArrows />}
                  title="No Opportunities Yet"
                  desc="Track your opportunities by creating or linking an opportunity"
                >
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => setOppModalOpen(true)}
                      className="px-3 py-1.5 bg-white border border-slate-300 hover:border-slate-400 rounded-md text-xs font-semibold text-slate-700 shadow-sm transition"
                    >
                      Create new
                    </button>
                    <button
                      onClick={() => onNotify('Linking existing opportunity...')}
                      className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-md text-xs font-semibold transition border border-blue-100"
                    >
                      Link existing
                    </button>
                  </div>
                </EmptyState>
              ) : (
                <div className="space-y-3">
                  {opps.map((o) => (
                    <div key={o.id} className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm space-y-2 hover:border-blue-300 transition">
                      <div className="flex items-start justify-between">
                        <div>
                          <h5 className="font-bold text-slate-800 text-xs">{o.name}</h5>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {o.business_name} • {contactName}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200">
                            {o.status}
                          </span>
                          <button
                            onClick={() => deleteOpportunity(o.id)}
                            className="text-[#94A3B8] hover:text-red-500 p-1 transition-colors"
                            title="Delete opportunity"
                          >
                            <FaRegTrashCan className="text-xs" />
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-[11px] pt-1 border-t border-slate-100 text-slate-600">
                        <div>
                          <strong>Pipeline:</strong> {o.pipeline}
                        </div>
                        <div>
                          <strong>Stage:</strong> {o.stage}
                        </div>
                        <div>
                          <strong>Value:</strong> {o.value}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case 'tasks':
        return (
          <TasksDrawer
            tasks={tasks}
            onClose={onClosePanel}
            onAddTask={openAddTask}
            onDeleteTask={deleteTask}
            onNotify={onNotify}
          />
        );

      case 'notes':
        return (
          <NotesDrawer notes={notes} onClose={onClosePanel} onAddNote={openAddNote} onDeleteNote={deleteNote} />
        );

      case 'appointments':
        return (
          <div className="flex flex-col h-full">
            <PanelHeader
              title="Appointments"
              onClose={onClosePanel}
              right={
                <div className="relative">
                  <button
                    onClick={() => setApptAddMenu((v) => !v)}
                    className="text-slate-600 hover:text-blue-600 font-semibold flex items-center gap-1 transition py-0.5 px-2 rounded hover:bg-slate-100"
                  >
                    <FaPlus className="text-[10px]" />
                    <span>Add</span>
                  </button>
                  {apptAddMenu && (
                    <div className="absolute right-0 top-8 bg-white border border-slate-200 rounded-xl shadow-xl py-2 w-72 z-40 text-xs">
                      <div className="px-3 py-1 mb-1 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Select Appointment Type
                      </div>
                      <button
                        onClick={() => {
                          setApptAddMenu(false);
                          setApptModalOpen(true);
                        }}
                        className="w-full text-left px-3 py-2.5 hover:bg-blue-50/60 flex items-start gap-3 text-slate-700 transition"
                      >
                        <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <FaRegCalendarCheck className="text-base" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-800 text-xs">Meetings</span>
                            <span className="bg-blue-100 text-blue-700 text-[9px] font-semibold px-1.5 py-0.5 rounded-full">
                              Standard
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 leading-tight mt-0.5">
                            Book a 1-on-1 meeting or consultation with client
                          </p>
                        </div>
                      </button>
                      <button
                        onClick={createRental}
                        className="w-full text-left px-3 py-2.5 hover:bg-amber-50/60 flex items-start gap-3 text-slate-700 transition border-t border-slate-100"
                      >
                        <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <FaKey className="text-sm" />
                        </div>
                        <div>
                          <span className="font-bold text-slate-800 text-xs block">Rentals</span>
                          <p className="text-[10px] text-slate-500 leading-tight mt-0.5">
                            Create a rental booking for the client
                          </p>
                        </div>
                      </button>
                    </div>
                  )}
                </div>
              }
            />
            <div className="p-3 border-b border-slate-100 bg-slate-50/50 flex-shrink-0 space-y-2.5">
              <div className="relative flex items-center">
                <FaMagnifyingGlass className="absolute left-2.5 text-slate-400 text-xs" />
                <input
                  type="text"
                  placeholder="Search by Calendar Name"
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-md text-xs focus:outline-none focus:border-blue-500 placeholder-slate-400"
                />
              </div>
              <div className="grid grid-cols-2 bg-slate-200/60 p-0.5 rounded-md text-xs font-medium text-slate-600">
                <button
                  onClick={() => setApptTab('upcoming')}
                  className={tabCls(apptTab === 'upcoming')}
                >
                  Upcoming
                </button>
                <button onClick={() => setApptTab('past')} className={tabCls(apptTab === 'past')}>
                  Past
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 flex flex-col">
              {filteredAppts.length === 0 ? (
                <EmptyState
                  icon={<FaRegCalendar />}
                  title="No appointments yet"
                  desc="Keep things moving by creating your first appointment."
                >
                  <button
                    onClick={() => setApptAddMenu(true)}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
                  >
                    <FaPlus className="text-[10px]" />
                    <span>Add Appointment</span>
                  </button>
                </EmptyState>
              ) : (
                <div className="space-y-3">
                  {filteredAppts.map((a) => (
                    <div
                      key={a.id}
                      className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm space-y-2 hover:border-blue-300 transition relative"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-600 border border-slate-200 mb-1">
                            {a.calendar}
                          </span>
                          <h5 className="font-bold text-slate-800 text-xs">{a.title}</h5>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            a.status === 'Cancelled'
                              ? 'bg-red-50 text-red-600 border border-red-200'
                              : 'bg-blue-50 text-blue-600 border border-blue-200'
                          }`}
                        >
                          {a.status}
                        </span>
                      </div>
                      <div className="space-y-1 text-[11px] text-slate-600 pt-1 border-t border-slate-100">
                        <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                          <FaClock className="text-blue-500 text-[10px]" />
                          <span>
                            {formatDate(a.date) || a.date}, {a.start_time} - {a.end_time}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <FaLocationDot className="text-slate-400 text-[10px]" />
                          <span>{a.location}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <FaRegUser className="text-slate-400 text-[10px]" />
                          <span>Host: {a.host}</span>
                        </div>
                      </div>
                      <div className="pt-2 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-100 mt-1">
                        <span className="text-emerald-600 font-medium">
                          Saved in {a.category.toUpperCase()}
                        </span>
                        <button onClick={() => deleteAppointment(a.id)} className="text-slate-400 hover:text-red-500 transition">
                          <FaRegTrashCan />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case 'documents': {
        const visibleDocs = documents.filter((d) => docTab === 'all' || d.tab === docTab);
        return (
          <div className="flex flex-col h-full">
            <PanelHeader
              title="Documents"
              onClose={onClosePanel}
              right={
                <button
                  onClick={() => setUploadModalOpen(true)}
                  className="text-slate-600 hover:text-blue-600 font-semibold flex items-center gap-1 transition"
                >
                  <FaPlus className="text-[10px]" /> Add
                </button>
              }
            />
            <div className="p-3 border-b border-slate-100 bg-slate-50/50 flex-shrink-0 space-y-2.5">
              <div className="relative flex items-center">
                <FaMagnifyingGlass className="absolute left-2.5 text-slate-400 text-xs" />
                <input
                  type="text"
                  placeholder="Search by document name"
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-md text-xs focus:outline-none focus:border-blue-500 placeholder-slate-400"
                />
              </div>
              <div className="grid grid-cols-4 bg-slate-200/60 p-0.5 rounded-md text-[11px] font-medium text-slate-600">
                {['all', 'internal', 'sent', 'received'].map((t) => (
                  <button
                    key={t}
                    onClick={() => setDocTab(t)}
                    className={tabCls(docTab === t)}
                  >
                    {t === 'all' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {visibleDocs.length === 0 ? (
                <EmptyState
                  icon={<FaRegFileLines />}
                  title="No documents yet"
                  desc="Upload or send documents to see them listed here."
                >
                  <button
                    onClick={() => setUploadModalOpen(true)}
                    className="px-3 py-1.5 bg-white border border-slate-300 hover:border-slate-400 rounded-md text-xs font-semibold text-slate-700 shadow-sm transition"
                  >
                    Add documents
                  </button>
                </EmptyState>
              ) : (
                <div className="space-y-2">
                  {visibleDocs.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center gap-3 p-2.5 bg-white border border-slate-200 rounded-lg shadow-sm"
                    >
                      <div className="w-9 h-9 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 flex-shrink-0">
                        <FaRegFileLines className="text-sm" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-800 truncate">{doc.name}</p>
                        <p className="text-[10px] text-slate-400">
                          {formatDocSize(doc.size)} · {doc.uploadedAt}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => openDoc(doc.id)}
                          className="text-slate-400 hover:text-blue-600 transition p-1"
                          title="Open"
                          aria-label="Open document"
                        >
                          <FaUpRightFromSquare className="text-xs" />
                        </button>
                        <button
                          onClick={() => downloadDoc(doc)}
                          className="text-slate-400 hover:text-emerald-600 transition p-1"
                          title="Download"
                          aria-label="Download document"
                        >
                          <FaDownload className="text-xs" />
                        </button>
                        <button
                          onClick={() => removeDoc(doc.id)}
                          className="text-slate-400 hover:text-red-500 transition p-1"
                          aria-label="Delete document"
                          title="Delete"
                        >
                          <FaRegTrashCan className="text-xs" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      }

      case 'payments':
        return (
          <div className="flex flex-col h-full">
            <PanelHeader
              title="Payments"
              onClose={onClosePanel}
              right={
                <div className="relative">
                  <button
                    onClick={() => setPayAddMenu((v) => !v)}
                    className="text-slate-600 hover:text-blue-600 font-semibold flex items-center gap-1 transition py-0.5"
                  >
                    <FaPlus className="text-[10px]" />
                    <span>Add</span>
                  </button>
                  {payAddMenu && (
                    <div className="absolute right-0 top-7 bg-white border border-slate-200 rounded-lg shadow-xl py-1.5 w-48 z-40 text-xs">
                      {['Send invoice', 'Send estimate', 'Create recurring invoice', 'Create subscription', 'Record payment'].map(
                        (a) => (
                          <button
                            key={a}
                            onClick={() => {
                              setPayAddMenu(false);
                              onNotify(`Action selected: ${a}`);
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700 font-medium transition"
                          >
                            {a === 'Send invoice' && <FaRegFileLines className="text-slate-400 w-4 text-center" />}
                            {a === 'Send estimate' && <FaCalculator className="text-slate-400 w-4 text-center text-[11px]" />}
                            {a === 'Create recurring invoice' && <FaRotate className="text-slate-400 w-4 text-center text-[10px]" />}
                            {a === 'Create subscription' && <FaRegCalendarCheck className="text-slate-400 w-4 text-center" />}
                            {a === 'Record payment' && <FaReceipt className="text-slate-400 w-4 text-center" />}
                            <span>{a}</span>
                          </button>
                        )
                      )}
                    </div>
                  )}
                </div>
              }
            />
            <div className="p-3 border-b border-slate-100 bg-slate-50/50 flex-shrink-0 space-y-2.5">
              <div className="relative flex items-center">
                <FaMagnifyingGlass className="absolute left-2.5 text-slate-400 text-xs" />
                <input
                  type="text"
                  placeholder="Search by Title"
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-md text-xs focus:outline-none focus:border-blue-500 placeholder-slate-400"
                />
              </div>
              <div className="grid grid-cols-4 bg-slate-200/60 p-0.5 rounded-md text-[10px] font-medium text-slate-600">
                {['invoices', 'estimates', 'subscriptions', 'transactions'].map((t) => (
                  <button key={t} onClick={() => setPayTab(t)} className={tabCls(payTab === t)}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 flex flex-col">
              <EmptyState
                icon={<FaDollarSign />}
                title="No payments found"
                desc="Keep track of payments, invoices, estimates, subscriptions, and transactions created for this contact."
              >
                <button
                  onClick={() => setPayAddMenu((v) => !v)}
                  className="px-3 py-1.5 bg-white border border-slate-300 hover:border-slate-400 rounded-md text-xs font-semibold text-slate-700 shadow-sm transition"
                >
                  Add payment
                </button>
              </EmptyState>
            </div>
          </div>
        );

      case 'ai':
        return (
          <div className="flex flex-col h-full">
            <PanelHeader
              title="Ask AI Assistant"
              onClose={onClosePanel}
              right={
                <span className="flex items-center space-x-2">
                  <FaWandMagicSparkles className="text-indigo-600 text-sm" />
                </span>
              }
            />
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
              {aiMessages.length === 0 && (
                <div className="bg-indigo-50/80 border border-indigo-100 rounded-lg p-3 text-xs text-indigo-900 leading-relaxed">
                  Hi! I&apos;m your CRM AI Assistant. Ask me to draft a message for {contactName}, summarize
                  interaction history, or create a new task!
                </div>
              )}
              {aiMessages.map((m, i) =>
                m.role === 'user' ? (
                  <div key={i} className="bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 ml-6 text-right shadow-sm font-medium">
                    {m.text}
                  </div>
                ) : (
                  <div key={i} className="bg-indigo-50 border border-indigo-100 rounded-lg p-2.5 text-xs text-indigo-900 leading-relaxed mr-6 shadow-sm">
                    <FaWandMagicSparkles className="inline mr-1 text-indigo-600" />
                    {m.text}
                  </div>
                )
              )}
            </div>
            <div className="p-3 bg-white border-t border-slate-200 flex-shrink-0">
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendAiPrompt()}
                  placeholder="Ask AI something..."
                  className="w-full pr-8 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-xs focus:outline-none focus:border-indigo-500"
                />
                <button onClick={sendAiPrompt} className="absolute right-2 text-indigo-600 hover:text-indigo-800">
                  <FaPaperPlane className="text-xs" />
                </button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`relative flex gap-2 items-stretch w-full lg:w-auto flex-1 lg:flex-none min-h-0 lg:flex-shrink-0 ${className ?? ''}`}>
      <div
        className={`bg-white rounded-lg border border-slate-200 flex flex-col overflow-hidden shadow-sm transition-all duration-300 ${
          panel ? 'flex-1 min-w-0 lg:flex-none lg:w-[340px] opacity-100' : 'w-0 opacity-0 border-0 flex-none'
        }`}
      >
        {renderPanels()}
      </div>

      <div className="w-10 bg-white rounded-lg border border-slate-200 flex flex-col items-center py-2 space-y-2 text-slate-400 text-xs shadow-sm z-30 flex-shrink-0">
        {dockItems.map(({ id, label, icon: Icon }) => {
          const active = panel === id;
          return (
            <button
              key={id}
              onClick={() => onTogglePanel(id)}
              title={label}
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition ${
                active
                  ? 'bg-blue-50 text-blue-600 hover:bg-blue-100 shadow-sm font-semibold'
                  : 'hover:bg-slate-100 hover:text-slate-600'
              }`}
            >
              <Icon className="text-xs" />
            </button>
          );
        })}

        <div className="mt-auto space-y-2 flex flex-col items-center pt-2 border-t border-slate-100 w-full">
          <button title="Info" className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 flex items-center justify-center">
            <FaCircleInfo className="text-xs" />
          </button>
          <button title="Keyboard" className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 flex items-center justify-center">
            <FaKeyboard className="text-xs" />
          </button>
        </div>
      </div>

      {oppModalOpen && (
        <AddOpportunityModal
          contactName={contactName}
          email={contactEmail}
          phone={contactPhone}
          onClose={() => setOppModalOpen(false)}
          onSave={saveOpportunity}
        />
      )}

      {apptModalOpen && (
        <BookAppointmentModal
          contactName={contactName}
          phone={contactPhone}
          onClose={() => setApptModalOpen(false)}
          onSave={saveAppointment}
        />
      )}

      {rentalModalOpen && (
        <NewBookingModal
          contactName={contactName}
          contactPhone={contactPhone}
          contactEmail={contactEmail}
          onClose={() => setRentalModalOpen(false)}
          onSave={saveRental}
        />
      )}

      {uploadModalOpen && (
        <UploadDocumentsModal
          onClose={() => setUploadModalOpen(false)}
          onUpload={handleModalUpload}
        />
      )}

      {companyDrawerOpen && (
        <AddCompanyDrawer
          open={companyDrawerOpen}
          onClose={() => setCompanyDrawerOpen(false)}
          onSave={saveCompany}
        />
      )}

      {taskNoteDrawer.open && (
        <CreateTaskNoteDrawer
          mode={taskNoteDrawer.mode}
          open={taskNoteDrawer.open}
          contactName={contactName}
          onClose={() => setTaskNoteDrawer((prev) => ({ ...prev, open: false }))}
          onSubmit={submitTaskNote}
          opportunities={opps.map((o) => ({ id: o.id, name: o.name }))}
          companies={companies.map((c) => ({ id: c.id, name: c.name }))}
        />
      )}
    </div>
  );
}

export default RightSidebar;

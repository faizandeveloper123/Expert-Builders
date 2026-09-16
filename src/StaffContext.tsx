import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { api, type ApiStaffUser, type StaffInput } from './api';

interface StaffContextValue {
  staff: ApiStaffUser[];
  loading: boolean;
  reload: () => Promise<void>;
  addStaff: (input: StaffInput) => Promise<ApiStaffUser | null>;
  updateStaff: (id: number, input: StaffInput) => Promise<void>;
  removeStaff: (id: number) => Promise<void>;
}

const StaffContext = createContext<StaffContextValue | null>(null);

export function StaffProvider({ children }: { children: React.ReactNode }) {
  const [staff, setStaff] = useState<ApiStaffUser[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    try {
      const res = await api.listStaff();
      setStaff(res.data);
    } catch {
      setStaff([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const addStaff = useCallback(
    async (input: StaffInput): Promise<ApiStaffUser | null> => {
      const res = await api.createStaff(input);
      await reload();
      const found = staff.find((s) => s.id === res.data.id) ?? null;
      return found;
    },
    [reload, staff]
  );

  const updateStaff = useCallback(
    async (id: number, input: StaffInput) => {
      await api.updateStaff(id, input);
      await reload();
    },
    [reload]
  );

  const removeStaff = useCallback(
    async (id: number) => {
      await api.deleteStaff(id);
      await reload();
    },
    [reload]
  );

  const value = useMemo(
    () => ({ staff, loading, reload, addStaff, updateStaff, removeStaff }),
    [staff, loading, reload, addStaff, updateStaff, removeStaff]
  );

  return <StaffContext.Provider value={value}>{children}</StaffContext.Provider>;
}

export function useStaff(): StaffContextValue {
  const ctx = useContext(StaffContext);
  if (!ctx) throw new Error('useStaff must be used within a StaffProvider');
  return ctx;
}
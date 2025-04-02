import { create } from 'zustand';

interface FilteredRows {
  companyIds: string[];
  setIds: (ids: string[]) => void;
}

export const useIds = create<FilteredRows>()((set) => ({
  companyIds: [],
  setIds: (ids) => set({ companyIds: ids }),
}));

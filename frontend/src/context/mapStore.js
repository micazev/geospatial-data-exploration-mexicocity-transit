import { create } from 'zustand';

export const useMapStore = create((set) => ({
  filters: {
    modes: [],
    hour: null,
    district: null,
  },
  selectedRoute: null,
  selectedStop: null,
  loading: false,
  mapData: null,

  setModes: (modes) =>
    set((state) => ({
      filters: { ...state.filters, modes },
    })),

  setHour: (hour) =>
    set((state) => ({
      filters: { ...state.filters, hour },
    })),

  setDistrict: (district) =>
    set((state) => ({
      filters: { ...state.filters, district },
    })),

  setSelectedRoute: (route) =>
    set({ selectedRoute: route }),

  setSelectedStop: (stop) =>
    set({ selectedStop: stop }),

  setLoading: (loading) =>
    set({ loading }),

  setMapData: (data) =>
    set({ mapData: data }),

  resetFilters: () =>
    set({
      filters: { modes: [], hour: null, district: null },
      selectedRoute: null,
      selectedStop: null,
    }),
}));

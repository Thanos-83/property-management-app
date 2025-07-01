// store/sidebarSlice.ts
import { createSlice } from '@reduxjs/toolkit';

interface SidebarState {
  open: boolean;
}
const initialState: SidebarState = { open: true };

export const sidebarSlice = createSlice({
  name: 'sidebar',
  initialState,
  reducers: {
    toggleSidebar(state) {
      state.open = !state.open;
    },
    setOpen(state, action) {
      state.open = action.payload;
    },
  },
});

export const { toggleSidebar, setOpen } = sidebarSlice.actions;
export default sidebarSlice.reducer;

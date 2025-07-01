// store/sidebarSlice.ts
import { createSlice } from '@reduxjs/toolkit';

interface SidebarState {
  openUrlModal: boolean;
}
const initialState: SidebarState = { openUrlModal: false };

export const listingsSlice = createSlice({
  name: 'listings',
  initialState,
  reducers: {
    setOpenUrlModal(state, action) {
      state.openUrlModal = action.payload;
    },
  },
});

export const { setOpenUrlModal } = listingsSlice.actions;
export default listingsSlice.reducer;

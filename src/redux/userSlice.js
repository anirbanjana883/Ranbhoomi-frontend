import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { serverUrl } from "../App"; 


export const fetchUser = createAsyncThunk(
  "user/fetchUser",
  async (_, { rejectWithValue }) => {
    try {

      const response = await axios.get(`${serverUrl}/api/user/getcurrentuser`, {
        withCredentials: true, 
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || "Login failed");
    }
  }
);

const userSlice = createSlice({
  name: "user",
  initialState: {
    userData: null,
    loading: true, 
    error: null,
  },
  reducers: {
    setUserData: (state, action) => {
      state.userData = action.payload;
      state.loading = false; 
    },
    logout: (state) => {
      state.userData = null;
      state.loading = false;
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder

      .addCase(fetchUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUser.fulfilled, (state, action) => {
        state.userData = action.payload;
        state.loading = false;
      })
      .addCase(fetchUser.rejected, (state, action) => {
        state.loading = false; 
        state.userData = null;
        state.error = action.payload;
      });
  },
});

export const { setUserData, logout } = userSlice.actions;
export default userSlice.reducer;
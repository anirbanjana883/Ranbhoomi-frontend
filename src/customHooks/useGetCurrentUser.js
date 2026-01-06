import { useEffect } from "react";
import axios from "axios";
import { serverUrl } from "../App";
import { useDispatch } from "react-redux";
import { setUserData } from "../redux/userSlice";

// Rename to 'useGetCurrentUser' (Hooks must start with 'use')
const useGetCurrentUser = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const result = await axios.get(`${serverUrl}/api/user/getcurrentuser`, {
          withCredentials: true,
        });
        
        // Success: User is logged in
        dispatch(setUserData(result.data));
      } catch (error) {
        // 2. Fix Status Code: Check for 401 (Unauthorized)
        // This is what your backend sends when the token is missing/invalid
        if (error.response?.status === 401) {
          dispatch(setUserData(null)); // User is guest, this is normal
        } else {
          // Only log REAL errors (like 500 Server Error or Network Error)
          console.error("Error fetching user:", error);
        }
      }
    };

    fetchUser();
  }, [dispatch]);
};

export default useGetCurrentUser;
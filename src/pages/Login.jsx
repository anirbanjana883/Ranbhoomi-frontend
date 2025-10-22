import React, { useState } from "react";
import logo from "../assets/ranbhoomi_main.png";
import { FaRegEye, FaRegEyeSlash, FaGoogle } from "react-icons/fa6";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { serverUrl } from "../App";
import ClipLoader from "react-spinners/ClipLoader";
import { toast } from "react-toastify";
import { useDispatch } from "react-redux";
import { setUserData } from "../redux/userSlice";
import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "../../utils/firebase";

function Login() {
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleLogin = async () => {
    setLoading(true);
    try {
      const result = await axios.post(
        serverUrl + "/api/auth/login",
        { email, password },
        { withCredentials: true }
      );
      dispatch(setUserData(result.data));
      toast.success("Login Successfully");
      navigate("/");
    } catch (error) {
      if (error.response) {
        toast.error(error.response.data.message || "Login failed");
      } else if (error.request) {
        toast.error("No response from server. Please try again.");
      } else {
        toast.error("Error: " + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = async () => {
    try {
      const response = await signInWithPopup(auth, provider);
      const user = response.user;
      const { displayName: name, email } = user;
      const result = await axios.post(
        serverUrl + "/api/auth/googleauth",
        // Sending "user" as role since an empty string might cause issues.
        { name, email, role: "user" },
        { withCredentials: true }
      );
      dispatch(setUserData(result.data));
      navigate("/");
      toast.success("Login Successfully");
    } catch (error) {
      console.log(error);
      toast.error(error?.response?.data?.message || error.message || "Login failed");
    }
  };

  return (
    <div className="w-full min-h-screen relative bg-[#000000] text-[#D3D3D3] flex items-center justify-center p-4">
      {/* Background Gradient */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,rgba(255,69,0,0.15)_0%,#000000_70%)]"></div>

      <div className="relative z-10 w-full max-w-4xl flex rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(255,69,0,0.3)] border border-[#FF4500]/30">
        {/* Left Side: Form */}
        <div className="w-full lg:w-1/2 bg-black/50 backdrop-blur-xl p-8 sm:p-12 flex flex-col justify-center">
          <div className="w-full">
            <h1 className="font-bold text-3xl text-[#FF4500]">Welcome Back</h1>
            <h2 className="text-[#D3D3D3] text-base mt-1">Login to your <span className="text-orange-400">RANBHOOMI</span> account</h2>

            <form
              className="mt-8 flex flex-col gap-4"
              onSubmit={(e) => {
                e.preventDefault();
                handleLogin();
              }}
            >
              {/* Email Input */}
              <div className="flex flex-col gap-1">
                <label htmlFor="email" className="font-semibold text-[#D3D3D3] text-sm">Email</label>
                <input
                  id="email"
                  type="email"
                  className="w-full p-3 bg-black/30 text-[#D3D3D3] placeholder-gray-500 border border-[#FF4500]/40 rounded-lg 
                             focus:outline-none focus:border-[#FF4500] focus:ring-2 focus:ring-[#FF4500]/50 transition-all"
                  placeholder="your.email@example.com"
                  required
                  onChange={(e) => setEmail(e.target.value)}
                  value={email}
                />
              </div>

              {/* Password Input */}
              <div className="flex flex-col gap-1">
                <label htmlFor="password" className="font-semibold text-[#D3D3D3] text-sm">Password</label>
                <div className="relative w-full">
                  <input
                    id="password"
                    type={show ? "text" : "password"}
                    className="w-full p-3 pr-12 bg-black/30 text-[#D3D3D3] placeholder-gray-500 border border-[#FF4500]/40 rounded-lg 
                                 focus:outline-none focus:border-[#FF4500] focus:ring-2 focus:ring-[#FF4500]/50 transition-all"
                    placeholder="Enter your password"
                    required
                    onChange={(e) => setPassword(e.target.value)}
                    value={password}
                  />
                  <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#FFD700]" onClick={() => setShow(!show)}>
                    {show ? <FaRegEye className="w-5 h-5" /> : <FaRegEyeSlash className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <span className="text-sm text-gray-500 text-right cursor-pointer hover:text-[#FFD700]" onClick={() => navigate("/forget")}>
                Forgot Password?
              </span>

              <button
                className="w-full p-3 mt-4 bg-[#FF4500] text-black font-bold rounded-lg flex items-center justify-center
                           transition-all duration-300 hover:bg-[#E03E00] hover:shadow-[0_0_20px_rgba(255,69,0,0.7)]
                           disabled:bg-[#FF4500]/50 disabled:cursor-not-allowed"
                disabled={loading}
                type="submit"
              >
                {loading ? <ClipLoader size={24} color="black" /> : "Login"}
              </button>

              <div className="w-full flex items-center gap-4 my-2">
                <div className="flex-grow h-px bg-[#FF4500]/30"></div>
                <span className="text-gray-500 text-sm">OR</span>
                <div className="flex-grow h-px bg-[#FF4500]/30"></div>
              </div>

              <button
                type="button"
                className="w-full p-3 bg-zinc-900/60 text-[#D3D3D3] font-semibold rounded-lg flex items-center justify-center gap-3
                           border border-gray-700 transition-all duration-300 hover:bg-zinc-800/80 hover:border-[#FFD700]"
                onClick={googleLogin}
              >
                <FaGoogle className="text-lg" />
                Continue with Google
              </button>

              <p className="text-sm text-gray-500 text-center mt-4">
                Don't have an account?
                <span className="font-semibold text-[#FFD700] cursor-pointer ml-2 hover:underline" onClick={() => navigate("/signup")}>
                  Sign Up
                </span>
              </p>
            </form>
          </div>
        </div>

        {/* Right Side: Branding */}
        <div className="hidden lg:flex w-1/2 bg-black items-center justify-center p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <img src={logo} alt="AetherLearn Logo" className="w-200 shadow-2xl " />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
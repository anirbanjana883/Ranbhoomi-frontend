import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/ranbhoomi_main.png";
import { FaRegEye, FaRegEyeSlash, FaGoogle } from "react-icons/fa6";
import axios from "axios";
import { serverUrl } from "../../App";
import { toast } from "react-toastify";
import ClipLoader from "react-spinners/ClipLoader";
import { useDispatch } from "react-redux";
import { setUserData } from "../../redux/userSlice";
import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "../../../utils/firebase";

function SignUp() {
  const [show, setShow] = useState(false);
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // const [role, setRole] = useState("user");
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await axios.post(
        serverUrl + "/api/auth/signup",
        { name, password, email },
        { withCredentials: true }
      );
      dispatch(setUserData(result.data));
      navigate("/");
      toast.success("Signup Successfully");
    } catch (error) {
      console.log(error);
      toast.error(error.response.data.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  const googleSignUp = async () => {
    try {
      const response = await signInWithPopup(auth, provider);
      const user = response.user;
      const { displayName: name, email } = user;
      // You have 'role' commented out in state, but it's used here.
      // This might cause an error. I'll pass "user" as a default.
      // If you re-enable your role selector, this will use its state.
      const result = await axios.post(
        serverUrl + "/api/auth/googleauth",
        { name, email, role: "user" }, // Changed 'role' to 'role: "user"'
        { withCredentials: true }
      );
      dispatch(setUserData(result.data));
      navigate("/");
      toast.success("Signup Successfully");
    } catch (error) {
      console.log(error);
      toast.error(error.response?.data?.message || "Signup failed");
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
            <h1 className="font-bold text-3xl text-[#FF4500]">Let's Get Started</h1>
            <h2 className="text-[#D3D3D3] text-base mt-1">Create your <span className="text-orange-400">RANBHOOMI</span> account</h2>

            <form className="mt-8 flex flex-col gap-4" onSubmit={handleSignup}>
              {/* Name, Email, Password Inputs */}
              {[
                { id: "name", type: "text", label: "Name", value: name, action: setName, placeholder: "Your Full Name" },
                { id: "email", type: "email", label: "Email", value: email, action: setEmail, placeholder: "your.email@example.com" },
                { id: "password", type: show ? "text" : "password", label: "Password", value: password, action: setPassword, placeholder: "Create a strong password" }
              ].map(field => (
                <div key={field.id} className="flex flex-col gap-1">
                  <label htmlFor={field.id} className="font-semibold text-[#D3D3D3] text-sm">{field.label}</label>
                  <div className="relative w-full">
                    <input
                      id={field.id}
                      type={field.type}
                      className="w-full p-3 pr-12 bg-black/30 text-[#D3D3D3] placeholder-gray-500 border border-[#FF4500]/40 rounded-lg 
                                 focus:outline-none focus:border-[#FF4500] focus:ring-2 focus:ring-[#FF4500]/50 transition-all"
                      placeholder={field.placeholder}
                      required
                      onChange={(e) => field.action(e.target.value)}
                      value={field.value}
                    />
                    {field.id === "password" && (
                      <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#FFD700]" onClick={() => setShow(!show)}>
                        {show ? <FaRegEye className="w-5 h-5" /> : <FaRegEyeSlash className="w-5 h-5" />}
                      </button>
                    )}
                  </div>
                </div>
              ))}
              
              {/* Role Selection (Styling updated inside comments) */}
              {/* <div className="flex flex-col gap-2 mt-2">
                <label className="font-semibold text-[#D3D3D3] text-sm">I am a...</label>
                <div className="flex gap-4">
                    {["student", "educator"].map(r => (
                        <button
                            key={r}
                            type="button"
                            onClick={() => setRole(r)}
                            className={`
                                px-4 py-2 rounded-md text-sm font-semibold transition-all duration-200 w-full
                                border ${role === r ? "border-[#FF4500] bg-[#FF4500]/50 text-white shadow-[0_0_15px_rgba(255,69,0,0.5)]" : "border-[#FF4500]/30 bg-black/50 text-[#D3D3D3] hover:bg-zinc-900/70"}
                            `}
                        >
                            {r.charAt(0).toUpperCase() + r.slice(1)}
                        </button>
                    ))}
                </div>
              </div> */}

              <button
                className="w-full p-3 mt-4 bg-[#FF4500] text-black font-bold rounded-lg flex items-center justify-center
                           transition-all duration-300 hover:bg-[#E03E00] hover:shadow-[0_0_20px_rgba(255,69,0,0.7)]
                           disabled:bg-[#FF4500]/50 disabled:cursor-not-allowed"
                disabled={loading}
                type="submit"
              >
                {loading ? <ClipLoader size={24} color="black" /> : "Create Account"}
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
                onClick={googleSignUp}
              >
                <FaGoogle className="text-lg" />
                Continue with Google
              </button>

              <p className="text-sm text-gray-500 text-center mt-4">
                Already have an account?
                <span className="font-semibold text-[#FFD700] cursor-pointer ml-2 hover:underline" onClick={() => navigate("/login")}>
                  Login
                </span>
              </p>
            </form>
          </div>
        </div>

        {/* Right Side: Branding */}
        <div className="hidden lg:flex w-1/2 bg-black items-center justify-center p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <img src={logo} alt="AetherLearn Logo" className="w-150 shadow-2xl " />
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignUp;
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { serverUrl } from "../App";
import { toast } from "react-toastify";
import ClipLoader from "react-spinners/ClipLoader";
import { FaRegEye, FaRegEyeSlash, FaArrowLeftLong } from "react-icons/fa6";

function ForgetPassowrd() {
  const [step, setStep] = useState(1);
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [conPassword, setConPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConPass, setShowConPass] = useState(false);

  const sendOtp = async () => {
    if (!email) {
    toast.error("Please enter your email.");
    return; // This stops the function from running further
  }
    setLoading(true);
    try {
      const result = await axios.post(
        serverUrl + "/api/auth/sendotp",
        { email },
        { withCredentials: true }
      );
      setLoading(false);
      setStep(2);
      toast.success(result.data.message);
    } catch (error) {
      toast.error(error.response?.data?.message || "OTP not sent");
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (!otp) {
    toast.error("Please enter the verification code.");
    return; // Stops the function
  }
    setLoading(true);
    try {
      const result = await axios.post(
        serverUrl + "/api/auth/verifyotp",
        { email, otp },
        { withCredentials: true }
      );
      setLoading(false);
      setStep(3);
      toast.success(result.data.message);
    } catch (error) {
      toast.error(error.response?.data?.message || "OTP not verified");
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    if (!newPassword || !conPassword) {
      toast.error("Please fill in both new password fields.");
      return; // Stops the function
    }
    if (newPassword !== conPassword) {
      return toast.error("Passwords do not match");
    }
    setLoading(true);
    try {
      const result = await axios.post(
        serverUrl + "/api/auth/resetpassword",
        { email, password: newPassword },
        { withCredentials: true }
      );
      setLoading(false);
      toast.success(result.data.message);
      navigate("/login"); // Navigate to login on success
    } catch (error) {
      toast.error(error.response?.data?.message || "Password reset failed");
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return {
          title: "Forgot Password",
          description: "Enter your email address to receive a verification code.",
          fields: [
            { id: "email", type: "email", label: "Email", value: email, action: setEmail, placeholder: "your.email@example.com" }
          ],
          buttonText: "Send OTP",
          action: sendOtp
        };
      case 2:
        return {
          title: "Enter OTP",
          description: `Enter the 4-digit code sent to ${email}.`,
          fields: [
            { id: "otp", type: "text", label: "Verification Code", value: otp, action: setOtp, placeholder: "1234" }
          ],
          buttonText: "Verify OTP",
          action: verifyOtp
        };
      case 3:
        return {
          title: "Reset Password",
          description: "Create a new, strong password for your account.",
          fields: [
            { id: "newPassword", type: showNewPass ? "text" : "password", label: "New Password", value: newPassword, action: setNewPassword, placeholder: "Enter new password", showToggle: true, showState: showNewPass, setShow: setShowNewPass },
            { id: "conPassword", type: showConPass ? "text" : "password", label: "Confirm New Password", value: conPassword, action: setConPassword, placeholder: "Confirm new password", showToggle: true, showState: showConPass, setShow: setShowConPass }
          ],
          buttonText: "Reset Password",
          action: resetPassword
        };
      default:
        return {};
    }
  };

  const { title, description, fields, buttonText, action } = renderStepContent();

  return (
    <div className="w-full min-h-screen relative bg-[#000000] text-[#D3D3D3] flex items-center justify-center p-4">
      {/* Background Gradient */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,rgba(255,69,0,0.15)_0%,#000000_70%)]"></div>
      
      <div className="relative z-10 w-full max-w-md bg-black/50 backdrop-blur-xl border border-[#FF4500]/30 rounded-2xl shadow-[0_0_50px_rgba(255,69,0,0.3)] overflow-hidden">
        {/* Progress Bar */}
        <div className="w-full bg-black/30 h-2.5">
          <div
            className="bg-gradient-to-r from-[#FFD700] to-[#FF4500] h-full transition-all duration-500 ease-out"
            style={{ width: `${(step / 3) * 100}%` }}
          ></div>
        </div>
        
        <div className="p-8">
          <div className="text-center mb-8">
            <h1 className="font-bold text-3xl text-[#FF4500]">{title}</h1>
            <p className="text-[#D3D3D3] text-base mt-2">{description}</p>
          </div>

          <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
            {fields.map(field => (
              <div key={field.id} className="relative">
                <label htmlFor={field.id} className="font-semibold text-[#D3D3D3] text-sm mb-1 block">{field.label}</label>
                <input
                  id={field.id}
                  type={field.type}
                  className="w-full p-3 pr-12 bg-black/30 text-[#D3D3D3] placeholder-gray-500 border border-[#FF4500]/40 rounded-lg 
                             transition-all duration-300
                             focus:outline-none focus:border-[#FF4500] focus:ring-2 focus:ring-[#FF4500]/50
                             focus:shadow-[0_0_20px_rgba(255,69,0,0.5)]"
                  placeholder={field.placeholder}
                  required
                  onChange={(e) => field.action(e.target.value)}
                  value={field.value}
                />
                {field.showToggle && (
                  <button type="button" className="absolute right-4 top-[42px] -translate-y-1/2 text-gray-500 hover:text-[#FFD700] transition-colors" onClick={() => field.setShow(!field.showState)}>
                    {field.showState ? <FaRegEye className="w-5 h-5" /> : <FaRegEyeSlash className="w-5 h-5" />}
                  </button>
                )}
              </div>
            ))}

            <button
              className="w-full p-3 mt-6 bg-[#FF4500] text-black font-bold rounded-lg flex items-center justify-center
                         transition-all duration-300 hover:bg-[#E03E00] hover:shadow-[0_0_20px_rgba(255,69,0,0.7)]
                         disabled:bg-[#FF4500]/50 disabled:cursor-not-allowed"
              disabled={loading}
              onClick={action}
            >
              {loading ? <ClipLoader size={24} color="black" /> : buttonText}
            </button>
          </form>

          <div className="text-center mt-6">
            <button
              onClick={() => navigate("/login")}
              className="text-sm text-gray-500 hover:text-[#FFD700] flex items-center justify-center gap-2 mx-auto transition-colors"
            >
              <FaArrowLeftLong />
              Back to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ForgetPassowrd;
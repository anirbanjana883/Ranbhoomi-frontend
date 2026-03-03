import React, { useEffect, useState, useRef } from "react";
import logo from "../assets/logo.png"; 
import { FaCode, FaUserCircle } from "react-icons/fa";
import { GrTrophy } from "react-icons/gr";
import { FaClipboardList, FaUsers } from "react-icons/fa6";
import { FaMapSigns } from "react-icons/fa";
import { TfiMenu } from "react-icons/tfi";
import { GiTireIronCross } from "react-icons/gi";
import { TbLogout } from "react-icons/tb";
import { IoPersonCircleSharp } from "react-icons/io5";
import { FaCrown } from "react-icons/fa"; 
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { serverUrl } from "../App";
import { setUserData } from "../redux/userSlice";
import { toast } from "react-toastify";
import axios from "axios";

// Define navigation links with icons
const navLinks = [
  { title: "Practice", path: "/practice", icon: <FaCode size={16} /> },
  { title: "Contests", path: "/contests", icon: <GrTrophy size={16} /> },
  { title: "Interview", path: "/interview", icon: <FaClipboardList size={16} /> },
  { title: "Community", path: "/community", icon: <FaUsers size={16} /> },
  { title: "Roadmaps", path: "/roadmaps", icon: <FaMapSigns size={16} /> },
];

function Nav() {
  const { userData } = useSelector((state) => state.user);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation(); 
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showHam, setShowHam] = useState(false);
  const profileRef = useRef(null);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [profileRef]);

  const handleLogOut = async () => {
    try {
      await axios.get(serverUrl + "/api/auth/logout", {
        withCredentials: true,
      });
      dispatch(setUserData(null));
      setShowProfileDropdown(false);
      setShowHam(false);
      navigate("/");
      toast.success("Logout Successfully");
    } catch (error) {
      console.log(error);
      toast.error(error.response?.data?.message || "Logout failed");
    }
  };

  const handleMobileNav = (path) => {
    navigate(path);
    setShowHam(false);
  };

  // --- PREMIUM FROSTED GLASS STYLES ---

  // Ultra-sleek glassy floating island
  const glassIslandStyle = `
    bg-zinc-950/40 backdrop-blur-xl 
    border border-white/10 
    shadow-[0_8px_32px_rgba(0,0,0,0.5)]
    transition-all duration-300
  `;

  // Standard Link (Glass hover effect)
  const commonLinkStyles = `
    flex items-center gap-2 px-4 py-2 rounded-md font-medium text-sm
    text-zinc-300 bg-transparent 
    transition-all duration-200
    hover:text-white hover:bg-white/10 hover:shadow-sm cursor-pointer
  `;
  
  // Active Link (Frosted active state with TUF Red Accent)
  const activeLinkStyles = `
    flex items-center gap-2 px-4 py-2 rounded-md font-semibold text-sm
    text-red-400 bg-white/10 
    border border-white/5 
    shadow-inner cursor-pointer
  `;

  // Mobile link styles 
  const mobileLinkStyles =
    "flex items-center gap-4 text-2xl font-semibold text-zinc-300 transition-colors duration-200 hover:text-white";

  // --- HELPER: Dynamic Premium Ring Styles ---
  const getProfileStyles = (plan) => {
    switch (plan) {
      case "Gladiator":
        return "border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)] bg-amber-500/10 text-amber-400"; 
      case "Warrior":
        return "border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)] bg-red-500/10 text-red-400"; 
      default: 
        return "border-white/10 bg-white/5 text-zinc-200 hover:border-white/20 hover:bg-white/10"; 
    }
  };

  const profileRingClass = userData 
    ? getProfileStyles(userData.subscriptionPlan)
    : "border-white/10 bg-white/5 text-zinc-200 hover:border-white/20 hover:bg-white/10";

  return (
    <>
      {/* ####### Desktop: Frosted Glass Navbar ####### */}
      <div className="hidden lg:flex fixed top-5 left-0 w-full z-50 px-6 justify-center items-center pointer-events-none">
        
        <div className="flex items-center gap-4 pointer-events-auto">
          {/* Left: Logo Box */}
          <div 
            onClick={() => navigate("/")}
            className={`w-12 h-12 rounded-xl cursor-pointer flex items-center justify-center ${glassIslandStyle} hover:bg-zinc-950/60`}
          >
            <img src={logo} alt="Logo" className="w-8 h-8 object-contain" />
          </div>

          {/* Center: Nav Island */}
          <nav className={`flex items-center gap-1 p-1.5 rounded-xl ${glassIslandStyle}`}>
            {navLinks.map((link) => {
              const isActive = location.pathname.startsWith(link.path);
              return (
                <button
                  key={link.title}
                  onClick={() => navigate(link.path)}
                  className={isActive ? activeLinkStyles : commonLinkStyles}
                >
                  {React.cloneElement(link.icon, {
                    className: isActive ? 'text-red-400' : 'text-zinc-400'
                  })}
                  <span>{link.title}</span>
                </button>
              );
            })}

            {/* --- PREMIUM UPGRADE BUTTONS --- */}
            {userData && (
              <>
                <div className="w-px h-5 bg-white/10 mx-2"></div>
                
                {/* Go Pro Button (Free Plan) */}
                {userData.subscriptionPlan === "Free" && (
                  <button
                    onClick={() => navigate("/premium")}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md font-bold text-xs uppercase tracking-wider text-white bg-gradient-to-r from-red-600 to-red-500 hover:shadow-[0_0_15px_rgba(239,68,68,0.4)] transition-all ml-1"
                  >
                    <FaCrown size={12} className="text-white" /> Go Pro
                  </button>
                )}

                {/* Status Badge (Paid Plans) */}
                {userData.subscriptionPlan !== "Free" && (
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border backdrop-blur-md ml-1 ${
                    userData.subscriptionPlan === "Gladiator" ? "border-amber-500/30 bg-amber-500/10 text-amber-400" : "border-red-500/30 bg-red-500/10 text-red-400"
                  }`}>
                    <FaCrown size={12} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">{userData.subscriptionPlan}</span>
                  </div>
                )}
              </>
            )}
          </nav>

          {/* Right: Profile Dropdown */}
          <div className="relative" ref={profileRef}>
            <div
              className={`w-12 h-12 rounded-xl cursor-pointer flex items-center justify-center overflow-hidden border backdrop-blur-xl transition-all duration-300 ${profileRingClass}`}
              onClick={() => setShowProfileDropdown((prev) => !prev)}
            >
              {userData?.photoUrl ? (
                <img src={userData.photoUrl} alt="profile" className="w-full h-full object-cover" />
              ) : userData ? (
                <span className="text-lg font-bold">{userData.name.charAt(0).toUpperCase()}</span>
              ) : (
                <IoPersonCircleSharp size={24} className="text-zinc-300" />
              )}
            </div>

            {/* Profile Dropdown Menu (Glassy) */}
            <div
              className={`absolute top-full right-0 mt-3 w-56 bg-zinc-900/60 backdrop-blur-2xl border border-white/10 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.6)] transition-all duration-300 origin-top-right
                         ${showProfileDropdown ? "opacity-100 scale-100 pointer-events-auto translate-y-0" : "opacity-0 scale-95 pointer-events-none -translate-y-2"}`}
            >
              {userData ? (
                <div className="p-1.5">
                  <div className="px-3 py-2.5 border-b border-white/10 mb-1">
                    <p className="text-sm font-semibold text-white truncate">{userData.name}</p>
                    <p className="text-xs text-zinc-400 truncate">{userData.email}</p>
                  </div>
                  <div className="space-y-0.5">
                    <button
                      onClick={() => {
                        navigate(`/profile/${userData.username}`);
                        setShowProfileDropdown(false);
                      }}
                      className="w-full flex items-center text-left px-3 py-2 rounded-md text-sm text-zinc-300 hover:bg-white/10 hover:text-white transition-all"
                    >
                      <FaUserCircle className="mr-2 text-zinc-400" size={14} /> My Profile
                    </button>
                    <button
                      onClick={handleLogOut}
                      className="w-full flex items-center text-left px-3 py-2 rounded-md text-sm text-zinc-300 hover:bg-white/10 hover:text-white transition-all"
                    >
                      <TbLogout className="mr-2 text-zinc-400" size={14} /> Logout
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-2">
                  <button
                    onClick={() => {
                      navigate("/login");
                      setShowProfileDropdown(false);
                    }}
                    className="w-full py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-semibold rounded-lg transition-colors shadow-[0_0_15px_rgba(239,68,68,0.3)]"
                  >
                    Login to Continue
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ####### Mobile Navigation (Frosted Glass) ####### */}
      <div className="lg:hidden w-full h-16 fixed top-0 px-4 flex items-center justify-between bg-zinc-950/50 backdrop-blur-xl border-b border-white/10 z-50 shadow-[0_4px_30px_rgba(0,0,0,0.3)]">
        <img
          src={logo}
          alt="Logo"
          className="w-8 object-contain cursor-pointer"
          onClick={() => navigate("/")}
        />
        <TfiMenu
          className="text-2xl text-zinc-200 cursor-pointer hover:text-white transition-colors"
          onClick={() => setShowHam(true)}
        />
      </div>

      {/* Mobile Flyout Menu (Frosted Glass) */}
      <div
        className={`fixed inset-0 w-full h-full bg-zinc-950/80 backdrop-blur-2xl z-[60] lg:hidden 
                    flex flex-col items-center justify-center gap-8
                    transition-transform duration-400 ease-[cubic-bezier(0.16,1,0.3,1)]
                    ${showHam ? "translate-x-0" : "translate-x-full"}`}
      >
        <GiTireIronCross
          className="text-2xl text-zinc-400 absolute top-5 right-5 cursor-pointer hover:text-white transition-colors"
          onClick={() => setShowHam(false)}
        />
        
        {/* Profile Pic Mobile */}
        {userData?.photoUrl ? (
          <img
            src={userData.photoUrl}
            alt="profile"
            className="w-20 h-20 rounded-full object-cover border-2 border-white/20 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
            onClick={() => handleMobileNav(`/profile/${userData.username}`)}
          />
        ) : userData ? (
          <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold border border-white/20 bg-white/5 text-white shadow-[0_0_20px_rgba(255,255,255,0.1)]"
               onClick={() => handleMobileNav(`/profile/${userData.username}`)}>
            {userData.name.charAt(0).toUpperCase()}
          </div>
        ) : (
          <IoPersonCircleSharp className="w-20 h-20 text-zinc-500" onClick={() => handleMobileNav("/login")}/>
        )}

        {/* Nav Links Mobile */}
        <nav className="flex flex-col items-center gap-6 w-full px-8">
          {navLinks.map((link) => {
            const isActive = location.pathname.startsWith(link.path);
            return (
              <button
                key={link.title}
                onClick={() => handleMobileNav(link.path)}
                className={isActive ? `${mobileLinkStyles} !text-red-400` : mobileLinkStyles}
              >
                {React.cloneElement(link.icon, { size: 24, className: isActive ? "text-red-400" : "text-zinc-400" })}
                <span>{link.title}</span>
              </button>
            );
          })}
        </nav>
        
        <div className="h-px w-1/2 bg-white/10 my-2"></div>
        
        {/* Auth Links Mobile */}
        {userData && (
          <button
            onClick={() => handleMobileNav(`/profile/${userData.username}`)}
            className={location.pathname.startsWith('/profile') ? `${mobileLinkStyles} !text-red-400` : mobileLinkStyles}
          >
            <FaUserCircle size={24} className={location.pathname.startsWith('/profile') ? "text-red-400" : "text-zinc-400"} />
            My Profile
          </button>
        )}

        {!userData ? (
          <button
            onClick={() => handleMobileNav("/login")}
            className="px-10 py-3 mt-4 bg-red-600 text-white text-lg font-semibold rounded-xl hover:bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.4)] transition-all hover:scale-105"
          >
            Login to Continue
          </button>
        ) : (
          <button
            onClick={handleLogOut}
            className="px-10 py-3 mt-4 bg-white/5 border border-white/10 text-zinc-300 text-lg font-semibold rounded-xl hover:bg-white/10 hover:text-white transition-all"
          >
            Logout
          </button>
        )}
      </div>
    </>
  );
}

export default Nav;
import React, { useState, useEffect, useRef } from "react";
import logo from "../assets/logo.png"; // Assuming this is your ranbhoomi logo
import { FaCode } from "react-icons/fa";
import { GrTrophy } from "react-icons/gr";
import { FaClipboardList } from "react-icons/fa";
import { FaUsers } from "react-icons/fa6";
import { FaMapSigns } from "react-icons/fa";
import { TfiMenu } from "react-icons/tfi";
import { GiTireIronCross } from "react-icons/gi";
import { FaUserCircle } from "react-icons/fa";
import { TbLogout } from "react-icons/tb";

import { IoPersonCircleSharp } from "react-icons/io5";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { serverUrl } from "../App";
import { setUserData } from "../redux/userSlice";
import { toast } from "react-toastify";
import axios from "axios";

// Define navigation links with icons
const navLinks = [
  { title: "Practice", path: "/practice", icon: <FaCode size={18} /> },
  { title: "Contests", path: "/contests", icon: <GrTrophy size={18} /> },
  { title: "Interview", path: "/interview", icon: <FaClipboardList size={18} /> },
  { title: "Community", path: "/community", icon: <FaUsers size={18} /> },
  { title: "Roadmaps", path: "/roadmaps", icon: <FaMapSigns size={18} /> },
];

function Nav() {
  const { userData } = useSelector((state) => state.user);
  const navigate = useNavigate();
  const dispatch = useDispatch();
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
      const result = await axios.get(serverUrl + "/api/auth/logout", {
        withCredentials: true,
      });
      dispatch(setUserData(null));
      setShowProfileDropdown(false);
      setShowHam(false);
      navigate("/");
      toast.success("Logout Successfully");
    } catch (error) {
      console.log(error);
      toast.error(error.response.data.message);
    }
  };

  const handleMobileNav = (path) => {
    navigate(path);
    setShowHam(false);
  };

  // Common styles
  const commonLinkStyles =
    "flex items-center gap-1.5 px-4 py-2 rounded-full font-medium text-[#D3D3D3] transition-all duration-300 transform hover:text-[#FF4500] hover:bg-[#FF4500]/20 hover:-translate-y-0.5 cursor-pointer";
  const mobileLinkStyles =
    "flex items-center gap-4 text-3xl font-bold text-[#D3D3D3] transition-all duration-300 transform hover:text-[#FF4500] hover:scale-105";

  // Base styles for the floating glass elements
  const glassIslandStyle = "bg-black/70 backdrop-blur-lg border border-[#FF4500]/30 transition-all duration-500 ease-in-out transform shadow-[0_0_40px_rgba(255,69,0,0.4)] hover:shadow-[0_0_50px_rgba(255,69,0,0.6)]";


  return (
    <>
      {/* ####### Desktop: Frosted Glass Dynamic Island (NEW STRUCTURE) ####### */}
      <div
        className="hidden lg:flex fixed top-3 left-0 w-full z-50 p-4 justify-center items-center"
      >
        {/* Left: Logo Circle */}
        <div className="pr-4">
          <img
            src={logo}
            alt="Ranbhoomi Logo"
            className={`w-14 h-14 rounded-full cursor-pointer p-1 ${glassIslandStyle} hover:scale-110`}
            onClick={() => navigate("/")}
          />
        </div>

        {/* Center: Nav Island */}
        <nav
          className={`flex items-center gap-2 p-2 rounded-full ${glassIslandStyle} hover:scale-[1.01]`}
        >
          {navLinks.map((link) => (
            <button
              key={link.title}
              onClick={() => navigate(link.path)}
              className={commonLinkStyles}
            >
              {link.icon}
              <span className="text-sm">{link.title}</span>
            </button>
          ))}
        </nav>

        {/* Right: Profile Circle */}
        <div className="relative pl-4" ref={profileRef}>
          <div
            className={`w-14 h-14 rounded-full cursor-pointer flex items-center justify-center ${glassIslandStyle} hover:scale-110`}
            onClick={() => setShowProfileDropdown((prev) => !prev)}
          >
            {userData?.photoUrl ? (
              <img
                src={userData.photoUrl}
                alt="profile"
                className="w-full h-full rounded-full object-cover" // Fills the glass parent
              />
            ) : userData ? (
              <div className="w-full h-full rounded-full text-white flex items-center justify-center text-xl font-bold"> {/* Fills the glass parent */}
                {userData.name.slice(0, 1).toUpperCase()}
              </div>
            ) : (
              <IoPersonCircleSharp className="w-10 h-10 text-gray-500 transition-colors duration-300 hover:text-[#FFD700]" /> // Icon inside the glass parent
            )}
          </div>

          {/* Profile Dropdown (Positioned relative to the circle) */}
          <div
            className={`absolute top-full right-0 mt-3 w-56 bg-black/70 backdrop-blur-xl border border-[#FF4500]/30 rounded-lg 
                        shadow-[0_0_30px_rgba(255,69,0,0.3)] transition-all duration-200 ease-out transform
                        ${showProfileDropdown ? "opacity-100 translate-y-0 scale-100" : "opacity-0 -translate-y-2 scale-95 pointer-events-none"}`}
          >
            {userData ? (
              <div className="p-2">
                <div className="px-3 py-2 border-b border-[#FF4500]/20">
                  <p className="text-sm font-semibold text-[#D3D3D3] truncate">
                    {userData.name}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {userData.email}
                  </p>
                </div>
                <div className="mt-2 space-y-1">
                  <button
                    onClick={() => {
                      navigate("/profile");
                      setShowProfileDropdown(false);
                    }}
                    className="w-full flex items-center text-left px-3 py-2 rounded-md text-sm text-[#D3D3D3] hover:bg-[#FF4500]/20 hover:text-[#FF4500] transition-colors"
                  >
                    <FaUserCircle className="mr-2" size={16} />
                    My Profile
                  </button>
                  <button
                    onClick={handleLogOut}
                    className="w-full flex items-center text-left px-3 py-2 rounded-md text-sm text-[#D3D3D3] hover:bg-[#FF4500]/20 hover:text-[#FF4500] transition-colors"
                  >
                    <TbLogout className="mr-2" size={16} />
                    Logout
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
                  className="w-full p-2 bg-[#FF4500] text-black text-sm font-bold rounded-lg flex items-center justify-center
                             transition-all duration-300 transform hover:bg-[#E03E00] hover:shadow-[0_0_15px_rgba(255,69,0,0.7)] hover:scale-105"
                >
                  Login
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ####### Mobile Navigation (Unchanged) ####### */}
      <div className="lg:hidden w-full h-20 fixed top-0 px-4 flex items-center justify-between bg-black/70 backdrop-blur-xl border-b border-[#FF4500]/30 z-50">
        <img
          src={logo}
          alt="Logo"
          className="w-14 rounded-md"
          onClick={() => navigate("/")}
        />
        <TfiMenu
          className="text-3xl text-[#FF4500] cursor-pointer"
          onClick={() => setShowHam(true)}
        />
      </div>

      {/* Mobile Flyout Menu (Unchanged) */}
      <div
        className={`fixed inset-0 w-full h-full bg-black/90 backdrop-blur-2xl z-[60] lg:hidden 
                   flex flex-col items-center justify-center gap-6
                   transition-transform duration-300 ease-in-out
                   ${showHam ? "translate-x-0" : "-translate-x-full"}`}
      >
        <GiTireIronCross
          className="text-4xl text-[#FF4500] absolute top-6 right-5 cursor-pointer"
          onClick={() => setShowHam(false)}
        />
        
        {/* Profile Pic */}
        {userData?.photoUrl ? (
          <img
            src={userData.photoUrl}
            alt="profile"
            className="w-20 h-20 rounded-full object-cover border-2 border-[#FF4500]"
            onClick={() => handleMobileNav("/profile")}
          />
        ) : userData ? (
          <div className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold border-2 border-[#FF4500] bg-gray-900"
               onClick={() => handleMobileNav("/profile")}>
            {userData.name.slice(0, 1).toUpperCase()}
          </div>
        ) : (
          <IoPersonCircleSharp className="w-20 h-20 text-gray-500" onClick={() => handleMobileNav("/login")}/>
        )}

        {/* Nav Links */}
        <nav className="flex flex-col items-center gap-4">
          {navLinks.map((link) => (
            <button
              key={link.title}
              onClick={() => handleMobileNav(link.path)}
              className={mobileLinkStyles}
            >
              {React.cloneElement(link.icon, { size: 28 })}
              <span>{link.title}</span>
            </button>
          ))}
        </nav>
        
        <div className="h-px w-2/3 bg-[#FF4500]/30 my-2"></div>
        
        {/* Auth Links */}
        {userData ? (
          <button
            onClick={() => handleMobileNav("/profile")}
            className={mobileLinkStyles}
          >
            <FaUserCircle  size={28} />
            My Profile
          </button>
        ) : null}

        {!userData ? (
          <button
            onClick={() => handleMobileNav("/login")}
            className="px-8 py-3 bg-[#FF4500] text-black text-xl font-bold rounded-lg transform transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-[#FF4500]/40"
          >
            Login
          </button>
        ) : (
          <button
            onClick={handleLogOut}
            className="px-8 py-3 bg-zinc-800 text-[#D3D3D3] text-xl font-bold rounded-lg transform transition-all duration-300 hover:scale-105 hover:bg-zinc-700"
          >
            Logout
          </button>
        )}
      </div>
    </>
  );
}

export default Nav;


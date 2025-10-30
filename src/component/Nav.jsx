import React, { useEffect, useState, useRef } from "react";
import logo from "../assets/logo.png"; // Assuming this is your ranbhoomi logo
import { FaCode, FaUserCircle } from "react-icons/fa";
import { GrTrophy } from "react-icons/gr";
import { FaClipboardList, FaUsers } from "react-icons/fa6";
import { FaMapSigns } from "react-icons/fa";
import { TfiMenu } from "react-icons/tfi";
import { GiTireIronCross } from "react-icons/gi";
import { TbLogout } from "react-icons/tb";
import { IoPersonCircleSharp } from "react-icons/io5";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom"; // 1. Import useLocation
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
  const location = useLocation(); // 2. Get location hook
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
      toast.error(error.response.data.message);
    }
  };

  const handleMobileNav = (path) => {
    navigate(path);
    setShowHam(false);
  };

  // --- 3. UPDATED STYLES ---

  // Base style for all glass islands
const glassIslandStyle = `
    bg-orange-1000/30       /* <-- Adjust this: More orange, more opaque for frosted look */
    backdrop-blur-xl       /* <-- Keep blur, maybe increase if desired */
    border border-orange-600/60 /* <-- Adjust: Stronger orange border */
    shadow-[0_0_25px_rgba(255,100,0,0.3)] /* <-- Adjust: Default glow is more orange and present */
    transition-all duration-300 ease-in-out transform
    hover:shadow-[0_0_45px_rgba(255,100,0,0.5)] hover:border-orange-500/80 /* <-- Adjust: Hover glow is stronger */
  `;

  // Style for links (not active)
 const commonLinkStyles = `
    flex items-center gap-1.5 px-4 py-2 rounded-full font-medium 
    text-orange-200       /* <-- Adjust: Default text color for frosted look */
    bg-transparent        /* <-- Ensure background is transparent to see glass */
    transition-all duration-300 transform
    hover:text-orange-100 hover:bg-orange-800/40 hover:-translate-y-0.5 cursor-pointer /* <-- Adjust hover state */
  `;
  
  // Style for the currently active link
const activeLinkStyles = `
    flex items-center gap-1.5 px-4 py-2 rounded-full font-semibold 
    text-orange-50         /* <-- Adjust: Highlighted text color */
    bg-orange-900/60        /* <-- Adjust: More opaque active background */
    border border-orange-500/80 /* <-- Adjust: Stronger active border */
    shadow-[0_0_20px_rgba(255,100,0,0.5),inset_0_1px_3px_rgba(255,100,0,0.3)] /* <-- Adjust: Stronger active glow */
    cursor-pointer -translate-y-0.5
  `;

  // Mobile link styles (unchanged)
  const mobileLinkStyles =
    "flex items-center gap-4 text-3xl font-bold text-[#D3D3D3] transition-all duration-300 transform hover:text-[#FF4500] hover:scale-105";

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
              // 4. Apply conditional styling
              className={
                location.pathname.startsWith(link.path)
                  ? activeLinkStyles
                  : commonLinkStyles
              }
            >
              {React.cloneElement(link.icon, {
                className: location.pathname.startsWith(link.path) ? 'text-orange-400' : ''
              })}
              <span className="text-sm">{link.title}</span>
            </button>
          ))}
        </nav>

        {/* Right: Profile Circle */}
        <div className="relative pl-4" ref={profileRef}>
          <div
            className={`w-14 h-14 rounded-full cursor-pointer flex items-center justify-center overflow-hidden ${glassIslandStyle} hover:scale-110`}
            onClick={() => setShowProfileDropdown((prev) => !prev)}
          >
            {userData?.photoUrl ? (
              <img
                src={userData.photoUrl}
                alt="profile"
                className="w-full h-full object-cover" // Fills the glass parent
              />
            ) : userData ? (
              // 5. Themed background for initial
              <div className="w-full h-full rounded-full text-white flex items-center justify-center text-2xl font-bold bg-orange-900/60">
                {userData.name.slice(0, 1).toUpperCase()}
              </div>
            ) : (
              <IoPersonCircleSharp className="w-10 h-10 text-orange-500/70 transition-colors duration-300 hover:text-orange-400" />
            )}
          </div>

          {/* Profile Dropdown (Refined Style) */}
          <div
            className={`absolute top-full right-0 mt-3 w-56 bg-gradient-to-b from-black via-gray-950/90 to-black backdrop-blur-xl 
                        border border-orange-700/50 rounded-lg 
                        shadow-[0_10px_40px_rgba(255,69,0,0.4)] transition-all duration-200 ease-out transform
                        ${showProfileDropdown ? "opacity-100 translate-y-0 scale-100" : "opacity-0 -translate-y-2 scale-95 pointer-events-none"}`}
          >
            {userData ? (
              <div className="p-2">
                <div className="px-3 py-2 border-b border-orange-700/30">
                  <p className="text-sm font-semibold text-gray-200 truncate">
                    {userData.name}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {userData.email}
                  </p>
                </div>
                <div className="mt-2 space-y-1">
                  <button
                    onClick={() => {
                      navigate(`/profile/${userData.username}`);
                      setShowProfileDropdown(false);
                    }}
                    className="w-full flex items-center text-left px-3 py-2 rounded-md text-sm text-gray-300 hover:bg-orange-900/50 hover:text-orange-300 transition-colors"
                  >
                    <FaUserCircle className="mr-2" size={16} />
                    My Profile
                  </button>
                  <button
                    onClick={handleLogOut}
                    className="w-full flex items-center text-left px-3 py-2 rounded-md text-sm text-gray-300 hover:bg-orange-900/50 hover:text-orange-300 transition-colors"
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
                  className="w-full p-2 bg-orange-600 text-white text-sm font-bold rounded-lg flex items-center justify-center
                                transition-all duration-300 transform hover:bg-orange-700 hover:shadow-[0_0_15px_rgba(255,69,0,0.7)] hover:scale-105"
                >
                  Login
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ####### Mobile Navigation (Refined Style) ####### */}
      <div className="lg:hidden w-full h-20 fixed top-0 px-4 flex items-center justify-between bg-black/80 backdrop-blur-xl border-b border-orange-700/40 z-50 shadow-[0_0_20px_rgba(255,69,0,0.3)]">
        <img
          src={logo}
          alt="Logo"
          className="w-14 rounded-md cursor-pointer"
          onClick={() => navigate("/")}
        />
        <TfiMenu
          className="text-3xl text-orange-500 cursor-pointer"
          onClick={() => setShowHam(true)}
        />
      </div>

      {/* Mobile Flyout Menu (Refined Style) */}
      <div
        className={`fixed inset-0 w-full h-full bg-black/80 backdrop-blur-2xl z-[60] lg:hidden 
                    flex flex-col items-center justify-center gap-6
                    transition-transform duration-300 ease-in-out
                    ${showHam ? "translate-x-0" : "-translate-x-full"}`}
      >
        <GiTireIronCross
          className="text-4xl text-orange-500 absolute top-6 right-5 cursor-pointer"
          onClick={() => setShowHam(false)}
        />
        
        {/* Profile Pic */}
        {userData?.photoUrl ? (
          <img
            src={userData.photoUrl}
            alt="profile"
            className="w-20 h-20 rounded-full object-cover border-2 border-orange-500 shadow-[0_0_20px_rgba(255,69,0,0.5)]"
            onClick={() => handleMobileNav(`/profile/${userData.username}`)}
          />
        ) : userData ? (
          <div className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold border-2 border-orange-500 bg-orange-900/60 shadow-[0_0_20px_rgba(255,69,0,0.5)]"
               onClick={() => handleMobileNav(`/profile/${userData.username}`)}>
            {userData.name.slice(0, 1).toUpperCase()}
          </div>
        ) : (
          <IoPersonCircleSharp className="w-20 h-20 text-gray-600" onClick={() => handleMobileNav("/login")}/>
        )}

        {/* Nav Links */}
        <nav className="flex flex-col items-center gap-4">
          {navLinks.map((link) => (
            <button
              key={link.title}
              onClick={() => handleMobileNav(link.path)}
              // 4. Apply conditional styling for mobile
              className={
                location.pathname.startsWith(link.path)
                  ? `${mobileLinkStyles} !text-orange-400 [text-shadow:0_0_10px_rgba(255,69,0,0.5)]`
                  : mobileLinkStyles
              }
            >
              {React.cloneElement(link.icon, { size: 28 })}
              <span>{link.title}</span>
            </button>
          ))}
        </nav>
        
        <div className="h-px w-2/3 bg-orange-700/40 my-2"></div>
        
        {/* Auth Links */}
        {userData ? (
          <button
            onClick={() => handleMobileNav(`/profile/${userData.username}`)}
            className={
              location.pathname.startsWith('/profile')
                ? `${mobileLinkStyles} !text-orange-400 [text-shadow:0_0_10px_rgba(255,69,0,0.5)]`
                : mobileLinkStyles
            }
          >
            <FaUserCircle size={28} />
            My Profile
          </button>
        ) : null}

        {!userData ? (
          <button
            onClick={() => handleMobileNav("/login")}
            className="px-8 py-3 bg-orange-600 text-white text-xl font-bold rounded-lg transform transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-orange-500/40"
          >
            Login
          </button>
        ) : (
          <button
            onClick={handleLogOut}
            className="px-8 py-3 bg-gray-800 text-gray-300 text-xl font-bold rounded-lg transform transition-all duration-300 hover:scale-105 hover:bg-gray-700"
          >
            Logout
          </button>
        )}
      </div>
    </>
  );
}

export default Nav;
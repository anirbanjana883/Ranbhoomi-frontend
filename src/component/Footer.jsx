import React from "react";
import logo from "../assets/logo.png"; // This should be your square Ranbhoomi logo
import { FaFacebookF, FaTwitter, FaLinkedinIn, FaGithub } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

function Footer() {
  const navigate = useNavigate();

  // Data for links and socials for cleaner code
  const quickLinks = [
    { name: "Home", path: "/" },
    { name: "Login", path: "/login" },
    { name: "Contact", path: "/contact" }, // Changed to be more relevant
    { name: "Carer", path: "/Career" },   // Changed to be more relevant
  ];

  const socialLinks = [
    { icon: <FaFacebookF />, href: "#" },
    { icon: <FaTwitter />, href: "#" },
    { icon: <FaLinkedinIn />, href: "#" },
    { icon: <FaGithub />, href: "#" },
  ];

  return (
    <footer className="w-full relative bg-black text-white py-12 md:py-16 px-6 sm:px-10 lg:px-20 border-t border-[#FF4500]/20 overflow-hidden">
      
      {/* Background Gradient - Changed to Fiery Orange */}
      <div className="absolute inset-0 z-0">
        <div className="absolute w-[150%] h-[150%] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(circle_farthest-corner,rgba(255,69,0,0.05)_0%,rgba(0,0,0,0)_60%)]"></div>
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto flex flex-col lg:flex-row justify-between items-start gap-10">
        
        {/* Brand & Description */}
        <div className="flex flex-col gap-4 max-w-md w-full">
          <div className="flex items-center gap-4">
            <img
              src={logo}
              alt="Ranbhoomi Logo"
              // Changed shadow to orange
              className="h-14 rounded-md shadow-[0_0_20px_rgba(255,69,0,0.5)]"
            />
            <h2 className="text-3xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-orange-300 to-orange-500 drop-shadow-[0_0_15px_rgba(255,69,0,0.6)]">
              RANBHOOMI
            </h2>
          </div>
          <p className="text-slate-400 text-sm leading-relaxed mt-2">
            This is no mere practice arena. This is Ranbhoomi. The ultimate proving ground where logic is your weapon and every challenge is a battle for glory.
          </p>
        </div>

        {/* Links & Socials Container */}
        <div className="flex flex-col sm:flex-row gap-10 lg:gap-20 w-full lg:w-auto">
          
          {/* Quick Links */}
          <div className="flex flex-col gap-4">
            {/* Changed text color to orange */}
            <h3 className="text-lg font-bold text-orange-400 tracking-wider">Quick Links</h3>
            <ul className="flex flex-col gap-2 text-slate-300">
              {quickLinks.map((link) => (
                <li
                  key={link.name}
                  // Changed hover color to orange
                  className="hover:text-orange-300 hover:translate-x-1 transition-all duration-200 cursor-pointer w-fit"
                  onClick={() => navigate(link.path)}
                >
                  {link.name}
                </li>
              ))}
            </ul>
          </div>

          {/* Social Icons */}
          <div className="flex flex-col gap-4">
            {/* Changed text color to orange */}
            <h3 className="text-lg font-bold text-orange-400 tracking-wider">Follow Us</h3>
            <div className="flex gap-4">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="
                    group w-10 h-10 flex items-center justify-center rounded-full
                    bg-slate-900/50 
                    border border-orange-500/30  /* Changed border color */
                    transition-all duration-300
                    hover:bg-slate-800/80 
                    hover:border-orange-400      /* Changed hover border */
                    hover:-translate-y-1
                    hover:shadow-[0_0_20px_rgba(255,69,0,0.5)] /* Changed shadow color */
                  "
                >
                  {React.cloneElement(social.icon, {
                    // Changed hover text color
                    className: "w-5 h-5 text-slate-400 transition-colors duration-300 group-hover:text-orange-300"
                  })}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Line */}
      <div className="relative z-10 mt-12 pt-8 text-center text-slate-500 text-sm border-t border-orange-500/20">
        &copy; {new Date().getFullYear()} Ranbhoomi. All rights reserved. Forged in fire.
      </div>
    </footer>
  );
}

export default Footer;
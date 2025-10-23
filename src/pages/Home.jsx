import React, { useEffect, useRef } from 'react';
import Nav from '../component/Nav.jsx'; // Your Nav component
import Footer from '../component/Footer.jsx';

function Home() {
  const canvasRef = useRef(null);

  // useEffect to handle the particle animation script
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return; // Exit if canvas isn't rendered yet

    const ctx = canvas.getContext('2d');
    let particles = [];

    function setCanvasSize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 1;
        this.speedX = (Math.random() * 1 - 0.5) * 0.5;
        this.speedY = (Math.random() * 1 - 0.5) * 0.5;
        this.color = 'rgba(255, 69, 0, 0.5)'; // Volcanic Orange
      }

      update() {
        if (this.x > canvas.width || this.x < 0) this.speedX *= -1;
        if (this.y > canvas.height || this.y < 0) this.speedY *= -1;
        this.x += this.speedX;
        this.y += this.speedY;
      }

      draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function init() {
      particles = [];
      let numberOfParticles = (canvas.width * canvas.height) / 9000;
      for (let i = 0; i < numberOfParticles; i++) {
        particles.push(new Particle());
      }
    }

    function connect() {
      let opacityValue = 1;
      for (let a = 0; a < particles.length; a++) {
        for (let b = a; b < particles.length; b++) {
          let distance = Math.sqrt(
            (particles[a].x - particles[b].x) ** 2 +
            (particles[a].y - particles[b].y) ** 2
          );

          if (distance < 120) {
            opacityValue = 1 - (distance / 120);
            ctx.strokeStyle = `rgba(255, 69, 0, ${opacityValue * 0.2})`; // Faint orange lines
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(particles[a].x, particles[a].y);
            ctx.lineTo(particles[b].x, particles[b].y);
            ctx.stroke();
          }
        }
      }
    }

    let animationFrameId;
    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let particle of particles) {
        particle.update();
        particle.draw();
      }
      connect();
      animationFrameId = requestAnimationFrame(animate);
    }

    // Resize handler
    const handleResize = () => {
      setCanvasSize();
      init();
    };
    
    window.addEventListener('resize', handleResize);

    // Start animation
    setCanvasSize();
    init();
    animate();

    // Cleanup function
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []); // Empty dependency array ensures this runs only once on mount

  return (
    <>
      {/* Custom Styles */}
      <style>{`
        /* Using Inter font (Assuming it's imported in your index.html or global CSS) */
        /* If not, you might need to add the @import to your main CSS file */
        
        /* Fiery Particle Canvas */
        #particle-canvas {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 0;
            opacity: 0.6;
        }

        /* Ember Flicker Animation for Hero Text */
        @keyframes emberFlicker {
            0%, 100% {
                text-shadow: 0 0 10px rgba(255, 215, 0, 0.5), 0 0 20px rgba(255, 69, 0, 0.5);
            }
            50% {
                text-shadow: 0 0 20px rgba(255, 215, 0, 0.8), 0 0 40px rgba(255, 69, 0, 0.8);
            }
        }
        .animate-ember-flicker {
            animation: emberFlicker 3s ease-in-out infinite alternate;
        }

        /* Base styles for the frosted glass elements */
        .glass-card {
            background-color: rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 69, 0, 0.3);
            transition: all 0.3s ease-in-out;
        }
        .glass-card:hover {
            border-color: rgba(255, 69, 0, 0.7);
            box-shadow: 0 0 30px rgba(255, 69, 0, 0.4);
            transform: translateY(-8px);
        }
      `}</style>
      
      {/* Set body properties (optional, but good for ensuring bg color) */}
      <div className="bg-black text-[#D3D3D3] overflow-x-hidden">
        
        {/* Fiery Particle Background */}
        <canvas ref={canvasRef} id="particle-canvas"></canvas>

        {/* Main Content (relative to canvas) */}
        <div className="relative z-10">

          {/* Your Nav Component */}
          <Nav />

          {/* ################### */}
          {/* HERO SECTION    */}
          {/* ################### */}
          <main className="min-h-screen w-full flex items-center justify-center text-center px-4 relative overflow-hidden">
            <div className="flex flex-col items-center gap-6 max-w-4xl pt-24"> {/* Added pt-24 to offset nav */}
              
              {/* Fiery Gradient Headline */}
              <h1 className="text-6xl md:text-7xl lg:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#FFD700] via-[#FF4500] to-[#DC143C] animate-ember-flicker">
                  RANBHOOMI
              </h1>
              <h2 className="text-3xl md:text-6xl lg:text-7xl font-bold fiery-gradient-text">
                  Enter the battlefield, conquer with logic
              </h2>

              <p className="text-sm md:text-xl text-gray-400 max-w-2xl mt-4">
                  This isn't just practice. This is Ranbhoomi. The ultimate proving ground for competitive programmers and interview-ready engineers.
              </p>

              {/* Aggressive CTA Button */}
              <button 
                  className="mt-8 px-10 py-4 bg-[#FF4500] text-black text-lg font-bold rounded-full
                         flex items-center justify-center
                         transform transition-all duration-300
                         hover:bg-[#E03E00] hover:shadow-[0_0_25px_rgba(255,69,0,0.8)]
                         hover:scale-105 hover:-rotate-1
                         active:scale-95 active:rotate-0">
                  Step onto the Battlefield
              </button>
            </div>
          </main>

          {/* FEATURES SECTION   */}
          <section id="features" className="py-24 px-4">
            <h2 className="text-4xl font-bold text-center mb-16 text-white">
                Choose Your<span className="text-[#FF4500]"> Battlefield</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 max-w-7xl mx-auto">
                
                {/* Feature 1: Practice */}
                <a href="/practice" className="glass-card rounded-2xl p-6 flex flex-col items-center text-center">
                    <svg className="w-12 h-12 text-[#FF4500] mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path></svg>
                    <h3 className="text-xl font-bold text-white mb-2">Practice</h3>
                    <p className="text-sm text-gray-400">Hone your skills in the armory. Sort, search, and conquer a vast library of problems.</p>
                </a>
                
                {/* Feature 2: Contests */}
                <a href="/contests" className="glass-card rounded-2xl p-6 flex flex-col items-center text-center">
                    <svg className="w-12 h-12 text-[#FF4500] mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"></path></svg>
                    <h3 className="text-xl font-bold text-white mb-2">Contests</h3>
                    <p className="text-sm text-gray-400">Prove your mettle. Compete against the best in high-stakes, real-time challenges.</p>
                </a>
                
                {/* Feature 3: Interview */}
                <a href="/interview" className="glass-card rounded-2xl p-6 flex flex-col items-center text-center">
                    <svg className="w-12 h-12 text-[#FF4500] mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12 12 0 0012 21.694a12 12 0 008.618-3.04A11.955 11.955 0 0112 2.944z"></path></svg>
                    <h3 className="text-xl font-bold text-white mb-2">Interview</h3>
                    <p className="text-sm text-gray-400">Prepare for war. Master company-specific questions and mock interviews.</p>
                </a>

                {/* Feature 4: Community */}
                <a href="/community" className="glass-card rounded-2xl p-6 flex flex-col items-center text-center">
                    <svg className="w-12 h-12 text-[#FF4500] mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-1.657-1.343-3-3-3s-3 1.343-3 3v2m6 0H9"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20v-2a3 3 0 00-5.356-1.857M9 20H2v-2a3 3 0 015.356-1.857m0 0a3 3 0 010-4.286m0 4.286A3 3 0 009 20m0-8a3 3 0 100-6 3 3 0 000 6z"></path></svg>
                    <h3 className="text-xl font-bold text-white mb-2">Community</h3>
                    <p className="text-sm text-gray-400">Join the legions. Discuss strategies, form alliances, and learn from fellow warriors.</p>
                </a>

                {/* Feature 5: Roadmaps */}
                <a href="/roadmaps" className="glass-card rounded-2xl p-6 flex flex-col items-center text-center">
                    <svg className="w-12 h-12 text-[#FF4500] mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7"></path></svg>
                    <h3 className="text-xl font-bold text-white mb-2">Roadmaps</h3>
                    <p className="text-sm text-gray-400">Chart your path to victory. Follow curated learning paths from novice to grandmaster.</p>
                </a>
            </div>
          </section>


          {/* "DAILY GAUNTLET" SECTION */}
          <section id="gauntlet" className="py-24 px-4">
              <div className="glass-card max-w-4xl mx-auto rounded-2xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="text-center md:text-left">
                      <h2 className="text-3xl md:text-4xl font-bold text-white">
                          The Daily <span className="text-[#DC143C]">Gauntlet</span>
                      </h2>
                      <p className="text-lg text-gray-400 mt-2">A new challenge awaits. Prove your worth.</p>

                      <div className="mt-6">
                          <p className="text-xl font-semibold text-white">"Find Median from Data Stream"</p>
                          <span className="inline-block bg-[#DC143C]/20 text-[#DC143C] text-sm font-bold px-3 py-1 rounded-full mt-2">
                              Hard
                          </span>
                      </div>
                  </div>
                  
                  <div className="flex-shrink-0">
                      <button 
                          className="px-8 py-3 bg-[#FF4500] text-black text-base font-bold rounded-full
                                 transform transition-all duration-300
                                 hover:bg-[#E03E00] hover:shadow-[0_0_20px_rgba(255,69,0,0.7)]
                                 hover:scale-105">
                          Solve Now
                      </button>
                  </div>
              </div>
          </section>

          {/* FOOTER       */}
          {/* <footer className="text-center py-12 px-4 border-t border-[#FF4500]/20">
              <p className="text-gray-500">
                  © 2025 Ranbhoomi. All rights reserved. Forged in fire.
              </p>
          </footer> */}

          <Footer/>

        </div>
      </div>
    </>
  );
}

export default Home;


'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion, Variants } from 'framer-motion';
import { Calendar, Clock, MapPin, ArrowRight, ArrowDown } from 'lucide-react';

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
};

export default function Home() {
  const guests = [
    { name: "Captain Brijesh Chowta", title: "Chief Guest", info: "Member of Parliament, Dakshina Kannada Lok Sabha Constituency", img: "https://imgs.etvbharat.com/etvbharat/prod-images/14-03-2024/1200-675-20984062-thumbnail-16x9-etvbharat.JPG" },
    { name: "Dr Bharath Shetty", title: "Guest of honour", info: "MLA, Mangaluru City North", img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSAJ8BijrOP9Giay3tfBTX2gnboPFUl5BG5FQ&s" },
    { name: "Shri D. Vedavyas Kamath", title: "Guest of honour", info: "MLA, Mangaluru City South", img: "https://pbs.twimg.com/media/FwATVHxX0AMu82x.jpg" },
    { name: "Bharath N Acharya", title: "Inaugural Guest", info: "National President Of JCI RPP", img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQIjOmqeOGOJa3kuXNydo-cUuNmnRbBHl-rhQ&s" }
  ];

  const scrollToEvents = () => {
    const element = document.getElementById('upcoming-events');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white overflow-hidden">
      {/* HERO SECTION - PURELY CLUB FOCUSED */}
      <section className="relative w-full pt-32 pb-32 lg:pt-44 lg:pb-40 overflow-hidden bg-linear-to-br from-[#1B1B4D] via-[#2D1B36] to-[#F5841F]/30">
        <motion.div
          animate={{ x: [0, 100, 0], y: [0, -50, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-0 left-0 w-96 h-96 bg-[#6B2FA0]/20 rounded-full blur-[120px] mix-blend-multiply"
        />
        <motion.div
          animate={{ x: [0, -100, 0], y: [0, 100, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute top-40 right-0 w-120 h-120 bg-[#F5841F]/20 rounded-full blur-[120px] mix-blend-multiply"
        />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.15] mix-blend-overlay"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="text-center max-w-4xl mx-auto"
          >
            <motion.div variants={fadeInUp} className="flex justify-center mb-6">
              <div className="w-24 h-24 sm:w-32 sm:h-32 relative rounded-full overflow-hidden flex items-center justify-center shadow-xl shadow-[#6B2FA0]/20 border-4 border-white/50">
                <Image src="/IMG_3702.PNG" alt="Balipu Logo" fill className="object-cover" priority />
              </div>
            </motion.div>

            {/* Hero Title */}
            <motion.div variants={fadeInUp} className="relative font-heading uppercase italic tracking-tighter mb-8 mt-6 -skew-x-3 text-center mx-auto px-4">
              <div className="text-[#F5841F] drop-shadow-[0_4px_24px_rgba(245,132,31,0.6)] text-[clamp(3.5rem,15vw,8rem)] leading-[0.85]">
                BALIPU
              </div>
              <div className="text-white drop-shadow-[0_4px_24px_rgba(255,255,255,0.15)] text-[clamp(3.5rem,15vw,8rem)] leading-[0.85] sm:-translate-x-6 mt-2">
                RUN CLUB
              </div>
            </motion.div>

            <motion.p variants={fadeInUp} className="text-xl sm:text-2xl text-white font-medium mb-2 drop-shadow-md">
              Mangaluru's premier community of runners & fitness enthusiasts.
            </motion.p>
            <motion.p variants={fadeInUp} className="text-lg sm:text-xl text-[#F5841F] italic font-semibold mb-12 drop-shadow-md">
              "Run for a Better Tomorrow"
            </motion.p>

            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-4">
              <a href="https://chat.whatsapp.com/Drd93iPcBwv4sXneIDuoPc" target="_blank" rel="noopener noreferrer" className="btn-primary uppercase text-sm sm:text-base px-6 py-4 shadow-xl hover:shadow-[#F5841F]/40 transform transition hover:scale-105 w-full sm:w-auto flex justify-center items-center gap-2">
                Join our WhatsApp
              </a>
              <a href="https://www.instagram.com/balipurunclub?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center rounded-xl bg-linear-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] px-6 py-4 text-sm sm:text-base font-semibold text-white uppercase tracking-wide shadow-xl hover:shadow-[#ee2a7b]/40 transform transition hover:scale-105 w-full sm:w-auto gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                Connect on Instagram
              </a>
              <button onClick={scrollToEvents} className="btn-secondary bg-white/10 border-white/20 text-white hover:bg-white/20 text-lg px-8 py-4 shadow-xl transform transition hover:scale-105 w-full sm:w-auto flex justify-center items-center gap-2">
                Upcoming Events
                <ArrowDown className="w-5 h-5" />
              </button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ABOUT THE CLUB */}
      <section className="py-20 bg-white relative overflow-hidden border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">About Us</h2>
            <motion.h2 variants={fadeInUp} className="font-heading text-4xl sm:text-5xl text-[#1B1B4D] uppercase italic -skew-x-6 mb-2">
              More Than Just a Run
            </motion.h2>
            <div className="w-24 h-1.5 bg-[#F5841F] mx-auto mt-4 mb-8 rounded-full"></div>
            <motion.p variants={fadeInUp} className="text-lg sm:text-xl text-slate-600 leading-relaxed mb-6">
              <strong className="text-[#1B1B4D]">Balipu Run Club</strong> is a growing community of fitness enthusiasts in Mangaluru. We are bringing together athletes, students, and professionals to build a stronger, brighter future through active lifestyles.
            </motion.p>
            <motion.p variants={fadeInUp} className="text-lg sm:text-xl text-slate-600 leading-relaxed">
              This isn't just a one-time event—our club is a permanent fixture in the city. We will be consistently organizing different kinds of runs, training sessions, and fitness activities to keep our community active, supported, and moving forward.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* UPCOMING EVENTS SECTION */}
      <section id="upcoming-events" className="py-24 bg-slate-50 relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#6B2FA0] rounded-full blur-[100px] opacity-10"></div>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10">
          
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            className="text-center mb-16"
          >
            <h2 className="font-heading text-4xl sm:text-5xl text-[#1B1B4D] uppercase italic -skew-x-6">Upcoming Events</h2>
            <div className="w-24 h-1.5 bg-[#F5841F] mx-auto mt-6 rounded-full"></div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Event Summary Card */}
            <Link href="/events/monsoon-run" className="block group">
              <motion.div 
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeInUp}
                className="bg-white rounded-3xl overflow-hidden shadow-xl shadow-slate-200/50 border border-slate-100 hover:shadow-2xl hover:shadow-[#F5841F]/20 transition-all duration-300 transform group-hover:-translate-y-2 flex flex-col h-full"
              >
                <div className="w-full h-48 sm:h-56 relative overflow-hidden">
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors z-10"></div>
                  <img src="/poster.png" alt="The Monsoon Run" className="w-full h-full object-cover object-top transform group-hover:scale-105 transition-transform duration-500" />
                </div>
                
                <div className="p-8 flex flex-col flex-1 text-center">
                  <div className="inline-block bg-green-100 text-green-700 font-bold px-3 py-1 rounded-full text-[10px] tracking-widest uppercase mb-4 mx-auto">
                    Registrations Open
                  </div>
                  <h3 className="font-heading text-3xl text-[#1B1B4D] uppercase italic -skew-x-3 mb-2">
                    The Monsoon Run
                  </h3>
                  <p className="text-slate-500 font-medium mb-6">12th July 2026<br/>Fiza by Nexus Mall</p>
                  
                  <div className="mt-auto flex items-center justify-center gap-2 text-[#F5841F] font-semibold text-lg group-hover:translate-x-2 transition-transform">
                    Event Details <ArrowRight className="w-5 h-5" />
                  </div>
                </div>
              </motion.div>
            </Link>
          </div>
        </div>
      </section>


      {/* CLUB LEADERSHIP */}
      <section className="py-24 bg-white border-t border-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="flex flex-col items-center text-center"
          >
            <motion.h2 variants={fadeInUp} className="font-heading text-4xl text-[#1B1B4D] uppercase italic -skew-x-6 mb-2">Club Leadership</motion.h2>
            <div className="w-16 h-1 bg-[#F5841F] mx-auto mt-2 mb-10 rounded-full"></div>

            <motion.div variants={fadeInUp} className="flex flex-col items-center">
              <div className="text-2xl font-heading text-[#1B1B4D] mb-1">Jeethesh A &amp; Sohan Raj</div>
              <span className="text-base font-sans font-medium text-[#F5841F]">Founders, Balipu Run Club</span>
            </motion.div>
          </motion.div>
        </div>
      </section>

    </div>
  );
}

'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion, Variants } from 'framer-motion';
import { Calendar, Clock, MapPin, ArrowRight } from 'lucide-react';

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



  return (
    <div className="flex flex-col min-h-screen bg-white overflow-hidden">
      {/* HERO SECTION */}
      <section className="relative w-full pt-32 pb-32 lg:pt-44 lg:pb-40 overflow-hidden bg-linear-to-br from-[#1B1B4D] via-[#2D1B36] to-[#F5841F]/30">
        {/* Animated Background Orbs */}
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

            {/* Hero Title - Poster Style */}
            <motion.div variants={fadeInUp} className="relative font-heading uppercase italic tracking-tighter mb-12 mt-6 -skew-x-3 text-center max-w-lg mx-auto px-4">
              {/* BALIPU */}
              <div className="text-[#F5841F] drop-shadow-[0_4px_24px_rgba(245,132,31,0.6)] text-[clamp(3.5rem,16vw,9rem)] leading-[0.85]">
                BALIPU
              </div>
              {/* X overlapping between lines - centered on all screens */}
              <div className="text-white font-sans font-black text-[clamp(2.5rem,12vw,7rem)] leading-none -my-1 sm:-my-2 drop-shadow-[0_8px_24px_rgba(0,0,0,0.5)] pointer-events-none select-none text-center">
                X
              </div>
              {/* NEXUS - center on mobile, slight left shift on desktop */}
              <div className="text-white drop-shadow-[0_4px_24px_rgba(255,255,255,0.15)] text-[clamp(3.5rem,16vw,9rem)] leading-[0.85] sm:-translate-x-6">
                NEXUS
              </div>
            </motion.div>

            <motion.p variants={fadeInUp} className="text-xl sm:text-2xl text-white font-medium mb-2 drop-shadow-md">
              A Community Run & Youth Fitness Initiative
            </motion.p>
            <motion.p variants={fadeInUp} className="text-lg sm:text-xl text-[#F5841F] italic font-semibold mb-12 drop-shadow-md">
              "Run for a Better Tomorrow"
            </motion.p>

            <motion.div variants={fadeInUp} className="card-dark inline-block p-8 mx-auto w-full max-w-3xl mb-12 relative overflow-hidden group">
              <div className="absolute inset-0 bg-linear-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute -top-20 -right-20 w-48 h-48 bg-[#F5841F] rounded-full blur-3xl opacity-30 group-hover:opacity-40 transition-opacity duration-500"></div>
              <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-[#6B2FA0] rounded-full blur-3xl opacity-30 group-hover:opacity-40 transition-opacity duration-500"></div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-4 relative z-10">
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-4 border border-white/10 group-hover:border-[#F5841F]/50 transition-colors">
                    <Calendar className="w-6 h-6 text-[#F5841F]" />
                  </div>
                  <span className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Date</span>
                  <strong className="text-lg text-white font-medium">12th July 2026</strong>
                </div>
                <div className="flex flex-col items-center justify-center text-center sm:border-x sm:border-white/10 px-4">
                  <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-4 border border-white/10 group-hover:border-[#F5841F]/50 transition-colors">
                    <Clock className="w-6 h-6 text-[#F5841F]" />
                  </div>
                  <span className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Time</span>
                  <strong className="text-lg text-white font-medium">6:30 AM</strong>
                </div>
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-4 border border-white/10 group-hover:border-[#F5841F]/50 transition-colors">
                    <MapPin className="w-6 h-6 text-[#F5841F]" />
                  </div>
                  <span className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Venue</span>
                  <strong className="text-base text-white font-medium leading-tight">Fiza by Nexus Mall<br />Pandeshwar</strong>
                </div>
              </div>
            </motion.div>

            <motion.div variants={fadeInUp}>
              <Link href="/register" className="btn-primary text-lg px-10 py-4 shadow-xl hover:shadow-[#F5841F]/40 transform transition hover:scale-105">
                Register Now
                <ArrowRight className="w-5 h-5" />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ORGANIZERS & PARTNERS */}
      <section className="py-12 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16 divide-y md:divide-y-0 md:divide-x divide-slate-200"
          >
            <motion.div variants={fadeInUp} className="flex flex-col items-center text-center pt-8 md:pt-0 md:px-8 first:pt-0">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Co-founders</span>
              <div className="text-xl font-heading text-[#1B1B4D]">Jeethesh A &amp; Sohan Raj</div>
              <span className="text-sm font-sans font-medium text-slate-500 mt-1">Balipu Run Club</span>
            </motion.div>

            <motion.div variants={fadeInUp} className="flex flex-col items-center text-center pt-8 md:pt-0 md:px-8">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Supported by</span>
              <div className="text-xl font-heading text-[#1B1B4D]">JCI Mangalore</div>
            </motion.div>

            <motion.div variants={fadeInUp} className="flex flex-col items-center text-center pt-8 md:pt-0 md:px-8">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Health Partner</span>
              <div className="text-xl font-heading text-[#1B1B4D]">KMC Hospital</div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* GUESTS SECTION */}
      <section className="py-20 bg-slate-50 relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#6B2FA0] rounded-full blur-[100px] opacity-10"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            className="text-center mb-16"
          >
            <h2 className="font-heading text-4xl sm:text-5xl text-[#1B1B4D] uppercase italic -skew-x-6">Special Guests</h2>
            <div className="w-24 h-1.5 bg-[#F5841F] mx-auto mt-6 rounded-full"></div>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {guests.map((guest, i) => (
              <motion.div key={i} variants={fadeInUp} className="card p-6 flex flex-col items-center text-center group hover:-translate-y-3 hover:shadow-2xl transition-all duration-300 relative overflow-hidden">
                <div className="absolute inset-0 bg-linear-to-b from-transparent to-[#1B1B4D]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="w-32 h-32 rounded-full overflow-hidden mb-5 border-4 border-white shadow-lg group-hover:border-[#F5841F] transition-colors bg-white relative z-10 group-hover:shadow-[#F5841F]/30">
                  <img src={guest.img} alt={guest.name} className="w-full h-full object-cover object-top" />
                </div>
                <h3 className="font-bold text-lg text-[#1B1B4D] mb-1 relative z-10">{guest.name}</h3>
                <p className="text-sm text-[#F5841F] font-semibold mb-2 relative z-10">{guest.title}</p>
                <p className="text-xs text-slate-500 relative z-10">{guest.info}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* PRICING PHASES */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            className="text-center mb-12"
          >
            <h2 className="font-heading text-4xl sm:text-5xl text-[#1B1B4D] uppercase italic -skew-x-6 mb-2">Registration Fee</h2>
            <div className="w-24 h-1.5 bg-[#F5841F] mx-auto mt-4 rounded-full" />
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 sm:grid-cols-2 gap-8"
          >
            {/* Phase 1 */}
            <motion.div variants={fadeInUp} className="relative card p-8 border-2 border-slate-200 opacity-70 overflow-hidden grayscale">
              <div className="absolute top-4 right-4">
                <span className="bg-slate-500 text-white text-xs font-bold px-3 py-1 rounded-full">SOLD OUT</span>
              </div>
              <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-slate-400 rounded-full blur-3xl opacity-10" />
              <p className="text-slate-500 text-sm font-semibold uppercase tracking-widest mb-2">Phase 1</p>
              <div className="flex items-end gap-1 mb-4">
                <span className="text-5xl font-bold text-[#1B1B4D]">₹200</span>
              </div>
              <p className="text-slate-600 text-sm mb-6">
                All 50 early bird spots have been filled!
              </p>
              <ul className="space-y-2 text-sm text-slate-600 mb-8">
                <li className="flex items-center gap-2"><span className="text-slate-400 font-bold">✓</span> Race BIB &amp; Timing Chip</li>
                <li className="flex items-center gap-2"><span className="text-slate-400 font-bold">✓</span> Event T-Shirt</li>
                <li className="flex items-center gap-2"><span className="text-slate-400 font-bold">✓</span> Finisher Certificate</li>
                <li className="flex items-center gap-2"><span className="text-slate-400 font-bold">✓</span> Refreshments</li>
              </ul>
            </motion.div>

            {/* Phase 2 */}
            <motion.div variants={fadeInUp} className="relative card p-8 border-2 border-[#F5841F]/40 overflow-hidden shadow-[0_0_40px_rgba(245,132,31,0.15)] transform md:scale-105 z-10 bg-white">
              <div className="absolute top-4 right-4">
                <span className="bg-[#F5841F] text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse">ACTIVE NOW</span>
              </div>
              <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-[#F5841F] rounded-full blur-3xl opacity-10" />
              <p className="text-[#F5841F] text-sm font-semibold uppercase tracking-widest mb-2">Phase 2</p>
              <div className="flex items-end gap-2 mb-4">
                <span className="text-5xl font-bold text-[#1B1B4D]">₹299</span>
                <span className="text-slate-400 line-through text-lg mb-1">₹200</span>
              </div>
              <p className="text-slate-600 text-sm mb-6">
                Register now before slots are completely filled!
              </p>
              <ul className="space-y-2 text-sm text-slate-600 mb-8">
                <li className="flex items-center gap-2"><span className="text-green-500 font-bold">✓</span> Race BIB &amp; Timing Chip</li>
                <li className="flex items-center gap-2"><span className="text-green-500 font-bold">✓</span> Event T-Shirt</li>
                <li className="flex items-center gap-2"><span className="text-green-500 font-bold">✓</span> Finisher Certificate</li>
                <li className="flex items-center gap-2"><span className="text-green-500 font-bold">✓</span> Refreshments</li>
              </ul>
              
              <Link href="/register" className="btn-primary w-full text-center py-4 bg-linear-to-r from-[#F5841F] to-[#ff9b44] hover:from-[#ff9b44] hover:to-[#ffb26a] border-none text-white shadow-xl">
                Register Now — ₹299
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* REGISTRATION TEASER */}
      <section className="py-24 bg-[#1B1B4D] relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-r from-[#6B2FA0]/40 to-transparent"></div>
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-[#F5841F] rounded-full blur-[120px] opacity-30"></div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.h2 variants={fadeInUp} className="font-heading text-5xl sm:text-6xl text-white uppercase italic -skew-x-6 mb-6">
              Register for the Run
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
              Join hundreds of runners. Secure your spot today and be part of the movement. Let's make every step count!
            </motion.p>
            <motion.div variants={fadeInUp}>
              <Link href="/register" className="btn-primary text-xl px-12 py-5 shadow-2xl hover:shadow-[#F5841F]/50">
                Register Now
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>


    </div>
  );
}

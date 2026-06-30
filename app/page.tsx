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
      <section className="relative w-full pt-20 pb-32 lg:pt-32 lg:pb-40 overflow-hidden bg-gradient-to-br from-[#6B2FA0]/10 via-[#F5841F]/10 to-blue-100">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-30 mix-blend-overlay"></div>



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

            <motion.h1 variants={fadeInUp} className="font-heading text-6xl sm:text-7xl md:text-8xl text-[#1B1B4D] uppercase italic transform -skew-x-6 tracking-tight mb-2">
              BALIPU <span className="text-[#F5841F]">x</span> NEXUS
            </motion.h1>

            <motion.p variants={fadeInUp} className="text-xl sm:text-2xl text-slate-700 font-medium mb-1">
              A Community Run & Youth Fitness Initiative
            </motion.p>
            <motion.p variants={fadeInUp} className="text-lg sm:text-xl text-[#F5841F] italic font-semibold mb-12">
              "Run for a Better Tomorrow"
            </motion.p>

            <motion.div variants={fadeInUp} className="card-dark inline-block p-6 sm:p-8 mx-auto w-full max-w-3xl mb-12 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#F5841F] rounded-full blur-3xl opacity-20 transform translate-x-1/2 -translate-y-1/2"></div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-4 relative z-10">
                <div className="flex flex-col items-center justify-center text-center">
                  <Calendar className="w-8 h-8 text-[#F5841F] mb-3" />
                  <span className="text-slate-300 text-sm uppercase tracking-wider mb-1">Date</span>
                  <strong className="text-xl">12th July 2026</strong>
                </div>
                <div className="flex flex-col items-center justify-center text-center sm:border-x sm:border-white/10 px-4">
                  <Clock className="w-8 h-8 text-[#F5841F] mb-3" />
                  <span className="text-slate-300 text-sm uppercase tracking-wider mb-1">Time</span>
                  <strong className="text-xl">6:30 AM</strong>
                </div>
                <div className="flex flex-col items-center justify-center text-center">
                  <MapPin className="w-8 h-8 text-[#F5841F] mb-3" />
                  <span className="text-slate-300 text-sm uppercase tracking-wider mb-1">Venue</span>
                  <strong className="text-lg leading-tight">Fiza by Nexus Mall<br />Pandeshwar</strong>
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
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Organised by</span>
              <div className="text-xl font-heading text-[#1B1B4D]">Balipu Run Club</div>
            </motion.div>

            <motion.div variants={fadeInUp} className="flex flex-col items-center text-center pt-8 md:pt-0 md:px-8">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Supported by</span>
              <div className="text-xl font-heading text-[#1B1B4D]">JCI Mangalore</div>
            </motion.div>

            <motion.div variants={fadeInUp} className="flex flex-col items-center text-center pt-8 md:pt-0 md:px-8">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Medical Partner</span>
              <div className="text-xl font-heading text-[#1B1B4D]">KMC Mangalore</div>
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
              <motion.div key={i} variants={fadeInUp} className="card p-6 flex flex-col items-center text-center group hover:-translate-y-2 transition-transform duration-300">
                <div className="w-32 h-32 rounded-full overflow-hidden mb-4 border-4 border-white shadow-lg group-hover:border-[#F5841F] transition-colors bg-white">
                  <img src={guest.img} alt={guest.name} className="w-full h-full object-cover object-top" />
                </div>
                <h3 className="font-bold text-lg text-[#1B1B4D] mb-1">{guest.name}</h3>
                <p className="text-sm text-[#F5841F] font-bold mb-1">{guest.title}</p>
                <p className="text-xs text-slate-500">{guest.info}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* REGISTRATION TEASER */}
      <section className="py-24 bg-[#1B1B4D] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#6B2FA0]/40 to-transparent"></div>
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
                Join Now — ₹299
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>


    </div>
  );
}

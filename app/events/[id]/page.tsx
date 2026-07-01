'use client';

import Link from 'next/link';
import { motion, Variants } from 'framer-motion';
import { Calendar, Clock, MapPin, ArrowRight, ArrowLeft } from 'lucide-react';
import { useParams } from 'next/navigation';

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

export default function EventPage() {
  const params = useParams();
  const eventId = params.id as string;

  // Mock database for events (can be moved to a real DB later)
  const eventsData: Record<string, any> = {
    'monsoon-run': {
      title: "The Monsoon Run",
      sponsors: ["JCI Mangalore"],
      date: "12th July 2026",
      time: "6:30 AM",
      venue: "Pandeshwar, Mangaluru",
      guests: [
        { name: "Captain Brijesh Chowta", title: "Chief Guest", info: "Member of Parliament, Dakshina Kannada Lok Sabha Constituency", img: "https://imgs.etvbharat.com/etvbharat/prod-images/14-03-2024/1200-675-20984062-thumbnail-16x9-etvbharat.JPG" },
        { name: "Dr Bharath Shetty", title: "Guest of honour", info: "MLA, Mangaluru City North", img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSAJ8BijrOP9Giay3tfBTX2gnboPFUl5BG5FQ&s" },
        { name: "Shri D. Vedavyas Kamath", title: "Guest of honour", info: "MLA, Mangaluru City South", img: "https://pbs.twimg.com/media/FwATVHxX0AMu82x.jpg" },
        { name: "Bharath N Acharya", title: "Inaugural Guest", info: "National President Of JCI RPP", img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQIjOmqeOGOJa3kuXNydo-cUuNmnRbBHl-rhQ&s" }
      ],
      pricing: {
        phase1: { price: 200, status: 'SOLD OUT' },
        phase2: { price: 299, status: 'ACTIVE NOW', originalPrice: 200 }
      }
    }
  };

  const event = eventsData[eventId];

  if (!event) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white pt-20">
        <h1 className="text-3xl font-bold text-[#1B1B4D] mb-4">Event not found</h1>
        <Link href="/" className="text-[#F5841F] font-semibold flex items-center gap-2 hover:underline">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 overflow-hidden pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative w-full z-10">
        
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-slate-600 bg-white border border-slate-200 px-4 py-2 rounded-full hover:bg-slate-50 hover:text-[#F5841F] hover:shadow-md transition-all shadow-sm text-sm font-semibold w-fit">
            <ArrowLeft className="w-4 h-4" /> Back to Club
          </Link>
        </div>

        {/* Event Header */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="text-center mb-8"
        >
          <h1 className="font-heading text-5xl sm:text-7xl text-[#1B1B4D] uppercase italic -skew-x-6 mt-8">
            {event.title}
          </h1>
          <div className="w-24 h-1.5 bg-[#F5841F] mx-auto mt-6 rounded-full"></div>
        </motion.div>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="w-full overflow-hidden bg-white py-8 mb-12 rounded-2xl border border-slate-200 shadow-sm relative"
        >
          <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-white to-transparent z-10"></div>
          <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-white to-transparent z-10"></div>
          <div className="flex whitespace-nowrap animate-marquee w-max">
            <div className="flex items-center px-8 gap-16 md:gap-24 pr-16 md:pr-24">
              <div className="flex items-center gap-6">
                <img src="/jci.png" alt="JCI Mangalore" className="h-20 sm:h-28 w-auto object-contain" />
                <span className="text-4xl sm:text-6xl font-heading italic text-slate-300">JCI MANGALORE</span>
              </div>
              <div className="flex items-center gap-6">
                <img src="https://ui-avatars.com/api/?name=CB&background=f1f5f9&color=94a3b8" alt="Logo" className="h-20 w-20 sm:h-28 sm:w-28 rounded-full" />
                <span className="text-4xl sm:text-6xl font-heading italic text-slate-300">CANARA BANK</span>
              </div>
              <div className="flex items-center gap-6">
                <img src="https://ui-avatars.com/api/?name=DC&background=f1f5f9&color=94a3b8" alt="Logo" className="h-20 w-20 sm:h-28 sm:w-28 rounded-full" />
                <span className="text-4xl sm:text-6xl font-heading italic text-slate-300">DECATHLON</span>
              </div>
              <div className="flex items-center gap-6">
                <img src="/kmc.png" alt="KMC Hospital" className="h-20 sm:h-28 w-auto object-contain" />
                <span className="text-4xl sm:text-6xl font-heading italic text-slate-300">KMC HOSPITAL</span>
              </div>
              <div className="flex items-center gap-6">
                <img src="https://ui-avatars.com/api/?name=D1&background=f1f5f9&color=94a3b8" alt="Logo" className="h-20 w-20 sm:h-28 sm:w-28 rounded-full" />
                <span className="text-4xl sm:text-6xl font-heading italic text-slate-300">DUMMY SPONSOR</span>
              </div>
            </div>
            <div className="flex items-center px-8 gap-16 md:gap-24 pr-16 md:pr-24">
              <div className="flex items-center gap-6">
                <img src="/jci.png" alt="JCI Mangalore" className="h-20 sm:h-28 w-auto object-contain" />
                <span className="text-4xl sm:text-6xl font-heading italic text-slate-300">JCI MANGALORE</span>
              </div>
              <div className="flex items-center gap-6">
                <img src="https://ui-avatars.com/api/?name=CB&background=f1f5f9&color=94a3b8" alt="Logo" className="h-20 w-20 sm:h-28 sm:w-28 rounded-full" />
                <span className="text-4xl sm:text-6xl font-heading italic text-slate-300">CANARA BANK</span>
              </div>
              <div className="flex items-center gap-6">
                <img src="https://ui-avatars.com/api/?name=DC&background=f1f5f9&color=94a3b8" alt="Logo" className="h-20 w-20 sm:h-28 sm:w-28 rounded-full" />
                <span className="text-4xl sm:text-6xl font-heading italic text-slate-300">DECATHLON</span>
              </div>
              <div className="flex items-center gap-6">
                <img src="/kmc.png" alt="KMC Hospital" className="h-20 sm:h-28 w-auto object-contain" />
                <span className="text-4xl sm:text-6xl font-heading italic text-slate-300">KMC HOSPITAL</span>
              </div>
              <div className="flex items-center gap-6">
                <img src="https://ui-avatars.com/api/?name=D1&background=f1f5f9&color=94a3b8" alt="Logo" className="h-20 w-20 sm:h-28 sm:w-28 rounded-full" />
                <span className="text-4xl sm:text-6xl font-heading italic text-slate-300">DUMMY SPONSOR</span>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="bg-white rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.06)] border border-slate-200 flex flex-col lg:flex-row relative z-20"
        >
          {/* Event Details Left */}
          <div className="p-8 md:p-12 lg:w-3/5 bg-linear-to-br from-white to-slate-50">
            <div className="inline-block bg-green-100 text-green-700 font-bold px-4 py-1.5 rounded-full text-xs tracking-widest uppercase mb-8 animate-pulse">
              Registrations Open
            </div>
            
            <div className="space-y-4 mb-10">
              <div className="flex items-center gap-5 p-5 rounded-2xl bg-slate-50 border border-slate-100 shadow-xs hover:shadow-md transition-shadow">
                <div className="w-14 h-14 rounded-2xl bg-[#F5841F]/10 flex items-center justify-center shrink-0">
                  <Calendar className="w-7 h-7 text-[#F5841F]" />
                </div>
                <div>
                  <span className="block text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Date</span>
                  <strong className="text-xl text-[#1B1B4D] font-bold">{event.date}</strong>
                </div>
              </div>
              
              <div className="flex items-center gap-5 p-5 rounded-2xl bg-slate-50 border border-slate-100 shadow-xs hover:shadow-md transition-shadow">
                <div className="w-14 h-14 rounded-2xl bg-[#F5841F]/10 flex items-center justify-center shrink-0">
                  <Clock className="w-7 h-7 text-[#F5841F]" />
                </div>
                <div>
                  <span className="block text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Time</span>
                  <strong className="text-xl text-[#1B1B4D] font-bold">{event.time}</strong>
                </div>
              </div>

              <div className="flex items-center gap-5 p-5 rounded-2xl bg-slate-50 border border-slate-100 shadow-xs hover:shadow-md transition-shadow">
                <div className="w-14 h-14 rounded-2xl bg-[#F5841F]/10 flex items-center justify-center shrink-0">
                  <MapPin className="w-7 h-7 text-[#F5841F]" />
                </div>
                <div>
                  <span className="block text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Venue</span>
                  <strong className="text-xl text-[#1B1B4D] font-bold">{event.venue}</strong>
                </div>
              </div>
            </div>

          </div>

          {/* Pricing Right side */}
          <div className="p-8 md:p-12 lg:w-2/5 bg-[#1B1B4D] relative overflow-hidden flex flex-col justify-center">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#F5841F] rounded-full blur-[100px] opacity-20"></div>
            
            <h4 className="text-white font-heading text-2xl uppercase italic -skew-x-3 mb-6 relative z-10">Secure Your Spot</h4>
            
            {/* Phase 1 */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-4 relative overflow-hidden">
              <div className="absolute top-3 right-3 bg-white/20 text-white/50 text-[10px] font-bold px-2 py-1 rounded-full">{event.pricing.phase1.status}</div>
              <p className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-1">Phase 1</p>
              <div className="text-2xl font-bold text-white/40 line-through">₹{event.pricing.phase1.price}</div>
            </div>

            {/* Phase 2 */}
            <div className="bg-linear-to-br from-[#F5841F] to-[#ff9b44] rounded-2xl p-6 relative shadow-[0_0_30px_rgba(245,132,31,0.3)] z-10">
              <div className="absolute top-4 right-4 bg-white text-[#F5841F] text-[10px] font-bold px-2 py-1 rounded-full animate-pulse">{event.pricing.phase2.status}</div>
              <p className="text-white/90 text-xs font-bold uppercase tracking-widest mb-1">Phase 2</p>
              <div className="flex items-end gap-2 mb-4">
                <span className="text-4xl font-bold text-white">₹{event.pricing.phase2.price}</span>
              </div>
              
              <ul className="space-y-2 text-sm text-white/90 mb-6">
                <li className="flex items-center gap-2"><span className="font-bold">✓</span> Race BIB</li>
                <li className="flex items-center gap-2"><span className="font-bold">✓</span> Event T-Shirt</li>
                <li className="flex items-center gap-2"><span className="font-bold">✓</span> Finisher Certificate</li>
              </ul>

              <Link href="/register" className="w-full text-center py-4 bg-white text-[#F5841F] hover:bg-slate-50 shadow-xl rounded-xl font-semibold flex items-center justify-center gap-2 transition-all">
                Register Now
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Primary Sponsors (Moved below registration card) */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="bg-white rounded-3xl p-8 md:p-12 mt-12 mb-8 shadow-sm border border-slate-200 flex flex-col md:flex-row flex-wrap justify-center items-center gap-10 md:gap-16 text-[#1B1B4D]"
        >
          <div className="text-center">
            <span className="block text-slate-400 font-bold tracking-widest text-[10px] sm:text-xs uppercase mb-2">Supported By</span>
            <h3 className="text-3xl sm:text-4xl font-heading font-bold tracking-tight italic -skew-x-3">JCI Mangalore</h3>
          </div>
          <div className="w-full md:w-px h-px md:h-16 bg-slate-200"></div>
          <div className="text-center">
            <span className="block text-slate-400 font-bold tracking-widest text-[10px] sm:text-xs uppercase mb-2">Banking Partner</span>
            <h3 className="text-3xl sm:text-4xl font-heading font-bold tracking-tight italic -skew-x-3">Canara Bank</h3>
          </div>
          <div className="w-full md:w-px h-px md:h-16 bg-slate-200"></div>
          <div className="text-center">
            <span className="block text-slate-400 font-bold tracking-widest text-[10px] sm:text-xs uppercase mb-2">Health Partner</span>
            <h3 className="text-3xl sm:text-4xl font-heading font-bold tracking-tight italic -skew-x-3">KMC Hospital</h3>
          </div>
        </motion.div>

        {/* Special Guests Section */}
        {event.guests && event.guests.length > 0 && (
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={fadeInUp}
            className="mt-20 mb-8"
          >
            <div className="text-center mb-12">
              <h2 className="font-heading text-4xl sm:text-5xl text-[#1B1B4D] uppercase italic -skew-x-6">Honorable Guests</h2>
              <div className="w-16 h-1.5 bg-[#F5841F] mx-auto mt-4 rounded-full"></div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {event.guests.map((g: any, i: number) => (
                <div key={i} className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col items-center text-center hover:-translate-y-2 hover:shadow-2xl hover:shadow-[#F5841F]/10 transition-all duration-300">
                  <div className="w-40 h-40 rounded-full p-1.5 bg-linear-to-tr from-[#F5841F] to-[#ff9b44] mb-6 shadow-lg shadow-[#F5841F]/30">
                    <img src={g.img} className="w-full h-full rounded-full object-cover border-4 border-white bg-slate-100" alt={g.name} />
                  </div>
                  <div className="inline-block bg-[#1B1B4D]/5 text-[#1B1B4D] font-bold px-4 py-1.5 rounded-full text-xs tracking-widest uppercase mb-4">
                    {g.title}
                  </div>
                  <h4 className="text-xl font-bold text-[#1B1B4D] mb-3">{g.name}</h4>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed">{g.info}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

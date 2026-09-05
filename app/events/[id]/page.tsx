'use client';

import Link from 'next/link';
import { motion, Variants } from 'framer-motion';
import { Calendar, Clock, MapPin, ArrowRight, ArrowLeft, Shirt } from 'lucide-react';
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
    'next-run': {
      title: "Next Community Run",
      sponsors: ["Balipu Run Club"],
      time: "Assembly 6:15 AM | Starts 6:30 AM",
      venue: "Mangaluru",
      mapImage: "/map.png",
      mapUrl: "https://maps.app.goo.gl/sqSHqAcyAWqnFgvs8",
      description: "Lace up for Balipu x Aloysius: Mangalore's first ever super car run. Full route, timing, and registration details on the event page.",
      date: "11th October 2026",
      guests: [],
      pricing: {
        phase1: { price: 0, status: 'COMING SOON', title: 'Registration' },
        benefits: ["Race BIB", "Community Run", "Club Support"]
      },
      registrationLink: "https://chat.whatsapp.com/Drd93iPcBwv4sXneIDuoPc",
      isUpcoming: true,
    },
    'monsoon-run': {
      title: "The Monsoon Run",
      sponsors: ["JCI Mangalore"],
      date: "12th July 2026",
      time: "6:30 AM",
      venue: "Fiza by nexus",
      mapImage: "/map.png",
      mapUrl: "https://maps.app.goo.gl/sqSHqAcyAWqnFgvs8",
      guests: [
        { name: "Captain Brijesh Chowta", title: "Chief Guest", info: "Member of Parliament, Dakshina Kannada Lok Sabha Constituency", img: "https://imgs.etvbharat.com/etvbharat/prod-images/14-03-2024/1200-675-20984062-thumbnail-16x9-etvbharat.JPG" },
        { name: "Dr Bharath Shetty", title: "Guest of honour", info: "MLA, Mangaluru City North", img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSAJ8BijrOP9Giay3tfBTX2gnboPFUl5BG5FQ&s" },
        { name: "Shri D. Vedavyas Kamath", title: "Guest of honour", info: "MLA, Mangaluru City South", img: "https://pbs.twimg.com/media/FwATVHxX0AMu82x.jpg" },
        { name: "RPP BHARATH N ACHARYA", title: "Inaugural Guest", info: "National President JCI India", img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQIjOmqeOGOJa3kuXNydo-cUuNmnRbBHl-rhQ&s" }
      ],
      pricing: {
        earlyBird: { price: 200, status: 'SOLD OUT' },
        phase1: { price: 299, status: 'SOLD OUT' },
        phase2: { price: 350, status: 'SOLD OUT', title: 'Phase 2 (Last Phase)' },
        benefits: ["Race BIB", "Event T-Shirt", "Finisher Certificate"]
      },
      registrationLink: "https://forms.gle/FqMjYtDnunoH3sJx8"
    },
    'monsoon-dancebattle': {
      title: "Monsoon Dance Battle",
      isDance: true,
      sponsors: ["JCI Mangalore"],
      date: "12th July 2026",
      time: "After fitness event (Around 9:45 AM)",
      venue: "Fiza by nexus",
      description: "Get ready to witness the ultimate street dance showdown! This is a SOLO battle event. Cash prizes for the winners will be revealed at the venue.",
      guests: [
        { name: "Captain Brijesh Chowta", title: "Chief Guest", info: "Member of Parliament, Dakshina Kannada Lok Sabha Constituency", img: "https://imgs.etvbharat.com/etvbharat/prod-images/14-03-2024/1200-675-20984062-thumbnail-16x9-etvbharat.JPG" },
        { name: "Dr Bharath Shetty", title: "Guest of honour", info: "MLA, Mangaluru City North", img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSAJ8BijrOP9Giay3tfBTX2gnboPFUl5BG5FQ&s" },
        { name: "Shri D. Vedavyas Kamath", title: "Guest of honour", info: "MLA, Mangaluru City South", img: "https://pbs.twimg.com/media/FwATVHxX0AMu82x.jpg" },
        { name: "RPP BHARATH N ACHARYA", title: "Inaugural Guest", info: "National President JCI India", img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQIjOmqeOGOJa3kuXNydo-cUuNmnRbBHl-rhQ&s" }
      ],
      pricing: {
        phase2: { price: 200, status: 'SOLD OUT', title: 'Solo Entry' },
        benefits: ["Entry to Dance Battle", "Experience the Vibe", "Cash Prizes for Winners!"]
      },
      registrationLink: "https://forms.gle/XvYjr1jmaTqSTxB68"
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
    <div className={`flex flex-col min-h-screen overflow-x-clip pt-24 pb-20 ${event.isDance ? 'bg-zinc-950 text-slate-200 bg-[url("https://www.transparenttextures.com/patterns/carbon-fibre.png")]' : 'bg-slate-50'}`}>
      <div className="site-container relative w-full z-10 min-w-0">

        <div className="mb-8">
          <Link href="/" className={`inline-flex items-center gap-2 border px-4 py-2 rounded-full transition-all shadow-sm text-sm font-semibold w-fit min-h-11 ${event.isDance ? 'bg-zinc-900 border-zinc-800 text-slate-300 hover:bg-zinc-800 hover:text-purple-400' : 'text-slate-600 bg-white border-slate-200 hover:bg-slate-50 hover:text-[#F5841F]'}`}>
            <ArrowLeft className="w-4 h-4" /> Back to Club
          </Link>
        </div>

        {/* Event Header */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="text-center mb-8 overflow-x-clip min-w-0"
        >
          <h1 className={`font-heading text-[clamp(2.25rem,8vw,4.5rem)] sm:text-[clamp(3rem,7vw,4.5rem)] uppercase italic -skew-x-6 mt-8 break-words px-1 ${event.isDance ? 'text-transparent bg-clip-text bg-linear-to-r from-purple-400 to-pink-600 drop-shadow-[0_0_20px_rgba(168,85,247,0.5)]' : 'text-[#1B1B4D]'}`}>
            {event.title}
          </h1>
          <div className={`w-24 h-1.5 mx-auto mt-6 rounded-full ${event.isDance ? 'bg-purple-600' : 'bg-[#F5841F]'}`}></div>
        </motion.div>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className={`w-full overflow-hidden pt-6 pb-8 mb-12 rounded-2xl border shadow-sm relative ${event.isDance ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'}`}
        >
          <div className="text-center mb-6 relative z-20">
            <span className="text-slate-400 font-bold tracking-widest text-xs uppercase">Our Sponsors</span>
          </div>
          <div className={`absolute left-0 top-0 bottom-0 w-8 sm:w-16 md:w-24 z-10 pointer-events-none ${event.isDance ? 'bg-gradient-to-r from-zinc-900 to-transparent' : 'bg-gradient-to-r from-white to-transparent'}`}></div>
          <div className={`absolute right-0 top-0 bottom-0 w-8 sm:w-16 md:w-24 z-10 pointer-events-none ${event.isDance ? 'bg-gradient-to-l from-zinc-900 to-transparent' : 'bg-gradient-to-l from-white to-transparent'}`}></div>
          <div className="flex whitespace-nowrap animate-marquee w-max">
            <div className="flex items-center px-4 sm:px-8 gap-10 sm:gap-16 md:gap-24 pr-10 sm:pr-16 md:pr-24">
              <div className="flex items-center gap-4 sm:gap-6">
                <img src="/decathlon.png" alt="Decathlon" className="h-14 sm:h-20 md:h-28 w-auto rounded-2xl object-contain bg-white shadow-sm border border-slate-100 p-2" />
                <span className="text-2xl sm:text-4xl md:text-6xl font-heading italic text-slate-300">DECATHLON</span>
              </div>
              <div className="flex items-center gap-4 sm:gap-6">
                <img src="/jci.jpeg" alt="JCI Mangalore" className="h-14 sm:h-20 md:h-28 w-auto rounded-2xl object-contain bg-white shadow-sm border border-slate-100 p-2" />
                <span className="text-2xl sm:text-4xl md:text-6xl font-heading italic text-slate-300">JCI MANGALORE</span>
              </div>
              <div className="flex items-center gap-4 sm:gap-6">
                <img src="/canara.jpg" alt="Canara Bank" className="w-14 h-14 sm:w-20 sm:h-20 md:w-28 md:h-28 rounded-full object-cover bg-white shadow-sm border border-slate-100 scale-105" />
                <span className="text-2xl sm:text-4xl md:text-6xl font-heading italic text-slate-300">CANARA BANK</span>
              </div>
              <div className="flex items-center gap-4 sm:gap-6">
                <img src="/kmc.png" alt="KMC Hospital" className="h-14 sm:h-20 md:h-28 w-auto object-contain" />
                <span className="text-2xl sm:text-4xl md:text-6xl font-heading italic text-slate-300">KMC HOSPITAL</span>
              </div>
            </div>
            <div className="flex items-center px-4 sm:px-8 gap-10 sm:gap-16 md:gap-24 pr-10 sm:pr-16 md:pr-24">
              <div className="flex items-center gap-4 sm:gap-6">
                <img src="/decathlon.png" alt="Decathlon" className="h-14 sm:h-20 md:h-28 w-auto rounded-2xl object-contain bg-white shadow-sm border border-slate-100 p-2" />
                <span className="text-2xl sm:text-4xl md:text-6xl font-heading italic text-slate-300">DECATHLON</span>
              </div>
              <div className="flex items-center gap-4 sm:gap-6">
                <img src="/jci.jpeg" alt="JCI Mangalore" className="h-14 sm:h-20 md:h-28 w-auto rounded-2xl object-contain bg-white shadow-sm border border-slate-100 p-2" />
                <span className="text-2xl sm:text-4xl md:text-6xl font-heading italic text-slate-300">JCI MANGALORE</span>
              </div>
              <div className="flex items-center gap-4 sm:gap-6">
                <img src="/canara.jpg" alt="Canara Bank" className="w-14 h-14 sm:w-20 sm:h-20 md:w-28 md:h-28 rounded-full object-cover bg-white shadow-sm border border-slate-100 scale-105" />
                <span className="text-2xl sm:text-4xl md:text-6xl font-heading italic text-slate-300">CANARA BANK</span>
              </div>
              <div className="flex items-center gap-4 sm:gap-6">
                <img src="/kmc.png" alt="KMC Hospital" className="h-14 sm:h-20 md:h-28 w-auto object-contain" />
                <span className="text-2xl sm:text-4xl md:text-6xl font-heading italic text-slate-300">KMC HOSPITAL</span>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className={`rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.06)] border flex flex-col lg:flex-row relative z-20 ${event.isDance ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'}`}
        >
          {/* Event Details Left */}
          <div className={`p-4 sm:p-6 md:p-8 lg:p-12 lg:w-3/5 min-w-0 ${event.isDance ? 'bg-zinc-900' : 'bg-linear-to-br from-white to-slate-50'}`}>
            <div className={`inline-block font-bold px-4 py-1.5 rounded-full text-xs tracking-widest uppercase mb-6 sm:mb-8 ${event.isUpcoming ? 'bg-[#FF2D87]/15 text-[#FF2D87]' : event.isDance ? 'bg-purple-500/20 text-purple-400 animate-pulse' : 'bg-green-100 text-green-700 animate-pulse'}`}>
              {event.isUpcoming ? 'Coming Soon' : event.isDance ? 'Solo Registrations Open' : 'Registrations Open'}
            </div>

            <div className="space-y-3 sm:space-y-4 mb-10">
              <div className={`flex items-center gap-3 sm:gap-5 p-3 sm:p-5 rounded-2xl border shadow-xs hover:shadow-md transition-shadow min-w-0 ${event.isDance ? 'bg-zinc-800/50 border-zinc-800' : 'bg-slate-50 border-slate-100'}`}>
                <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shrink-0 ${event.isDance ? 'bg-purple-500/20' : 'bg-[#F5841F]/10'}`}>
                  <Calendar className={`w-5 h-5 sm:w-7 sm:h-7 ${event.isDance ? 'text-purple-400' : 'text-[#F5841F]'}`} />
                </div>
                <div className="min-w-0 break-words">
                  <span className="block text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Date</span>
                  <strong className={`text-lg sm:text-xl font-bold ${event.isDance ? 'text-white' : 'text-[#1B1B4D]'}`}>{event.date}</strong>
                </div>
              </div>

              <div className={`flex items-center gap-3 sm:gap-5 p-3 sm:p-5 rounded-2xl border shadow-xs hover:shadow-md transition-shadow min-w-0 ${event.isDance ? 'bg-zinc-800/50 border-zinc-800' : 'bg-slate-50 border-slate-100'}`}>
                <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shrink-0 ${event.isDance ? 'bg-purple-500/20' : 'bg-[#F5841F]/10'}`}>
                  <Clock className={`w-5 h-5 sm:w-7 sm:h-7 ${event.isDance ? 'text-purple-400' : 'text-[#F5841F]'}`} />
                </div>
                <div className="min-w-0 break-words">
                  <span className="block text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Time</span>
                  <strong className={`text-lg sm:text-xl font-bold ${event.isDance ? 'text-white' : 'text-[#1B1B4D]'}`}>{event.time}</strong>
                </div>
              </div>

              <div className={`flex items-center gap-3 sm:gap-5 p-3 sm:p-5 rounded-2xl border shadow-xs hover:shadow-md transition-shadow min-w-0 ${event.isDance ? 'bg-zinc-800/50 border-zinc-800' : 'bg-slate-50 border-slate-100'}`}>
                <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shrink-0 ${event.isDance ? 'bg-purple-500/20' : 'bg-[#F5841F]/10'}`}>
                  <MapPin className={`w-5 h-5 sm:w-7 sm:h-7 ${event.isDance ? 'text-purple-400' : 'text-[#F5841F]'}`} />
                </div>
                <div className="flex-1 min-w-0 break-words">
                  <span className="block text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Venue</span>
                  <strong className={`text-lg sm:text-xl font-bold block ${event.isDance ? 'text-white' : 'text-[#1B1B4D]'}`}>{event.venue}</strong>
                  {event.mapImage && (
                    <a href="#route-map" className={`inline-block mt-1 text-xs font-semibold hover:underline ${event.isDance ? 'text-purple-400' : 'text-[#F5841F]'}`}>
                      View Route Map &darr;
                    </a>
                  )}
                </div>
              </div>

              {/* BIB Collection Details */}
              {!event.isDance && (
                <div className="flex flex-col gap-4 p-3 sm:p-5 rounded-2xl border shadow-xs bg-blue-50/50 border-blue-100/50 min-w-0">
                  <div className="flex items-center gap-3 mb-1 min-w-0">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 bg-blue-500/10">
                      <Shirt className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                    </div>
                    <h4 className="font-bold text-[#1B1B4D] text-base sm:text-lg break-words">BIB Collection</h4>
                  </div>
                  
                  <div className="space-y-3 pl-0 sm:pl-[3.25rem] text-sm break-words">
                    <div>
                      <span className="font-bold text-slate-800 block mb-0.5">Paid Entries:</span>
                      <span className="text-slate-600 font-medium">10th July • 2:00 PM - 7:30 PM</span>
                    </div>
                    <div>
                      <span className="font-bold text-slate-800 block mb-0.5">Free Entries:</span>
                      <span className="text-slate-600 font-medium">11th July • 11:00 AM - 6:00 PM</span>
                    </div>
                    <div className="pt-3 border-t border-blue-200/50">
                      <a href="https://maps.app.goo.gl/hacfPsQE4KWpT3re6" target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-600 hover:text-blue-700 hover:underline flex items-start gap-1.5 transition-colors">
                        <MapPin className="w-4 h-4 mt-0.5 shrink-0"/>
                        <span className="leading-snug">Decathlon Sports - 1st floor, Bharath Mall, Bejai Kavoor Rd, opposite KSRTC, Lalbagh, Mangaluru</span>
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {event.description && (
                <div className="bg-indigo-50 border border-indigo-100 p-5 rounded-2xl mb-4">
                  <p className="text-indigo-900 font-medium">{event.description}</p>
                </div>
              )}


            </div>

          </div>

          {/* Pricing Right side */}
          <div className={`p-4 sm:p-6 md:p-8 lg:p-12 lg:w-2/5 relative overflow-hidden flex flex-col justify-center min-w-0 ${event.isDance ? 'bg-black' : 'bg-[#1B1B4D]'}`}>
            <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-[100px] opacity-20 ${event.isDance ? 'bg-purple-600' : 'bg-[#F5841F]'}`}></div>

            <h4 className="text-white font-heading text-xl sm:text-2xl uppercase italic -skew-x-3 mb-6 relative z-10 break-words overflow-x-clip">
              {event.isDance ? 'Join the Battle' : 'Secure Your Spot'}
            </h4>

            {/* Early Bird */}
            {event.pricing.earlyBird && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-3 sm:p-4 mb-4 relative overflow-hidden pr-20 sm:pr-24">
                <div className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-white/20 text-white/50 text-[10px] font-bold px-2 py-1 rounded-full">{event.pricing.earlyBird.status}</div>
                <p className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-1">Early Bird</p>
                <div className="text-2xl font-bold text-white/40 line-through">₹{event.pricing.earlyBird.price}</div>
              </div>
            )}

            {/* Phase 1 */}
            {event.pricing.phase1 && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-3 sm:p-4 mb-4 relative overflow-hidden pr-20 sm:pr-24">
                <div className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-white/20 text-white/50 text-[10px] font-bold px-2 py-1 rounded-full">{event.pricing.phase1.status}</div>
                <p className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-1">Phase 1</p>
                <div className="text-2xl font-bold text-white/40 line-through">₹{event.pricing.phase1.price}</div>
              </div>
            )}

            {/* Phase 2 / Active Phase */}
            <div className={`rounded-2xl p-4 sm:p-6 relative z-10 ${event.isDance ? 'bg-linear-to-br from-purple-600 to-indigo-600 shadow-[0_0_30px_rgba(147,51,234,0.3)] border border-purple-400' : 'bg-linear-to-br from-[#F5841F] to-[#ff9b44] shadow-[0_0_30px_rgba(245,132,31,0.3)]'}`}>
              <div className={`absolute top-2 right-2 sm:top-4 sm:right-4 bg-white text-[10px] font-bold px-2 py-1 rounded-full animate-pulse ${event.isDance ? 'text-purple-600' : 'text-[#F5841F]'}`}>
                {event.pricing.phase2.status}
              </div>
              <p className="text-white/90 text-xs font-bold uppercase tracking-widest mb-1 pr-16 sm:pr-20">{event.pricing.phase2.title}</p>
              <div className="flex items-end gap-2 mb-2">
                <span className="text-3xl sm:text-4xl font-bold text-white">₹{event.pricing.phase2.price}</span>
              </div>

              {!event.isDance && (
                <div className="bg-white/20 rounded-lg p-2.5 mb-5 border border-white/30 shadow-sm animate-fade-in">
                  <p className="text-xs font-bold text-white">🎉 20 more spots just opened!</p>
                  <p className="text-[10px] text-white/90 mt-0.5">Limited slots available. Register before they sell out!</p>
                </div>
              )}

              <ul className="space-y-2 text-sm text-white/90 mb-6 mt-4">
                {event.pricing.benefits?.map((benefit: string, idx: number) => (
                  <li key={idx} className="flex items-center gap-2"><span className="font-bold">✓</span> {benefit}</li>
                ))}
              </ul>

              {event.pricing.phase2.status === 'SOLD OUT' ? (
                <button disabled className="w-full min-h-11 text-center py-4 bg-slate-200 text-slate-500 rounded-xl font-semibold flex items-center justify-center gap-2 cursor-not-allowed">
                  Registrations Closed
                </button>
              ) : (
                <a href={event.registrationLink} target="_blank" rel="noopener noreferrer" className={`w-full min-h-11 text-center py-4 bg-white hover:bg-slate-50 shadow-xl rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${event.isDance ? 'text-purple-600' : 'text-[#F5841F]'}`}>
                  Register Now
                  <ArrowRight className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>
        </motion.div>


        {/* Primary Sponsors */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className={`rounded-3xl p-4 sm:p-6 md:p-8 lg:p-12 mt-12 mb-8 shadow-sm border flex flex-col md:flex-row flex-wrap justify-center items-center gap-8 sm:gap-10 md:gap-16 overflow-x-clip ${event.isDance ? 'bg-zinc-900 border-zinc-800 text-slate-200' : 'bg-white border-slate-200 text-[#1B1B4D]'}`}
        >
          <div className="text-center min-w-0">
            <span className="block text-slate-400 font-bold tracking-widest text-[10px] sm:text-xs uppercase mb-2">Title Sponsor</span>
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-heading font-bold tracking-tight italic -skew-x-3 text-[#0082C3] break-words">Decathlon</h3>
          </div>
          <div className={`w-full md:w-px h-px md:h-16 ${event.isDance ? 'bg-zinc-800' : 'bg-slate-200'}`}></div>
          <div className="text-center min-w-0">
            <span className="block text-slate-400 font-bold tracking-widest text-[10px] sm:text-xs uppercase mb-2">Supported By</span>
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-heading font-bold tracking-tight italic -skew-x-3 break-words">JCI Mangalore</h3>
          </div>
          <div className={`w-full md:w-px h-px md:h-16 ${event.isDance ? 'bg-zinc-800' : 'bg-slate-200'}`}></div>
          <div className="text-center min-w-0">
            <span className="block text-slate-400 font-bold tracking-widest text-[10px] sm:text-xs uppercase mb-2">Supporting Sponsor</span>
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-heading font-bold tracking-tight italic -skew-x-3 break-words">Canara Bank</h3>
          </div>
          <div className={`w-full md:w-px h-px md:h-16 ${event.isDance ? 'bg-zinc-800' : 'bg-slate-200'}`}></div>
          <div className="text-center min-w-0">
            <span className="block text-slate-400 font-bold tracking-widest text-[10px] sm:text-xs uppercase mb-2">Health Partner</span>
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-heading font-bold tracking-tight italic -skew-x-3 break-words">KMC Hospital</h3>
          </div>
        </motion.div>

        {/* Special Guests Section */}
        {event.guests && event.guests.length > 0 && (
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={fadeInUp}
            className="mt-16 sm:mt-20 mb-8 overflow-x-clip"
          >
            <div className="text-center mb-10 sm:mb-12 min-w-0">
              <h2 className={`font-heading text-[clamp(1.75rem,5vw,3rem)] sm:text-5xl uppercase italic -skew-x-6 break-words px-1 ${event.isDance ? 'text-transparent bg-clip-text bg-linear-to-r from-purple-400 to-pink-600' : 'text-[#1B1B4D]'}`}>Honorable Guests</h2>
              <div className={`w-16 h-1.5 mx-auto mt-4 rounded-full ${event.isDance ? 'bg-purple-600' : 'bg-[#F5841F]'}`}></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
              {event.guests.map((g: any, i: number) => (
                <div key={i} className={`rounded-2xl p-4 sm:p-6 flex flex-col items-center text-center shadow-sm border hover:-translate-y-1 transition-transform min-w-0 ${event.isDance ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-100 hover:shadow-lg hover:shadow-slate-200/50'}`}>
                  <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full p-1.5 bg-linear-to-tr from-[#F5841F] to-[#ff9b44] mb-6 shadow-lg shadow-[#F5841F]/30">
                    <img src={g.img} className="w-full h-full rounded-full object-cover border-4 border-white bg-slate-100" alt={g.name} />
                  </div>
                  <div className={`inline-block font-bold px-4 py-1.5 rounded-full text-xs tracking-widest uppercase mb-4 ${event.isDance ? 'bg-purple-500/20 text-purple-300' : 'bg-[#1B1B4D]/5 text-[#1B1B4D]'}`}>
                    {g.title}
                  </div>
                  <h3 className={`font-bold text-lg mb-1 break-words ${event.isDance ? 'text-white' : 'text-slate-800'}`}>{g.name}</h3>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed break-words">{g.info}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Map Section */}
        {event.mapImage && (
          <motion.div
            id="route-map"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className={`mt-8 mb-8 rounded-3xl p-4 sm:p-6 md:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.06)] border relative z-20 ${event.isDance ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'}`}
          >
            <span className="block text-slate-400 text-xs font-bold uppercase tracking-widest mb-4 text-center">Route Map</span>
            <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm relative group bg-slate-100 flex justify-center">
              <img src={event.mapImage} alt="Route Map" className="w-full h-auto object-contain max-h-[500px]" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <a href={event.mapUrl} target="_blank" rel="noopener noreferrer" className="bg-white text-[#1B1B4D] px-6 py-2 rounded-full font-bold text-sm shadow-xl flex items-center gap-2 transform transition hover:scale-105">
                  <MapPin className="w-4 h-4" /> View Full Map
                </a>
              </div>
            </div>
          </motion.div>
        )}

        {/* Support Contacts */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="bg-white rounded-3xl p-4 sm:p-6 md:p-8 lg:p-12 mb-12 shadow-sm border border-slate-200 text-center overflow-x-clip"
        >
          <h3 className="text-xl sm:text-2xl font-heading font-bold text-[#1B1B4D] uppercase italic -skew-x-3 mb-6 break-words">Need Help?</h3>
          <p className="text-slate-600 mb-6">If you have any questions or need support regarding the event, feel free to contact us:</p>
          <div className="flex flex-col md:flex-row justify-center items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-4 bg-slate-50 px-4 sm:px-6 py-4 rounded-xl border border-slate-100 w-full md:w-auto min-w-0">
              <div className="w-10 h-10 rounded-full bg-[#F5841F]/10 flex items-center justify-center text-[#F5841F] shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
              </div>
              <div className="text-left min-w-0">
                <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Phone</span>
                <span className="text-slate-700 font-semibold break-words">+91 8317380741<br />+91 7349791297</span>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-slate-50 px-4 sm:px-6 py-4 rounded-xl border border-slate-100 w-full md:w-auto min-w-0">
              <div className="w-10 h-10 rounded-full bg-[#F5841F]/10 flex items-center justify-center text-[#F5841F] shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
              </div>
              <div className="text-left min-w-0">
                <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Email</span>
                <a href="mailto:Balipurunclub@gmail.com" className="text-slate-700 font-semibold hover:text-[#F5841F] transition-colors break-all sm:break-normal">Balipurunclub@gmail.com</a>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

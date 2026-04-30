import { notFound } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, XCircle, Calendar, CreditCard, Dumbbell, MapPin, ShieldCheck, User } from "lucide-react";
import { query } from "@/lib/db";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function VerifyBookingPage({ params }: Props) {
  const { id } = await params;

  let booking = null;
  try {
    const result = await query(
      `SELECT b.*, 
       json_build_object('full_name', u.full_name, 'avatar_url', null) as profiles,
       json_build_object('name', g.name, 'location', g.location, 'image', g.image) as gyms
       FROM bookings b
       LEFT JOIN users u ON b.user_id = u.id
       LEFT JOIN gyms g ON b.gym_id = g.id
       WHERE b.id = $1`,
      [id]
    );
    booking = result.rows[0];
  } catch (err) {
    console.error("Error fetching booking for verification", err);
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="text-center space-y-6 max-w-sm w-full">
          <div className="w-24 h-24 bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto border-2 border-red-500/20">
            <XCircle className="w-12 h-12 text-red-500" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">Invalid Ticket</h1>
            <p className="text-slate-400 mt-2">This QR code is invalid or the booking was not found.</p>
          </div>
          <Link href="/" className="inline-block bg-red-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-red-700 transition-all">
            Go to GymDate
          </Link>
        </div>
      </div>
    );
  }

  const now = new Date();
  const endDate = new Date(booking.end_date);
  const startDate = new Date(booking.start_date);
  const isActive = booking.status === "completed" && now >= startDate && now <= endDate;
  const isExpired = now > endDate;

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2">
            <span className="text-2xl font-black text-white tracking-tighter">
              Gym<span className="text-red-500">Date</span>
            </span>
          </Link>
          <p className="text-slate-500 text-xs mt-1 uppercase tracking-widest font-bold">Booking Verification</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-[40px] overflow-hidden shadow-2xl">
          {/* Status Header */}
          <div className={`p-8 flex flex-col items-center ${isActive ? 'bg-green-500' : isExpired ? 'bg-slate-400' : 'bg-yellow-500'}`}>
            <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mb-4 shadow-xl">
              {isActive ? (
                <ShieldCheck className="w-12 h-12 text-green-500" />
              ) : (
                <XCircle className="w-12 h-12 text-slate-400" />
              )}
            </div>
            <h1 className="text-2xl font-black text-white uppercase tracking-tighter">
              {isActive ? "Access Granted" : isExpired ? "Ticket Expired" : "Inactive Ticket"}
            </h1>
            <p className="text-white/80 text-sm font-bold uppercase tracking-widest mt-1">
              {isActive ? "Valid Entry" : isExpired ? "This ticket has expired" : "Contact Support"}
            </p>
          </div>

          {/* Details */}
          <div className="p-8 space-y-6">
            {/* Member Info */}
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 overflow-hidden border-2 border-slate-50 shadow-sm flex items-center justify-center">
                {booking.profiles?.avatar_url ? (
                  <img src={booking.profiles.avatar_url} className="w-full h-full object-cover" alt="Member" />
                ) : (
                  <User className="w-8 h-8 text-slate-400" />
                )}
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Member</p>
                <h2 className="text-xl font-black text-slate-900 leading-none">
                  {booking.profiles?.full_name || "Anonymous User"}
                </h2>
              </div>
            </div>

            {/* Gym Info */}
            {booking.gyms && (
              <div className="flex items-center space-x-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <MapPin className="w-5 h-5 text-red-500 shrink-0" />
                <div>
                  <p className="font-black text-slate-900 text-sm">{booking.gyms.name}</p>
                  <p className="text-xs text-slate-400 font-medium">{booking.gyms.location}</p>
                </div>
              </div>
            )}

            {/* Plan & Status grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Plan</p>
                <div className="flex items-center text-slate-900 font-black text-sm">
                  <Dumbbell className="w-4 h-4 mr-1.5 text-red-500" />
                  {booking.plan_name}
                </div>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Status</p>
                <div className={`flex items-center font-black text-sm ${isActive ? 'text-green-600' : 'text-slate-400'}`}>
                  <CheckCircle2 className="w-4 h-4 mr-1.5" />
                  {isActive ? "Active" : isExpired ? "Expired" : booking.status}
                </div>
              </div>
            </div>

            {/* Dates & Amount */}
            <div className="bg-slate-900/5 p-5 rounded-3xl space-y-3 border border-slate-900/5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 font-bold flex items-center">
                  <Calendar className="w-4 h-4 mr-2" /> Start Date
                </span>
                <span className="text-slate-900 font-black">
                  {new Date(booking.start_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm pt-3 border-t border-slate-900/10">
                <span className="text-slate-500 font-bold flex items-center">
                  <Calendar className="w-4 h-4 mr-2" /> End Date
                </span>
                <span className="text-slate-900 font-black">
                  {new Date(booking.end_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm pt-3 border-t border-slate-900/10">
                <span className="text-slate-500 font-bold flex items-center">
                  <CreditCard className="w-4 h-4 mr-2" /> Amount Paid
                </span>
                <span className="text-red-500 font-black">₹{booking.amount || booking.total_price}</span>
              </div>
            </div>

            {/* Ticket ID */}
            <p className="text-center text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">
              Ticket #{id.slice(0, 8).toUpperCase()}
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-slate-600 text-xs mt-6 font-bold uppercase tracking-widest">
          GymDate Security Verification System
        </p>
      </div>
    </div>
  );
}

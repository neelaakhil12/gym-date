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
       COALESCE(b.customer_name, u.full_name, 'Anonymous User') as display_name,
       json_build_object('name', g.name, 'location', g.location, 'image', g.image) as gyms
       FROM bookings b
       LEFT JOIN users u ON b.user_id = u.id
       LEFT JOIN gyms g ON b.gym_id = g.id
       WHERE b.id::text = $1 OR b.ticket_code = $1`,
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
  const isActive = (booking.status === "completed" || booking.status === "active") && now <= endDate;
  const isExpired = now > endDate;

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-[48px] overflow-hidden shadow-2xl relative">
          {/* Status Header */}
          <div className={`pt-12 pb-10 flex flex-col items-center ${isActive ? 'bg-[#22C55E]' : isExpired ? 'bg-slate-400' : 'bg-yellow-500'}`}>
            <h1 className="text-4xl font-black text-white uppercase tracking-tight text-center leading-none">
              Access<br/>Granted
            </h1>
            <p className="text-white/90 text-sm font-black uppercase tracking-[0.2em] mt-3">
              Verified Entry
            </p>
          </div>

          {/* Details Section */}
          <div className="px-8 pb-10 -mt-6 bg-white rounded-t-[48px] relative z-10">
            {/* Member Info */}
            <div className="flex items-center space-x-6 pt-10 mb-8">
              <div className="w-24 h-24 rounded-[32px] bg-slate-50 flex items-center justify-center border-4 border-white shadow-xl">
                <User className="w-10 h-10 text-slate-300" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Customer Name</p>
                <h2 className="text-2xl font-black text-slate-900 leading-tight">
                  {booking.display_name}
                </h2>
              </div>
            </div>

            {/* Plan & Status grid */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-slate-50 p-5 rounded-[32px] border border-slate-100">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Plan</p>
                <div className="text-xl font-black text-slate-900">
                  {booking.plan_name}
                </div>
              </div>
              <div className="bg-slate-50 p-5 rounded-[32px] border border-slate-100">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Status</p>
                <div className={`flex items-center text-xl font-black ${isActive ? 'text-[#22C55E]' : 'text-slate-400'}`}>
                  <span className="w-2 h-2 rounded-full bg-current mr-2 animate-pulse" />
                  {isActive ? "Active" : "Expired"}
                </div>
              </div>
            </div>

            {/* Dates & Amount */}
            <div className="bg-slate-50 p-8 rounded-[40px] space-y-5 border border-slate-100 mb-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center text-slate-500 font-bold">
                  <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center mr-3 shadow-sm">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <span className="text-lg">Start Date</span>
                </div>
                <span className="text-lg font-black text-slate-900">
                  {new Date(booking.start_date).toLocaleDateString("en-GB")}
                </span>
              </div>
              
              <div className="w-full h-px bg-slate-200/50" />

              <div className="flex items-center justify-between">
                <div className="flex items-center text-slate-500 font-bold">
                  <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center mr-3 shadow-sm">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <span className="text-lg">End Date</span>
                </div>
                <span className="text-lg font-black text-slate-900">
                  {new Date(booking.end_date).toLocaleDateString("en-GB")}
                </span>
              </div>

              <div className="w-full h-px bg-slate-200/50" />

              <div className="flex items-center justify-between">
                <div className="flex items-center text-slate-500 font-bold">
                  <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center mr-3 shadow-sm">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <span className="text-lg">Amount Paid</span>
                </div>
                <span className="text-lg font-black text-[#E50914]">₹{booking.amount || booking.total_price}</span>
              </div>
            </div>

            {/* Action Button */}
            <Link 
              href="/partner/scan"
              className="w-full py-6 bg-[#0F172A] text-white rounded-[24px] font-black text-lg flex items-center justify-center shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
            >
              Done & Scan Next
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center space-y-2">
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em]">
            GymDate Security Verification System
          </p>
          <p className="text-slate-700 text-[10px] font-black opacity-40">
            V2.0
          </p>
        </div>
      </div>
    </div>
  );
}
  );
}

'use client';

import React from 'react';
import { Mail, CheckCircle2, ShieldAlert, ArrowRight } from 'lucide-react';
import { OFFICIAL_EMAILS } from '@/lib/notificationService';

export default function ActivateEmailsPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6">
      <div className="max-w-xl w-full bg-slate-900/90 border border-cyan-500/40 rounded-3xl p-8 shadow-2xl shadow-cyan-950/80 space-y-6">
        
        <div className="flex items-center gap-3 border-b border-cyan-500/30 pb-4">
          <div className="p-3 bg-cyan-500/20 rounded-2xl border border-cyan-400/40 text-cyan-400">
            <Mail className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-wide">FORMSUBMIT EMAIL ACTIVATOR</h1>
            <p className="text-xs text-cyan-300">BlueGuard Official Maritime Distress Dispatch Activation</p>
          </div>
        </div>

        <p className="text-sm text-slate-300 leading-relaxed">
          FormSubmit requires a 1-time activation for each official recipient email address. Click each button below to send a valid activation request directly to your inbox.
        </p>

        <div className="space-y-4">
          {OFFICIAL_EMAILS.map((email, idx) => (
            <form
              key={email}
              action={`https://formsubmit.co/${email}`}
              method="POST"
              target="_blank"
              className="p-4 rounded-2xl bg-slate-800/80 border border-cyan-500/30 hover:border-cyan-400 transition flex flex-col sm:flex-row items-center justify-between gap-4"
            >
              <input type="hidden" name="_subject" value={`BlueGuard Maritime Emergency Alert Activation for ${email}`} />
              <input type="hidden" name="_template" value="table" />
              <input type="hidden" name="System" value="BlueGuard Agentic AI Marine Information Assistant" />
              <input type="hidden" name="Notice" value="FormSubmit 1-time email activation link." />

              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-500/40 flex items-center justify-center text-xs font-mono font-bold">
                  0{idx + 1}
                </span>
                <div>
                  <div className="font-bold text-sm text-white font-mono">{email}</div>
                  <div className="text-xs text-slate-400">Click to request activation link</div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-cyan-950 flex items-center justify-center gap-2 transition"
              >
                Send Activation Email <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ))}
        </div>

        <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl text-xs text-emerald-300 space-y-1">
          <div className="font-bold flex items-center gap-1.5 text-emerald-200">
            <CheckCircle2 className="w-4 h-4" /> Next Steps After Clicking:
          </div>
          <ol className="list-decimal list-inside text-slate-300 space-y-1 pl-1">
            <li>Check your email inbox (or Spam/Promotions folder).</li>
            <li>Open the email from FormSubmit titled <strong>"Action Required: Activate FormSubmit"</strong>.</li>
            <li>Click the green <strong>"ACTIVATE FORM"</strong> button.</li>
          </ol>
        </div>

      </div>
    </div>
  );
}

'use client';

import React, { useState } from 'react';

const HomeContactCard = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!name || !email || !message) {
      setError('Please fill in your name, email, and message.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/messages/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || 'Failed to send message');
      }

      setSuccess('Message sent!');
      setName('');
      setEmail('');
      setMessage('');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong while sending your message. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="my-16 bg-white">
      <div className="container mx-auto max-w-4xl px-4 md:px-6">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 md:p-6 grid gap-6 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] items-start">
          <form onSubmit={handleSubmit} className="space-y-3">
            <h2 className="text-xl md:text-2xl font-semibold text-slate-900">Have a question?</h2>
            <p className="text-xs md:text-sm text-slate-600">
              Drop a quick note and I&apos;ll get back to you. For project-level details, use the full contact page.
            </p>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500"
                  placeholder="Your name"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none focus:border-violet-400/80"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">
                Message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500 resize-none"
                placeholder="How can I help?"
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Sending...' : 'Send'}
              </button>
              <a
                href="/contact"
                className="text-xs md:text-sm text-emerald-700 hover:text-emerald-600 underline"
              >
                Go to full contact page
              </a>
            </div>

            {error && (
              <p className="text-xs text-red-600">{error}</p>
            )}
            {success && (
              <p className="text-xs text-emerald-700">{success}</p>
            )}
          </form>

          <aside className="space-y-2 text-xs md:text-sm text-slate-600">
            <p className="font-semibold text-sm md:text-base text-slate-900">Quick Connect</p>
            <p>
              Whether it&apos;s a sizing question, an order concern, or an idea for a new design, this inbox is always
              open.
            </p>
            <div className="grid grid-cols-2 gap-2 text-[11px] md:text-xs">
              <div className="rounded-lg border border-slate-200 bg-white p-2">
                <p className="font-semibold text-slate-900">Reply Time</p>
                <p className="text-slate-600">Usually within 24 hours</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-2">
                <p className="font-semibold text-slate-900">Email</p>
                <p className="text-slate-600 break-all">contact@rockenmyvibe.com</p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
};

export default HomeContactCard;

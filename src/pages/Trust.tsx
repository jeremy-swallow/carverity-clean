// src/pages/Trust.tsx

import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, BadgeCheck, FileText, CreditCard } from "lucide-react";
import { applySeo } from "../utils/seo";

export default function Trust() {
  useEffect(() => {
    applySeo({
      title: "Trust & Transparency | CarVerity Australia",
      description:
        "Learn how CarVerity operates as an Australian web app, including business details, ABN registration, payment handling, data use, and product boundaries.",
      canonical: "https://www.carverity.com.au/trust",
    });
  }, []);

  return (
    <div className="text-white">
      <section className="max-w-4xl mx-auto px-6 py-16 space-y-12">
        <header className="space-y-4">
          <h1 className="text-3xl font-semibold tracking-tight">
            Trust & Transparency
          </h1>
          <p className="text-slate-300 leading-relaxed">
            CarVerity is designed to help Australian used car buyers make calmer,
            more structured decisions. This page explains who operates the
            product, how payments are handled, how data is used, and where the
            boundaries of the service sit.
          </p>
        </header>

        {/* BUSINESS DETAILS */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <BadgeCheck className="h-5 w-5 text-emerald-300" />
            <h2 className="text-xl font-semibold">Australian Business Details</h2>
          </div>

          <p className="text-slate-300 leading-relaxed">
            CarVerity operates as an Australian business.
          </p>

          <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-6">
            <p className="text-sm text-slate-300">
              <span className="font-semibold text-white">Business Name:</span>{" "}
              CarVerity
            </p>
            <p className="text-sm text-slate-300 mt-2">
              <span className="font-semibold text-white">ABN:</span>{" "}
              44 861 824 638
            </p>
            <p className="text-sm text-slate-300 mt-2">
              <span className="font-semibold text-white">Area Served:</span>{" "}
              Australia
            </p>
          </div>
        </section>

        {/* WHAT CARVERITY IS */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-300" />
            <h2 className="text-xl font-semibold">What CarVerity Is — And Is Not</h2>
          </div>

          <p className="text-slate-300 leading-relaxed">
            CarVerity is a structured, in-person used car inspection web app.
            It guides you through visible checks while you are standing next to
            the vehicle and turns your recorded observations into a structured,
            buyer-focused report.
          </p>

          <p className="text-slate-300 leading-relaxed">
            CarVerity is not:
          </p>

          <ul className="list-disc pl-6 space-y-2 text-slate-300">
            <li>A mechanical inspection service</li>
            <li>A roadworthy certificate provider</li>
            <li>A vehicle valuation service</li>
            <li>Financial or legal advice</li>
          </ul>

          <p className="text-slate-300 leading-relaxed">
            The system helps organise what you can observe — it does not
            diagnose mechanical faults or guarantee vehicle condition.
          </p>
        </section>

        {/* PAYMENTS */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-emerald-300" />
            <h2 className="text-xl font-semibold">Payments & Billing</h2>
          </div>

          <p className="text-slate-300 leading-relaxed">
            Payments for CarVerity are processed securely via Stripe. CarVerity
            does not store your full card details.
          </p>

          <p className="text-slate-300 leading-relaxed">
            Pricing is clearly displayed on the{" "}
            <Link
              to="/pricing"
              className="underline text-emerald-300 hover:text-emerald-200"
            >
              Pricing page
            </Link>
            . If you have billing questions, you can contact support through
            the app.
          </p>
        </section>

        {/* DATA & PRIVACY */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-emerald-300" />
            <h2 className="text-xl font-semibold">Data Handling</h2>
          </div>

          <p className="text-slate-300 leading-relaxed">
            Inspection data is associated with your account so you can access
            and manage your scans. Photos and notes are stored securely to
            support report generation and future access.
          </p>

          <p className="text-slate-300 leading-relaxed">
            CarVerity does not sell your personal data. Data is used solely to
            operate and improve the product experience.
          </p>
        </section>

        {/* REFUNDS */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Refunds</h2>

          <p className="text-slate-300 leading-relaxed">
            If you experience a technical issue that prevents use of the
            service, please contact support. Refund decisions are handled
            reasonably and on a case-by-case basis.
          </p>
        </section>

        {/* INTERNAL LINKS */}
        <section className="pt-8 border-t border-white/10 space-y-3">
          <p className="text-slate-300">
            Learn more about how CarVerity works:
          </p>

          <div className="flex flex-wrap gap-4 text-sm">
            <Link
              to="/what-to-expect"
              className="underline text-emerald-300 hover:text-emerald-200"
            >
              What to expect
            </Link>
            <Link
              to="/faq"
              className="underline text-emerald-300 hover:text-emerald-200"
            >
              FAQ
            </Link>
            <Link
              to="/about"
              className="underline text-emerald-300 hover:text-emerald-200"
            >
              About
            </Link>
            <Link
              to="/pricing"
              className="underline text-emerald-300 hover:text-emerald-200"
            >
              Pricing
            </Link>
          </div>
        </section>

        <footer className="pt-6 text-xs text-slate-500 leading-relaxed">
          CarVerity supports informed decisions during used car inspections in
          Australia. It does not replace professional inspections or financial
          advice.
        </footer>
      </section>
    </div>
  );
}

import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <div className="max-w-4xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="text-center mb-10">
          <img
            src="/logo.png"
            alt="CarVerity"
            className="mx-auto h-16 mb-4 rounded-xl shadow-lg"
          />

          <h1 className="text-3xl font-bold tracking-tight">
            Smarter Used-Car Checks
          </h1>

          <p className="text-slate-400 mt-2">
            Scan listings, highlight risks, and guide your in-person inspections.
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid gap-6 sm:grid-cols-2">

          {/* Online Scan */}
          <Link
            to="/online-scan"
            className="group block bg-slate-800/70 border border-slate-700 rounded-2xl p-6
            hover:border-blue-400 hover:bg-slate-800 shadow-sm hover:shadow-blue-500/10
            transition-all duration-200 hover:-translate-y-0.5"
          >
            <h2 className="text-lg font-semibold mb-1">
              Online Listing Scan
            </h2>

            <p className="text-slate-400 mb-4">
              Paste a vehicle listing link and get instant insights into risks and patterns.
            </p>

            <span className="flex items-center gap-2 text-blue-400 font-medium">
              Start online scan
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </span>
          </Link>

          {/* In-Person Inspection */}
          <Link
            to="/in-person-scan"
            className="group block bg-slate-800/70 border border-slate-700 rounded-2xl p-6
            hover:border-blue-400 hover:bg-slate-800 shadow-sm hover:shadow-blue-500/10
            transition-all duration-200 hover:-translate-y-0.5"
          >
            <h2 className="text-lg font-semibold mb-1">
              In-Person Inspection
            </h2>

            <p className="text-slate-400 mb-4">
              Guided photo prompts and condition checks while viewing the car on site.
            </p>

            <span className="flex items-center gap-2 text-blue-400 font-medium">
              Start in-person scan
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </span>
          </Link>
        </div>

        {/* Footer */}
        <p className="text-center text-slate-500 mt-10 text-sm">
          First online scan is free — no account required.
        </p>
      </div>
    </div>
  );
}

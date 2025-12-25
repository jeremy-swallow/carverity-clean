import { useNavigate } from "react-router-dom";

interface ResultItem {
  title: string;
  description: string;
  action?: string;
  confidence?: string;
}

interface ResultSection {
  heading: string;
  items: ResultItem[];
}

const mockResults: ResultSection[] = [
  {
    heading: "Listing Overview",
    items: [
      {
        title: "Vehicle match looks correct",
        description:
          "Details provided appear consistent with a typical online car listing. No immediate discrepancies detected.",
        confidence: "High",
      },
    ],
  },
  {
    heading: "Risk Factors",
    items: [
      {
        title: "Possible price mismatch",
        description:
          "The listed price may be below expected market value for similar vehicles. This can sometimes indicate missing information.",
        confidence: "Medium",
        action: "Compare similar listings",
      },
      {
        title: "Seller information incomplete",
        description:
          "The listing appears to lack clear seller identification or history details.",
        confidence: "Low",
        action: "Request seller verification",
      },
    ],
  },
  {
    heading: "Recommended Next Actions",
    items: [
      {
        title: "Continue to inspection questions",
        description:
          "Answer a few questions to personalise the risk analysis for this vehicle.",
        action: "Start next step",
      },
    ],
  },
];

export default function OnlineResults() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 px-6 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-semibold mb-2">
          Analysis results
        </h1>
        <p className="text-slate-400 mb-8">
          Preliminary findings based on the information provided so far.
        </p>

        {mockResults.map((section, i) => (
          <div key={i} className="mb-8">
            <h2 className="text-lg font-medium mb-4 text-slate-200">
              {section.heading}
            </h2>

            <div className="space-y-3">
              {section.items.map((item, j) => (
                <div
                  key={j}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-4"
                >
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium">{item.title}</h3>
                    {item.confidence && (
                      <span className="text-xs px-2 py-1 rounded bg-slate-800 text-slate-300">
                        {item.confidence} confidence
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-slate-400 mt-2">
                    {item.description}
                  </p>

                  {item.action && (
                    <button className="mt-3 text-sm text-blue-300 hover:text-blue-200 underline">
                      {item.action}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="flex justify-between pt-6 border-t border-slate-800 mt-10">
          <button
            className="px-4 py-2 rounded-lg border border-slate-700 hover:bg-slate-800"
            onClick={() => navigate(-1)}
          >
            Back
          </button>

          <button
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500"
            onClick={() => navigate("/online/next-actions")}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { saveOnlineResults } from "../utils/onlineResults";

export default function OnlineReport() {
  const navigate = useNavigate();

  useEffect(() => {
    // Temporary stub report — later this will be AI output
    const report = {
      sections: [
        {
          title: "Listing Overview",
          content: "Placeholder content — listing extraction & vehicle signals.",
        },
        {
          title: "Risk Factors",
          content: "Placeholder content — potential concerns or red flags.",
        },
        {
          title: "Next Actions",
          content: "Placeholder content — recommended verification steps.",
        },
      ],
    };

    // Transform → match ResultItem format
    const results = report.sections.map((s) => ({
      title: s.title,
      description: s.content,
    }));

    // Save for results page
    saveOnlineResults(results);

    // Go straight to results page
    navigate("/online-results", { replace: true });
  }, [navigate]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-16 text-center">
      <h1 className="text-xl font-semibold mb-2">
        Finalising your scan…
      </h1>
      <p className="text-muted-foreground">
        Preparing your report and redirecting…
      </p>
    </div>
  );
}

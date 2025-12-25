import { Link } from "react-router-dom";
import { Search, ClipboardList, ArrowRight, ShieldCheck } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-[calc(100vh-64px)] bg-background">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <header className="mb-10">
          <h1 className="text-4xl font-bold mb-3">CarVerity</h1>
          <p className="text-muted-foreground text-lg">
            Smarter used-car checks — scan listings, spot risks, and inspect
            with confidence.
          </p>
        </header>

        <div className="grid gap-4">

          <Link
            to="/online-start"
            className="border rounded-xl p-4 flex items-center justify-between hover:bg-accent"
          >
            <div className="flex items-center gap-3">
              <Search />
              <div>
                <h2 className="font-semibold">Online Listing Scan</h2>
                <p className="text-sm text-muted-foreground">
                  Paste a car listing to analyse risks instantly
                </p>
              </div>
            </div>
            <ArrowRight />
          </Link>

          <Link
            to="/inperson-start"
            className="border rounded-xl p-4 flex items-center justify-between hover:bg-accent"
          >
            <div className="flex items-center gap-3">
              <ClipboardList />
              <div>
                <h2 className="font-semibold">In-Person Inspection</h2>
                <p className="text-sm text-muted-foreground">
                  Guided on-site checks while viewing the car
                </p>
              </div>
            </div>
            <ShieldCheck />
          </Link>

        </div>
      </div>
    </div>
  );
}

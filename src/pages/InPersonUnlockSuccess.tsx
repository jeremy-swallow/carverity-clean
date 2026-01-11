import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { unlockScan } from "../utils/scanUnlock";

export default function InPersonUnlockSuccess() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const scanId = params.get("scanId");

  useEffect(() => {
    if (!scanId) {
      navigate("/scan/in-person/start", { replace: true });
      return;
    }

    // ✅ THIS IS THE MOMENT THE SCAN IS UNLOCKED
    unlockScan(scanId);

    // Route through analyzing for perceived value + safety
    navigate(`/scan/in-person/analyzing?scanId=${scanId}`, {
      replace: true,
    });
  }, [scanId, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">
      <p className="text-sm text-slate-400">
        Finalising your inspection…
      </p>
    </div>
  );
}

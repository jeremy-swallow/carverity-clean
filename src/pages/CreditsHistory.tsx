export default function CreditsHistory() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10">

      <h1 className="text-2xl font-bold mb-2">
        Credits history
      </h1>

      <p className="text-slate-400 mb-6">
        A record of how your scan credits were used. (Real data coming soon.)
      </p>

      <div className="
        border border-white/10 rounded-xl
        bg-slate-800/30 backdrop-blur
      ">

        <table className="w-full text-sm">
          <thead className="text-slate-300">
            <tr>
              <th className="text-left px-4 py-3">Date</th>
              <th className="text-left px-4 py-3">Action</th>
              <th className="text-left px-4 py-3">Change</th>
              <th className="text-left px-4 py-3">Balance</th>
            </tr>
          </thead>

          <tbody className="text-slate-300">

            <tr className="border-t border-white/10">
              <td className="px-4 py-3">Today</td>
              <td className="px-4 py-3">Online listing scan</td>
              <td className="px-4 py-3 text-red-300">−1 credit</td>
              <td className="px-4 py-3">1 remaining</td>
            </tr>

            <tr className="border-t border-white/10">
              <td className="px-4 py-3">Yesterday</td>
              <td className="px-4 py-3">Purchased credits</td>
              <td className="px-4 py-3 text-emerald-300">+3 credits</td>
              <td className="px-4 py-3">2 remaining</td>
            </tr>

          </tbody>
        </table>
      </div>
    </div>
  );
}

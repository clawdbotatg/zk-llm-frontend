"use client";

import { useEffect, useState } from "react";

interface CommitmentData {
  commitment: string;
  nullifier: string;
  secret: string;
  index?: number;
}

const STORAGE_KEY = "zk-api-credits";

export const CreditsList = () => {
  const [credits, setCredits] = useState<CommitmentData[]>([]);
  const [showSecrets, setShowSecrets] = useState(false);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      setCredits(stored);
    } catch {
      setCredits([]);
    }
  }, []);

  if (credits.length === 0) {
    return (
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">📋 Your Credits</h2>
          <p className="text-sm opacity-70">No credits registered yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <div className="flex justify-between items-center">
          <h2 className="card-title">📋 Your Credits ({credits.length})</h2>
          <button
            className="btn btn-sm btn-ghost"
            onClick={() => setShowSecrets(!showSecrets)}
          >
            {showSecrets ? "🙈 Hide" : "👁️ Show"} Secrets
          </button>
        </div>

        <div className="overflow-x-auto mt-2">
          <table className="table table-xs">
            <thead>
              <tr>
                <th>#</th>
                <th>Commitment</th>
                {showSecrets && <th>Nullifier</th>}
                {showSecrets && <th>Secret</th>}
                <th>Index</th>
              </tr>
            </thead>
            <tbody>
              {credits.map((c, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td className="font-mono text-xs">
                    {c.commitment.slice(0, 10)}...{c.commitment.slice(-8)}
                  </td>
                  {showSecrets && (
                    <td className="font-mono text-xs">
                      {c.nullifier.slice(0, 10)}...{c.nullifier.slice(-8)}
                    </td>
                  )}
                  {showSecrets && (
                    <td className="font-mono text-xs">
                      {c.secret.slice(0, 10)}...{c.secret.slice(-8)}
                    </td>
                  )}
                  <td>{c.index ?? "?"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="alert alert-warning mt-4">
          <span className="text-sm">
            ⚠️ Your secrets are stored in localStorage only. If you clear browser data, they&apos;re gone forever.
            Back them up!
          </span>
        </div>

        <button
          className="btn btn-sm btn-outline mt-2"
          onClick={() => {
            const blob = new Blob([JSON.stringify(credits, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "zk-api-credits-backup.json";
            a.click();
            URL.revokeObjectURL(url);
          }}
        >
          📥 Export Backup
        </button>
      </div>
    </div>
  );
};

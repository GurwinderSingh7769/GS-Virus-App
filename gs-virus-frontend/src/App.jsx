import { useState, useEffect, useRef, useCallback } from "react";
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Upload,
  Clock,
  Trash2,
  FileSearch,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  Terminal,
  Database,
  Activity,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

function StatusBadge({ result }) {
  const map = {
    Clean: {
      icon: <CheckCircle size={13} />,
      cls: "bg-emerald-950 text-emerald-400 border border-emerald-700",
    },
    Infected: {
      icon: <XCircle size={13} />,
      cls: "bg-red-950 text-red-400 border border-red-700",
    },
    "Not Found in DB": {
      icon: <AlertTriangle size={13} />,
      cls: "bg-yellow-950 text-yellow-400 border border-yellow-700",
    },
    Unknown: {
      icon: <AlertTriangle size={13} />,
      cls: "bg-zinc-800 text-zinc-400 border border-zinc-600",
    },
    "Scan Error": {
      icon: <XCircle size={13} />,
      cls: "bg-orange-950 text-orange-400 border border-orange-700",
    },
    "Network Error": {
      icon: <XCircle size={13} />,
      cls: "bg-orange-950 text-orange-400 border border-orange-700",
    },
  };
  const cfg = map[result] || map["Unknown"];
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-semibold ${cfg.cls}`}
    >
      {cfg.icon}
      {result}
    </span>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex items-center gap-4">
      <div className={`p-2 rounded-md ${color}`}>{icon}</div>
      <div>
        <p className="text-zinc-500 text-xs font-mono uppercase tracking-widest">
          {label}
        </p>
        <p className="text-white text-2xl font-bold font-mono">{value}</p>
      </div>
    </div>
  );
}

export default function App() {
  const [dragging, setDragging] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [stats, setStats] = useState({ total: 0, clean: 0, infected: 0 });
  const [error, setError] = useState(null);
  const fileInputRef = useRef();

  const fetchHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch(`${API_BASE}/history`);
      const data = await res.json();
      const records = data.history || [];
      setHistory(records);
      setStats({
        total: records.length,
        clean: records.filter((r) => r.result === "Clean").length,
        infected: records.filter((r) => r.result === "Infected").length,
      });
    } catch {
      setError("Failed to load scan history. Is the backend running?");
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleFile = async (file) => {
    if (!file) return;
    setScanning(true);
    setScanResult(null);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`${API_BASE}/scan`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Scan failed");
      }
      const data = await res.json();
      setScanResult(data);
      fetchHistory();
    } catch (e) {
      setError(e.message);
    } finally {
      setScanning(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`${API_BASE}/history/${id}`, { method: "DELETE" });
      fetchHistory();
      if (scanResult?.id === id) setScanResult(null);
    } catch {
      setError("Failed to delete record.");
    }
  };

  const formatHash = (hash) =>
    hash ? `${hash.slice(0, 8)}...${hash.slice(-8)}` : "—";

  const formatDate = (ts) => {
    if (!ts) return "—";
    const d = new Date(ts + "Z");
    return d.toLocaleString();
  };

  return (
    <div className="min-h-screen bg-black text-white font-mono">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-950 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-950 border border-red-800 rounded-lg">
              <Shield className="text-red-500" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-widest text-red-500 uppercase">
                GS-Virus
              </h1>
              <p className="text-zinc-600 text-xs tracking-widest uppercase">
                Advanced Threat Scanner
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <Activity size={12} className="text-red-600 animate-pulse" />
            <span>System Active</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <StatCard
            icon={<Database size={18} className="text-blue-400" />}
            label="Total Scans"
            value={stats.total}
            color="bg-blue-950 border border-blue-900"
          />
          <StatCard
            icon={<ShieldCheck size={18} className="text-emerald-400" />}
            label="Clean Files"
            value={stats.clean}
            color="bg-emerald-950 border border-emerald-900"
          />
          <StatCard
            icon={<ShieldAlert size={18} className="text-red-400" />}
            label="Threats Found"
            value={stats.infected}
            color="bg-red-950 border border-red-900"
          />
        </div>

        {/* Drop Zone */}
        <div>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => !scanning && fileInputRef.current.click()}
            className={`relative border-2 border-dashed rounded-xl p-12 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all duration-200
              ${
                dragging
                  ? "border-red-500 bg-red-950/20"
                  : "border-zinc-700 bg-zinc-950 hover:border-red-700 hover:bg-zinc-900"
              }
              ${scanning ? "cursor-not-allowed opacity-70" : ""}
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={(e) => handleFile(e.target.files[0])}
              disabled={scanning}
            />

            {scanning ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2
                  size={48}
                  className="text-red-500 animate-spin"
                />
                <p className="text-red-400 text-sm tracking-widest uppercase animate-pulse">
                  Scanning file...
                </p>
                <p className="text-zinc-600 text-xs">
                  Querying VirusTotal database
                </p>
              </div>
            ) : (
              <>
                <div
                  className={`p-4 rounded-full border ${
                    dragging
                      ? "border-red-500 bg-red-900/30"
                      : "border-zinc-700 bg-zinc-900"
                  }`}
                >
                  <Upload
                    size={32}
                    className={dragging ? "text-red-400" : "text-zinc-500"}
                  />
                </div>
                <div className="text-center">
                  <p className="text-zinc-300 font-semibold">
                    Drop file here or click to browse
                  </p>
                  <p className="text-zinc-600 text-sm mt-1">
                    File will be hashed &amp; checked against VirusTotal
                  </p>
                </div>
                <div className="flex items-center gap-2 mt-2 px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-full">
                  <FileSearch size={12} className="text-red-600" />
                  <span className="text-zinc-500 text-xs">
                    SHA-256 · VirusTotal API
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="flex items-start gap-3 bg-red-950/40 border border-red-800 rounded-lg px-4 py-3">
            <AlertTriangle size={16} className="text-red-500 mt-0.5 shrink-0" />
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {/* Scan Result */}
        {scanResult && !scanning && (
          <div
            className={`rounded-xl border p-6 space-y-4 ${
              scanResult.result === "Infected"
                ? "bg-red-950/20 border-red-800"
                : scanResult.result === "Clean"
                ? "bg-emerald-950/20 border-emerald-800"
                : "bg-zinc-900 border-zinc-700"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {scanResult.result === "Infected" ? (
                  <ShieldAlert size={22} className="text-red-500" />
                ) : scanResult.result === "Clean" ? (
                  <ShieldCheck size={22} className="text-emerald-500" />
                ) : (
                  <Shield size={22} className="text-zinc-400" />
                )}
                <span className="font-bold text-white">Scan Complete</span>
              </div>
              <StatusBadge result={scanResult.result} />
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-zinc-500 text-xs uppercase tracking-widest mb-1">
                  Filename
                </p>
                <p className="text-zinc-200 truncate">{scanResult.filename}</p>
              </div>
              <div>
                <p className="text-zinc-500 text-xs uppercase tracking-widest mb-1">
                  SHA-256 Hash
                </p>
                <p className="text-zinc-300 font-mono text-xs truncate">
                  {scanResult.file_hash}
                </p>
              </div>
              {scanResult.details && Object.keys(scanResult.details).length > 0 && (
                <div className="col-span-2">
                  <p className="text-zinc-500 text-xs uppercase tracking-widest mb-1">
                    Details
                  </p>
                  <div className="flex gap-4 flex-wrap">
                    {Object.entries(scanResult.details).map(([k, v]) => (
                      <span
                        key={k}
                        className="text-xs bg-zinc-900 border border-zinc-700 px-2 py-1 rounded text-zinc-300"
                      >
                        {k.replace(/_/g, " ")}: <strong>{v}</strong>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* History Table */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-red-600" />
              <span className="text-zinc-300 font-semibold text-sm uppercase tracking-widest">
                Scan History
              </span>
            </div>
            <button
              onClick={fetchHistory}
              disabled={loadingHistory}
              className="text-xs text-zinc-500 hover:text-red-400 border border-zinc-700 hover:border-red-800 px-3 py-1 rounded transition-colors flex items-center gap-1"
            >
              {loadingHistory ? (
                <Loader2 size={11} className="animate-spin" />
              ) : (
                <Terminal size={11} />
              )}
              Refresh
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-zinc-600 text-xs uppercase tracking-widest border-b border-zinc-900">
                  <th className="text-left px-5 py-3 font-normal">#</th>
                  <th className="text-left px-5 py-3 font-normal">Filename</th>
                  <th className="text-left px-5 py-3 font-normal">SHA-256 Hash</th>
                  <th className="text-left px-5 py-3 font-normal">Status</th>
                  <th className="text-left px-5 py-3 font-normal">Scanned</th>
                  <th className="px-5 py-3 font-normal"></th>
                </tr>
              </thead>
              <tbody>
                {history.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="text-center py-12 text-zinc-700 text-xs uppercase tracking-widest"
                    >
                      {loadingHistory
                        ? "Loading records..."
                        : "No scan records found"}
                    </td>
                  </tr>
                ) : (
                  history.map((row, i) => (
                    <tr
                      key={row.id}
                      className="border-t border-zinc-900 hover:bg-zinc-900/60 transition-colors"
                    >
                      <td className="px-5 py-3 text-zinc-700 text-xs">
                        {i + 1}
                      </td>
                      <td className="px-5 py-3 text-zinc-300 max-w-[180px] truncate">
                        {row.filename}
                      </td>
                      <td className="px-5 py-3 text-zinc-500 font-mono text-xs">
                        {formatHash(row.file_hash)}
                        <button
                          title="Copy full hash"
                          onClick={() =>
                            navigator.clipboard.writeText(row.file_hash)
                          }
                          className="ml-2 text-zinc-700 hover:text-red-500 transition-colors"
                        >
                          ⎘
                        </button>
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge result={row.result} />
                      </td>
                      <td className="px-5 py-3 text-zinc-600 text-xs">
                        {formatDate(row.timestamp)}
                      </td>
                      <td className="px-5 py-3">
                        <button
                          onClick={() => handleDelete(row.id)}
                          className="text-zinc-700 hover:text-red-500 transition-colors p-1 rounded hover:bg-red-950/30"
                          title="Delete record"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 mt-12 py-4 text-center text-zinc-800 text-xs font-mono">
        GS-Virus &copy; {new Date().getFullYear()} &mdash; Powered by VirusTotal
        API
      </footer>
    </div>
  );
}

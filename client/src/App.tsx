import { Link, Route, Routes, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { API_URL } from "./lib/api";
import Dashboard from "./pages/Dashboard";
import Documents from "./pages/Documents";
import Decks from "./pages/Decks";

export default function App() {
  const [health, setHealth] = useState<string>("Checking...");

  useEffect(() => {
    fetch(`${API_URL}/health`)
      .then((r) => r.json())
      .then((j) => setHealth(j.ok ? "Connected" : "API error"))
      .catch(() => setHealth("API unreachable"));
  }, []);

  return (
    <div style={{ fontFamily: "system-ui, sans-serif" }}>
      {/* Navbar */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px",
          borderBottom: "1px solid #eee",
          position: "sticky",
          top: 0,
          background: "white",
          zIndex: 10,
        }}
      >
        <nav style={{ display: "flex", gap: 16 }}>
          <Link to="/" style={{ fontWeight: 700, textDecoration: "none" }}>
            NoteMate
          </Link>
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/documents">Documents</Link>
          <Link to="/decks">Decks</Link>
        </nav>
        <div>
          API: <strong>{health}</strong>
        </div>
      </header>

      {/* Page container */}
      <main style={{ padding: 16 }}>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/documents" element={<Documents />} />
          <Route path="/decks" element={<Decks />} />
          {/* 404 */}
          <Route path="*" element={<p>Not found</p>} />
        </Routes>
      </main>
    </div>
  );
}

import { Link, Route, Routes, Navigate, NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "./contexts/AuthContext";
import { API_URL } from "./lib/api";
import Dashboard from "./pages/Dashboard";
import Documents from "./pages/Documents";
import Decks from "./pages/Decks";
import Login from "./pages/Login";
import Signup from "./pages/Signup";

export default function App() {
  const [health, setHealth] = useState<string>("Checking...");
  const { user, logout} = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${API_URL}/health`)
      .then((r) => r.json())
      .then((j) => setHealth(j.ok ? "Connected" : "API error"))
      .catch(() => setHealth("API unreachable"));
  }, []);

  return (
    <div style={{ fontFamily: "system-ui, sans-serif" }}>
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
        <nav style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <NavLink to="/" style={{ fontWeight: 700, textDecoration: "none", color: "#333" }}>
            NoteMate
          </NavLink>
          {user && (
            <>
              <NavLink to="/dashboard" style={{ textDecoration: "none", color: "#666" }}>Dashboard</NavLink>
              <NavLink to="/documents" style={{ textDecoration: "none", color: "#666" }}>Documents</NavLink>
              <NavLink to="/decks" style={{ textDecoration: "none", color: "#666" }}>Decks</NavLink>
            </>
          )}
        </nav>

        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ fontSize: 12, color: "#999" }}>
            API: <strong style={{ color: health === "Connected" ? "#22c55e" : "#ef4444" }}>{health}</strong>
          </div>
          
          {user ? (
            <>
              <span style={{ fontSize: 13, color: "#666" }}>
                {user.name || user.email}
              </span>
              <button
                onClick={() => { logout(); navigate("/login", { replace: true }); }}
                style={{
                  padding: "8px 14px",
                  borderRadius: 6,
                  border: "1px solid #ddd",
                  background: "white",
                  cursor: "pointer",
                  fontSize: 13
                }}
              >
                Logout
              </button>
            </>
          ) : (
            <div style={{ display: "flex", gap: 8 }}>
              <Link to="/login">
                <button
                  style={{
                    padding: "8px 14px",
                    borderRadius: 6,
                    border: "none",
                    background: "#5B5FED",
                    color: "white",
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: 600
                  }}
                >
                  Login
                </button>
              </Link>
              {/* Optional: quick path to sign up */}
              <Link to="/signup" style={{ textDecoration: "none" }}>
                <button
                  style={{
                    padding: "8px 14px",
                    borderRadius: 6,
                    border: "1px solid #ddd",
                    background: "white",
                    cursor: "pointer",
                    fontSize: 13
                  }}
                >
                  Sign up
                </button>
              </Link>
            </div>
          )}
        </div>
      </header>

      <main style={{ padding: 16 }}>
        <Routes>
          <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
          <Route path="/signup" element={user ? <Navigate to="/dashboard" replace /> : <Signup />} />
          <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} />
          <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/login" replace />} />
          <Route path="/documents" element={user ? <Documents /> : <Navigate to="/login" replace />} />
          <Route path="/decks" element={user ? <Decks /> : <Navigate to="/login" replace />} />
          <Route path="*" element={<p>Not found</p>} />
        </Routes>
      </main>
    </div>
  );
}

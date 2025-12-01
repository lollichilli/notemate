import { Link, Route, Routes, Navigate, NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "./contexts/AuthContext";
import { API_URL } from "./lib/api";
import Dashboard from "./pages/Dashboard";
import Documents from "./pages/Documents";
import Decks from "./pages/Decks";
import Quizzes from "./pages/Quizzes";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import UserProfile from './pages/UserProfile';

export default function App() {
  const [health, setHealth] = useState<string>("Checking...");
  const { user, logout } = useAuth();
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
              <NavLink to="/quizzes" style={{ textDecoration: "none", color: "#666" }}>Quizzes</NavLink>
            </>
          )}
        </nav>

        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ fontSize: 12, color: "#999" }}>
            API: <strong style={{ color: health === "Connected" ? "#22c55e" : "#ef4444" }}>{health}</strong>
          </div>
          
          {user ? (
            <>
              <NavLink 
                to="/profile" 
                style={({ isActive }) => ({
                  textDecoration: "none", 
                  color: isActive ? "#5B5FED" : "#666",
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                })}
              >
                <svg 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                Profile
              </NavLink>
              <button
                onClick={() => { 
                  logout(); 
                  navigate("/login", { replace: true }); 
                }}
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
          <Route path="/profile" element={user ? <UserProfile /> : <Navigate to="/login" replace />} />
          <Route path="/decks" element={user ? <Decks /> : <Navigate to="/login" replace />} />
          <Route path="/quizzes" element={user ? <Quizzes /> : <Navigate to="/login" replace />} />
          <Route path="*" element={<p>Not found</p>} />
        </Routes>
      </main>
    </div>
  );
}
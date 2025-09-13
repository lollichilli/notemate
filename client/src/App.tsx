import { useEffect, useState } from "react";
import { API_URL } from "./lib/api";

function App() {
  const [health, setHealth] = useState<string>("Checking...");

  useEffect(() => {
    fetch(`${API_URL}/health`)
      .then((r) => r.json())
      .then((j) => setHealth(j.ok ? "Connected" : "API error"))
      .catch(() => setHealth("API unreachable"));
  }, []);

  return (
    <main style={{ fontFamily: "system-ui, sans-serif", padding: 16 }}>
      <h1>NoteMate</h1>
      <p>Turn notes (PDF/Markdown) into flashcards & quizzes, then track mastery.</p>

      <div style={{ marginTop: 12 }}>
        API status: <strong>{health}</strong>
      </div>
    </main>
  );
}

export default App;

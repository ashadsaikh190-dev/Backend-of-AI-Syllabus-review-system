import { useState } from "react";

export default function App() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const askBackend = async () => {
    if (!question.trim()) return;

    setLoading(true);
    setError("");
    setAnswer("");

    try {
      const res = await fetch("http://localhost:5000/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question,
          mode: "step-by-step",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Backend error");
      }

      setAnswer(data.answer);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-4xl w-full rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl p-10">

        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
          AI Doubt Solver 
        </h1>

        <textarea
          className="w-full mt-6 p-4 rounded-xl bg-black/40 border border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500"
          rows="4"
          placeholder="Ask your doubt..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />

        <button
          onClick={askBackend}
          disabled={loading}
          className="mt-4 px-8 py-3 rounded-xl font-semibold bg-gradient-to-r from-pink-500 to-purple-600 hover:scale-105 transition disabled:opacity-50"
        >
          {loading ? "Thinking..." : "Ask "}
        </button>

        {error && (
          <p className="mt-4 text-red-400"> {error}</p>
        )}

        {answer && (
          <div className="mt-6 p-6 rounded-xl bg-white/5 border border-white/10 whitespace-pre-wrap">
            {answer}
          </div>
        )}

      </div>
    </div>
  );
}

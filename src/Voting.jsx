import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import truth from "../src/assets/Truth.mp4";
import liar from "../src/assets/Liar.mp4";

// Initialize Supabase client
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_KEY
);

function Voting() {
  const [selectedLiar, setSelectedLiar] = useState(null);
  const [results, setResults] = useState({
    correct: 0,
    wrong: 0,
    allResponses: [],
  });
  const [isAdmin, setIsAdmin] = useState(false);

  const correctAnswer = { liar: "video1", truth: "video2" };

  useEffect(() => {
    const verifyAdminAccess = async () => {
      // 1. Check for admin key in URL
      const urlParams = new URLSearchParams(window.location.search);
      const adminKey = urlParams.get("admin");
      if (!adminKey) return;

      try {
        // 2. Fetch admin key from Supabase
        const { data, error } = await supabase
          .from("secrets")
          .select("admin_key")
          .eq("id", 1) // Explicitly get the first record
          .single();

        if (error) throw error;

        const isAuthorized = crypto.subtle.timingSafeEqual(
          new TextEncoder().encode(data?.admin_key || ""),
          new TextEncoder().encode(adminKey)
        );

        if (isAuthorized) {
          setIsAdmin(true);
          window.history.replaceState({}, "", window.location.pathname);

          await supabase
            .from("admin_logs")
            .insert([{ action: "login", timestamp: new Date() }]);
        }
      } catch (error) {
        console.error("Admin verification failed:", error);
        await supabase.from("errors").insert([
          {
            type: "admin_verification",
            message: error.message,
          },
        ]);
      }
    };

    verifyAdminAccess();
    updateResults();
  }, []);

  const sendChoice = async (liarChoice) => {
    try {
      const isCorrect = liarChoice === correctAnswer.liar;
      const truthChoice = liarChoice === "video1" ? "video2" : "video1";

      const { error } = await supabase.from("responses").insert([
        {
          selected_liar: liarChoice,
          selected_truth: truthChoice,
          is_correct: isCorrect,
          userType: "voter",
        },
      ]);

      if (!error) updateResults();
    } catch (err) {
      console.error("Error submitting choice:", err);
    }
  };

  const updateResults = async () => {
    try {
      const { data, error } = await supabase.from("responses").select("*");

      if (!error) {
        const correctCount = data.filter((r) => r.is_correct).length;
        setResults({
          correct: correctCount,
          wrong: data.length - correctCount,
          allResponses: isAdmin ? data : [],
        });
      }
    } catch (err) {
      console.error("Error fetching results:", err);
    }
  };

  const handleChoice = (liarChoice) => {
    if (selectedLiar !== null) return;
    setSelectedLiar(liarChoice);
    sendChoice(liarChoice);
  };

  // Admin view
  if (isAdmin) {
    return (
      <div
        className='admin-view'
        style={{ padding: "20px", fontFamily: "Arial" }}>
        <h1>Admin Dashboard</h1>
        <div
          className='stats'
          style={{
            background: "#f5f5f5",
            padding: "15px",
            borderRadius: "5px",
          }}>
          <h3>Total Votes: {results.correct + results.wrong}</h3>
          <p>✅ Correct: {results.correct}</p>
          <p>❌ Wrong: {results.wrong}</p>
          <p>
            Success Rate:{" "}
            {Math.round(
              (results.correct / (results.correct + results.wrong || 1)) * 100
            )}
            %
          </p>
        </div>

        <h3>Recent Votes</h3>
        <div style={{ maxHeight: "400px", overflowY: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "#eee" }}>
                <th style={{ padding: "8px", border: "1px solid #ddd" }}>
                  Time
                </th>
                <th style={{ padding: "8px", border: "1px solid #ddd" }}>
                  Liar Choice
                </th>
                <th style={{ padding: "8px", border: "1px solid #ddd" }}>
                  Truth Choice
                </th>
                <th style={{ padding: "8px", border: "1px solid #ddd" }}>
                  Correct?
                </th>
              </tr>
            </thead>
            <tbody>
              {results.allResponses
                .slice()
                .reverse()
                .map((response, index) => (
                  <tr key={index}>
                    <td style={{ padding: "8px", border: "1px solid #ddd" }}>
                      {new Date(response.timestamp).toLocaleString()}
                    </td>
                    <td style={{ padding: "8px", border: "1px solid #ddd" }}>
                      {response.selected_liar}
                    </td>
                    <td style={{ padding: "8px", border: "1px solid #ddd" }}>
                      {response.selected_truth}
                    </td>
                    <td
                      style={{
                        padding: "8px",
                        border: "1px solid #ddd",
                        color: response.is_correct ? "green" : "red",
                      }}>
                      {response.is_correct ? "✅" : "❌"}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        <button
          onClick={updateResults}
          style={{
            marginTop: "20px",
            padding: "10px 15px",
            backgroundColor: "#4CAF50",
            color: "white",
          }}>
          Refresh Data
        </button>
      </div>
    );
  }

  // Regular user view
  return (
    <div
      style={{
        maxWidth: "800px",
        margin: "0 auto",
        padding: "20px",
        fontFamily: "Arial",
      }}>
      <h1>Deception Detection</h1>
      <h3>Select the Liar</h3>

      <div style={{ display: "flex", gap: "20px", margin: "20px 0" }}>
        <video controls style={{ width: "50%" }}>
          <source src={liar} type='video/mp4' />
        </video>
        <video controls style={{ width: "50%" }}>
          <source src={truth} type='video/mp4' />
        </video>
      </div>

      <div style={{ display: "flex", gap: "10px", margin: "20px 0" }}>
        <button
          onClick={() => handleChoice("video1")}
          disabled={selectedLiar !== null}
          style={{
            padding: "10px 15px",
            backgroundColor: selectedLiar === null ? "#2196F3" : "#cccccc",
            color: "white",
          }}>
          Choose Video 1 as Liar
        </button>
        <button
          onClick={() => handleChoice("video2")}
          disabled={selectedLiar !== null}
          style={{
            padding: "10px 15px",
            backgroundColor: selectedLiar === null ? "#2196F3" : "#cccccc",
            color: "white",
          }}>
          Choose Video 2 as Liar
        </button>
      </div>

      {selectedLiar && (
        <div
          style={{
            background: "#f5f5f5",
            padding: "15px",
            borderRadius: "5px",
          }}>
          <p>
            Thank you for voting! You selected Video{" "}
            {selectedLiar === "video1" ? 1 : 2} as the liar.
          </p>
        </div>
      )}
    </div>
  );
}

export default Voting;

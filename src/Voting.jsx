import React, { useState, useEffect } from "react";
import truth from "../src/assets/Truth.mp4";
import liar from "../src/assets/Liar.mp4";

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
      const urlParams = new URLSearchParams(window.location.search);
      const adminKey = urlParams.get("admin");

      if (!adminKey) return;

      try {
        const response = await fetch("http://localhost:8000/adminAccess");
        const { secretKey } = await response.json();

        if (adminKey === secretKey) {
          setIsAdmin(true);
          window.history.replaceState({}, "", window.location.pathname);
        }
      } catch (error) {
        console.error("Admin verification failed:", error);
      }
    };

    verifyAdminAccess();
    updateResults();
  }, []);

  const sendChoice = async (liarChoice) => {
    try {
      const isCorrect = liarChoice === correctAnswer.liar;
      const truthChoice = liarChoice === "video1" ? "video2" : "video1";

      await fetch("http://localhost:8000/responses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selected_liar: liarChoice,
          selected_truth: truthChoice,
          timestamp: new Date().toISOString(),
          is_correct: isCorrect,
          userType: "voter",
        }),
      });
      updateResults();
    } catch (err) {
      console.error("Error submitting choice:", err);
    }
  };

  const updateResults = async () => {
    try {
      const res = await fetch("http://localhost:8000/responses");
      const data = await res.json();

      const correctCount = data.filter((r) => r.is_correct).length;
      setResults({
        correct: correctCount,
        wrong: data.length - correctCount,
        allResponses: isAdmin ? data : [],
      });
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
            marginBottom: "20px",
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

        <h3>All Responses</h3>
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
              {results.allResponses.map((response, index) => (
                <tr key={index} style={{ borderBottom: "1px solid #ddd" }}>
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
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}>
          Refresh Data
        </button>
      </div>
    );
  }

  // Regular user view
  return (
    <div
      className='user-view'
      style={{
        maxWidth: "800px",
        margin: "0 auto",
        padding: "20px",
        fontFamily: "Arial",
      }}>
      <h1>Deception Detection</h1>
      <h3>Select the Liar</h3>

      <div
        className='videos'
        style={{
          display: "flex",
          gap: "20px",
          margin: "20px 0",
        }}>
        <video id='video1' controls style={{ width: "50%" }}>
          <source src={liar} type='video/mp4' />
          Your browser doesn't support videos
        </video>

        <video id='video2' controls style={{ width: "50%" }}>
          <source src={truth} type='video/mp4' />
          Your browser doesn't support videos
        </video>
      </div>

      <div
        className='buttons'
        style={{
          display: "flex",
          gap: "10px",
          margin: "20px 0",
        }}>
        <button
          onClick={() => handleChoice("video1")}
          disabled={selectedLiar !== null}
          style={{
            padding: "10px 15px",
            backgroundColor: selectedLiar === null ? "#2196F3" : "#cccccc",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: selectedLiar === null ? "pointer" : "not-allowed",
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
            border: "none",
            borderRadius: "4px",
            cursor: selectedLiar === null ? "pointer" : "not-allowed",
          }}>
          Choose Video 2 as Liar
        </button>
      </div>
    </div>
  );
}

export default Voting;

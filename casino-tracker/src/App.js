import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function CasinoTracker() {
  const [entries, setEntries] = useState([]);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [amount, setAmount] = useState("");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Simulate Firebase initialization
  useEffect(() => {
    // In real app: initialize Firebase here
    // For demo: simulate logged in user
    setTimeout(() => {
      setUser({ email: "demo@example.com" });
      loadEntries();
      setLoading(false);
    }, 500);
  }, []);

  // Load entries from Firebase (simulated)
  const loadEntries = async () => {
    // In real app: fetch from Firebase
    // For demo: load from localStorage
    const stored = localStorage.getItem("casinoEntries");
    if (stored) {
      setEntries(JSON.parse(stored));
    }
  };

  // Save entries to Firebase (simulated)
  const saveEntries = (newEntries) => {
    // In real app: save to Firebase
    // For demo: save to localStorage
    localStorage.setItem("casinoEntries", JSON.stringify(newEntries));
    setEntries(newEntries);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(""); // Clear any previous errors

    if (!amount || isNaN(amount)) {
      setError("Please enter a valid amount");
      return;
    }

    if (!date) {
      setError("Please select a valid date");
      return;
    }

    const newEntry = {
      id: Date.now(),
      date,
      amount: parseFloat(amount),
      timestamp: new Date(date).getTime(),
    };

    const updated = [...entries, newEntry].sort(
      (a, b) => a.timestamp - b.timestamp
    );
    saveEntries(updated);
    setAmount("");
  };

  const handleDelete = (id) => {
    const updated = entries.filter((e) => e.id !== id);
    saveEntries(updated);
  };

  // Calculate running total for graph
  const chartData = entries.reduce((acc, entry) => {
    const runningTotal =
      acc.length > 0
        ? acc[acc.length - 1].runningTotal + entry.amount
        : entry.amount;

    acc.push({
      date: entry.date,
      amount: entry.amount,
      runningTotal: runningTotal,
    });
    return acc;
  }, []);

  const currentTotal =
    chartData.length > 0 ? chartData[chartData.length - 1].runningTotal : 0;

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="bg-gray-800 p-8 rounded-lg shadow-xl">
          <h1 className="text-3xl font-bold text-white mb-4">Casino Tracker</h1>
          <p className="text-gray-300 mb-6">
            Sign in to track your casino earnings
          </p>
          <button
            onClick={() => setUser({ email: "demo@example.com" })}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition"
          >
            Sign in with Google (Demo)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">🎰 Casino Tracker</h1>
          <div className="text-right">
            <div className="text-sm text-gray-400">{user.email}</div>
            <button
              onClick={() => setUser(null)}
              className="text-sm text-blue-400 hover:text-blue-300"
            >
              Sign out
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-8">
          {/* Left Column - Current Total and Input Form */}
          <div className="col-span-1">
            {/* Current Total */}
            <div className="col-span-1">
              <div className="bg-gray-800 rounded-lg p-6 mb-8 text-center">
                <div className="text-gray-400 text-sm uppercase tracking-wide mb-2">
                  Current Total
                </div>
                <div
                  className={`text-5xl font-bold ${
                    currentTotal >= 0 ? "text-green-400" : "text-red-400"
                  }`}
                >
                  ${currentTotal.toFixed(2)}
                </div>
              </div>
            </div>

            {/* Input Form */}
            <div className="bg-gray-800 rounded-lg p-6 shadow-xl">
              <h2 className="text-2xl font-bold mb-6">Add Entry</h2>

              {/* Error message */}
              {error && (
                <div className="mb-4 bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Amount ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter positive or negative"
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Use negative numbers for losses
                  </p>
                </div>
                <button
                  onClick={handleSubmit}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition"
                >
                  Add Entry
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Graph*/}
          <div className="col-span-2">
            {/* Graph */}
            <div className="bg-gray-800 rounded-lg p-6 mb-8 shadow-xl h-full">
              <h2 className="text-2xl font-bold mb-6">Earnings Over Time</h2>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="90%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis
                      dataKey="date"
                      stroke="#9CA3AF"
                      tick={{ fill: "#9CA3AF" }}
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return `${date
                          .getDate()
                          .toString()
                          .padStart(2, "0")}-${date.toLocaleString("default", {
                          month: "short",
                        })}`;
                      }}
                    />
                    <YAxis stroke="#9CA3AF" tick={{ fill: "#9CA3AF" }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1F2937",
                        border: "1px solid #374151",
                        borderRadius: "8px",
                        color: "#fff",
                      }}
                      formatter={(value) => `$${value.toFixed(2)}`}
                    />
                    <Legend wrapperStyle={{ color: "#9CA3AF" }} />
                    <Line
                      type="monotone"
                      dataKey="runningTotal"
                      stroke="#3B82F6"
                      strokeWidth={3}
                      name="Running Total"
                      dot={{ fill: "#3B82F6", r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-gray-400 py-20">
                  No data yet. Add your first entry to see the graph!
                </div>
              )}
            </div>
          </div>

          {/* Across Columns - Historical Data Table */}
          <div className="col-span-3">
            <div className="bg-gray-800 rounded-lg p-6 shadow-xl">
              <h2 className="text-2xl font-bold mb-6">History</h2>
              {entries.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left py-3 px-4 text-gray-300">
                          Date
                        </th>
                        <th className="text-right py-3 px-4 text-gray-300">
                          Amount
                        </th>
                        <th className="text-right py-3 px-4 text-gray-300">
                          Running Total
                        </th>
                        <th className="text-center py-3 px-4 text-gray-300">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {chartData.map((entry, index) => {
                        const originalEntry = entries[index];
                        return (
                          <tr
                            key={originalEntry.id}
                            className="border-b border-gray-700 hover:bg-gray-700"
                          >
                            <td className="py-3 px-4">{entry.date}</td>
                            <td
                              className={`text-right py-3 px-4 font-semibold ${
                                entry.amount >= 0
                                  ? "text-green-400"
                                  : "text-red-400"
                              }`}
                            >
                              ${entry.amount.toFixed(2)}
                            </td>
                            <td
                              className={`text-right py-3 px-4 font-semibold ${
                                entry.runningTotal >= 0
                                  ? "text-green-400"
                                  : "text-red-400"
                              }`}
                            >
                              ${entry.runningTotal.toFixed(2)}
                            </td>
                            <td className="text-center py-3 px-4">
                              <button
                                onClick={() => handleDelete(originalEntry.id)}
                                className="text-red-400 hover:text-red-300 text-sm"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center text-gray-400 py-10">
                  No entries yet. Add your first casino visit!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

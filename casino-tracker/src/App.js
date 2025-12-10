import React, { useState, useEffect } from "react";
import { auth, googleProvider, db } from "./firebase";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  query,
  where,
  onSnapshot,
  orderBy,
} from "firebase/firestore";
import { useLanguage } from "./LanguageContext";

export default function CasinoTracker() {
  const [entries, setEntries] = useState([]);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [amount, setAmount] = useState("");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Get translation function and language toggle
  const { t, language, toggleLanguage } = useLanguage();

  // Initialize Firebase authentication listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Load entries from Firestore when user logs in
  useEffect(() => {
    if (!user) {
      setEntries([]);
      return;
    }

    // Real-time listener for user's entries
    const q = query(
      collection(db, "entries"),
      where("userId", "==", user.uid),
      orderBy("timestamp", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const entriesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setEntries(entriesData);
    });

    return () => unsubscribe(); // Cleanup listener
  }, [user]);

  // Google Sign In
  const handleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Sign in error:", error);
      if (error.code === "auth/web-storage-unsupported") {
        setError(t("errorWebStorage"));
      } else {
        setError(t("errorSignIn"));
      }
    }
  };

  // Sign Out
  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  // Add entry to Firestore
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!amount || isNaN(amount)) {
      setError(t("errorInvalidAmount"));
      return;
    }

    if (!date) {
      setError(t("errorInvalidDate"));
      return;
    }

    try {
      await addDoc(collection(db, "entries"), {
        userId: user.uid,
        date,
        amount: parseFloat(amount),
        timestamp: new Date(date).getTime(),
        createdAt: new Date(),
      });
      setAmount(""); // Clear input
    } catch (error) {
      console.error("Error adding entry:", error);
      setError(t("errorAddEntry"));
    }
  };

  // Delete entry from Firestore
  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, "entries", id));
    } catch (error) {
      console.error("Error deleting entry:", error);
      setError(t("errorDeleteEntry"));
    }
  };

  // Calculate running total for graph
  const chartData = (() => {
    // First, group entries by date and sum amounts
    const dailyTotals = {};

    entries.forEach((entry) => {
      if (dailyTotals[entry.date]) {
        dailyTotals[entry.date] += entry.amount;
      } else {
        dailyTotals[entry.date] = entry.amount;
      }
    });

    // Convert to array and sort by date
    const sortedDates = Object.keys(dailyTotals).sort();

    // Calculate running totals
    let runningTotal = 0;
    return sortedDates.map((date) => {
      runningTotal += dailyTotals[date];
      return {
        date,
        amount: dailyTotals[date],
        runningTotal,
        // Add these for the area chart:
        positiveArea: runningTotal > 0 ? runningTotal : 0,
        negativeArea: runningTotal < 0 ? runningTotal : 0,
      };
    });
  })();

  const currentTotal =
    chartData.length > 0 ? chartData[chartData.length - 1].runningTotal : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
        <div className="text-white text-lg md:text-xl">{t("loading")}</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
        <div className="bg-gray-800 p-6 md:p-8 rounded-lg shadow-xl w-full max-w-md">
          {/* Title and Language toggle on same row */}
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              {t("signInTitle")}
            </h1>
            <button
              onClick={toggleLanguage}
              className="text-sm text-blue-400 hover:text-blue-300 transition touch-manipulation ml-4"
              title={
                language === "en" ? "Switch to Portuguese" : "Mudar para Inglês"
              }
            >
              {language === "en" ? "🇺🇸 EN" : "🇧🇷 PT"}
            </button>
          </div>
          <p className="text-gray-300 mb-4 md:mb-6 text-sm md:text-base">
            {t("signInSubtitle")}
          </p>
          <button
            onClick={handleSignIn}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition touch-manipulation"
          >
            {t("signInButton")}
          </button>
          {error && (
            <p className="text-red-400 text-sm mt-4 text-center">{error}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white pb-20 md:pb-24">
      {/* Header with language toggle */}
      <div className="sticky top-0 z-40 bg-gray-900 py-3 md:py-4 px-4 md:px-6 border-b border-gray-800 mb-4 md:mb-8">
        <div className="max-w-7xl mx-auto flex justify-between items-center gap-2">
          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold">
            🎰 {t("appTitle")}
          </h1>
          <div className="flex items-center gap-3 md:gap-4">
            <div className="text-right">
              <div className="text-xs md:text-sm text-gray-400 truncate max-w-[120px] sm:max-w-none">
                {user.email}
              </div>
              {/* Language toggle button */}
              <button
                onClick={toggleLanguage}
                className="text-xs md:text-sm text-blue-400 hover:text-blue-300 transition touch-manipulation"
                title={
                  language === "en"
                    ? "Switch to Portuguese"
                    : "Mudar para Inglês"
                }
              >
                {language === "en" ? "🇺🇸 EN" : "🇧🇷 PT"}
              </button>
              <span> • </span>
              <button
                onClick={handleSignOut}
                className="text-xs md:text-sm text-blue-400 hover:text-blue-300 touch-manipulation"
              >
                {t("signOut")}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 md:px-6 max-w-7xl mx-auto">
        {/* Mobile: Stack everything vertically, Desktop: 3-column grid */}
        <div className="flex flex-col lg:grid lg:grid-cols-3 lg:grid-rows-1 gap-4 md:gap-6 lg:gap-8">
          {/* Left Column: Current Total + Add Entry stacked - Full width on mobile, 1 col on desktop */}
          <div className="lg:col-span-1 lg:row-span-1 flex flex-col gap-4 md:gap-6 lg:gap-8">
            {/* Current Total */}
            <div className="bg-gray-800 rounded-lg p-4 md:p-6 text-center">
              <div className="text-gray-400 text-xs md:text-sm uppercase tracking-wide mb-1 md:mb-2">
                {t("currentTotal")}
              </div>
              <div
                className={`text-3xl sm:text-4xl md:text-5xl font-bold ${
                  currentTotal >= 0 ? "text-green-400" : "text-red-400"
                }`}
              >
                ${currentTotal.toFixed(2)}
              </div>
            </div>

            {/* Add Entry Form */}
            <div className="bg-gray-800 rounded-lg p-4 md:p-6 shadow-xl">
              <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">
                {t("addEntryTitle")}
              </h2>

              {error && (
                <div className="mb-4 bg-red-500/20 border border-red-500 text-red-200 px-3 py-2 md:px-4 md:py-3 rounded text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-3 md:space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {t("dateLabel")}
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 md:px-4 md:py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white text-sm md:text-base touch-manipulation"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {t("amountLabel")}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleSubmit(e);
                      }
                    }}
                    placeholder={t("amountPlaceholder")}
                    className="w-full px-3 py-2 md:px-4 md:py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white text-sm md:text-base touch-manipulation"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    {t("amountHint")}
                  </p>
                </div>
                <button
                  onClick={handleSubmit}
                  className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold py-3 px-4 md:px-6 rounded-lg transition touch-manipulation"
                >
                  {t("addEntryButton")}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Graph - Full width on mobile, 2 cols on desktop */}
          <div className="lg:col-span-2 lg:row-span-1">
            <div className="bg-gray-800 rounded-lg p-4 md:p-6 shadow-xl h-full flex flex-col">
              <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">
                {t("chartTitle")}
              </h2>
              <div className="w-full h-[300px] lg:flex-1 lg:h-auto">
                {chartData.length > 0 ? (
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                    minHeight={300}
                  >
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis
                        dataKey="date"
                        stroke="#9CA3AF"
                        tick={{ fill: "#9CA3AF", fontSize: 12 }}
                        tickFormatter={(value) => {
                          const date = new Date(value);
                          const day = date
                            .getDate()
                            .toString()
                            .padStart(2, "0");
                          const month = (date.getMonth() + 1)
                            .toString()
                            .padStart(2, "0");
                          return `${day}/${month}`;
                        }}
                      />
                      <YAxis
                        stroke="#9CA3AF"
                        tick={{ fill: "#9CA3AF", fontSize: 12 }}
                        tickFormatter={(value) => {
                          if (value === 0) return "$0";
                          // For large numbers, you can abbreviate
                          if (Math.abs(value) >= 1000) {
                            return `$${(value / 1000).toFixed(0)}k`;
                          }
                          return `$${value.toFixed(0)}`;
                        }}
                      />
                      <ReferenceLine
                        y={0}
                        stroke="#6B7280"
                        strokeDasharray="5 5"
                        strokeWidth={1}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1F2937",
                          border: "1px solid #374151",
                          borderRadius: "8px",
                          color: "#fff",
                          fontSize: "14px",
                        }}
                        formatter={(value, name, props) => {
                          // Only show tooltip for runningTotal
                          if (props.dataKey === "runningTotal") {
                            return [`$${value.toFixed(2)}`, t("tooltipTotal")];
                          }
                          return null;
                        }}
                        labelFormatter={(label) =>
                          `${t("tooltipDate")}: ${label}`
                        }
                      />
                      <Legend
                        wrapperStyle={{ color: "#9CA3AF", fontSize: "12px" }}
                      />
                      {/* Red area for negative values */}
                      <Area
                        type="monotone"
                        dataKey="negativeArea" // We'll need to transform data
                        stroke="#ef4444"
                        fill="#ef4444"
                        fillOpacity={0.6}
                        strokeWidth={0}
                        connectNulls={true}
                        name={t("legendBelowZero")}
                        isAnimationActive={false}
                      />
                      {/* Green area for positive values */}
                      <Area
                        type="monotone"
                        dataKey="positiveArea" // We'll need to transform data
                        stroke="#10B981"
                        fill="#10B981"
                        fillOpacity={0.6}
                        strokeWidth={0}
                        connectNulls={true}
                        name={t("legendAboveZero")}
                        isAnimationActive={false}
                      />
                      {/* Add a line on top to show the actual running total */}
                      {/* For the dots, they are green if dailyTotal is positive, red if negative */}
                      <Line
                        type="monotone"
                        dataKey="runningTotal"
                        stroke="#3B82F6"
                        strokeWidth={2}
                        name={t("legendRunningTotal")}
                        dot={(props) => {
                          const { cx, cy, payload } = props;
                          const color =
                            payload.amount >= 0 ? "#10B981" : "#EF4444";
                          return (
                            <circle
                              cx={cx}
                              cy={cy}
                              r={4}
                              fill={color}
                              stroke={color}
                              strokeWidth={2}
                            />
                          );
                        }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center text-gray-400 py-12 md:py-20 text-sm md:text-base">
                    {t("chartNoData")}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* History Table - Full width across all columns */}
          <div className="lg:col-span-3">
            <div className="bg-gray-800 rounded-lg p-4 md:p-6 shadow-xl">
              <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">
                {t("historyTitle")}
              </h2>
              {entries.length > 0 ? (
                <div className="overflow-x-auto -mx-4 md:mx-0">
                  <div className="inline-block min-w-full align-middle">
                    <table className="min-w-full">
                      <thead>
                        <tr className="border-b border-gray-700">
                          <th className="text-left py-2 md:py-3 px-2 md:px-4 text-gray-300 text-sm md:text-base">
                            {t("tableDate")}
                          </th>
                          <th className="text-right py-2 md:py-3 px-2 md:px-4 text-gray-300 text-sm md:text-base">
                            {t("tableAmount")}
                          </th>
                          <th className="text-right py-2 md:py-3 px-2 md:px-4 text-gray-300 text-sm md:text-base">
                            {t("tableTotal")}
                          </th>
                          <th className="text-center py-2 md:py-3 px-2 md:px-4 text-gray-300 text-sm md:text-base">
                            {t("tableAction")}
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
                              <td className="py-2 md:py-3 px-2 md:px-4 text-sm md:text-base">
                                {entry.date}
                              </td>
                              <td
                                className={`text-right py-2 md:py-3 px-2 md:px-4 font-semibold text-sm md:text-base ${
                                  entry.amount >= 0
                                    ? "text-green-400"
                                    : "text-red-400"
                                }`}
                              >
                                ${entry.amount.toFixed(2)}
                              </td>
                              <td
                                className={`text-right py-2 md:py-3 px-2 md:px-4 font-semibold text-sm md:text-base ${
                                  entry.runningTotal >= 0
                                    ? "text-green-400"
                                    : "text-red-400"
                                }`}
                              >
                                ${entry.runningTotal.toFixed(2)}
                              </td>
                              <td className="text-center py-2 md:py-3 px-2 md:px-4">
                                <button
                                  onClick={() => handleDelete(originalEntry.id)}
                                  className="text-red-400 hover:text-red-300 text-xs md:text-sm touch-manipulation py-1 px-2"
                                >
                                  {t("deleteButton")}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-400 py-8 md:py-10 text-sm md:text-base">
                  {t("historyNoData")}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer - responsive text size */}
      <footer className="fixed bottom-0 left-0 w-full text-center p-2 md:p-3 bg-gray-900 text-gray-500 text-xs border-t border-gray-800 z-50">
        <div className="flex flex-wrap justify-center gap-1 md:gap-2 items-center">
          <a
            href="https://github.com/palharesf/"
            className="text-blue-400 hover:text-blue-300"
          >
            {t("footerBuiltBy")}
          </a>
          <span>•</span>
          <a
            href="https://github.com/palharesf/rei_do_casino"
            className="text-blue-400 hover:text-blue-300"
          >
            {t("footerSourceCode")}
          </a>
          <span>•</span>
          <a
            href="https://ko-fi.com/fernandopa"
            className="text-blue-400 hover:text-blue-300"
          >
            {t("footerCoffee")}
          </a>
        </div>
      </footer>
    </div>
  );
}
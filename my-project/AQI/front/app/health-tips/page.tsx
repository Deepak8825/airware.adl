"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Heart, Info } from "lucide-react";

type CityAqi = { name: string; aqi: number };

const DEMO_CITIES: CityAqi[] = [
  { name: "Chennai", aqi: 92 },
  { name: "Coimbatore", aqi: 58 },
  { name: "Madurai", aqi: 110 },
  { name: "Tiruchirappalli", aqi: 135 },
  { name: "Salem", aqi: 78 },
  { name: "Erode", aqi: 48 },
  { name: "Puducherry", aqi: 65 },
];

function aqiMeta(aqi: number) {
  if (aqi <= 50) return { label: "Good", color: "#16a34a" };
  if (aqi <= 100) return { label: "Moderate", color: "#eab308" };
  if (aqi <= 150) return { label: "Unhealthy for Sensitive Groups", color: "#f97316" };
  if (aqi <= 200) return { label: "Unhealthy", color: "#ef4444" };
  if (aqi <= 300) return { label: "Very Unhealthy", color: "#7c3aed" };
  return { label: "Hazardous", color: "#6b0f0f" };
}

function healthTipsForAqi(aqi: number) {
  if (aqi <= 50)
    return ["Air quality is good — enjoy outdoor activities.", "Keep windows open if indoors and ventilated."];
  if (aqi <= 100)
    return ["Acceptable for most people. Sensitive groups should reduce long outdoor exertion."];
  if (aqi <= 150)
    return [
      "Sensitive groups: reduce prolonged or heavy exertion outdoors.",
      "Consider using an N95/FFP2 mask for extended outdoor exposure.",
    ];
  if (aqi <= 200)
    return [
      "Everyone may begin to experience health effects; minimize outdoor activities.",
      "Use indoor air purifiers (HEPA) and avoid exercise outdoors.",
    ];
  return ["Emergency condition: avoid all outdoor exertion.", "Seek medical attention if you experience respiratory symptoms."];
}

const container = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { staggerChildren: 0.05 } } };

export default function HealthTipsPage() {
  const [selected, setSelected] = useState<CityAqi>(DEMO_CITIES[0]);
  const [expanded, setExpanded] = useState<number | null>(0);

  const meta = aqiMeta(selected.aqi);

  return (
    <div className="container mx-auto px-4 py-10 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10"
      >
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-cyan-400 flex items-center justify-center shadow-xl">
            <Sun className="text-white w-8 h-8" />
          </div>
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900">Health Tips & Recommendations</h1>
            <p className="text-gray-700 mt-1">Practical guidance based on AQI levels. Demo data for Tamil Nadu & sample cities.</p>
          </div>
        </div>
      </motion.header>

      {/* Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sidebar */}
        <motion.aside className="lg:col-span-1 bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <motion.div className="mb-6">
            <label className="block text-sm font-semibold text-gray-900 mb-2">Choose a demo city</label>
            <div className="relative">
              <select
                value={selected.name}
                onChange={(e) =>
                  setSelected(DEMO_CITIES.find((c) => c.name === e.target.value) || DEMO_CITIES[0])
                }
                className="w-full p-3 rounded-lg border bg-white text-gray-900 shadow focus:ring-2 focus:ring-blue-500"
              >
                {DEMO_CITIES.map((c) => (
                  <option key={c.name} value={c.name} className="text-gray-900">
                    {c.name} — AQI {c.aqi}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-500">▾</div>
            </div>
          </motion.div>

          <motion.div className="mt-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-800">Current AQI</div>
                <div className="flex items-baseline gap-3">
                  <motion.h2 layout key={selected.name} className="text-4xl font-extrabold text-gray-900">
                    {selected.aqi}
                  </motion.h2>
                  <div className="text-sm font-semibold text-gray-900">{meta.label}</div>
                </div>
              </div>
              <div
                style={{ background: meta.color }}
                className="w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg"
              >
                <Heart className="w-6 h-6" />
              </div>
            </div>

            <div className="mt-4">
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, (selected.aqi / 300) * 100)}%` }}
                  style={{ background: meta.color }}
                  className="h-full"
                />
              </div>
              <div className="flex justify-between text-xs font-medium text-gray-700 mt-2">
                <span>0</span>
                <span>150</span>
                <span>300+</span>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={() => setExpanded((prev) => (prev === 0 ? null : 0))}
                className="w-full py-2.5 px-4 rounded-lg border bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 text-gray-900 font-medium transition shadow-sm"
              >
                Quick recommendations
              </button>
            </div>
          </motion.div>
        </motion.aside>

        {/* Main */}
        <motion.main className="lg:col-span-2 space-y-6">
          {/* Recommendations */}
          <motion.section
            className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
            initial="hidden"
            animate="show"
            variants={container}
          >
            <motion.h3 className="text-xl font-semibold mb-4 text-gray-900">Recommendations</motion.h3>
            <AnimatePresence>
              <motion.div
                layout
                key={selected.name}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {healthTipsForAqi(selected.aqi).map((tip, idx) => (
                    <motion.div
                      key={idx}
                      whileHover={{ y: -6, scale: 1.02 }}
                      className="p-4 bg-gradient-to-br from-white to-gray-50 rounded-xl border shadow-sm hover:shadow-md transition"
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-blue-50 text-blue-600 shadow-sm">
                          <Info className="w-5 h-5" />
                        </div>
                        <p className="text-gray-900 text-sm">{tip}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </motion.section>

          {/* Detailed Guidance */}
          <motion.section className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Detailed Guidance</h3>
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="border rounded-lg overflow-hidden shadow-sm">
                  <button
                    onClick={() => setExpanded((prev) => (prev === i + 1 ? null : i + 1))}
                    className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition"
                  >
                    <div>
                      <div className="font-semibold text-gray-900">
                        {i === 0 ? "When to wear a mask" : i === 1 ? "Indoor air actions" : "Vulnerable groups"}
                      </div>
                      <div className="text-sm text-gray-600">Tap to expand</div>
                    </div>
                    <div className="text-gray-600 text-xl">{expanded === i + 1 ? "−" : "+"}</div>
                  </button>
                  <AnimatePresence>
                    {expanded === i + 1 && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="px-4 pb-4"
                      >
                        <div className="text-sm text-gray-800 py-2 leading-relaxed">
                          {i === 0 && (
                            <>Wear a fitted N95/FFP2 when AQI &gt;100 for prolonged outdoor activities. Avoid strenuous exercise outdoors when AQI &gt;150.</>
                          )}
                          {i === 1 && (
                            <>Keep windows closed on high AQI days, run an air purifier with a HEPA filter, and avoid indoor sources of pollution (smoking, frying).</>
                          )}
                          {i === 2 && (
                            <>Children, elderly and people with lung/cardiac conditions should limit time outdoors and keep medications handy during poor air days.</>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </motion.section>

          {/* Help Section */}
          <motion.section className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-6 shadow-lg flex items-center justify-between border border-blue-100">
            <div>
              <h4 className="font-bold text-gray-900">Need more help?</h4>
              <p className="text-sm text-gray-700 mt-1">Contact local health services or consult your physician for personalized advice.</p>
            </div>
            <div className="flex gap-3">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 shadow transition">
                Find clinics
              </button>
              <button className="px-4 py-2 bg-gray-100 text-gray-900 rounded-lg font-medium hover:bg-gray-200 shadow-sm transition">
                Save report
              </button>
            </div>
          </motion.section>
        </motion.main>
      </div>
    </div>
  );
}

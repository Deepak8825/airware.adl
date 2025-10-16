"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Heart, Info, Newspaper, Cloud, Activity, AlertTriangle, MapPin, Calendar, TrendingUp, Wind, Droplets, ThermometerSun } from "lucide-react";

type CityAqi = { 
  name: string; 
  aqi: number;
  location?: string;
  pm25?: number;
  pm10?: number;
  temp?: number;
  humidity?: number;
};

type NewsArticle = {
  title: string;
  description: string;
  source: string;
  publishedAt: string;
  category: 'air-quality' | 'weather' | 'health';
};

type WeatherActivity = {
  activity: string;
  recommendation: 'recommended' | 'caution' | 'avoid';
  reason: string;
  icon: string;
};

const availableLocations = [
  "Delhi", "Mumbai", "Bangalore", "Chennai", "Kolkata", "Hyderabad", 
  "Pune", "Ahmedabad", "Coimbatore", "Jaipur"
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
    return ["Air quality is good — enjoy outdoor activities.", "Keep windows open for fresh air.", "Perfect time for exercise outdoors."];
  if (aqi <= 100)
    return ["Acceptable for most people. Sensitive groups should reduce long outdoor exertion.", "Consider light outdoor activities.", "Monitor air quality if you have respiratory conditions."];
  if (aqi <= 150)
    return [
      "Sensitive groups: reduce prolonged or heavy exertion outdoors.",
      "Consider using an N95/FFP2 mask for extended outdoor exposure.",
      "Keep windows closed during peak pollution hours.",
      "Use indoor air purifiers if available."
    ];
  if (aqi <= 200)
    return [
      "Everyone may begin to experience health effects; minimize outdoor activities.",
      "Use indoor air purifiers (HEPA) and avoid exercise outdoors.",
      "Wear N95 masks if going outside is necessary.",
      "Keep medications handy if you have respiratory issues."
    ];
  return [
    "Emergency condition: avoid all outdoor exertion.", 
    "Seek medical attention if you experience respiratory symptoms.",
    "Stay indoors with air purifiers running.",
    "Close all windows and doors."
  ];
}

function getActivitiesRecommendation(aqi: number): WeatherActivity[] {
  return [
    {
      activity: "Morning Walk/Jog",
      recommendation: aqi <= 50 ? 'recommended' : aqi <= 100 ? 'caution' : 'avoid',
      reason: aqi <= 50 ? "Air quality is excellent" : aqi <= 100 ? "Moderate air - limit duration" : "Poor air quality",
      icon: "🏃"
    },
    {
      activity: "Outdoor Sports",
      recommendation: aqi <= 50 ? 'recommended' : aqi <= 100 ? 'caution' : 'avoid',
      reason: aqi <= 50 ? "Safe for all activities" : aqi <= 100 ? "Limit intense activities" : "Indoor sports recommended",
      icon: "⚽"
    },
    {
      activity: "Cycling",
      recommendation: aqi <= 50 ? 'recommended' : aqi <= 100 ? 'caution' : 'avoid',
      reason: aqi <= 50 ? "Great conditions" : aqi <= 100 ? "Short distances only" : "Use indoor alternatives",
      icon: "🚴"
    },
    {
      activity: "Children's Outdoor Play",
      recommendation: aqi <= 50 ? 'recommended' : aqi <= 100 ? 'caution' : 'avoid',
      reason: aqi <= 50 ? "Perfect for kids" : aqi <= 100 ? "Supervised and limited time" : "Indoor activities preferred",
      icon: "🎮"
    },
    {
      activity: "Window Ventilation",
      recommendation: aqi <= 50 ? 'recommended' : aqi <= 150 ? 'caution' : 'avoid',
      reason: aqi <= 50 ? "Excellent for fresh air" : aqi <= 150 ? "Open during early morning only" : "Keep windows closed",
      icon: "🪟"
    },
    {
      activity: "Outdoor Dining",
      recommendation: aqi <= 100 ? 'recommended' : aqi <= 150 ? 'caution' : 'avoid',
      reason: aqi <= 100 ? "Enjoy outdoor meals" : aqi <= 150 ? "Short durations okay" : "Indoor dining recommended",
      icon: "🍽️"
    }
  ];
}

const container = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { staggerChildren: 0.05 } } };

export default function HealthTipsPage() {
  const [cityData, setCityData] = useState<CityAqi>({
    name: "Loading...",
    aqi: 0,
  });
  const [expanded, setExpanded] = useState<number | null>(0);
  const [loading, setLoading] = useState(true);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>("Delhi");

  // Fetch real-time AQI data
  useEffect(() => {
    const fetchRealTimeData = async () => {
      try {
        const backendBase = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
        
        const response = await fetch(`${backendBase}/api/aqi?location=${encodeURIComponent(selectedLocation)}`);
        
        if (response.ok) {
          const data = await response.json();
          setCityData({
            name: selectedLocation,
            aqi: data.aqi || 0,
            location: data.location || selectedLocation,
            pm25: data.pm25,
            pm10: data.pm10,
            temp: data.temperature,
            humidity: data.humidity,
          });
        } else {
          // Fallback to mock data
          setCityData({
            name: selectedLocation,
            aqi: 65,
            pm25: 32.5,
            pm10: 45.2,
            temp: 28,
            humidity: 65,
          });
        }
      } catch (error) {
        console.warn("Failed to fetch real-time data, using fallback:", error);
        setCityData({
          name: selectedLocation,
          aqi: 65,
          pm25: 32.5,
          pm10: 45.2,
          temp: 28,
          humidity: 65,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchRealTimeData();
    // Refresh data every 5 minutes
    const interval = setInterval(fetchRealTimeData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [selectedLocation]);

  // Generate news articles
  useEffect(() => {
    const generateNews = () => {
      const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      const currentAqi = cityData.aqi;
      
      const newsArticles: NewsArticle[] = [
        {
          title: `${cityData.name} Air Quality Update - ${today}`,
          description: `Current AQI stands at ${currentAqi}. ${currentAqi > 100 ? 'Residents advised to limit outdoor activities.' : 'Air quality is acceptable for outdoor activities.'}`,
          source: "AirWare Health Monitor",
          publishedAt: new Date().toISOString(),
          category: 'air-quality'
        },
        {
          title: "Weather Forecast Impact on Air Quality",
          description: `${cityData.temp ? `Temperature: ${cityData.temp}°C, Humidity: ${cityData.humidity}%. ` : ''}Weather conditions may affect pollutant dispersion. Monitor updates regularly.`,
          source: "Weather & Environment Desk",
          publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          category: 'weather'
        },
        {
          title: "Health Advisory for Sensitive Groups",
          description: currentAqi > 100 
            ? "Children, elderly, and people with respiratory conditions should take extra precautions and avoid prolonged outdoor exposure."
            : "Air quality is within acceptable limits. Normal activities can proceed for all groups.",
          source: "Health Advisory Board",
          publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          category: 'health'
        },
        {
          title: "PM2.5 and PM10 Levels Analysis",
          description: `PM2.5: ${cityData.pm25 || 'N/A'} µg/m³, PM10: ${cityData.pm10 || 'N/A'} µg/m³. Fine particulate matter remains ${currentAqi > 100 ? 'elevated' : 'moderate'}.`,
          source: "Environmental Monitoring",
          publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          category: 'air-quality'
        },
        {
          title: "Best Times for Outdoor Activities Today",
          description: currentAqi <= 100 
            ? "Early morning (6-8 AM) and evening (6-8 PM) are ideal for outdoor exercise and activities."
            : "Consider indoor alternatives. If outdoor activity is necessary, limit to early morning hours with proper N95 mask.",
          source: "Fitness & Wellness",
          publishedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
          category: 'health'
        }
      ];
      
      setNews(newsArticles);
    };

    if (!loading) {
      generateNews();
    }
  }, [cityData, loading]);

  const meta = aqiMeta(cityData.aqi);
  const activities = getActivitiesRecommendation(cityData.aqi);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100">
        <div className="text-center">
          <div className="w-16 h-16 border-t-4 border-blue-500 border-solid rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-lg text-gray-700">Loading health tips...</p>
        </div>
      </div>
    );
  }

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
            <h1 className="text-4xl font-extrabold text-gray-900">Health Tips & Live Updates</h1>
            <p className="text-gray-700 mt-1">Real-time air quality data, health recommendations, and daily news updates</p>
          </div>
        </div>
      </motion.header>

      {/* Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sidebar */}
        <motion.aside className="lg:col-span-1 bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <motion.div className="mb-6">
            <label className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-600" />
              Select Your Location
            </label>
            <div className="relative">
              <select
                value={selectedLocation}
                onChange={(e) => {
                  setSelectedLocation(e.target.value);
                  setLoading(true);
                }}
                className="w-full p-3 rounded-xl border border-gray-300 bg-white text-gray-900 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              >
                {availableLocations.map((loc) => (
                  <option key={loc} value={loc} className="text-gray-900">
                    {loc}
                  </option>
                ))}
              </select>
            </div>
          </motion.div>

          <motion.div className="mt-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-800">Current AQI</div>
                <div className="flex items-baseline gap-3">
                  <motion.h2 layout key={cityData.name} className="text-5xl font-extrabold text-gray-900">
                    {cityData.aqi}
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
                  animate={{ width: `${Math.min(100, (cityData.aqi / 300) * 100)}%` }}
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
          {/* Live News Section */}
          <motion.section
            className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
            initial="hidden"
            animate="show"
            variants={container}
          >
            <motion.h3 className="text-xl font-semibold mb-6 text-gray-900 flex items-center gap-2">
              <Newspaper className="w-6 h-6 text-blue-600" />
              Today&apos;s Air Quality News & Updates
            </motion.h3>
            <div className="space-y-4">
              {news.map((article, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="border-l-4 border-blue-500 bg-gradient-to-r from-blue-50 to-white rounded-r-xl p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {article.category === 'air-quality' && <Cloud className="w-4 h-4 text-blue-600" />}
                        {article.category === 'weather' && <Sun className="w-4 h-4 text-orange-600" />}
                        {article.category === 'health' && <Heart className="w-4 h-4 text-red-600" />}
                        <span className="text-xs font-semibold text-gray-500 uppercase">
                          {article.category.replace('-', ' ')}
                        </span>
                      </div>
                      <h4 className="font-bold text-gray-900 mb-2">{article.title}</h4>
                      <p className="text-sm text-gray-700 leading-relaxed">{article.description}</p>
                      <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                        <span className="font-medium">{article.source}</span>
                        <span>•</span>
                        <span>{new Date(article.publishedAt).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* Activity Recommendations */}
          <motion.section
            className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
            initial="hidden"
            animate="show"
            variants={container}
          >
            <motion.h3 className="text-xl font-semibold mb-6 text-gray-900 flex items-center gap-2">
              <Activity className="w-6 h-6 text-green-600" />
              Outdoor Activity Recommendations
            </motion.h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activities.map((activity, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`p-4 rounded-xl border-2 ${
                    activity.recommendation === 'recommended' 
                      ? 'border-green-500 bg-green-50' 
                      : activity.recommendation === 'caution'
                      ? 'border-yellow-500 bg-yellow-50'
                      : 'border-red-500 bg-red-50'
                  } hover:shadow-md transition-shadow`}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-3xl">{activity.icon}</div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 mb-1">{activity.activity}</h4>
                      <div className={`text-xs font-semibold uppercase mb-2 ${
                        activity.recommendation === 'recommended' 
                          ? 'text-green-700' 
                          : activity.recommendation === 'caution'
                          ? 'text-yellow-700'
                          : 'text-red-700'
                      }`}>
                        {activity.recommendation === 'recommended' ? '✓ Recommended' : activity.recommendation === 'caution' ? '⚠ Caution' : '✗ Avoid'}
                      </div>
                      <p className="text-sm text-gray-700">{activity.reason}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* Health Recommendations */}
          <motion.section
            className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
            initial="hidden"
            animate="show"
            variants={container}
          >
            <motion.h3 className="text-xl font-semibold mb-6 text-gray-900 flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
              Health Recommendations
            </motion.h3>
            <AnimatePresence>
              <motion.div
                layout
                key={cityData.name}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {healthTipsForAqi(cityData.aqi).map((tip, idx) => (
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

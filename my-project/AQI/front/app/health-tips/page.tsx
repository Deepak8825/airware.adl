"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Heart, Info, Newspaper, Cloud, Activity, AlertTriangle, MapPin, Calendar, Sprout, Tractor, Leaf } from "lucide-react";

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

type CropAlert = {
  severity: string;
  crop: string;
  message: string;
  recommendation: string;
  safe_actions?: string[];
  optimal?: string;
};

type SeasonalSuggestion = {
  period: string;
  crops: string[];
  sowing: string;
  harvest: string;
  aqi_impact: string;
  tips: string[];
};

type GeneralRecommendation = {
  icon: string;
  title: string;
  activities: string[];
};

type PollutionManagement = {
  preventive_measures: string[];
  aqi_monitoring_tips: string[];
  crop_protection: string[];
};

type FarmingSuggestion = {
  location: string;
  current_aqi: number;
  season: string;
  pm25: number;
  pm10: number;
  crop_specific_alerts: CropAlert[] | null;
  general_recommendations: GeneralRecommendation[];
  seasonal_suggestions: SeasonalSuggestion[];
  pollution_management: PollutionManagement;
  message: string;
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
  const [farmingData, setFarmingData] = useState<FarmingSuggestion | null>(null);
  const [selectedCrop, setSelectedCrop] = useState<string>("rice");
  const [showFarmerSection, setShowFarmerSection] = useState(false);

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

  // Fetch farming suggestions
  useEffect(() => {
    const fetchFarmingSuggestions = async () => {
      try {
        const backendBase = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
        const response = await fetch(
          `${backendBase}/api/farming/suggestions?location=${encodeURIComponent(selectedLocation)}&crop=${selectedCrop}`
        );
        
        if (response.ok) {
          const data = await response.json();
          setFarmingData(data);
        }
      } catch (error) {
        console.warn("Failed to fetch farming suggestions:", error);
      }
    };

    if (!loading && showFarmerSection) {
      fetchFarmingSuggestions();
    }
  }, [selectedLocation, selectedCrop, loading, showFarmerSection]);

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
            <h1 className="text-4xl font-extrabold text-black">Health Tips & Live Updates</h1>
            <p className="text-black font-medium mt-1">Real-time air quality data, health recommendations, and daily news updates</p>
          </div>
        </div>
      </motion.header>

      {/* Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sidebar */}
        <motion.aside className="lg:col-span-1 bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <motion.div className="mb-6">
            <label className="text-sm font-semibold text-black mb-3 flex items-center gap-2">
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
                className="w-full p-3 rounded-xl border border-gray-300 bg-white text-black font-medium shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              >
                {availableLocations.map((loc) => (
                  <option key={loc} value={loc} className="text-black">
                    {loc}
                  </option>
                ))}
              </select>
            </div>
          </motion.div>

          <motion.div className="mt-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-black font-semibold">Current AQI</div>
                <div className="flex items-baseline gap-3">
                  <motion.h2 layout key={cityData.name} className="text-5xl font-extrabold text-black">
                    {cityData.aqi}
                  </motion.h2>
                  <div className="text-sm font-semibold text-black">{meta.label}</div>
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
              <div className="flex justify-between text-xs font-bold text-black mt-2">
                <span>0</span>
                <span>150</span>
                <span>300+</span>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={() => setExpanded((prev) => (prev === 0 ? null : 0))}
                className="w-full py-2.5 px-4 rounded-lg border bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 text-black font-medium transition shadow-sm"
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
            <motion.h3 className="text-xl font-semibold mb-6 text-black flex items-center gap-2">
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
                        <span className="text-xs font-semibold text-gray-800 uppercase">
                          {article.category.replace('-', ' ')}
                        </span>
                      </div>
                      <h4 className="font-bold text-black mb-2">{article.title}</h4>
                      <p className="text-sm text-black leading-relaxed">{article.description}</p>
                      <div className="flex items-center gap-4 mt-3 text-xs text-gray-800">
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
            <motion.h3 className="text-xl font-semibold mb-6 text-black flex items-center gap-2">
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
                      <h4 className="font-bold text-black mb-1">{activity.activity}</h4>
                      <div className={`text-xs font-semibold uppercase mb-2 ${
                        activity.recommendation === 'recommended' 
                          ? 'text-green-800' 
                          : activity.recommendation === 'caution'
                          ? 'text-yellow-800'
                          : 'text-red-800'
                      }`}>
                        {activity.recommendation === 'recommended' ? '✓ Recommended' : activity.recommendation === 'caution' ? '⚠ Caution' : '✗ Avoid'}
                      </div>
                      <p className="text-sm text-black">{activity.reason}</p>
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
            <motion.h3 className="text-xl font-semibold mb-6 text-black flex items-center gap-2">
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
                        <p className="text-black text-sm font-medium">{tip}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </motion.section>

          {/* Detailed Guidance */}
          <motion.section className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <h3 className="text-lg font-semibold mb-4 text-black">Detailed Guidance</h3>
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="border rounded-lg overflow-hidden shadow-sm">
                  <button
                    onClick={() => setExpanded((prev) => (prev === i + 1 ? null : i + 1))}
                    className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition"
                  >
                    <div>
                      <div className="font-semibold text-black">
                        {i === 0 ? "When to wear a mask" : i === 1 ? "Indoor air actions" : "Vulnerable groups"}
                      </div>
                      <div className="text-sm text-gray-800 font-medium">Tap to expand</div>
                    </div>
                    <div className="text-black text-xl font-bold">{expanded === i + 1 ? "−" : "+"}</div>
                  </button>
                  <AnimatePresence>
                    {expanded === i + 1 && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="px-4 pb-4"
                      >
                        <div className="text-sm text-black py-2 leading-relaxed">
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

          {/* 🌾 Farmer Supportive Enhancement Section */}
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mb-8"
          >
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 shadow-lg border border-green-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Tractor className="w-8 h-8 text-green-600" />
                  <div>
                    <h3 className="text-2xl font-bold text-black">
                      🌾 AirAware Farmer Support
                    </h3>
                    <p className="text-sm text-gray-800 font-medium">
                      Climate-smart assistant for rural farmers
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowFarmerSection(!showFarmerSection)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 shadow transition"
                >
                  {showFarmerSection ? 'Hide' : 'Show'} Farmer Tools
                </button>
              </div>

              {showFarmerSection && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-6"
                >
                  {/* Crop Selection */}
                  <div className="bg-white rounded-xl p-4 shadow">
                    <label className="block text-sm font-bold text-black mb-2">
                      Select Your Crop
                    </label>
                    <select
                      value={selectedCrop}
                      onChange={(e) => setSelectedCrop(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-black font-medium bg-white"
                    >
                      <option value="rice">🌾 Rice (Paddy)</option>
                      <option value="wheat">🌾 Wheat</option>
                      <option value="cotton">🌱 Cotton</option>
                      <option value="sugarcane">🎍 Sugarcane</option>
                      <option value="vegetables">🥬 Vegetables</option>
                      <option value="pulses">🫘 Pulses</option>
                    </select>
                  </div>

                  {farmingData && (
                    <>
                      {/* Crop-Specific Alerts */}
                      {farmingData.crop_specific_alerts && farmingData.crop_specific_alerts.length > 0 && (
                        <div className="bg-white rounded-xl p-6 shadow-md">
                          <div className="flex items-center gap-2 mb-4">
                            <Leaf className="w-6 h-6 text-orange-600" />
                            <h4 className="text-lg font-bold text-black">
                              Crop-Specific AQI Alerts
                            </h4>
                          </div>
                          {farmingData.crop_specific_alerts.map((alert, idx) => (
                            <div
                              key={idx}
                              className={`p-4 rounded-lg mb-3 ${
                                alert.severity === 'warning'
                                  ? 'bg-orange-50 border-l-4 border-orange-500'
                                  : 'bg-green-50 border-l-4 border-green-500'
                              }`}
                            >
                              <p className="font-semibold text-lg mb-2 text-black">
                                {alert.message}
                              </p>
                              <p className="text-sm text-black mb-2">
                                <strong className="text-black">Recommendation:</strong> {alert.recommendation}
                              </p>
                              {alert.safe_actions && (
                                <div className="mt-2">
                                  <strong className="text-sm text-black">Safe Activities:</strong>
                                  <ul className="list-disc list-inside text-sm text-black mt-1">
                                    {alert.safe_actions.map((action, i) => (
                                      <li key={i}>{action}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              {alert.optimal && (
                                <p className="text-xs text-gray-800 mt-2">
                                  <strong className="text-black">Optimal:</strong> {alert.optimal}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* AI-Based General Recommendations */}
                      {farmingData.general_recommendations && farmingData.general_recommendations.length > 0 && (
                        <div className="bg-white rounded-xl p-6 shadow-md">
                          <div className="flex items-center gap-2 mb-4">
                            <Sprout className="w-6 h-6 text-green-600" />
                            <h4 className="text-lg font-bold text-black">
                              🧠 AI-Based Farming Suggestions
                            </h4>
                          </div>
                          {farmingData.general_recommendations.map((rec, idx) => (
                            <div key={idx} className="mb-4">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-2xl">{rec.icon}</span>
                                <h5 className="font-semibold text-black">{rec.title}</h5>
                              </div>
                              <ul className="list-disc list-inside text-sm text-black space-y-1 ml-8">
                                {rec.activities.map((activity: string, i: number) => (
                                  <li key={i}>{activity}</li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Seasonal Suggestions */}
                      {farmingData.seasonal_suggestions && farmingData.seasonal_suggestions.length > 0 && (
                        <div className="bg-white rounded-xl p-6 shadow-md">
                          <div className="flex items-center gap-2 mb-4">
                            <Calendar className="w-6 h-6 text-blue-600" />
                            <h4 className="text-lg font-bold text-black">
                              Seasonal Guidance - {farmingData.season}
                            </h4>
                          </div>
                          {farmingData.seasonal_suggestions.map((season, idx) => (
                            <div key={idx} className="space-y-3">
                              <div className="bg-blue-50 p-4 rounded-lg">
                                <h5 className="font-semibold text-black mb-2">
                                  {season.period}
                                </h5>
                                <p className="text-sm text-black mb-2">
                                  <strong className="text-black">Recommended Crops:</strong> {season.crops.join(', ')}
                                </p>
                                <p className="text-sm text-black mb-2">
                                  <strong className="text-black">Sowing Period:</strong> {season.sowing}
                                </p>
                                <p className="text-sm text-black mb-2">
                                  <strong className="text-black">Harvest Period:</strong> {season.harvest}
                                </p>
                                <p className="text-sm text-orange-800 mb-2 font-semibold">
                                  <strong className="text-black">⚠️ AQI Impact:</strong> {season.aqi_impact}
                                </p>
                                <div className="mt-3">
                                  <strong className="text-sm text-black">💡 Tips:</strong>
                                  <ul className="list-disc list-inside text-sm text-black mt-1">
                                    {season.tips.map((tip: string, i: number) => (
                                      <li key={i}>{tip}</li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Pollution Management Best Practices */}
                      {farmingData.pollution_management && (
                        <div className="bg-white rounded-xl p-6 shadow-md">
                          <div className="flex items-center gap-2 mb-4">
                            <AlertTriangle className="w-6 h-6 text-red-600" />
                            <h4 className="text-lg font-bold text-black">
                              Pollution Management Best Practices
                            </h4>
                          </div>
                          <div className="space-y-4">
                            <div>
                              <h5 className="font-semibold text-black mb-2">
                                🛡️ Preventive Measures
                              </h5>
                              <ul className="list-disc list-inside text-sm text-black space-y-1">
                                {farmingData.pollution_management.preventive_measures.map((measure: string, i: number) => (
                                  <li key={i}>{measure}</li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <h5 className="font-semibold text-black mb-2">
                                📊 AQI Monitoring Tips
                              </h5>
                              <ul className="list-disc list-inside text-sm text-black space-y-1">
                                {farmingData.pollution_management.aqi_monitoring_tips.map((tip: string, i: number) => (
                                  <li key={i}>{tip}</li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <h5 className="font-semibold text-black mb-2">
                                🌱 Crop Protection
                              </h5>
                              <ul className="list-disc list-inside text-sm text-black space-y-1">
                                {farmingData.pollution_management.crop_protection.map((tip: string, i: number) => (
                                  <li key={i}>{tip}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Current Conditions Summary */}
                      <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-4 shadow">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">
                              {farmingData.current_aqi}
                            </div>
                            <div className="text-xs text-black font-semibold">Current AQI</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">
                              {farmingData.season}
                            </div>
                            <div className="text-xs text-black font-semibold">Season</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-orange-600">
                              {farmingData.pm25 || 'N/A'}
                            </div>
                            <div className="text-xs text-black font-semibold">PM2.5 µg/m³</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600">
                              {farmingData.pm10 || 'N/A'}
                            </div>
                            <div className="text-xs text-black font-semibold">PM10 µg/m³</div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </motion.div>
              )}
            </div>
          </motion.section>

          {/* Help Section */}
          <motion.section className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-6 shadow-lg flex items-center justify-between border border-blue-100">
            <div>
              <h4 className="font-bold text-black">Need more help?</h4>
              <p className="text-sm text-black font-medium mt-1">Contact local health services or consult your physician for personalized advice.</p>
            </div>
            <div className="flex gap-3">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 shadow transition">
                Find clinics
              </button>
              <button className="px-4 py-2 bg-gray-100 text-black rounded-lg font-medium hover:bg-gray-200 shadow-sm transition">
                Save report
              </button>
            </div>
          </motion.section>
        </motion.main>
      </div>
    </div>
  );
}

"use client";
import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sun, Cloud, CloudRain, CloudDrizzle, Wind } from "lucide-react";
import Link from "next/link";
import dynamic from 'next/dynamic';
import { useLanguage } from "@/contexts/LanguageContext";

import LocationWidget from "@/components/LocationWidget";
import { LocationData } from "@/lib/useGeolocation";
const IndiaMap = dynamic(() => import('@/components/ui/map'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-96">
      <div className="w-12 h-12 border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div>
    </div>
  )
});

// AQI data types
interface AqiData {
  location: string;
  aqi: number;
  pm25: number;
  pm10: number;
  o3: number;
  no2: number;
  so2: number;
  co: number;
  lastUpdated: string;
}

interface Forecast {
  day: string;
  temp: number;
  condition: string;
  aqi: number;
}

const Home = () => {
  const { t } = useLanguage();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [aqiData, setAqiData] = useState<AqiData | null>(null);
  const [forecast, setForecast] = useState<Forecast[]>([]);
  const [location, setLocation] = useState("New York");
  const [userLocation, setUserLocation] = useState<LocationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Handle location updates from LocationWidget
  const handleLocationUpdate = (locationData: LocationData) => {
    setUserLocation(locationData);
    setLocation(locationData.city || `${locationData.city}, ${locationData.country}`);
    // Immediately trigger AQI fetch with new location
    fetchAqiData(locationData);
  };

  // Check authentication and redirect to login if not authenticated
  useEffect(() => {
    const token = localStorage.getItem("airware_token");
    if (!token) {
      setAuthChecking(false);
      router.replace("/login");
    } else {
      setIsAuthenticated(true);
      setAuthChecking(false);
    }
  }, [router]);

  // Fetch AQI data function (extracted for reuse)
  const fetchAqiData = async (locData?: LocationData) => {
    try {
      const backendBase = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
      const locationToUse = locData || userLocation;
      let apiUrl = `${backendBase}/api/aqi?location=` + encodeURIComponent(location);

      // If we have user coordinates, use them for more accurate data
      if (locationToUse) {
        apiUrl = `${backendBase}/api/aqi?lat=${locationToUse.latitude}&lng=${locationToUse.longitude}`;
      }

      const res = await fetch(apiUrl);
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      setAqiData({
        location: data.location, // Always use the location from API (nearest WAQI station)
        aqi: data.aqi,
        pm25: data.pm25,
        pm10: data.pm10,
        o3: data.o3,
        no2: data.no2,
        so2: data.so2,
        co: data.co,
        lastUpdated: data.lastUpdated || new Date().toLocaleTimeString(),
      });
      setForecast(data.forecast || []);
    } catch (err) {
      // fallback to mock data if API fails
      const mockAqiData: AqiData = {
        location: userLocation ? `${userLocation.city}, ${userLocation.country}` : "New York",
        aqi: 42,
        pm25: 12.3,
        pm10: 23.1,
        o3: 32,
        no2: 18,
        so2: 4,
        co: 0.7,
        lastUpdated: new Date().toLocaleTimeString(),
      };
      const mockForecast: Forecast[] = [
        { day: "Today", temp: 72, condition: "sunny", aqi: 42 },
        { day: "Tue", temp: 68, condition: "partly-cloudy", aqi: 55 },
        { day: "Wed", temp: 70, condition: "rain", aqi: 38 },
        { day: "Thu", temp: 75, condition: "cloudy", aqi: 62 },
        { day: "Fri", temp: 78, condition: "sunny", aqi: 45 },
      ];
      setAqiData(mockAqiData);
      setForecast(mockForecast);
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger API fetch when location changes
  useEffect(() => {
    if (isAuthenticated) {
      fetchAqiData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location, userLocation, isAuthenticated]);


  // Get AQI category and color
  const getAqiCategory = (aqi: number) => {
    if (aqi <= 50) return { label: t.aqi.good, color: "bg-green-500" };
    if (aqi <= 100) return { label: t.aqi.moderate, color: "bg-yellow-500" };
    if (aqi <= 150) return { label: t.aqi.unhealthyForSensitive, color: "bg-orange-500" };
    if (aqi <= 200) return { label: t.aqi.unhealthy, color: "bg-red-500" };
    if (aqi <= 300) return { label: t.aqi.veryUnhealthy, color: "bg-purple-500" };
    return { label: t.aqi.hazardous, color: "bg-maroon-500" };
  };

  // Get weather icon
  const getWeatherIcon = (condition: string) => {
    switch (condition) {
      case "sunny":
        return <Sun className="w-8 h-8 text-yellow-500" />;
      case "partly-cloudy":
        return <Cloud className="w-8 h-8 text-gray-400" />;
      case "cloudy":
        return <CloudDrizzle className="w-8 h-8 text-gray-500" />;
      case "rain":
        return <CloudRain className="w-8 h-8 text-blue-500" />;
      default:
        return <Wind className="w-8 h-8 text-gray-400" />;
    }
  };

  // Get health recommendation based on AQI
  const getHealthRecommendation = (aqi: number) => {
    if (aqi <= 50) return t.aqi.categories.good;
    if (aqi <= 100) return t.aqi.categories.moderate;
    if (aqi <= 150) return t.aqi.categories.unhealthyForSensitive;
    if (aqi <= 200) return t.aqi.categories.unhealthy;
    if (aqi <= 300) return t.aqi.categories.veryUnhealthy;
    return t.aqi.categories.hazardous;
  };

  if (authChecking || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="w-16 h-16 border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div>
          <p className="mt-4 text-lg text-gray-700">{t.common.loading}</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  if (!aqiData) return <div>{t.common.error}</div>;

  const aqiCategory = getAqiCategory(aqiData.aqi);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="bg-blue-500 w-10 h-10 rounded-full flex items-center justify-center">
              <Wind className="text-white" />
            </div>
            <Link href="/" className="text-2xl font-bold text-gray-800 hover:text-blue-600">{t.home.title}</Link>
          </div>
          <nav className="flex space-x-6">
            <Link href="/" className="text-gray-600 hover:text-blue-600 font-medium">{t.nav.home}</Link>
            <Link href="/forecast" className="text-gray-600 hover:text-blue-600 font-medium">{t.nav.forecast}</Link>
            <Link href="/health-tips" className="text-gray-600 hover:text-blue-600 font-medium">{t.nav.healthTips}</Link>
            <Link href="/settings" className="text-gray-600 hover:text-blue-600 font-medium">{t.nav.settings}</Link>
            {/* auth removed */}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-12 text-center relative overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7 }}
          className="relative z-10"
        >
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-4xl md:text-5xl font-extrabold mb-4 text-blue-700 drop-shadow-lg"
          >
            {t.home.title}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.7 }}
            className="text-lg md:text-xl text-gray-700 mb-8"
          >
            {t.home.subtitle}
          </motion.p>
          <div className="flex flex-col md:flex-row justify-center gap-6 mb-8">
            <Link href="/" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg shadow-lg transition-transform transform hover:-translate-y-1 hover:scale-105 focus:ring-4 focus:ring-blue-300">{t.nav.goToDashboard}</Link>
            <Link href="/forecast" className="bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-3 px-8 rounded-lg shadow-lg transition-transform transform hover:-translate-y-1 hover:scale-105 focus:ring-4 focus:ring-cyan-300">{t.nav.viewForecast}</Link>
            <Link href="/health-tips" className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-8 rounded-lg shadow-lg transition-transform transform hover:-translate-y-1 hover:scale-105 focus:ring-4 focus:ring-green-300">{t.nav.healthTips}</Link>
            <Link href="/settings" className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-8 rounded-lg shadow-lg transition-transform transform hover:-translate-y-1 hover:scale-105 focus:ring-4 focus:ring-gray-300">{t.nav.settings}</Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
            <motion.div whileHover={{ scale: 1.05 }} className="bg-white/90 rounded-xl shadow-xl p-6 border-t-4 border-blue-500 transition-all">
              <h3 className="text-xl font-bold mb-2 text-blue-700 flex items-center justify-center gap-2"><Wind className="inline w-6 h-6 text-blue-400" /> {t.home.liveAirQuality}</h3>
              <p className="text-gray-700">{t.home.liveAirQualityDesc}</p>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} className="bg-white/90 rounded-xl shadow-xl p-6 border-t-4 border-cyan-500 transition-all">
              <h3 className="text-xl font-bold mb-2 text-cyan-700 flex items-center justify-center gap-2"><Cloud className="inline w-6 h-6 text-cyan-400" /> {t.home.forecasting}</h3>
              <p className="text-gray-700">{t.home.forecastingDesc}</p>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} className="bg-white/90 rounded-xl shadow-xl p-6 border-t-4 border-green-500 transition-all">
              <h3 className="text-xl font-bold mb-2 text-green-700 flex items-center justify-center gap-2"><Sun className="inline w-6 h-6 text-green-400" /> {t.home.healthTips}</h3>
              <p className="text-gray-700">{t.home.healthTipsDesc}</p>
            </motion.div>
          </div>
          {/* Animated stats */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.7 }} className="bg-gradient-to-r from-blue-100 to-blue-200 rounded-xl p-6 shadow flex flex-col items-center">
              <span className="text-3xl font-bold text-blue-700 mb-2">100+</span>
              <span className="text-gray-700">{t.home.citiesMonitored}</span>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.7 }} className="bg-gradient-to-r from-cyan-100 to-cyan-200 rounded-xl p-6 shadow flex flex-col items-center">
              <span className="text-3xl font-bold text-cyan-700 mb-2">24/7</span>
              <span className="text-gray-700">{t.home.liveDataUpdates}</span>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.7 }} className="bg-gradient-to-r from-green-100 to-green-200 rounded-xl p-6 shadow flex flex-col items-center">
              <span className="text-3xl font-bold text-green-700 mb-2">99.9%</span>
              <span className="text-gray-700">{t.home.uptimeGuarantee}</span>
            </motion.div>
          </div>
        </motion.div>
        {/* Animated background shapes */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.15 }}
          transition={{ duration: 1 }}
          className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-blue-200 rounded-full blur-3xl z-0"
        />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.12 }}
          transition={{ duration: 1 }}
          className="absolute -bottom-32 -right-32 w-[500px] h-[500px] bg-cyan-200 rounded-full blur-3xl z-0"
        />
      </section>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Location Access Widget */}
        <div className="mb-8">
          <LocationWidget 
            onLocationUpdate={handleLocationUpdate}
            showFullCard={true}
            className="w-full"
          />
        </div>

        {/* Location Search */}
        <div className="mb-8 flex">
          <Input 
            type="text" 
            placeholder={t.home.searchLocation} 
            value={location}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLocation(e.target.value)}
            className="flex-grow mr-4 py-6 text-lg"
          />
          <Button className="py-6 px-8 text-lg" onClick={() => setLocation(location)}>
            Search
          </Button>
        </div>

        {/* Current AQI */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <Card className="bg-white/90 backdrop-blur-md">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-2xl">{t.home.currentAQI}</CardTitle>
                <span className="text-gray-500">{t.home.lastUpdated}: {aqiData.lastUpdated}</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-4xl font-bold mb-2">{aqiData.location}</h2>
                  <div className="flex items-center">
                    <div className={`w-6 h-6 rounded-full ${aqiCategory.color} mr-2`}></div>
                    <span className="text-xl font-semibold">{aqiCategory.label}</span>
                  </div>
                </div>
                <motion.div 
                  className="text-6xl font-bold"
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 15 }}
                >
                  {aqiData.aqi}
                </motion.div>
              </div>

              <div className="mt-6">
                <div className="bg-gray-200 h-4 rounded-full overflow-hidden">
                  <motion.div 
                    className={`h-full ${aqiCategory.color}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${(aqiData.aqi / 300) * 100}%` }}
                    transition={{ duration: 1 }}
                  ></motion.div>
                </div>
                <div className="flex justify-between mt-2 text-sm text-gray-600">
                  <span>0</span>
                  <span>50</span>
                  <span>100</span>
                  <span>150</span>
                  <span>200</span>
                  <span>300+</span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-gray-600">PM2.5</p>
                  <p className="text-xl font-bold">{aqiData.pm25} μg/m³</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-gray-600">PM10</p>
                  <p className="text-xl font-bold">{aqiData.pm10} μg/m³</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-gray-600">O₃</p>
                  <p className="text-xl font-bold">{aqiData.o3} ppb</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-gray-600">NO₂</p>
                  <p className="text-xl font-bold">{aqiData.no2} ppb</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Health Recommendation */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mb-8"
        >
          <Card className="bg-white/90 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-xl">{t.home.healthRecommendations}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg">{getHealthRecommendation(aqiData.aqi)}</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* India Air Quality Map */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          className="mb-8"
        >
          <Card className="bg-white/90 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-xl">{t.home.indiaAirQualityMap}</CardTitle>
            </CardHeader>
            <CardContent>
              <IndiaMap />
            </CardContent>
          </Card>
        </motion.div>

        {/* Forecast */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <Card className="bg-white/90 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-xl">{t.home.forecast5Day}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {forecast.map((day, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className="bg-blue-50 p-4 rounded-lg text-center"
                  >
                    <h3 className="font-bold mb-2">{day.day}</h3>
                    <div className="flex justify-center mb-2">
                      {getWeatherIcon(day.condition)}
                    </div>
                    <p className="text-xl font-bold">{day.temp}°F</p>
                    <div className="mt-2 flex items-center justify-center">
                      <div className={`w-3 h-3 rounded-full ${getAqiCategory(day.aqi).color} mr-2`}></div>
                      <span className="text-sm">{day.aqi}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="bg-white/80 backdrop-blur-sm py-6 mt-8">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>Data provided by OpenAQ and OpenWeatherMap APIs</p>
          <p className="mt-2">© {new Date().getFullYear()} AirAware. All rights reserved.</p>
        </div>
      </footer>
      
    </div>
  );
};

export default Home;

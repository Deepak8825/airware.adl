"use client";
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Sun, Cloud, CloudRain, CloudDrizzle, Wind, ArrowUpRight, ArrowDownRight, CloudFog } from 'lucide-react';

// Types for our data
type ForecastDay = {
  day: string;
  fullDate: string;
  temp: { min: number; max: number };
  weather: string;
  humidity: number;
  aqi: number;
  windSpeed: number;
};

type City = {
  name: string;
  state?: string;
  lat: number;
  lng: number;
};

// Demo cities
const CITIES: City[] = [
  { name: 'Chennai', state: 'Tamil Nadu', lat: 13.0827, lng: 80.2707 },
  { name: 'Delhi', state: 'Delhi', lat: 28.6139, lng: 77.2090 },
  { name: 'Mumbai', state: 'Maharashtra', lat: 19.0760, lng: 72.8777 },
  { name: 'Bangalore', state: 'Karnataka', lat: 12.9716, lng: 77.5946 },
  { name: 'Kolkata', state: 'West Bengal', lat: 22.5726, lng: 88.3639 },
  { name: 'Coimbatore', state: 'Tamil Nadu', lat: 11.0168, lng: 76.9558 },
  { name: 'Madurai', state: 'Tamil Nadu', lat: 9.9252, lng: 78.1198 },
  { name: 'Tiruchirappalli', state: 'Tamil Nadu', lat: 10.7905, lng: 78.7047 },
  { name: 'Salem', state: 'Tamil Nadu', lat: 11.6643, lng: 78.1460 },
  { name: 'Erode', state: 'Tamil Nadu', lat: 11.3410, lng: 77.7172 }
];

// Helper functions
function getWeatherIcon(condition: string, className: string = 'w-6 h-6') {
  switch(condition.toLowerCase()) {
    case 'sunny':
      return <Sun className={className} />;
    case 'cloudy':
      return <Cloud className={className} />;
    case 'rain':
      return <CloudRain className={className} />;
    case 'drizzle':
      return <CloudDrizzle className={className} />;
    case 'fog':
      return <CloudFog className={className} />;
    default:
      return <Wind className={className} />;
  }
}

function getAqiColor(aqi: number) {
  if (aqi <= 50) return { color: '#16a34a', label: 'Good' };
  if (aqi <= 100) return { color: '#eab308', label: 'Moderate' };
  if (aqi <= 150) return { color: '#f97316', label: 'Unhealthy for SG' };
  if (aqi <= 200) return { color: '#ef4444', label: 'Unhealthy' };
  if (aqi <= 300) return { color: '#7c3aed', label: 'Very Unhealthy' };
  return { color: '#7f1d1d', label: 'Hazardous' };
}

// Generate mock forecast data for a location
function generateMockForecast(city: City): ForecastDay[] {
  const today = new Date();
  const weatherTypes = ['sunny', 'cloudy', 'rain', 'drizzle', 'fog'];
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const baseTemp = 20 + Math.floor(Math.random() * 15); // Base temperature
  const baseAqi = 40 + Math.floor(Math.random() * 120); // Base AQI
  
  // Seed some randomness based on city name
  const cityNameSum = city.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const seededRandom = (seed: number) => (cityNameSum * seed) % 100 / 100;
  
  return Array.from({ length: 5 }).map((_, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    
    // Create some weather patterns - hotter with higher AQI
    const dailyTemp = baseTemp + (Math.floor(seededRandom(i + 3) * 10) - 5);
    const dailyAqi = Math.min(350, Math.max(20, baseAqi + (Math.floor(seededRandom(i + 7) * 60) - 30)));
    const weatherIndex = Math.floor(seededRandom(i + 5) * weatherTypes.length);
    
    return {
      day: i === 0 ? 'Today' : days[date.getDay()],
      fullDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      temp: { 
        min: dailyTemp - 3 - Math.floor(seededRandom(i + 11) * 5),
        max: dailyTemp + 3 + Math.floor(seededRandom(i + 13) * 5)
      },
      weather: weatherTypes[weatherIndex],
      humidity: 40 + Math.floor(seededRandom(i + 17) * 40),
      aqi: dailyAqi,
      windSpeed: 2 + Math.floor(seededRandom(i + 19) * 20)
    };
  });
}

export default function ForecastPage() {
  const [selectedCity, setSelectedCity] = useState<City>(CITIES[0]);
  const [searchText, setSearchText] = useState('');
  const [forecast, setForecast] = useState<ForecastDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDay, setActiveDay] = useState(0);
  
  // Load mock forecast when city changes
  useEffect(() => {
    setLoading(true);
    
    // Simulate API delay
    const timer = setTimeout(() => {
      setForecast(generateMockForecast(selectedCity));
      setLoading(false);
    }, 600);
    
    return () => clearTimeout(timer);
  }, [selectedCity]);
  
  // City selection and search
  const handleCitySelect = (city: City) => {
    setSelectedCity(city);
    setSearchText('');
  };
  
  const filteredCities = searchText.trim() === '' 
    ? [] 
    : CITIES.filter(city => 
        city.name.toLowerCase().includes(searchText.toLowerCase()) ||
        (city.state && city.state.toLowerCase().includes(searchText.toLowerCase()))
      );
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-10">
        <motion.header 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex flex-col md:flex-row justify-between items-start gap-6"
        >
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">Weather & AQI Forecast</h1>
            <p className="text-gray-700">5-day forecast for {selectedCity.name}, {selectedCity.state || 'India'}</p>
          </div>
          
          <div className="relative w-full md:w-64">
            <Input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search city..."
              className="w-full"
            />
            {filteredCities.length > 0 && (
              <AnimatePresence>
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full left-0 right-0 mt-1 bg-white rounded-md shadow-lg border z-20"
                >
                  <ul className="py-1 max-h-60 overflow-auto">
                    {filteredCities.map((city) => (
                      <li key={city.name}>
                        <button 
                          onClick={() => handleCitySelect(city)}
                          className="w-full px-4 py-2 text-left hover:bg-sky-50 flex justify-between items-center"
                        >
                          <span>{city.name}</span>
                          {city.state && <span className="text-gray-500 text-sm">{city.state}</span>}
                        </button>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </motion.header>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-600">Loading forecast for {selectedCity.name}...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Current day highlight */}
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-2">
                  <div className="p-6 md:p-8">
                    <div className="flex items-start justify-between">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-800">{forecast[activeDay].day}</h2>
                        <p className="text-gray-500">{forecast[activeDay].fullDate}</p>
                      </div>
                      <div className="bg-sky-500 text-white rounded-lg p-3">
                        {getWeatherIcon(forecast[activeDay].weather, 'w-8 h-8')}
                      </div>
                    </div>
                    
                    <div className="mt-6">
                      <div className="flex items-end gap-2">
                        <span className="text-5xl font-bold text-gray-900">{forecast[activeDay].temp.max}°</span>
                        <span className="text-xl text-gray-500 mb-1">/ {forecast[activeDay].temp.min}°</span>
                      </div>
                      <p className="text-gray-700 capitalize mt-1">{forecast[activeDay].weather}</p>
                    </div>
                    
                    <div className="mt-8 grid grid-cols-3 gap-4">
                      <div className="border rounded-lg p-3 text-center">
                        <p className="text-sm text-gray-500">Humidity</p>
                        <p className="text-xl font-medium">{forecast[activeDay].humidity}%</p>
                      </div>
                      <div className="border rounded-lg p-3 text-center">
                        <p className="text-sm text-gray-500">Wind</p>
                        <p className="text-xl font-medium">{forecast[activeDay].windSpeed} km/h</p>
                      </div>
                      <div className="border rounded-lg p-3 text-center">
                        <p className="text-sm text-gray-500">AQI</p>
                        <p className="text-xl font-medium">{forecast[activeDay].aqi}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-sky-400 to-blue-500 text-white p-6 md:p-8 flex flex-col">
                    <h3 className="font-semibold text-lg">Air Quality</h3>
                    <div className="mt-2 flex items-baseline gap-3">
                      <span className="text-4xl font-bold">{forecast[activeDay].aqi}</span>
                      <span className="text-lg">{getAqiColor(forecast[activeDay].aqi).label}</span>
                    </div>
                    
                    <div className="mt-4 flex-grow flex flex-col justify-between">
                      <div>
                        <div className="mt-4 h-2 bg-white/30 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-white" 
                            style={{ width: `${Math.min(100, (forecast[activeDay].aqi / 300) * 100)}%` }} 
                          />
                        </div>
                        <div className="flex justify-between text-xs mt-1">
                          <span>Good</span>
                          <span>Hazardous</span>
                        </div>
                      </div>
                      
                      <div className="mt-auto">
                        {forecast[activeDay].aqi > 100 ? (
                          <div className="bg-white/20 rounded-lg p-3 mt-4">
                            <p className="font-medium">Health Advisory</p>
                            <p className="text-sm mt-1">
                              Consider limiting outdoor activities and wearing a mask if you have respiratory issues.
                            </p>
                          </div>
                        ) : (
                          <div className="bg-white/20 rounded-lg p-3 mt-4">
                            <p className="font-medium">Health Advisory</p>
                            <p className="text-sm mt-1">
                              Air quality is acceptable. Enjoy your outdoor activities!
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.section>
            
            {/* 5-day overview */}
            <section>
              <h3 className="text-xl font-bold text-gray-900 mb-4">5-Day Forecast</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                {forecast.map((day, idx) => (
                  <motion.div
                    key={day.day}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: idx * 0.1 }}
                    onClick={() => setActiveDay(idx)}
                    className={`
                      cursor-pointer rounded-xl p-4 
                      ${activeDay === idx 
                        ? 'bg-blue-50 border-blue-200 border-2'
                        : 'bg-white border hover:border-blue-200 border-gray-200'
                      }
                    `}
                  >
                    <div className="text-center">
                      <p className={`font-medium ${activeDay === idx ? 'text-blue-600' : 'text-gray-900'}`}>
                        {day.day}
                      </p>
                      <p className="text-xs text-gray-500">{day.fullDate}</p>
                      
                      <div className={`my-3 flex justify-center ${activeDay === idx ? 'text-blue-500' : 'text-gray-600'}`}>
                        {getWeatherIcon(day.weather, 'w-8 h-8')}
                      </div>
                      
                      <div className="flex justify-center items-baseline gap-2">
                        <span className="text-lg font-semibold">{day.temp.max}°</span>
                        <span className="text-sm text-gray-500">{day.temp.min}°</span>
                      </div>
                      
                      <div className="mt-3 flex justify-center items-center gap-1">
                        <span className="text-xs px-2 py-1 rounded-full" 
                          style={{ 
                            background: getAqiColor(day.aqi).color,
                            color: day.aqi > 150 ? '#fff' : '#000',
                            opacity: 0.8
                          }}>
                          AQI {day.aqi}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
            
            {/* AQI Trend */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="bg-white rounded-xl p-6 shadow-lg"
            >
              <h3 className="text-xl font-bold text-gray-900 mb-4">AQI Trend</h3>
              <div className="h-48 relative mt-4">
                {/* Simple bar chart */}
                <div className="absolute inset-0 flex items-end justify-between">
                  {forecast.map((day, idx) => {
                    const height = Math.max(15, Math.min(100, (day.aqi / 300) * 100));
                    const color = getAqiColor(day.aqi).color;
                    
                    return (
                      <div key={idx} className="w-1/6 flex flex-col items-center">
                        <motion.div 
                          initial={{ height: 0 }}
                          animate={{ height: `${height}%` }}
                          transition={{ duration: 1, delay: idx * 0.1 }}
                          style={{ background: color }}
                          className="w-12 rounded-t-md"
                        />
                        <p className="text-sm text-gray-500 mt-2">{day.day.slice(0,3)}</p>
                      </div>
                    );
                  })}
                </div>
                
                {/* Chart grid lines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                  <div className="border-b border-gray-200 relative h-0">
                    <span className="absolute -top-2 -left-8 text-xs text-gray-400">300</span>
                  </div>
                  <div className="border-b border-gray-200 relative h-0">
                    <span className="absolute -top-2 -left-8 text-xs text-gray-400">200</span>
                  </div>
                  <div className="border-b border-gray-200 relative h-0">
                    <span className="absolute -top-2 -left-8 text-xs text-gray-400">100</span>
                  </div>
                  <div className="border-b border-gray-200 relative h-0">
                    <span className="absolute -top-2 -left-8 text-xs text-gray-400">0</span>
                  </div>
                </div>
              </div>
              
              {/* Legend */}
              <div className="flex justify-center flex-wrap gap-4 mt-6">
                <div className="flex items-center gap-1">
                  <span className="w-4 h-4 rounded-full" style={{ background: '#16a34a' }}></span>
                  <span className="text-sm">Good</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-4 h-4 rounded-full" style={{ background: '#eab308' }}></span>
                  <span className="text-sm">Moderate</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-4 h-4 rounded-full" style={{ background: '#f97316' }}></span>
                  <span className="text-sm">Unhealthy for SG</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-4 h-4 rounded-full" style={{ background: '#ef4444' }}></span>
                  <span className="text-sm">Unhealthy</span>
                </div>
              </div>
            </motion.section>
            
            {/* Tips */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.7 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <div className="bg-gradient-to-br from-emerald-400 to-cyan-500 text-white rounded-xl p-6 shadow-lg">
                <div className="flex justify-between items-start">
                  <h3 className="text-xl font-bold">Eco-friendly tip</h3>
                  <ArrowUpRight className="w-5 h-5" />
                </div>
                <p className="mt-4">
                  Consider using public transportation on days with high AQI to help reduce emissions 
                  and improve air quality for everyone in {selectedCity.name}.
                </p>
              </div>
              
              <div className="bg-gradient-to-br from-amber-400 to-orange-500 text-white rounded-xl p-6 shadow-lg">
                <div className="flex justify-between items-start">
                  <h3 className="text-xl font-bold">Health tip</h3>
                  <ArrowDownRight className="w-5 h-5" />
                </div>
                <p className="mt-4">
                  Stay hydrated during hotter days and consider exercising indoors when 
                  the AQI exceeds 100 for better respiratory health.
                </p>
              </div>
            </motion.section>
          </div>
        )}
      </div>
    </div>
  );
}

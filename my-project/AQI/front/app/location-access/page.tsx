"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import LocationWidget from "@/components/LocationWidget";
import { LocationData } from "@/lib/useGeolocation";
import Link from "next/link";
import { ArrowLeft, Home } from "lucide-react";

export default function LocationAccess() {
  const router = useRouter();

  const handleLocationUpdate = (locationData: LocationData) => {
    // Store location and redirect to dashboard
    localStorage.setItem('userLocation', JSON.stringify(locationData));
    
    // Redirect to dashboard after a short delay to show success
    setTimeout(() => {
      router.push('/');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link 
            href="/" 
            className="flex items-center gap-2 text-gray-600 hover:text-blue-600 font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <Link 
            href="/"
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium transition-colors"
          >
            <Home className="w-4 h-4" />
            Home
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mx-auto"
        >
          <div className="text-center mb-8">
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-4xl font-bold text-blue-700 mb-4"
            >
              Enable Location Access
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-lg text-gray-600 leading-relaxed"
            >
              Get the most accurate air quality data for your exact location. 
              Your location information is used only to provide relevant environmental data 
              and is never shared with third parties.
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <LocationWidget 
              onLocationUpdate={handleLocationUpdate}
              showFullCard={true}
              className="w-full"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="mt-8 p-6 bg-blue-50 rounded-xl border border-blue-100"
          >
            <h3 className="font-semibold text-blue-800 mb-3">Why we need your location:</h3>
            <ul className="space-y-2 text-sm text-blue-700">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                <span>Provide hyper-local air quality readings for your exact area</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                <span>Show nearby monitoring stations and their readings</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                <span>Deliver personalized health recommendations based on your location</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                <span>Send location-specific air quality alerts and warnings</span>
              </li>
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="mt-6 text-center"
          >
            <p className="text-xs text-gray-500">
              Your location data is stored locally on your device and is only used to fetch air quality information. 
              You can clear this data at any time from your browser settings.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

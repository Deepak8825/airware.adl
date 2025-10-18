"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  MapPin, 
  Navigation, 
  RefreshCw, 
  X, 
  CheckCircle, 
  AlertCircle,
  Clock,
  Globe
} from 'lucide-react';
import { useGeolocation, type LocationData } from '@/lib/useGeolocation';

interface LocationWidgetProps {
  onLocationUpdate?: (location: LocationData) => void;
  showFullCard?: boolean;
  className?: string;
}

export default function LocationWidget({ 
  onLocationUpdate, 
  showFullCard = true, 
  className = "" 
}: LocationWidgetProps) {
  const { 
    data: location, 
    isLoading, 
    error, 
    hasPermission, 
    isSupported, 
    requestLocation, 
    clearLocation 
  } = useGeolocation();

  const [showPermissionModal, setShowPermissionModal] = useState(false);
  // Track whether component has mounted on client to avoid SSR/CSR markup mismatch
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (location && onLocationUpdate) {
      onLocationUpdate(location);
    }
  }, [location, onLocationUpdate]);

  const handleLocationRequest = async () => {
    if (!hasPermission && !location) {
      setShowPermissionModal(true);
    } else {
      await requestLocation();
    }
  };

  const handlePermissionGrant = async () => {
    setShowPermissionModal(false);
    await requestLocation();
  };

  const formatAccuracy = (accuracy?: number) => {
    if (!accuracy) return 'Unknown';
    if (accuracy < 100) return `±${Math.round(accuracy)}m (High)`;
    if (accuracy < 1000) return `±${Math.round(accuracy)}m (Medium)`;
    return `±${Math.round(accuracy / 1000)}km (Low)`;
  };

  const formatTimestamp = (timestamp?: number) => {
    if (!timestamp) return 'Unknown';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}min ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  // During SSR we don't know permission or location state; render a non-interactive skeleton
  if (!mounted) {
    return (
      <Card className={`transition-all duration-300 ${className}`}>
        <CardContent className="p-4">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
            <div className="h-12 bg-gray-100 rounded mb-2" />
            <div className="h-8 bg-gray-100 rounded w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isSupported) {
    return (
      <Card className={`border-red-200 bg-red-50/50 ${className}`}>
        <CardContent className="flex items-center gap-3 p-4">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <span className="text-red-700">Geolocation not supported</span>
        </CardContent>
      </Card>
    );
  }

  const CompactView = () => (
    <Card className={`transition-all duration-300 hover:shadow-md ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <MapPin className={`w-5 h-5 ${location ? 'text-green-500' : isLoading ? 'text-blue-500' : 'text-gray-400'}`} />
              {location && !isLoading && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              )}
              {isLoading && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-ping" />
              )}
            </div>
            <div className="flex flex-col">
              <span className="font-medium text-sm">
                {isLoading ? 'Detecting location...' : location ? location.city : 'Location not set'}
              </span>
              {location && !isLoading && (
                <span className="text-xs text-gray-500">
                  {location.country} • {formatTimestamp(location.timestamp)}
                </span>
              )}
              {isLoading && (
                <span className="text-xs text-blue-500 animate-pulse">
                  Please wait...
                </span>
              )}
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLocationRequest}
            disabled={isLoading}
            className="h-8 px-3"
          >
            {isLoading ? (
              <RefreshCw className="w-3 h-3 animate-spin" />
            ) : location ? (
              <RefreshCw className="w-3 h-3" />
            ) : (
              <Navigation className="w-3 h-3" />
            )}
          </Button>
        </div>
        {error && (
          <div className="mt-2 p-2 bg-red-50 rounded-md">
            <p className="text-xs text-red-600">{error}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const FullCard = () => (
    <Card className={`transition-all duration-300 hover:shadow-lg ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-blue-500" />
          Your Location
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {location ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="font-medium text-green-800">Location Detected</span>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <Globe className="w-3 h-3 text-gray-500" />
                      <span className="font-medium">{location.city}, {location.country}</span>
                    </div>
                    <p className="text-gray-600 text-xs">{location.address}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearLocation}
                  className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <p className="text-gray-500">Coordinates</p>
                <p className="font-mono text-xs">
                  {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-gray-500">Accuracy</p>
                <p className="text-xs">{formatAccuracy(location.accuracy)}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Clock className="w-3 h-3" />
              <span>Updated {formatTimestamp(location.timestamp)}</span>
            </div>
          </motion.div>
        ) : (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 mx-auto bg-blue-50 rounded-full flex items-center justify-center">
              <Navigation className="w-8 h-8 text-blue-500" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Enable Location Access</h3>
              <p className="text-sm text-gray-600 mb-4">
                Get accurate air quality data for your exact location
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            onClick={handleLocationRequest}
            disabled={isLoading}
            className="flex-1"
            variant={location ? "outline" : "default"}
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Getting Location...
              </>
            ) : location ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Update Location
              </>
            ) : (
              <>
                <Navigation className="w-4 h-4 mr-2" />
                Get My Location
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <>
      {showFullCard ? <FullCard /> : <CompactView />}
      
      {/* Permission Modal */}
      <AnimatePresence>
        {showPermissionModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowPermissionModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto bg-blue-50 rounded-full flex items-center justify-center">
                  <MapPin className="w-8 h-8 text-blue-500" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    Location Permission Required
                  </h2>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    To provide accurate air quality data for your area, we need access to your location. 
                    Your location data will only be used to fetch relevant environmental information.
                  </p>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowPermissionModal(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handlePermissionGrant}
                    className="flex-1"
                  >
                    Allow Location
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
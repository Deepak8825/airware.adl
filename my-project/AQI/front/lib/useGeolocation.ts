import { useState, useEffect, useCallback } from 'react';

export interface LocationData {
  latitude: number;
  longitude: number;
  city: string;
  country: string;
  address: string;
  accuracy?: number;
  timestamp?: number;
}

export interface LocationState {
  data: LocationData | null;
  isLoading: boolean;
  error: string | null;
  hasPermission: boolean;
  isSupported: boolean;
}

export const useGeolocation = () => {
  const [state, setState] = useState<LocationState>({
    data: null,
    isLoading: false,
    error: null,
    hasPermission: false,
    isSupported: typeof navigator !== 'undefined' && 'geolocation' in navigator,
  });

  // Reverse geocoding to get address from coordinates using WAQI API
  const reverseGeocode = async (lat: number, lng: number): Promise<Partial<LocationData>> => {
    try {
      // Get location from our backend (which uses WAQI) - with timeout
      const backendBase = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch(`${backendBase}/api/aqi?lat=${lat}&lng=${lng}`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        
        // WAQI returns the actual monitoring station name and location
        return {
          city: data.location || 'Unknown City',
          country: 'India',
          address: data.location || 'Location detected'
        };
      }
      
      // Fallback to generic geocoding if WAQI fails
      const geoResponse = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
      );
      
      if (!geoResponse.ok) throw new Error('Geocoding failed');
      
      const geoData = await geoResponse.json();
      
      return {
        city: geoData.city || geoData.locality || 'Unknown City',
        country: geoData.countryName || 'Unknown Country',
        address: geoData.localityInfo?.administrative?.[2]?.name || 
                geoData.localityInfo?.administrative?.[1]?.name || 
                `${geoData.city}, ${geoData.countryName}` || 'Unknown Address'
      };
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return {
        city: 'Unknown City',
        country: 'Unknown Country',
        address: 'Location detected, address unavailable'
      };
    }
  };

  // Request location permission and get current position
  const requestLocation = useCallback(async (): Promise<LocationData | null> => {
    if (!state.isSupported) {
      setState(prev => ({ ...prev, error: 'Geolocation is not supported by this browser' }));
      return null;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 10000, // Reduced to 10 seconds
            maximumAge: 30000, // Cache for 30 seconds (faster repeat access)
          }
        );
      });

      const { latitude, longitude, accuracy } = position.coords;
      
      // Get address information
      const addressInfo = await reverseGeocode(latitude, longitude);
      
      const locationData: LocationData = {
        latitude,
        longitude,
        accuracy,
        timestamp: Date.now(),
        city: addressInfo.city || 'Unknown City',
        country: addressInfo.country || 'Unknown Country',
        address: addressInfo.address || 'Location detected',
      };

      setState(prev => ({
        ...prev,
        data: locationData,
        isLoading: false,
        hasPermission: true,
        error: null,
      }));

      // Store in localStorage for persistence
      localStorage.setItem('userLocation', JSON.stringify(locationData));
      
      return locationData;
    } catch (error: unknown) {
      let errorMessage = 'Failed to get location';

      if (typeof error === 'object' && error !== null && 'code' in error) {
        const geolocationError = error as GeolocationPositionError;
        switch (geolocationError.code) {
          case geolocationError.PERMISSION_DENIED:
            errorMessage = 'Location access denied by user';
            break;
          case geolocationError.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable';
            break;
          case geolocationError.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
          default:
            errorMessage = geolocationError.message || 'Unknown location error';
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      setState(prev => ({
        ...prev,
        isLoading: false,
        hasPermission: false,
        error: errorMessage,
      }));
      
      return null;
    }
  }, [state.isSupported]);

  // Check for stored location data on mount
  useEffect(() => {
    const storedLocation = localStorage.getItem('userLocation');
    if (storedLocation) {
      try {
        const parsedLocation: LocationData = JSON.parse(storedLocation);
        // Check if stored location is less than 1 hour old
        if (parsedLocation.timestamp && Date.now() - parsedLocation.timestamp < 3600000) {
          setState(prev => ({
            ...prev,
            data: parsedLocation,
            hasPermission: true,
          }));
        }
      } catch (error) {
        console.error('Error parsing stored location:', error);
        localStorage.removeItem('userLocation');
      }
    }
  }, []);

  // Watch location changes (optional)
  const watchLocation = useCallback((): (() => void) | null => {
    if (!state.isSupported || !state.hasPermission) return null;

    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const addressInfo = await reverseGeocode(latitude, longitude);
        
        const locationData: LocationData = {
          latitude,
          longitude,
          accuracy,
          timestamp: Date.now(),
          city: addressInfo.city || 'Unknown City',
          country: addressInfo.country || 'Unknown Country',
          address: addressInfo.address || 'Location detected',
        };

        setState(prev => ({ ...prev, data: locationData }));
        localStorage.setItem('userLocation', JSON.stringify(locationData));
      },
      (error) => {
        console.error('Watch location error:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [state.isSupported, state.hasPermission]);

  // Clear location data
  const clearLocation = useCallback(() => {
    setState(prev => ({
      ...prev,
      data: null,
      hasPermission: false,
      error: null,
    }));
    localStorage.removeItem('userLocation');
  }, []);

  return {
    ...state,
    requestLocation,
    watchLocation,
    clearLocation,
    refetch: requestLocation,
  };
};
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

  // Reverse geocoding to get address from coordinates
  const reverseGeocode = async (lat: number, lng: number): Promise<Partial<LocationData>> => {
    try {
      // Use Nominatim OpenStreetMap reverse geocoding (free, no API key needed)
      const geoResponse = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'AirWare-App/1.0'
          }
        }
      );
      
      if (geoResponse.ok) {
        const geoData = await geoResponse.json();
        const address = geoData.address || {};
        
        // Extract city name (try multiple fields for better coverage)
        const city = address.city || 
                     address.town || 
                     address.village || 
                     address.municipality || 
                     address.county || 
                     address.state_district ||
                     'Unknown City';
        
        const country = address.country || 'Unknown Country';
        
        // Build a nice address string
        const addressParts = [
          city,
          address.state || address.region,
          country
        ].filter(Boolean);
        
        return {
          city,
          country,
          address: addressParts.join(', ')
        };
      }
      
      // Fallback to BigDataCloud if Nominatim fails
      const fallbackResponse = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
      );
      
      if (fallbackResponse.ok) {
        const fallbackData = await fallbackResponse.json();
        
        return {
          city: fallbackData.city || fallbackData.locality || 'Unknown City',
          country: fallbackData.countryName || 'Unknown Country',
          address: `${fallbackData.city || fallbackData.locality}, ${fallbackData.principalSubdivision || fallbackData.countryName}` || 'Location detected'
        };
      }
      
      throw new Error('All geocoding services failed');
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      
      // As last resort, try to get location from backend WAQI
      try {
        const backendBase = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
        const response = await fetch(`${backendBase}/api/aqi?lat=${lat}&lng=${lng}`);
        
        if (response.ok) {
          const data = await response.json();
          return {
            city: data.location || 'Detected Location',
            country: 'India',
            address: data.location || 'Location detected'
          };
        }
      } catch (backendError) {
        console.error('Backend geocoding also failed:', backendError);
      }
      
      return {
        city: 'Detected Location',
        country: 'Country',
        address: `Coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)}`
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
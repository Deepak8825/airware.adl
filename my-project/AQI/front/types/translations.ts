export interface Translations {
  // Common
  common: {
    loading: string;
    error: string;
    success: string;
    save: string;
    cancel: string;
    submit: string;
    close: string;
    open: string;
    back: string;
    next: string;
    previous: string;
    search: string;
    clear: string;
  };

  // Navigation
  nav: {
    home: string;
    forecast: string;
    healthTips: string;
    settings: string;
    login: string;
    register: string;
    logout: string;
    dashboard: string;
    goToDashboard: string;
    viewForecast: string;
  };

  // Home page
  home: {
    title: string;
    subtitle: string;
    currentAQI: string;
    location: string;
    lastUpdated: string;
    airQualityIndex: string;
    pollutants: string;
    pm25: string;
    pm10: string;
    ozone: string;
    no2: string;
    so2: string;
    co: string;
    getLocation: string;
    locationAccess: string;
    allowLocation: string;
    manualLocation: string;
    enterLocation: string;
    checkAQI: string;
    searchLocation: string;
    liveAirQuality: string;
    liveAirQualityDesc: string;
    forecasting: string;
    forecastingDesc: string;
    healthTips: string;
    healthTipsDesc: string;
    uptimeGuarantee: string;
    forecast5Day: string;
    citiesMonitored: string;
    liveDataUpdates: string;
    healthRecommendations: string;
    indiaAirQualityMap: string;
  };

  // AQI Categories
  aqi: {
    good: string;
    moderate: string;
    unhealthyForSensitive: string;
    unhealthy: string;
    veryUnhealthy: string;
    hazardous: string;
    categories: {
      good: string;
      moderate: string;
      unhealthyForSensitive: string;
      unhealthy: string;
      veryUnhealthy: string;
      hazardous: string;
    };
  };

  // Settings
  settings: {
    title: string;
    language: string;
    selectLanguage: string;
    notifications: string;
    enableNotifications: string;
    aqiAlerts: string;
    dailyReports: string;
    theme: string;
    lightMode: string;
    darkMode: string;
    autoMode: string;
    units: string;
    metric: string;
    imperial: string;
    privacy: string;
    locationSharing: string;
    dataCollection: string;
    about: string;
    version: string;
    support: string;
    feedback: string;
  };

  // Health Tips
  healthTips: {
    title: string;
    basedOnAQI: string;
    recommendations: string;
    activities: string;
    protection: string;
    indoor: string;
    outdoor: string;
    sensitive: string;
    general: string;
  };

  // Forecast
  forecast: {
    title: string;
    today: string;
    tomorrow: string;
    next5Days: string;
    temperature: string;
    humidity: string;
    windSpeed: string;
    condition: string;
    sunny: string;
    cloudy: string;
    rainy: string;
    partlyCloudy: string;
  };

  // Auth
  auth: {
    login: string;
    register: string;
    email: string;
    password: string;
    confirmPassword: string;
    name: string;
    forgotPassword: string;
    dontHaveAccount: string;
    alreadyHaveAccount: string;
    signIn: string;
    signUp: string;
    loginSuccess: string;
    registerSuccess: string;
    invalidCredentials: string;
    emailRequired: string;
    passwordRequired: string;
    nameRequired: string;
  };

  // Chatbot
  chatbot: {
    title: string;
    placeholder: string;
    send: string;
    minimize: string;
    close: string;
    typing: string;
    welcomeMessage: string;
    errorMessage: string;
  };

  // Languages
  languages: {
    english: string;
    tamil: string;
    hindi: string;
  };

  // Feedback
  feedback: {
    title: string;
    subtitle: string;
    stepOf: string;
    rating: {
      title: string;
      subtitle: string;
      excellent: string;
      great: string;
      good: string;
      fair: string;
      poor: string;
    };
    category: {
      title: string;
      subtitle: string;
      bug: string;
      bugDesc: string;
      feature: string;
      featureDesc: string;
      improvement: string;
      improvementDesc: string;
      general: string;
      generalDesc: string;
    };
    usage: {
      title: string;
      subtitle: string;
      daily: string;
      dailyDesc: string;
      weekly: string;
      weeklyDesc: string;
      monthly: string;
      monthlyDesc: string;
      rarely: string;
      rarelyDesc: string;
    };
    features: {
      title: string;
      subtitle: string;
    };
    improvements: {
      title: string;
      subtitle: string;
    };
    additional: {
      title: string;
      subtitle: string;
      recommend: string;
      placeholder: string;
    };
    navigation: {
      previous: string;
      next: string;
      submit: string;
    };
    success: {
      title: string;
      message: string;
      description: string;
      backHome: string;
    };
  };
}
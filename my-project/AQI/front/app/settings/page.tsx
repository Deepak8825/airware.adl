"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Bell, Globe, Moon, Sun, Shield, Info, Check } from "lucide-react"
import { useLanguage, Language, getLanguageDisplayName } from "@/contexts/LanguageContext"
import { useTheme } from "@/contexts/ThemeContext"

export default function Settings() {
  const { language, setLanguage, t } = useLanguage()
  const { theme, setTheme } = useTheme()
  const [notifications, setNotifications] = useState(true)
  const [aqiAlerts, setAqiAlerts] = useState(true)
  const [dailyReports, setDailyReports] = useState(false)
  const [locationSharing, setLocationSharing] = useState(true)
  const [dataCollection, setDataCollection] = useState(false)

  const languages: { code: Language; name: string; nativeName: string }[] = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिंदी' },
  ]

  const ToggleSwitch = ({ enabled, onChange }: { enabled: boolean; onChange: () => void }) => (
    <button
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 ${
        enabled ? 'bg-gradient-to-r from-blue-500 to-blue-600' : 'bg-gray-300 dark:bg-gray-600'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 shadow-lg ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  )

  // load profile from localStorage
  const [profile, setProfile] = useState<{email?:string;name?:string;} | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('profile') || localStorage.getItem('user');
      if (raw) setProfile(JSON.parse(raw));
    } catch {}
  }, []);

  const handleLogout = () => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('profile');
    } catch {}
    window.location.href = '/';
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Link href="/" className="mr-4 p-3 rounded-full hover:bg-white/60 dark:hover:bg-gray-700/60 transition-all duration-300 shadow-md bg-white/40 dark:bg-gray-700/40">
            <ArrowLeft className="w-6 h-6 text-gray-700 dark:text-gray-300" />
          </Link>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-gray-200 dark:to-gray-400 bg-clip-text text-transparent">
              {t.settings.title}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Customize your experience</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          
          {/* Language Card */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20 dark:border-gray-700/20 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center mb-6">
              <div className="p-3 rounded-full bg-gradient-to-r from-green-400 to-green-600 shadow-lg">
                <Globe className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{t.settings.language}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t.settings.selectLanguage}</p>
              </div>
            </div>
            <div className="space-y-3">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setLanguage(lang.code)}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-300 ${
                    language === lang.code
                      ? 'bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 border-blue-300 dark:border-blue-600 shadow-md'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">
                      {lang.code === 'en' ? '🇺🇸' : lang.code === 'ta' ? '🇮🇳' : '🇮🇳'}
                    </span>
                    <div className="text-left">
                      <div className="font-medium text-gray-900 dark:text-gray-100">{lang.nativeName}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{lang.name}</div>
                    </div>
                  </div>
                  {language === lang.code && (
                    <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Notifications Card */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20 dark:border-gray-700/20 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center mb-6">
              <div className="p-3 rounded-full bg-gradient-to-r from-orange-400 to-orange-600 shadow-lg">
                <Bell className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{t.settings.notifications}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Manage your alerts</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-gray-800 dark:text-gray-200 font-medium">{t.settings.enableNotifications}</span>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Get notified about important updates</p>
                </div>
                <ToggleSwitch enabled={notifications} onChange={() => setNotifications(!notifications)} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-gray-800 dark:text-gray-200 font-medium">{t.settings.aqiAlerts}</span>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Air quality warnings</p>
                </div>
                <ToggleSwitch enabled={aqiAlerts} onChange={() => setAqiAlerts(!aqiAlerts)} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-gray-800 dark:text-gray-200 font-medium">{t.settings.dailyReports}</span>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Daily air quality summary</p>
                </div>
                <ToggleSwitch enabled={dailyReports} onChange={() => setDailyReports(!dailyReports)} />
              </div>
            </div>
          </div>

          {/* Theme Card */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20 dark:border-gray-700/20 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center mb-6">
              <div className="p-3 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-600 shadow-lg">
                <Sun className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{t.settings.theme}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Choose your preferred appearance</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setTheme("light")}
                className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                  theme === "light" 
                    ? 'border-blue-400 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 shadow-md' 
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
              >
                <Sun className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
                <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{t.settings.lightMode}</span>
              </button>
              <button
                onClick={() => setTheme("dark")}
                className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                  theme === "dark" 
                    ? 'border-blue-400 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 shadow-md' 
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
              >
                <Moon className="w-8 h-8 mx-auto mb-2 text-gray-600" />
                <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{t.settings.darkMode}</span>
              </button>
              <button
                onClick={() => setTheme("auto")}
                className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                  theme === "auto" 
                    ? 'border-blue-400 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 shadow-md' 
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
              >
                <div className="w-8 h-8 mx-auto mb-2 flex items-center justify-center">
                  <Sun className="w-4 h-8 text-yellow-500" />
                  <Moon className="w-4 h-8 text-gray-600" />
                </div>
                <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{t.settings.autoMode}</span>
              </button>
            </div>
          </div>

          {/* Privacy Card */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20 dark:border-gray-700/20 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center mb-6">
              <div className="p-3 rounded-full bg-gradient-to-r from-purple-400 to-purple-600 shadow-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{t.settings.privacy}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Control your data</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-gray-800 dark:text-gray-200 font-medium">{t.settings.locationSharing}</span>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Share location for better results</p>
                </div>
                <ToggleSwitch enabled={locationSharing} onChange={() => setLocationSharing(!locationSharing)} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-gray-800 dark:text-gray-200 font-medium">{t.settings.dataCollection}</span>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Help improve our service</p>
                </div>
                <ToggleSwitch enabled={dataCollection} onChange={() => setDataCollection(!dataCollection)} />
              </div>
            </div>
          </div>

          {/* About Card */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20 dark:border-gray-700/20 hover:shadow-2xl transition-all duration-300 md:col-span-2">
            <div className="flex items-center mb-6">
              <div className="p-3 rounded-full bg-gradient-to-r from-indigo-400 to-indigo-600 shadow-lg">
                <Info className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{t.settings.about}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Application information</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex justify-between items-center p-4 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-600/50">
                <span className="text-gray-700 dark:text-gray-300 font-medium">{t.settings.version}</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 px-3 py-1 rounded-full shadow-sm">1.0.0</span>
              </div>
              <div className="flex justify-between items-center p-4 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-600/50">
                <span className="text-gray-700 dark:text-gray-300 font-medium">{t.settings.support}</span>
                <a href="#" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors shadow-sm">
                  Contact
                </a>
              </div>
              <div className="flex justify-between items-center p-4 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-600/50">
                <span className="text-gray-700 dark:text-gray-300 font-medium">{t.settings.feedback}</span>
                <Link href="/feedback" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors shadow-sm">
                  Send
                </Link>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
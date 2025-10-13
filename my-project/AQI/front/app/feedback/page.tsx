"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Star, Send, MessageSquare, TrendingUp, Bug, Lightbulb, CheckCircle } from "lucide-react"
import { useLanguage } from "@/contexts/LanguageContext"

interface FeedbackData {
  rating: number
  category: string
  usageFrequency: string
  features: string[]
  improvements: string[]
  recommend: boolean
  additionalFeedback: string
}

export default function Feedback() {
  const { t } = useLanguage()
  const [currentStep, setCurrentStep] = useState(1)
  const [submitted, setSubmitted] = useState(false)
  const [feedback, setFeedback] = useState<FeedbackData>({
    rating: 0,
    category: '',
    usageFrequency: '',
    features: [],
    improvements: [],
    recommend: false,
    additionalFeedback: ''
  })

  const totalSteps = 6

  const categories = [
    { id: 'bug', label: t.feedback.category.bug, icon: Bug, color: 'bg-red-500', description: t.feedback.category.bugDesc },
    { id: 'feature', label: t.feedback.category.feature, icon: Lightbulb, color: 'bg-yellow-500', description: t.feedback.category.featureDesc },
    { id: 'improvement', label: t.feedback.category.improvement, icon: TrendingUp, color: 'bg-blue-500', description: t.feedback.category.improvementDesc },
    { id: 'general', label: t.feedback.category.general, icon: MessageSquare, color: 'bg-green-500', description: t.feedback.category.generalDesc },
  ]

  const usageOptions = [
    { id: 'daily', label: t.feedback.usage.daily, description: t.feedback.usage.dailyDesc },
    { id: 'weekly', label: t.feedback.usage.weekly, description: t.feedback.usage.weeklyDesc },
    { id: 'monthly', label: t.feedback.usage.monthly, description: t.feedback.usage.monthlyDesc },
    { id: 'rarely', label: t.feedback.usage.rarely, description: t.feedback.usage.rarelyDesc },
  ]

  const featureOptions = [
    { id: 'aqi-display', label: 'AQI Display' },
    { id: 'location-tracking', label: 'Location Tracking' },
    { id: 'health-tips', label: 'Health Tips' },
    { id: 'forecast', label: 'Air Quality Forecast' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'chatbot', label: 'AI Chatbot' },
    { id: 'ui-design', label: 'User Interface' },
    { id: 'performance', label: 'App Performance' },
  ]

  const improvementOptions = [
    { id: 'more-locations', label: 'More Locations' },
    { id: 'better-accuracy', label: 'Better Data Accuracy' },
    { id: 'faster-updates', label: 'Faster Updates' },
    { id: 'more-languages', label: 'More Languages' },
    { id: 'offline-mode', label: 'Offline Mode' },
    { id: 'widget', label: 'Home Screen Widget' },
    { id: 'dark-mode', label: 'Dark Mode' },
    { id: 'export-data', label: 'Export Data' },
  ]

  const handleRating = (rating: number) => {
    setFeedback(prev => ({ ...prev, rating }))
  }

  const handleFeatureToggle = (featureId: string) => {
    setFeedback(prev => ({
      ...prev,
      features: prev.features.includes(featureId)
        ? prev.features.filter(f => f !== featureId)
        : [...prev.features, featureId]
    }))
  }

  const handleImprovementToggle = (improvementId: string) => {
    setFeedback(prev => ({
      ...prev,
      improvements: prev.improvements.includes(improvementId)
        ? prev.improvements.filter(i => i !== improvementId)
        : [...prev.improvements, improvementId]
    }))
  }

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    try {
  const backendBase = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
  const response = await fetch(`${backendBase}/submit_feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(feedback),
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Feedback submitted successfully:', result)
        setSubmitted(true)
      } else {
        console.error('Failed to submit feedback:', response.statusText)
        // Still show success to user, but log the error
        setSubmitted(true)
      }
    } catch (error) {
      console.error('Error submitting feedback:', error)
      // Still show success to user, but log the error
      setSubmitted(true)
    }
  }

  const isStepValid = () => {
    switch (currentStep) {
      case 1: return feedback.rating > 0
      case 2: return feedback.category !== ''
      case 3: return feedback.usageFrequency !== ''
      case 4: return feedback.features.length > 0
      case 5: return true // improvements are optional
      case 6: return true // additional feedback is optional
      default: return false
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-12 text-center max-w-md mx-4">
          <div className="mb-6">
            <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{t.feedback.success.title}</h1>
            <p className="text-gray-600">{t.feedback.success.message}</p>
          </div>
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              {t.feedback.success.description}
            </p>
            <Link 
              href="/"
              className="inline-block bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-3 rounded-full font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg"
            >
              {t.feedback.success.backHome}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Link href="/settings" className="mr-4 p-3 rounded-full hover:bg-white/60 dark:hover:bg-gray-700/60 transition-all duration-300 shadow-md bg-white/40 dark:bg-gray-700/40">
            <ArrowLeft className="w-6 h-6 text-gray-700 dark:text-gray-300" />
          </Link>
          <div className="flex-1">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-gray-200 dark:to-gray-400 bg-clip-text text-transparent">
              {t.feedback.title}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">{t.feedback.subtitle}</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">
              {t.feedback.stepOf.replace('{current}', currentStep.toString()).replace('{total}', totalSteps.toString())}
            </span>
            <span className="text-sm text-gray-500">{Math.round((currentStep / totalSteps) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Feedback Form */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-white/20 dark:border-gray-700/20">
          
          {/* Step 1: Rating */}
          {currentStep === 1 && (
            <div className="text-center">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{t.feedback.rating.title}</h2>
                <p className="text-gray-600">{t.feedback.rating.subtitle}</p>
              </div>
              <div className="flex justify-center space-x-4 mb-8">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => handleRating(star)}
                    className={`p-3 rounded-full transition-all duration-300 transform hover:scale-110 ${
                      feedback.rating >= star 
                        ? 'text-yellow-400 bg-yellow-50' 
                        : 'text-gray-300 hover:text-yellow-300'
                    }`}
                  >
                    <Star className="w-10 h-10 fill-current" />
                  </button>
                ))}
              </div>
              {feedback.rating > 0 && (
                <div className="text-center">
                  <p className="text-lg font-medium text-gray-800">
                    {feedback.rating === 5 && t.feedback.rating.excellent}
                    {feedback.rating === 4 && t.feedback.rating.great}
                    {feedback.rating === 3 && t.feedback.rating.good}
                    {feedback.rating === 2 && t.feedback.rating.fair}
                    {feedback.rating === 1 && t.feedback.rating.poor}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Category */}
          {currentStep === 2 && (
            <div>
              <div className="mb-8 text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{t.feedback.category.title}</h2>
                <p className="text-gray-600">{t.feedback.category.subtitle}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {categories.map((category) => {
                  const IconComponent = category.icon
                  return (
                    <button
                      key={category.id}
                      onClick={() => setFeedback(prev => ({ ...prev, category: category.id }))}
                      className={`p-6 rounded-2xl border-2 text-left transition-all duration-300 transform hover:scale-105 ${
                        feedback.category === category.id
                          ? 'border-blue-500 bg-blue-50 shadow-lg'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="flex items-start space-x-4">
                        <div className={`p-3 rounded-full ${category.color}`}>
                          <IconComponent className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-1">{category.label}</h3>
                          <p className="text-sm text-gray-600">{category.description}</p>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Step 3: Usage Frequency */}
          {currentStep === 3 && (
            <div>
              <div className="mb-8 text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{t.feedback.usage.title}</h2>
                <p className="text-gray-600">{t.feedback.usage.subtitle}</p>
              </div>
              <div className="space-y-4">
                {usageOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setFeedback(prev => ({ ...prev, usageFrequency: option.id }))}
                    className={`w-full p-6 rounded-2xl border-2 text-left transition-all duration-300 ${
                      feedback.usageFrequency === option.id
                        ? 'border-blue-500 bg-blue-50 shadow-lg'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">{option.label}</h3>
                        <p className="text-sm text-gray-600">{option.description}</p>
                      </div>
                      {feedback.usageFrequency === option.id && (
                        <CheckCircle className="w-6 h-6 text-blue-500" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Features */}
          {currentStep === 4 && (
            <div>
              <div className="mb-8 text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{t.feedback.features.title}</h2>
                <p className="text-gray-600">{t.feedback.features.subtitle}</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {featureOptions.map((feature) => (
                  <button
                    key={feature.id}
                    onClick={() => handleFeatureToggle(feature.id)}
                    className={`p-4 rounded-xl border-2 text-center transition-all duration-300 ${
                      feedback.features.includes(feature.id)
                        ? 'border-blue-500 bg-blue-50 shadow-lg'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <span className="font-medium text-gray-900 text-sm">{feature.label}</span>
                      {feedback.features.includes(feature.id) && (
                        <CheckCircle className="w-5 h-5 text-blue-500" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 5: Improvements */}
          {currentStep === 5 && (
            <div>
              <div className="mb-8 text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{t.feedback.improvements.title}</h2>
                <p className="text-gray-600">{t.feedback.improvements.subtitle}</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {improvementOptions.map((improvement) => (
                  <button
                    key={improvement.id}
                    onClick={() => handleImprovementToggle(improvement.id)}
                    className={`p-4 rounded-xl border-2 text-center transition-all duration-300 ${
                      feedback.improvements.includes(improvement.id)
                        ? 'border-orange-500 bg-orange-50 shadow-lg'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <span className="font-medium text-gray-900 text-sm">{improvement.label}</span>
                      {feedback.improvements.includes(improvement.id) && (
                        <CheckCircle className="w-5 h-5 text-orange-500" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 6: Additional Feedback */}
          {currentStep === 6 && (
            <div>
              <div className="mb-8 text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{t.feedback.additional.title}</h2>
                <p className="text-gray-600">{t.feedback.additional.subtitle}</p>
              </div>
              
              <div className="mb-6">
                <div className="flex items-center space-x-4 mb-4">
                  <span className="text-gray-700 font-medium">{t.feedback.additional.recommend}</span>
                  <div className="flex space-x-4">
                    <button
                      onClick={() => setFeedback(prev => ({ ...prev, recommend: true }))}
                      className={`px-4 py-2 rounded-full font-medium transition-all duration-300 ${
                        feedback.recommend === true
                          ? 'bg-green-500 text-white shadow-lg'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => setFeedback(prev => ({ ...prev, recommend: false }))}
                      className={`px-4 py-2 rounded-full font-medium transition-all duration-300 ${
                        feedback.recommend === false
                          ? 'bg-red-500 text-white shadow-lg'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      No
                    </button>
                  </div>
                </div>
              </div>

              <textarea
                value={feedback.additionalFeedback}
                onChange={(e) => setFeedback(prev => ({ ...prev, additionalFeedback: e.target.value }))}
                placeholder={t.feedback.additional.placeholder}
                rows={6}
                className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none resize-none bg-white"
              />
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className={`px-6 py-3 rounded-full font-medium transition-all duration-300 ${
                currentStep === 1
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {t.feedback.navigation.previous}
            </button>
            
            {currentStep < totalSteps ? (
              <button
                onClick={handleNext}
                disabled={!isStepValid()}
                className={`px-8 py-3 rounded-full font-medium transition-all duration-300 flex items-center space-x-2 ${
                  isStepValid()
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-lg'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                <span>{t.feedback.navigation.next}</span>
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className="px-8 py-3 rounded-full font-medium bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 transition-all duration-300 flex items-center space-x-2 shadow-lg"
              >
                <Send className="w-5 h-5" />
                <span>{t.feedback.navigation.submit}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
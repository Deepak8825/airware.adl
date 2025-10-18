# 🌾 Quick Start Guide - AirAware Farmer Support

## How to Access Farmer Features

### Step 1: Login to AirAware
1. Open browser and go to: **http://localhost:3000**
2. Login with:
   - Email: `test@example.com`
   - Password: `testpass123`

### Step 2: Navigate to Health Tips & Farmer Support
1. Click on **"Health Tips"** in the navigation menu
2. OR directly visit: **http://localhost:3000/health-tips**

### Step 3: Enable Farmer Support Section
1. Scroll down to find the green **"🌾 AirAware Farmer Support"** section
2. Click the **"Show Farmer Tools"** button

### Step 4: Select Your Crop
Choose your crop from the dropdown:
- 🌾 Rice (Paddy)
- 🌾 Wheat
- 🌱 Cotton
- 🎍 Sugarcane
- 🥬 Vegetables
- 🫘 Pulses

### Step 5: View Personalized Recommendations

You'll see:

#### 1. Crop-Specific AQI Alerts
- **Warning Alerts** (Orange): When AQI is harmful for your crop
- **Safe Alerts** (Green): When conditions are good
- Example: "⚠️ AQI harmful for paddy – avoid spraying pesticides today"

#### 2. AI-Based Farming Suggestions
Based on current AQI levels:
- **Excellent Conditions** (AQI ≤ 50): Green light for all activities
- **Moderate Conditions** (AQI 51-100): Some precautions needed
- **Caution Required** (AQI 101-150): Limit outdoor work
- **High Alert** (AQI > 150): Minimize all outdoor activities

#### 3. Seasonal Guidance
Automatically detects current season and shows:
- Recommended crops for this season
- Best sowing periods
- Harvesting timelines
- AQI impact warnings
- Season-specific tips

#### 4. Pollution Management Best Practices
Three categories:
- 🛡️ **Preventive Measures**: Tree barriers, organic methods
- 📊 **AQI Monitoring Tips**: When to check AQI, best farming hours
- 🌱 **Crop Protection**: Washing, sprays, protected cultivation

#### 5. Current Conditions Summary
Dashboard showing:
- Current AQI value
- Current Season
- PM2.5 levels
- PM10 levels

---

## 📱 API Testing (For Developers)

### Test the Farming Endpoint Directly:

**PowerShell:**
```powershell
Invoke-RestMethod -Uri "http://localhost:8000/api/farming/suggestions?location=Delhi&crop=rice" -Method Get | ConvertTo-Json
```

**Browser:**
```
http://localhost:8000/api/farming/suggestions?location=Delhi&crop=rice
```

### API Parameters:
- `location`: City name (e.g., Delhi, Mumbai, Bangalore)
- `crop`: Crop type (rice, wheat, cotton, sugarcane, vegetables, pulses)
- `lat` & `lng`: GPS coordinates (optional, instead of location)

---

## 🎯 Sample Scenarios

### Scenario 1: Rice Farmer in Delhi (High AQI)
**Current AQI: 169**

**What You'll See:**
- ⚠️ Warning Alert: "AQI harmful for rice"
- Recommendation: "Avoid midday pesticide spraying"
- Safe Actions: "Early morning irrigation (5-7 AM)"
- General: "High Alert - Minimize outdoor activities"

### Scenario 2: Vegetable Farmer in Bangalore (Good AQI)
**Current AQI: 45**

**What You'll See:**
- ✅ Safe Alert: "AQI acceptable for vegetables"
- Recommendation: "All outdoor activities can proceed"
- Safe Actions: "Protected cultivation, early morning watering"
- General: "Excellent Conditions - Normal farming activities"

### Scenario 3: Wheat Farmer in Punjab (Monsoon Season)
**Current AQI: 75**

**What You'll See:**
- ✅ Safe Alert: "AQI acceptable for wheat"
- Season: "Kharif Season - Prepare for rabi sowing"
- Tips: "Rain helps clear pollutants - good time for field prep"
- Best Time: "5-8 AM for chemical application"

---

## 🔔 Important Reminders

### Best Farming Hours:
**5-8 AM** - AQI is typically lowest in early morning

### Chemical Application Guidelines:
- ✅ Apply when AQI < 100
- ⚠️ Use caution when AQI 100-150
- ❌ AVOID when AQI > 150

### Stubble Burning:
**NEVER BURN CROP RESIDUE**
- Use as mulch instead
- Helps soil health
- Prevents AQI spikes
- Better for environment

### Monsoon Advantage:
**Rain naturally improves AQI**
- Best time for transplanting
- Good for irrigation planning
- Lower pollution levels

---

## 🌟 Key Benefits

### For You:
✅ Know when it's safe to work  
✅ Protect your crops from pollution damage  
✅ Save money by applying inputs at optimal times  
✅ Stay healthy by avoiding hazardous conditions  

### For Your Community:
🌱 Promote sustainable farming  
💰 Better yields = better income  
🏥 Healthier air for everyone  
📱 Access to modern technology  

---

## 📞 Support

**Web Interface:**  
http://localhost:3000/health-tips

**API Documentation:**  
http://localhost:8000/docs

**Test Account:**
- Email: test@example.com
- Password: testpass123

---

## 🎓 Learn More

Visit the full documentation:
- `FARMER_SUPPORT_FEATURES.md` - Complete feature list
- `README.md` - Project overview

---

**🌾 AirAware - Empowering Farmers with Air Quality Intelligence**

*Making Climate-Smart Agriculture Accessible to All*

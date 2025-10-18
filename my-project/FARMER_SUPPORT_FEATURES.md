# 🌾 AirAware — Farmer Supportive Enhancement Initiative

## Empowering Rural Farmers through Air Quality & Weather Intelligence

AirAware has evolved beyond air quality prediction — it's now a **climate-smart assistant for farmers** across rural India.

---

## 🚀 Implemented Features

### 1. 🌤️ Crop-Specific AQI Alerts

Each crop reacts differently to pollution and weather. AirAware now delivers smart alerts for:

#### Supported Crops:
- **🌾 Rice (Paddy)** - Sensitive AQI: 100
  - Alert: "⚠️ AQI harmful for paddy – avoid spraying pesticides today"
  - PM2.5 can reduce photosynthesis

- **🌾 Wheat** - Sensitive AQI: 120
  - Wheat growth affected by prolonged exposure to high AQI levels

- **🌱 Cotton** - Sensitive AQI: 110
  - Cotton requires clean air for optimal fiber quality

- **🎍 Sugarcane** - Sensitive AQI: 130
  - Moderately tolerant to pollution but growth can be affected

- **🥬 Vegetables** - Sensitive AQI: 80
  - Highly sensitive - leafy vegetables can absorb pollutants
  - Requires protected cultivation during high AQI

- **🫘 Pulses** - Sensitive AQI: 100
  - Can tolerate moderate pollution but yields may decrease

#### Alert Features:
- Real-time AQI-based warnings
- Safe vs. Avoid activities recommendations
- Optimal condition indicators
- Severity-based color coding (warning/safe)

---

### 2. 🧠 AI-Based Farming Suggestions

AI models combine **weather, air quality, and season data** to suggest:

#### Best Sowing and Harvesting Periods:
- **Rabi Season (Winter)**: November-December sowing, March-April harvest
  - Crops: Wheat, Barley, Mustard, Chickpea
  - Note: Winter often has higher AQI in North India

- **Kharif Season (Monsoon)**: June-July sowing, September-October harvest
  - Crops: Rice, Maize, Cotton, Soybean
  - Benefit: Rain helps clear pollutants - better air quality

- **Summer Season**: Field preparation and late rabi harvesting
  - Better air quality expected, watch for dust storms

- **Post-Monsoon Season**: Rabi preparation
  - Caution: AQI may rise due to stubble burning

#### Ideal Irrigation and Pesticide Times:
**Based on Current AQI:**

**✅ Good Conditions (AQI ≤ 50):**
- All outdoor farming activities can proceed normally
- Ideal time for pesticide/fertilizer application
- Good conditions for transplanting seedlings
- Safe for livestock grazing

**⚠️ Moderate Conditions (AQI 51-100):**
- Most farming activities can continue
- Prefer early morning (5-8 AM) for chemical spraying
- Use protective equipment for prolonged outdoor work
- Monitor sensitive crops closely

**🔴 Caution Required (AQI 101-150):**
- Limit duration of outdoor work to essential tasks
- Avoid pesticide spraying - pollutants can react with chemicals
- Use drip irrigation instead of spray irrigation
- Keep livestock in covered areas
- Postpone harvesting if possible

**🚨 High Alert (AQI > 150):**
- Minimize all outdoor farming activities
- Do NOT spray any chemicals - wait for AQI to improve
- Keep livestock indoors with adequate ventilation
- Use N95 masks if outdoor work is essential
- Delay harvesting and field preparation
- Monitor crop health for pollution damage

#### Preventive Steps for Pollution-Related Crop Stress:
- Plant tree barriers around fields (Neem, Peepal, Bamboo)
- Use organic farming methods to reduce chemical pollution
- Avoid crop residue burning - use decomposition methods
- Install drip irrigation to minimize water waste and dust
- Wash vegetables thoroughly before consumption or sale
- Use anti-transpirant sprays on sensitive crops during high AQI
- Consider protected cultivation for high-value crops
- Select pollution-tolerant crop varieties when possible

---

## 🎯 Technical Implementation

### Backend API Endpoint:
```
GET /api/farming/suggestions
```

**Parameters:**
- `location` (string): City or area name
- `lat` (float): Latitude coordinates
- `lng` (float): Longitude coordinates
- `crop` (string): Specific crop type (optional)

**Response Includes:**
- Current AQI and pollutant levels (PM2.5, PM10)
- Current season detection (Winter/Summer/Monsoon/Post-Monsoon)
- Crop-specific alerts and recommendations
- General farming recommendations based on AQI
- Seasonal crop suggestions
- Pollution management best practices
- AQI monitoring tips

### Frontend Integration:
**Location:** `/health-tips` page

**Features:**
- 🌾 Dedicated "AirAware Farmer Support" section
- Dropdown to select crop type
- Real-time data fetching based on location
- Color-coded alerts (green for safe, orange for warning)
- Expandable/collapsible interface
- Comprehensive guidance cards

---

## 📊 Data Sources

1. **Real-time AQI Data**: WAQI API integration
2. **Season Detection**: Automatic based on current date
3. **Crop Database**: Built-in knowledge base with crop sensitivities
4. **Location Data**: GPS coordinates or city name

---

## 💡 Usage Scenarios

### Example 1: Rice Farmer in Delhi (Post-Monsoon)
**Current AQI: 169**

**Alert Received:**
> ⚠️ AQI harmful for rice – Rice paddy is sensitive to high pollution. PM2.5 can reduce photosynthesis.

**Recommendations:**
- Avoid: Midday pesticide spraying, burning crop residue
- Safe: Early morning irrigation (5-7 AM), evening fertilizer application
- Season Tip: Complete kharif harvesting quickly, prepare for rabi crops

### Example 2: Vegetable Farmer in Bangalore
**Current AQI: 45**

**Alert Received:**
> ✅ AQI acceptable for vegetables cultivation

**Recommendations:**
- Safe activities: Protected cultivation, early morning watering
- All outdoor activities can proceed normally
- Ideal time for transplanting seedlings

---

## 🌟 Impact

### For Farmers:
- ✅ **Informed Decision Making**: Know when it's safe to work outdoors
- ✅ **Crop Protection**: Prevent pollution-related yield loss
- ✅ **Resource Optimization**: Apply pesticides/fertilizers at optimal times
- ✅ **Health Safety**: Avoid working in hazardous air quality

### For Rural Communities:
- 🌱 **Sustainable Practices**: Encourages no-burn policies
- 💰 **Economic Benefits**: Better crop yields and quality
- 🏥 **Health Benefits**: Reduced exposure to harmful pollutants
- 📱 **Digital Literacy**: Access to climate-smart technology

---

## 🔮 Future Enhancements

- [ ] SMS/WhatsApp alerts for farmers without smartphones
- [ ] Regional language support (Hindi, Tamil, Telugu, etc.)
- [ ] Soil health integration with AQI data
- [ ] Crop yield prediction models
- [ ] Weather forecast integration (7-day predictions)
- [ ] Community forums for farmer knowledge sharing
- [ ] Government scheme integration and alerts
- [ ] Market price correlation with air quality

---

## 🎓 Educational Value

The farmer support features also serve as an **educational tool** to help farmers understand:
- How air pollution affects different crops
- Why burning crop residue is harmful
- Best practices for sustainable agriculture
- Importance of timing in farming activities
- Correlation between weather, air quality, and crop health

---

## 📞 Access Information

**Web Interface:** http://localhost:3000/health-tips
**API Endpoint:** http://localhost:8000/api/farming/suggestions

**Test Credentials:**
- Email: test@example.com
- Password: testpass123

---

## 🙏 Acknowledgments

This initiative aligns with:
- India's National Clean Air Programme (NCAP)
- Sustainable Development Goals (SDG 2: Zero Hunger, SDG 13: Climate Action)
- Digital India initiative for rural empowerment
- Climate-smart agriculture principles

---

**🌾 AirAware - Empowering Rural Agriculture with Air Quality Intelligence**

*"Connecting Air Quality Insights with Agricultural Decision-Making for a Sustainable Future"*

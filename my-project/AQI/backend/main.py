from fastapi import FastAPI, HTTPException, Depends, Query, Request, Header
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
from pymongo.errors import DuplicateKeyError
from pydantic import BaseModel
import requests
import os
import jwt
import logging
from datetime import datetime, timedelta
from apscheduler.schedulers.background import BackgroundScheduler
from passlib.context import CryptContext
import json
import sqlite3
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

app = FastAPI()

# Allow CORS for local dev frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB setup
MONGO_URI = os.getenv("MONGO_URI", "mongodb://mongo:27017/")
try:
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    db = client.airware
    logging.info("Connected to MongoDB successfully")
except Exception as e:
    logging.warning(f"MongoDB connection failed: {e}. Will use fallback data.")
    db = None

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Pydantic models
class UserRegistration(BaseModel):
    name: str
    email: str
    password: str
    city: str = None
    country: str = None
    occupation: str = None

class UserLogin(BaseModel):
    email: str
    password: str

class FeedbackData(BaseModel):
    rating: int
    category: str
    usageFrequency: str
    features: list[str]
    improvements: list[str] = []
    recommend: bool
    additionalFeedback: str = ""

class ChatMessage(BaseModel):
    content: str

# Security setup
SECRET_KEY = os.getenv("SECRET_KEY", "airware-secret-key")
ALGORITHM = "HS256"

def create_access_token(data: dict):
    """Create a JWT access token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=7)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# Define cities for AQI data fetching
cities = [
    {"name": "Pune", "query": "pune"},
    {"name": "Ahmedabad", "query": "ahmedabad"},
]

# WAQI API token - Your personal token for better performance
api_token = "7beb4e8158ba2a4bf6681b42a618fbb5ee9ca56d"

# Major Indian cities for real-time map data
india_cities = [
    {"name": "Delhi", "query": "delhi", "lat": 28.6139, "lng": 77.2090},
    {"name": "Mumbai", "query": "mumbai", "lat": 19.0760, "lng": 72.8777},
    {"name": "Bangalore", "query": "bangalore", "lat": 12.9716, "lng": 77.5946},
    {"name": "Chennai", "query": "chennai", "lat": 13.0827, "lng": 80.2707},
    {"name": "Kolkata", "query": "kolkata", "lat": 22.5726, "lng": 88.3639},
    {"name": "Hyderabad", "query": "hyderabad", "lat": 17.3850, "lng": 78.4867},
    {"name": "Pune", "query": "pune", "lat": 18.5204, "lng": 73.8567},
    {"name": "Ahmedabad", "query": "ahmedabad", "lat": 23.0225, "lng": 72.5714},
    {"name": "Jaipur", "query": "jaipur", "lat": 26.9124, "lng": 75.7873},
    {"name": "Lucknow", "query": "lucknow", "lat": 26.8467, "lng": 80.9462},
    {"name": "Kanpur", "query": "kanpur", "lat": 26.4499, "lng": 80.3319},
    {"name": "Nagpur", "query": "nagpur", "lat": 21.1458, "lng": 79.0882},
    {"name": "Patna", "query": "patna", "lat": 25.5941, "lng": 85.1376},
    {"name": "Ghaziabad", "query": "ghaziabad", "lat": 28.6692, "lng": 77.4538},
    {"name": "Surat", "query": "surat", "lat": 21.1702, "lng": 72.8311},
    {"name": "Chandigarh", "query": "chandigarh", "lat": 30.7333, "lng": 76.7794},
    {"name": "Noida", "query": "noida", "lat": 28.5355, "lng": 77.3910},
    {"name": "Faridabad", "query": "faridabad", "lat": 28.4089, "lng": 77.3178},
    {"name": "Gurugram", "query": "gurugram", "lat": 28.4595, "lng": 77.0266},
    {"name": "Visakhapatnam", "query": "visakhapatnam", "lat": 17.6868, "lng": 83.2185},
    {"name": "Bhopal", "query": "bhopal", "lat": 23.2599, "lng": 77.4126},
    {"name": "Coimbatore", "query": "coimbatore", "lat": 11.0168, "lng": 76.9558},
    {"name": "Agra", "query": "agra", "lat": 27.1767, "lng": 78.0081},
    {"name": "Varanasi", "query": "varanasi", "lat": 25.3176, "lng": 82.9739},
    {"name": "Jodhpur", "query": "jodhpur", "lat": 26.2389, "lng": 73.0243},
    {"name": "Amritsar", "query": "amritsar", "lat": 31.6340, "lng": 74.8723},
    {"name": "Raipur", "query": "raipur", "lat": 21.2514, "lng": 81.6296},
    {"name": "Ranchi", "query": "ranchi", "lat": 23.3441, "lng": 85.3096},
    {"name": "Kochi", "query": "kochi", "lat": 9.9312, "lng": 76.2673},
    {"name": "Thiruvananthapuram", "query": "thiruvananthapuram", "lat": 8.5241, "lng": 76.9366},
]

# Scheduled data fetching function
def fetch_aqi_data():
    """Fetch AQI data from WAQI API for configured cities"""
    try:
        logging.info("Running scheduled AQI data fetch...")
        for city in cities:
            try:
                url = f"https://api.waqi.info/feed/{city['query']}/"
                params = {"token": api_token}
                
                response = requests.get(url, params=params, timeout=10)
                if response.status_code == 200:
                    data = response.json()
                    if data.get('status') == 'ok':
                        processed_data = process_waqi_data(city, data['data'])
                        
                        if db:
                            try:
                                db.aqi_data.update_one(
                                    {"city": city['name']},
                                    {"$set": processed_data},
                                    upsert=True
                                )
                                logging.info(f"Updated AQI data for {city['name']}")
                            except Exception as db_error:
                                logging.warning(f"Could not store data in MongoDB for {city['name']}: {db_error}")
                    else:
                        logging.warning(f"WAQI API error for {city['name']}: {data.get('data', 'Unknown error')}")
                else:
                    logging.error(f"Failed to fetch data for {city['name']}: {response.status_code}")
            except Exception as e:
                logging.error(f"Error processing {city['name']}: {e}")
    except Exception as e:
        logging.error(f"Error in fetch_aqi_data: {e}")

# Initialize and start scheduler
scheduler = BackgroundScheduler()
scheduler.add_job(fetch_aqi_data, 'interval', minutes=15)
scheduler.start()

def process_waqi_data(city, data):
    """Process WAQI API results into our format"""
    processed = {
        "city": city['name'],
        "coordinates": {
            "lat": data.get('city', {}).get('geo', [0, 0])[0],
            "lng": data.get('city', {}).get('geo', [0, 0])[1]
        },
        "lastUpdated": datetime.now().isoformat(),
        "measurements": {},
        "aqi": data.get('aqi', 50) if isinstance(data.get('aqi'), int) else 50
    }
    
    # Extract individual pollutant measurements
    iaqi = data.get('iaqi', {})
    measurements = {}
    
    # Map WAQI parameters to our format
    param_mapping = {
        'pm25': 'pm25',
        'pm10': 'pm10',
        'o3': 'o3',
        'no2': 'no2',
        'so2': 'so2',
        'co': 'co'
    }
    
    for waqi_param, our_param in param_mapping.items():
        if waqi_param in iaqi and 'v' in iaqi[waqi_param]:
            measurements[our_param] = iaqi[waqi_param]['v']
    
    processed['measurements'] = measurements
    return processed

def calculate_aqi_from_pm25(pm25):
    """Calculate AQI from PM2.5 concentration (US EPA standard)"""
    if pm25 <= 12.0:
        return int(((50 - 0) / (12.0 - 0)) * (pm25 - 0) + 0)
    elif pm25 <= 35.4:
        return int(((100 - 51) / (35.4 - 12.1)) * (pm25 - 12.1) + 51)
    elif pm25 <= 55.4:
        return int(((150 - 101) / (55.4 - 35.5)) * (pm25 - 35.5) + 101)
    elif pm25 <= 150.4:
        return int(((200 - 151) / (150.4 - 55.5)) * (pm25 - 55.5) + 151)
    elif pm25 <= 250.4:
        return int(((300 - 201) / (250.4 - 150.5)) * (pm25 - 150.5) + 201)
    else:
        return int(((500 - 301) / (500.4 - 250.5)) * (pm25 - 250.5) + 301)

scheduler = BackgroundScheduler()
scheduler.add_job(fetch_aqi_data, 'interval', minutes=15)
scheduler.start()

# API endpoints
@app.get("/api/aqi")
async def get_aqi_data(
    location: str = Query(None),
    lat: float = Query(None),
    lng: float = Query(None)
):
    """Get air quality data for a location (by name or coordinates)"""
    
    if lat is not None and lng is not None:
        # Find nearest city from our database based on coordinates
        nearest_city = find_nearest_city(lat, lng)
        if nearest_city:
            return nearest_city
        else:
            # Fallback: fetch real-time data from OpenAQ for these coordinates
            return await fetch_realtime_data_by_coordinates(lat, lng)
    else:
        # Use location name
        if not location:
            location = "Delhi"  # Default to Delhi instead of New York
        
        try:
            # Try to get data from our database first
            city_data = db.aqi_data.find_one({"city": {"$regex": location, "$options": "i"}})
            
            if city_data:
                # Convert MongoDB data to our API format
                return format_city_data(city_data)
            else:
                # Fallback: fetch real-time data from WAQI
                return await fetch_realtime_data_by_city(location)
        except Exception as db_error:
            logging.warning(f"MongoDB not available: {db_error}")
            # Direct API call when database is not available
            return await fetch_realtime_data_by_city(location)

def find_nearest_city(lat, lng):
    """Find the nearest city from our database based on coordinates"""
    try:
        # Simple distance calculation to find nearest city
        min_distance = float('inf')
        nearest_city_data = None
        
        for city_data in db.aqi_data.find():
            city_lat = city_data.get('coordinates', {}).get('lat', 0)
            city_lng = city_data.get('coordinates', {}).get('lng', 0)
            
            # Calculate approximate distance
            distance = ((lat - city_lat) ** 2 + (lng - city_lng) ** 2) ** 0.5
            
            if distance < min_distance:
                min_distance = distance
                nearest_city_data = city_data
        
        # If nearest city is within reasonable range (about 50km)
        if min_distance < 0.5:  # Rough approximation
            return format_city_data(nearest_city_data)
        
        return None
    except Exception as e:
        logging.error(f"Error finding nearest city: {e}")
        return None

def format_city_data(city_data):
    """Format MongoDB city data for API response"""
    measurements = city_data.get('measurements', {})
    
    return {
        "location": city_data.get('city', 'Unknown'),
        "aqi": city_data.get('aqi', 0),
        "pm25": measurements.get('pm25', 0),
        "pm10": measurements.get('pm10', 0),
        "o3": measurements.get('o3', 0),
        "no2": measurements.get('no2', 0),
        "so2": measurements.get('so2', 0),
        "co": measurements.get('co', 0),
        "lastUpdated": city_data.get('lastUpdated', datetime.now().isoformat()),
        "coordinates": city_data.get('coordinates', {}),
        "forecast": [
            {"day": "Today", "temp": 22, "condition": "sunny", "aqi": city_data.get('aqi', 42)},
            {"day": "Tomorrow", "temp": 25, "condition": "partly-cloudy", "aqi": max(0, city_data.get('aqi', 42) + 10)},
            {"day": "Day 3", "temp": 20, "condition": "rain", "aqi": max(0, city_data.get('aqi', 42) - 5)},
            {"day": "Day 4", "temp": 28, "condition": "cloudy", "aqi": max(0, city_data.get('aqi', 42) + 15)},
            {"day": "Day 5", "temp": 30, "condition": "sunny", "aqi": city_data.get('aqi', 42)},
        ]
    }

async def fetch_realtime_data_by_coordinates(lat, lng):
    """Fetch real-time data from WAQI API using coordinates"""
    try:
        url = f"https://api.waqi.info/feed/geo:{lat};{lng}/"
        params = {"token": api_token}
        
        response = requests.get(url, params=params, timeout=10)
        if response.status_code == 200:
            data = response.json()
            if data.get('status') == 'ok':
                # Get actual city name from API response
                city_name = data['data'].get('city', {}).get('name', f"Location ({lat:.2f}, {lng:.2f})")
                city_info = {"name": city_name, "query": "geo"}
                processed_data = process_waqi_data(city_info, data['data'])
                return format_city_data(processed_data)
        
        # Fallback if API fails
        return {
            "location": f"Location ({lat:.2f}, {lng:.2f})",
            "aqi": 50,
            "pm25": 15,
            "pm10": 25,
            "o3": 30,
            "no2": 20,
            "so2": 5,
            "co": 1.0,
            "lastUpdated": datetime.now().isoformat(),
            "coordinates": {"lat": lat, "lng": lng},
            "forecast": [
                {"day": "Today", "temp": 22, "condition": "sunny", "aqi": 50},
                {"day": "Tomorrow", "temp": 25, "condition": "partly-cloudy", "aqi": 55},
                {"day": "Day 3", "temp": 20, "condition": "rain", "aqi": 38},
                {"day": "Day 4", "temp": 28, "condition": "cloudy", "aqi": 62},
                {"day": "Day 5", "temp": 30, "condition": "sunny", "aqi": 45},
            ]
        }
    except Exception as e:
        logging.error(f"Error fetching real-time data by coordinates: {e}")
        return await get_fallback_data(f"Location ({lat:.2f}, {lng:.2f})")

async def fetch_realtime_data_by_city(city_name):
    """Fetch real-time data from WAQI API using city name"""
    try:
        url = f"https://api.waqi.info/feed/{city_name.lower()}/"
        params = {"token": api_token}
        
        response = requests.get(url, params=params, timeout=10)
        if response.status_code == 200:
            data = response.json()
            if data.get('status') == 'ok':
                city_info = {"name": city_name, "query": city_name.lower()}
                processed_data = process_waqi_data(city_info, data['data'])
                return format_city_data(processed_data)
        
        return await get_fallback_data(city_name)
    except Exception as e:
        logging.error(f"Error fetching real-time data by city: {e}")
        return await get_fallback_data(city_name)

async def get_fallback_data(location):
    """Fallback data when APIs fail"""
    return {
        "location": location,
        "aqi": 50,
        "pm25": 15,
        "pm10": 25,
        "o3": 30,
        "no2": 20,
        "so2": 5,
        "co": 1.0,
        "lastUpdated": datetime.now().isoformat(),
        "forecast": [
            {"day": "Today", "temp": 22, "condition": "sunny", "aqi": 50},
            {"day": "Tomorrow", "temp": 25, "condition": "partly-cloudy", "aqi": 55},
            {"day": "Day 3", "temp": 20, "condition": "rain", "aqi": 38},
            {"day": "Day 4", "temp": 28, "condition": "cloudy", "aqi": 62},
            {"day": "Day 5", "temp": 30, "condition": "sunny", "aqi": 45},
        ]
    }

@app.get("/get_aqi")
async def get_aqi(city: str = Query(...)):
    """Get AQI for a specific city with category"""
    try:
        try:
            # Try to get data from our database first
            city_data = db.aqi_data.find_one({"city": {"$regex": city, "$options": "i"}})
            
            if city_data:
                aqi = city_data.get('aqi', 50)
                category = get_aqi_category(aqi)
                return {"city": city_data.get('city'), "aqi": aqi, "category": category}
            else:
                # Fallback: fetch from WAQI API
                aqi_data = await fetch_realtime_data_by_city(city)
                aqi = aqi_data.get('aqi', 50)
                category = get_aqi_category(aqi)
                return {"city": city, "aqi": aqi, "category": category}
        except Exception as db_error:
            logging.warning(f"MongoDB not available: {db_error}")
            # Direct API call when database is not available
            aqi_data = await fetch_realtime_data_by_city(city)
            aqi = aqi_data.get('aqi', 50)
            category = get_aqi_category(aqi)
            return {"city": city, "aqi": aqi, "category": category}
    except Exception as e:
        logging.error(f"Error getting AQI for {city}: {e}")
        return {"city": city, "aqi": 50, "category": "Moderate"}

def get_aqi_category(aqi):
    """Get AQI category based on AQI value"""
    if aqi <= 50:
        return "Good"
    elif aqi <= 100:
        return "Moderate"
    elif aqi <= 150:
        return "Unhealthy for Sensitive Groups"
    elif aqi <= 200:
        return "Unhealthy"
    elif aqi <= 300:
        return "Very Unhealthy"
    else:
        return "Hazardous"

@app.get("/get_forecast")
async def get_forecast(city: str = Query(...)):
    # Placeholder - will implement forecast logic
    return {"city": city, "forecast": []}

@app.get("/get_map_data")
async def get_map_data():
    # Placeholder - will implement map data
    return {"data": []}

@app.get("/top10_cities_india")
async def top10_cities_india():
    """Get top 10 Indian cities with their AQI data"""
    try:
        try:
            # Get all cities from database, sorted by AQI (highest first)
            cities = list(db.aqi_data.find().sort("aqi", -1).limit(10))
            
            if cities:
                result = []
                for city in cities:
                    result.append({
                        "city": city.get('city'),
                        "aqi": city.get('aqi', 50),
                        "category": get_aqi_category(city.get('aqi', 50)),
                        "pm25": city.get('measurements', {}).get('pm25', 0),
                        "coordinates": city.get('coordinates', {}),
                        "lastUpdated": city.get('lastUpdated')
                    })
                return {"cities": result}
            else:
                # If no data in database, return fallback cities with real data
                return {"cities": await get_realtime_indian_cities()}
        except Exception as db_error:
            logging.warning(f"MongoDB not available: {db_error}")
            # Fetch real-time data when database is not available
            return {"cities": await get_realtime_indian_cities()}
    except Exception as e:
        logging.error(f"Error getting top cities: {e}")
        return {"cities": get_fallback_indian_cities()}

async def get_realtime_indian_cities():
    """Get real-time data for Indian cities from WAQI API"""
    cities = [
        {"name": "Delhi", "query": "delhi"},
        {"name": "Mumbai", "query": "mumbai"},
        {"name": "Bangalore", "query": "bangalore"},
        {"name": "Chennai", "query": "chennai"},
        {"name": "Kolkata", "query": "kolkata"},
        {"name": "Hyderabad", "query": "hyderabad"},
        {"name": "Pune", "query": "pune"},
        {"name": "Ahmedabad", "query": "ahmedabad"},
    ]
    
    result = []
    for city in cities:
        try:
            city_data = await fetch_realtime_data_by_city(city['query'])
            if city_data:
                result.append({
                    "city": city['name'],
                    "aqi": city_data.get('aqi', 50),
                    "category": get_aqi_category(city_data.get('aqi', 50)),
                    "pm25": city_data.get('pm25', 0),
                    "coordinates": city_data.get('coordinates', {}),
                    "lastUpdated": city_data.get('lastUpdated')
                })
        except Exception as e:
            logging.error(f"Error fetching data for {city['name']}: {e}")
            # Add fallback data for this city
            fallback_data = get_fallback_indian_cities()
            fallback_city = next((c for c in fallback_data if c['city'] == city['name']), None)
            if fallback_city:
                result.append(fallback_city)
    
    return result[:10]  # Return top 10

def get_fallback_indian_cities():
    """Fallback Indian cities data"""
    return [
        {"city": "Delhi", "aqi": 156, "category": "Unhealthy", "pm25": 95, "coordinates": {"lat": 28.6139, "lng": 77.2090}},
        {"city": "Mumbai", "aqi": 132, "category": "Unhealthy for Sensitive Groups", "pm25": 78, "coordinates": {"lat": 19.0760, "lng": 72.8777}},
        {"city": "Kolkata", "aqi": 145, "category": "Unhealthy for Sensitive Groups", "pm25": 85, "coordinates": {"lat": 22.5726, "lng": 88.3639}},
        {"city": "Chennai", "aqi": 98, "category": "Moderate", "pm25": 42, "coordinates": {"lat": 13.0827, "lng": 80.2707}},
        {"city": "Bangalore", "aqi": 87, "category": "Moderate", "pm25": 35, "coordinates": {"lat": 12.9716, "lng": 77.5946}},
        {"city": "Hyderabad", "aqi": 112, "category": "Unhealthy for Sensitive Groups", "pm25": 52, "coordinates": {"lat": 17.3850, "lng": 78.4867}},
        {"city": "Pune", "aqi": 76, "category": "Moderate", "pm25": 28, "coordinates": {"lat": 18.5204, "lng": 73.8567}},
        {"city": "Ahmedabad", "aqi": 134, "category": "Unhealthy for Sensitive Groups", "pm25": 82, "coordinates": {"lat": 23.0225, "lng": 72.5714}},
    ]

@app.get("/get_tips")
async def get_tips(aqi: int = Query(...)):
    """Get health tips based on AQI level"""
    category = get_aqi_category(aqi)
    
    tips = {
        "Good": [
            "Air quality is excellent! Perfect time for outdoor activities.",
            "Enjoy outdoor sports and exercises.",
            "Great weather for jogging, cycling, or walking."
        ],
        "Moderate": [
            "Air quality is acceptable for most people.",
            "Sensitive individuals should consider limiting prolonged outdoor activities.",
            "Good time for moderate outdoor exercises."
        ],
        "Unhealthy for Sensitive Groups": [
            "People with respiratory conditions should limit outdoor activities.",
            "Children and elderly should reduce prolonged outdoor exposure.",
            "Consider wearing a mask if you must go outside.",
            "Keep windows closed and use air purifiers indoors."
        ],
        "Unhealthy": [
            "Everyone should avoid prolonged outdoor activities.",
            "Wear N95 masks when going outside.",
            "Keep windows and doors closed.",
            "Use air purifiers and avoid outdoor exercises.",
            "People with heart or lung conditions should stay indoors."
        ],
        "Very Unhealthy": [
            "Avoid all outdoor activities.",
            "Wear high-quality masks (N95/N99) if you must go outside.",
            "Keep all windows and doors sealed.",
            "Run air purifiers continuously.",
            "Consider relocating temporarily if possible."
        ],
        "Hazardous": [
            "Stay indoors at all times.",
            "Seal all openings and use multiple air purifiers.",
            "Avoid any outdoor exposure.",
            "Seek medical attention if experiencing breathing difficulties.",
            "Consider emergency relocation if air quality doesn't improve."
        ]
    }
    
    return {
        "aqi": aqi,
        "category": category,
        "tips": tips.get(category, tips["Moderate"])
    }

@app.get("/api/aqi/india")
async def get_india_aqi():
    """Get real-time air quality data for ALL available Indian stations from WAQI using geo-based search"""
    india_aqi_data = []
    seen_locations = set()  # Track unique locations to avoid duplicates
    
    try:
        # India's approximate bounding box coordinates
        # We'll sample multiple points across India to find all stations
        geo_samples = [
            # North India
            (28.7, 77.2),   # Delhi
            (30.7, 76.8),   # Chandigarh
            (26.9, 75.8),   # Jaipur
            (26.8, 80.9),   # Lucknow
            (25.6, 85.1),   # Patna
            (31.6, 74.9),   # Amritsar
            # West India
            (19.1, 72.9),   # Mumbai
            (23.0, 72.6),   # Ahmedabad
            (21.2, 72.8),   # Surat
            (18.5, 73.9),   # Pune
            (15.4, 73.8),   # Goa
            # South India
            (12.97, 77.6),  # Bangalore
            (13.1, 80.3),   # Chennai
            (11.0, 76.9),   # Coimbatore
            (17.4, 78.5),   # Hyderabad
            (9.9, 76.3),    # Kochi
            (8.5, 76.9),    # Trivandrum
            (15.9, 79.7),   # Nellore
            # East India
            (22.6, 88.4),   # Kolkata
            (20.3, 85.8),   # Bhubaneswar
            (26.2, 92.9),   # Guwahati
            (23.3, 85.3),   # Ranchi
            # Central India
            (23.3, 77.4),   # Bhopal
            (21.2, 81.6),   # Raipur
            (21.1, 79.1),   # Nagpur
            (22.7, 75.9),   # Indore
            (26.4, 80.3),   # Kanpur
            (28.7, 77.4),   # Ghaziabad/Noida
            (28.4, 77.3),   # Faridabad
            (28.5, 77.1),   # Gurugram
        ]
        
        logging.info(f"Searching for stations across {len(geo_samples)} locations in India")
        
        for lat, lng in geo_samples:
            try:
                # Use WAQI geo API to find nearest station
                url = f"https://api.waqi.info/feed/geo:{lat};{lng}/"
                params = {"token": api_token}
                
                response = requests.get(url, params=params, timeout=5)
                
                if response.status_code == 200:
                    data = response.json()
                    
                    if data.get('status') == 'ok':
                        city_data = data['data']
                        aqi_value = city_data.get('aqi', 0)
                        
                        # Skip invalid AQI values
                        if aqi_value == '-' or aqi_value < 0:
                            continue
                        
                        # Get location details
                        location_name = city_data.get('city', {}).get('name', 'Unknown')
                        geo_coords = city_data.get('city', {}).get('geo', [lat, lng])
                        
                        # Create unique key for this location
                        location_key = f"{location_name}_{geo_coords[0]:.3f}_{geo_coords[1]:.3f}"
                        
                        # Skip if we already have this location
                        if location_key in seen_locations:
                            continue
                        
                        seen_locations.add(location_key)
                        
                        # Extract PM2.5
                        pm25_value = 0
                        if 'iaqi' in city_data and 'pm25' in city_data['iaqi']:
                            pm25_value = city_data['iaqi']['pm25'].get('v', 0)
                        
                        india_aqi_data.append({
                            "location": location_name,
                            "lat": geo_coords[0],
                            "lng": geo_coords[1],
                            "aqi": aqi_value,
                            "pm25": pm25_value,
                            "lastUpdated": city_data.get('time', {}).get('iso', datetime.now().isoformat())
                        })
                        
                        logging.info(f"Found station: {location_name} (AQI: {aqi_value})")
                        
            except Exception as e:
                logging.error(f"Error fetching geo data for ({lat}, {lng}): {e}")
                continue
        
        logging.info(f"Successfully fetched data for {len(india_aqi_data)} unique Indian stations")
        
    except Exception as e:
        logging.error(f"Error in dynamic India AQI fetch: {e}")
    
    # If dynamic fetch got data, return it
    if india_aqi_data:
        return india_aqi_data
    
    # Fallback: use our predefined city list
    logging.warning("Dynamic fetch failed, falling back to predefined cities")
    for city in india_cities:
        try:
            url = f"https://api.waqi.info/feed/{city['query']}/"
            params = {"token": api_token}
            
            response = requests.get(url, params=params, timeout=5)
            
            if response.status_code == 200:
                data = response.json()
                
                if data.get('status') == 'ok':
                    city_data = data['data']
                    aqi_value = city_data.get('aqi', 0)
                    
                    # Extract PM2.5 from iaqi
                    pm25_value = 0
                    if 'iaqi' in city_data and 'pm25' in city_data['iaqi']:
                        pm25_value = city_data['iaqi']['pm25'].get('v', 0)
                    
                    # Use predefined coordinates or get from API
                    lat = city.get('lat', city_data.get('city', {}).get('geo', [0, 0])[0])
                    lng = city.get('lng', city_data.get('city', {}).get('geo', [0, 0])[1])
                    
                    india_aqi_data.append({
                        "location": city['name'],
                        "lat": lat,
                        "lng": lng,
                        "aqi": aqi_value,
                        "pm25": pm25_value,
                        "lastUpdated": city_data.get('time', {}).get('iso', datetime.now().isoformat())
                    })
                    
        except Exception as e:
            logging.error(f"Error fetching AQI for {city['name']}: {e}")
    
    # If we got data, return it; otherwise return fallback mock data
    if india_aqi_data:
        return india_aqi_data
    
    # Fallback mock data if all API calls fail
    logging.warning("All WAQI API calls failed, returning fallback mock data")
    return [
        {
            "location": "Delhi",
            "lat": 28.6139,
            "lng": 77.2090,
            "aqi": 156,
            "pm25": 95,
            "lastUpdated": datetime.now().isoformat()
        },
        {
            "location": "Mumbai",
            "lat": 19.0760,
            "lng": 72.8777,
            "aqi": 89,
            "pm25": 42,
            "lastUpdated": datetime.now().isoformat()
        },
        {
            "location": "Bangalore",
            "lat": 12.9716,
            "lng": 77.5946,
            "aqi": 65,
            "pm25": 32,
            "lastUpdated": datetime.now().isoformat()
        },
        {
            "location": "Kolkata",
            "lat": 22.5726,
            "lng": 88.3639,
            "aqi": 142,
            "pm25": 78,
            "lastUpdated": datetime.now().isoformat()
        },
        {
            "location": "Chennai",
            "lat": 13.0827,
            "lng": 80.2707,
            "aqi": 92,
            "pm25": 45,
            "lastUpdated": datetime.now().isoformat()
        },
        {
            "location": "Coimbatore",
            "lat": 11.0168,
            "lng": 76.9558,
            "aqi": 58,
            "pm25": 22,
            "lastUpdated": datetime.now().isoformat()
        },
        {
            "location": "Madurai",
            "lat": 9.9252,
            "lng": 78.1198,
            "aqi": 110,
            "pm25": 60,
            "lastUpdated": datetime.now().isoformat()
        },
        {
            "location": "Tiruchirappalli",
            "lat": 10.7905,
            "lng": 78.7047,
            "aqi": 135,
            "pm25": 80,
            "lastUpdated": datetime.now().isoformat()
        },
        {
            "location": "Salem",
            "lat": 11.6643,
            "lng": 78.1460,
            "aqi": 78,
            "pm25": 34,
            "lastUpdated": datetime.now().isoformat()
        },
        {
            "location": "Erode",
            "lat": 11.3410,
            "lng": 77.7172,
            "aqi": 48,
            "pm25": 16,
            "lastUpdated": datetime.now().isoformat()
        },
        {
            "location": "Puducherry",
            "lat": 11.9416,
            "lng": 79.8083,
            "aqi": 65,
            "pm25": 28,
            "lastUpdated": datetime.now().isoformat()
        }
    ]

@app.post("/submit_feedback")
async def submit_feedback(feedback_data: FeedbackData):
    """Submit user feedback"""
    try:
        # Prepare feedback document
        feedback_doc = {
            "rating": feedback_data.rating,
            "category": feedback_data.category,
            "usageFrequency": feedback_data.usageFrequency,
            "features": feedback_data.features,
            "improvements": feedback_data.improvements,
            "recommend": feedback_data.recommend,
            "additionalFeedback": feedback_data.additionalFeedback,
            "timestamp": datetime.now().isoformat(),
            "processed": False
        }
        
        # Try to save to MongoDB
        try:
            db.feedback.insert_one(feedback_doc)
            logging.info(f"Feedback saved to database: Rating {feedback_data.rating}, Category: {feedback_data.category}")
            return {
                "status": "success",
                "message": "Thank you for your feedback! It has been saved successfully.",
                "feedback_id": str(feedback_doc.get('_id'))
            }
        except Exception as db_error:
            # If MongoDB is not available, log the feedback
            logging.warning(f"MongoDB not available for feedback storage: {db_error}")
            logging.info(f"FEEDBACK RECEIVED - Rating: {feedback_data.rating}, Category: {feedback_data.category}, "
                        f"Usage: {feedback_data.usageFrequency}, Features: {feedback_data.features}, "
                        f"Improvements: {feedback_data.improvements}, Recommend: {feedback_data.recommend}, "
                        f"Additional: {feedback_data.additionalFeedback}")
            
            return {
                "status": "success", 
                "message": "Thank you for your feedback! It has been received and logged.",
                "note": "Feedback logged to server logs"
            }
            
    except Exception as e:
        logging.error(f"Error processing feedback: {e}")
        raise HTTPException(status_code=500, detail=f"Error processing feedback: {str(e)}")

@app.get("/feedback_stats")
async def get_feedback_stats():
    """Get feedback statistics (admin endpoint)"""
    try:
        try:
            # Get feedback statistics from MongoDB
            total_feedback = db.feedback.count_documents({})
            avg_rating = list(db.feedback.aggregate([
                {"$group": {"_id": None, "avg_rating": {"$avg": "$rating"}}}
            ]))
            
            category_stats = list(db.feedback.aggregate([
                {"$group": {"_id": "$category", "count": {"$sum": 1}}}
            ]))
            
            recent_feedback = list(db.feedback.find({}).sort("timestamp", -1).limit(5))
            
            return {
                "total_feedback": total_feedback,
                "average_rating": round(avg_rating[0]["avg_rating"], 2) if avg_rating else 0,
                "category_breakdown": {item["_id"]: item["count"] for item in category_stats},
                "recent_feedback": [
                    {
                        "rating": item["rating"],
                        "category": item["category"],
                        "timestamp": item["timestamp"]
                    } for item in recent_feedback
                ]
            }
        except Exception as db_error:
            logging.warning(f"MongoDB not available for feedback stats: {db_error}")
            return {
                "total_feedback": 0,
                "average_rating": 0,
                "category_breakdown": {},
                "recent_feedback": [],
                "note": "Database not available - statistics unavailable"
            }
            
    except Exception as e:
        logging.error(f"Error getting feedback stats: {e}")
        raise HTTPException(status_code=500, detail=f"Error getting feedback stats: {str(e)}")

# Authentication endpoints
@app.post("/auth/register")
async def register_user(user: UserRegistration):
    """Register a new user"""
    try:
        # Check if user already exists
        if db.users.find_one({"email": user.email}):
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Truncate password to 72 characters (bcrypt limit)
        password = user.password[:72]
        
        # Hash the password
        hashed_password = pwd_context.hash(password)
        
        # Store user in database
        user_data = {
            "email": user.email,
            "name": user.name,
            "password": hashed_password,
            "created_at": datetime.utcnow()
        }
        
        result = db.users.insert_one(user_data)
        
        # Create access token
        access_token = create_access_token(data={"sub": user.email})
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {"email": user.email, "name": user.name}
        }
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error registering user: {e}")
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")

@app.post("/auth/login")
async def login_user(user: UserLogin):
    """Login a user"""
    try:
        # Find user in database
        db_user = db.users.find_one({"email": user.email})
        
        if not db_user:
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        # Truncate password to 72 characters (bcrypt limit)
        password = user.password[:72]
        
        if not pwd_context.verify(password, db_user["password"]):
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        # Create access token
        access_token = create_access_token(data={"sub": user.email})
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {"email": db_user["email"], "name": db_user.get("name", "")}
        }
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error logging in user: {e}")
        raise HTTPException(status_code=500, detail=f"Login failed: {str(e)}")

@app.get("/auth/me")
async def get_current_user(authorization: str = Header(None)):
    """Get current user from token"""
    try:
        if not authorization or not authorization.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        token = authorization.split(" ")[1]
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        db_user = db.users.find_one({"email": email})
        
        if not db_user:
            raise HTTPException(status_code=401, detail="User not found")
        
        return {"email": db_user["email"], "name": db_user.get("name", "")}
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error getting current user: {e}")
        raise HTTPException(status_code=500, detail=f"Authentication failed: {str(e)}")

@app.post("/api/messages")
async def handle_chat_message(message: ChatMessage):
    """Handle chatbot messages and provide AI-powered responses about air quality"""
    try:
        user_message = message.content.lower().strip()
        
        # Simple chatbot logic for air quality queries
        if any(word in user_message for word in ['aqi', 'air quality', 'pollution', 'air']):
            if any(city in user_message for city in ['delhi', 'mumbai', 'bangalore', 'chennai', 'kolkata']):
                # Extract city name
                city = None
                for c in ['delhi', 'mumbai', 'bangalore', 'chennai', 'kolkata']:
                    if c in user_message:
                        city = c.title()
                        break
                
                if city:
                    try:
                        # Get actual AQI data for the city
                        city_data = db.aqi_data.find_one({"city": {"$regex": city, "$options": "i"}})
                        if city_data:
                            aqi = city_data.get('aqi', 50)
                            category = get_aqi_category(aqi)
                            response = f"The current AQI in {city} is {aqi}, which is considered {category}. "
                            
                            # Add health advice based on AQI
                            if aqi <= 50:
                                response += "Great news! The air quality is good for outdoor activities. 🌟"
                            elif aqi <= 100:
                                response += "Air quality is moderate. Most people can enjoy outdoor activities. 😊"
                            elif aqi <= 150:
                                response += "Sensitive individuals should limit prolonged outdoor activities. Consider wearing a mask. 😷"
                            elif aqi <= 200:
                                response += "Everyone should avoid prolonged outdoor activities. Wear N95 masks when going outside. ⚠️"
                            else:
                                response += "Air quality is very poor. Stay indoors and avoid outdoor activities. 🚨"
                        else:
                            response = f"I don't have current data for {city}, but I can help you with general air quality information!"
                    except Exception as e:
                        response = f"I'd love to help with {city}'s air quality, but I'm having trouble accessing the latest data right now."
                else:
                    response = "I can help you check air quality for major Indian cities like Delhi, Mumbai, Bangalore, Chennai, and Kolkata. Which city would you like to know about?"
            else:
                response = "I can help you with air quality information! Try asking about specific cities like Delhi, Mumbai, or Bangalore, or ask general questions about AQI and health tips."
        
        elif any(word in user_message for word in ['health', 'tips', 'advice', 'recommend']):
            response = "Here are some general air quality health tips:\n\n• Check AQI before outdoor activities\n• Wear N95 masks when AQI > 100\n• Keep windows closed during high pollution\n• Use air purifiers indoors\n• Avoid outdoor exercise when AQI > 150\n\nWould you like specific advice for your city?"
        
        elif any(word in user_message for word in ['hello', 'hi', 'hey', 'help']):
            response = "Hello! 👋 I'm your AirWare assistant. I can help you with:\n\n• Current air quality in Indian cities\n• Health tips based on AQI levels\n• Understanding pollution levels\n• Safety recommendations\n\nWhat would you like to know about air quality today?"
        
        elif any(word in user_message for word in ['forecast', 'tomorrow', 'prediction']):
            response = "I can provide current air quality data, but weather and AQI forecasting requires specialized meteorological models. For now, I recommend checking current conditions and planning accordingly. Would you like to know today's AQI for any specific city?"
        
        elif any(word in user_message for word in ['pm2.5', 'pm10', 'ozone', 'no2', 'pollutants']):
            response = "Air quality is measured using several pollutants:\n\n• PM2.5: Fine particles that can penetrate lungs\n• PM10: Larger particles from dust and smoke\n• Ozone: Ground-level ozone, harmful to respiratory system\n• NO2: Nitrogen dioxide from vehicles and industry\n• SO2: Sulfur dioxide from fossil fuels\n\nWould you like current levels for any specific city?"
        
        else:
            response = "I'm here to help with air quality questions! You can ask me about:\n\n• Current AQI in Indian cities\n• Health and safety tips\n• Understanding air pollution\n• What different AQI levels mean\n\nWhat would you like to know?"
        
        return {"content": response, "timestamp": datetime.now().isoformat()}
        
    except Exception as e:
        logging.error(f"Error in chatbot: {e}")
        return {
            "content": "I'm sorry, I'm having trouble processing your message right now. Please try again or ask about air quality in specific cities like Delhi, Mumbai, or Bangalore.",
            "timestamp": datetime.now().isoformat()
        }

@app.get("/api/farming/suggestions")
async def get_farming_suggestions(
    location: str = None,
    lat: float = None, 
    lng: float = None,
    crop: str = None
):
    """
    Get AI-based farming suggestions based on current AQI, weather, and season
    Provides crop-specific alerts and recommendations for farmers
    """
    try:
        # Get current AQI data
        if lat and lng:
            aqi_data = await fetch_realtime_data_by_coordinates(lat, lng)
        elif location:
            aqi_data = await fetch_realtime_data_by_city(location)
        else:
            aqi_data = {"aqi": 50, "location": "India"}
        
        aqi = aqi_data.get("aqi", 50)
        current_location = aqi_data.get("location", location or "your area")
        pm25 = aqi_data.get("pm25", 0)
        pm10 = aqi_data.get("pm10", 0)
        
        # Determine current season (simplified for India)
        month = datetime.now().month
        if month in [12, 1, 2]:
            season = "Winter"
        elif month in [3, 4, 5]:
            season = "Summer"
        elif month in [6, 7, 8, 9]:
            season = "Monsoon"
        else:
            season = "Post-Monsoon"
        
        # Crop-specific recommendations
        crop_alerts = []
        
        # Common crops in India
        crops_db = {
            "rice": {
                "sensitive_aqi": 100,
                "alert_message": "Rice paddy is sensitive to high pollution. PM2.5 can reduce photosynthesis.",
                "safe_activities": ["Early morning irrigation (5-7 AM)", "Evening fertilizer application"],
                "avoid_activities": ["Midday pesticide spraying", "Burning crop residue"],
                "optimal_conditions": "AQI < 100, Humidity > 60%"
            },
            "wheat": {
                "sensitive_aqi": 120,
                "alert_message": "Wheat growth affected by prolonged exposure to high AQI levels.",
                "safe_activities": ["Morning harvesting", "Soil preparation"],
                "avoid_activities": ["Chemical spraying during high AQI"],
                "optimal_conditions": "AQI < 120, Cool mornings for harvesting"
            },
            "cotton": {
                "sensitive_aqi": 110,
                "alert_message": "Cotton requires clean air for optimal fiber quality.",
                "safe_activities": ["Early morning picking", "Drip irrigation"],
                "avoid_activities": ["Pesticide spraying when AQI > 100"],
                "optimal_conditions": "AQI < 110, Low humidity periods"
            },
            "sugarcane": {
                "sensitive_aqi": 130,
                "alert_message": "Sugarcane moderately tolerant to pollution but growth can be affected.",
                "safe_activities": ["Irrigation anytime", "Harvesting in early hours"],
                "avoid_activities": ["Field burning"],
                "optimal_conditions": "AQI < 130, Adequate moisture"
            },
            "vegetables": {
                "sensitive_aqi": 80,
                "alert_message": "Leafy vegetables highly sensitive to air pollution. Can absorb pollutants.",
                "safe_activities": ["Protected cultivation", "Early morning watering"],
                "avoid_activities": ["Open field cultivation during high AQI", "Harvesting in polluted conditions"],
                "optimal_conditions": "AQI < 80, Use protective nets"
            },
            "pulses": {
                "sensitive_aqi": 100,
                "alert_message": "Pulses can tolerate moderate pollution but yields may decrease.",
                "safe_activities": ["Normal irrigation", "Organic fertilizer application"],
                "avoid_activities": ["Chemical spraying when AQI > 100"],
                "optimal_conditions": "AQI < 100, Well-drained soil"
            }
        }
        
        # Generate crop-specific alert if crop is specified
        if crop:
            crop_lower = crop.lower()
            if crop_lower in crops_db:
                crop_info = crops_db[crop_lower]
                if aqi > crop_info["sensitive_aqi"]:
                    crop_alerts.append({
                        "severity": "warning",
                        "crop": crop,
                        "message": f"⚠️ AQI harmful for {crop} – {crop_info['alert_message']}",
                        "recommendation": f"Avoid: {', '.join(crop_info['avoid_activities'])}",
                        "safe_actions": crop_info['safe_activities']
                    })
                else:
                    crop_alerts.append({
                        "severity": "safe",
                        "crop": crop,
                        "message": f"✅ AQI acceptable for {crop} cultivation",
                        "recommendation": f"Safe activities: {', '.join(crop_info['safe_activities'])}",
                        "optimal": crop_info['optimal_conditions']
                    })
        
        # General farming recommendations based on AQI
        general_recommendations = []
        
        if aqi <= 50:
            general_recommendations = [
                {
                    "title": "Excellent Conditions",
                    "icon": "🌾",
                    "activities": [
                        "All outdoor farming activities can proceed normally",
                        "Ideal time for pesticide/fertilizer application",
                        "Good conditions for transplanting seedlings",
                        "Safe for livestock grazing"
                    ]
                }
            ]
        elif aqi <= 100:
            general_recommendations = [
                {
                    "title": "Moderate Conditions",
                    "icon": "🌱",
                    "activities": [
                        "Most farming activities can continue",
                        "Prefer early morning (5-8 AM) for chemical spraying",
                        "Use protective equipment for prolonged outdoor work",
                        "Monitor sensitive crops closely"
                    ]
                }
            ]
        elif aqi <= 150:
            general_recommendations = [
                {
                    "title": "Caution Required",
                    "icon": "⚠️",
                    "activities": [
                        "Limit duration of outdoor work to essential tasks",
                        "Avoid pesticide spraying - pollutants can react with chemicals",
                        "Use drip irrigation instead of spray irrigation",
                        "Keep livestock in covered areas",
                        "Postpone harvesting if possible"
                    ]
                }
            ]
        else:
            general_recommendations = [
                {
                    "title": "High Alert",
                    "icon": "🚨",
                    "activities": [
                        "Minimize all outdoor farming activities",
                        "Do not spray any chemicals - wait for AQI to improve",
                        "Keep livestock indoors with adequate ventilation",
                        "Use protective masks (N95) if outdoor work is essential",
                        "Delay harvesting and field preparation",
                        "Monitor crop health for pollution damage"
                    ]
                }
            ]
        
        # AI-based seasonal suggestions
        seasonal_suggestions = []
        
        if season == "Winter":
            seasonal_suggestions = [
                {
                    "period": "Rabi Season (Winter Crops)",
                    "crops": ["Wheat", "Barley", "Mustard", "Chickpea"],
                    "sowing": "November-December is ideal for rabi crops",
                    "harvest": "March-April harvesting period",
                    "aqi_impact": "Winter often has higher AQI in North India - monitor daily",
                    "tips": [
                        "Sow wheat early if AQI predictions show improvement",
                        "Use mulching to protect crops from cold and pollution",
                        "Avoid stubble burning - contributes to high AQI"
                    ]
                }
            ]
        elif season == "Summer":
            seasonal_suggestions = [
                {
                    "period": "Summer Season",
                    "crops": ["Rice preparation", "Cotton", "Pulses"],
                    "sowing": "Prepare fields for kharif crops",
                    "harvest": "Late rabi crop harvesting",
                    "aqi_impact": "Better air quality expected, but dust storms possible",
                    "tips": [
                        "Complete harvesting early morning to avoid dust",
                        "Prepare soil with organic matter",
                        "Plan irrigation schedules efficiently"
                    ]
                }
            ]
        elif season == "Monsoon":
            seasonal_suggestions = [
                {
                    "period": "Kharif Season (Monsoon Crops)",
                    "crops": ["Rice", "Maize", "Cotton", "Soybean"],
                    "sowing": "June-July is prime sowing time",
                    "harvest": "September-October harvesting",
                    "aqi_impact": "Rain helps clear pollutants - generally better air quality",
                    "tips": [
                        "Monsoon rains naturally improve AQI",
                        "Focus on water management and drainage",
                        "Watch for pest activity in humid conditions",
                        "Good time for transplanting rice"
                    ]
                }
            ]
        else:
            seasonal_suggestions = [
                {
                    "period": "Post-Monsoon Season",
                    "crops": ["Vegetable crops", "Rabi preparation"],
                    "sowing": "Prepare for rabi season sowing",
                    "harvest": "Late kharif crop harvesting",
                    "aqi_impact": "AQI may rise due to stubble burning - be cautious",
                    "tips": [
                        "Avoid burning crop residue - use as mulch instead",
                        "Complete kharif harvesting quickly",
                        "Prepare fields for winter crops",
                        "Monitor AQI before chemical applications"
                    ]
                }
            ]
        
        # Best practices for pollution management
        pollution_management = {
            "preventive_measures": [
                "Plant tree barriers around fields (Neem, Peepal, Bamboo)",
                "Use organic farming methods to reduce chemical pollution",
                "Avoid crop residue burning - use decomposition methods",
                "Install drip irrigation to minimize water waste and dust"
            ],
            "aqi_monitoring_tips": [
                "Check AQI daily before planning outdoor activities",
                "Best farming hours: 5-8 AM when AQI is typically lower",
                "Avoid chemical application when AQI > 100",
                "Use AirAware app for real-time location-based alerts"
            ],
            "crop_protection": [
                "Wash vegetables thoroughly before consumption or sale",
                "Use anti-transpirant sprays on sensitive crops during high AQI",
                "Consider protected cultivation for high-value crops",
                "Select pollution-tolerant crop varieties when possible"
            ]
        }
        
        return {
            "location": current_location,
            "current_aqi": aqi,
            "season": season,
            "pm25": pm25,
            "pm10": pm10,
            "crop_specific_alerts": crop_alerts if crop_alerts else None,
            "general_recommendations": general_recommendations,
            "seasonal_suggestions": seasonal_suggestions,
            "pollution_management": pollution_management,
            "timestamp": datetime.now().isoformat(),
            "message": "🌾 AirAware Farmer Support - Empowering Rural Agriculture with Air Quality Intelligence"
        }
        
    except Exception as e:
        logging.error(f"Error generating farming suggestions: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate farming suggestions: {str(e)}")

# Root endpoint
@app.get("/")
def read_root():
    return {"message": "AirAware API is running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

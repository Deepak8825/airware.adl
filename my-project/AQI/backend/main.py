from fastapi import FastAPI, HTTPException, Depends, Query, Request
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

# Security setup
SECRET_KEY = os.getenv("SECRET_KEY", "airware-secret-key")
ALGORITHM = "HS256"
scheduler = BackgroundScheduler()
scheduler.add_job(fetch_aqi_data, 'interval', minutes=15)
scheduler.start()

# Define cities for AQI data fetching
cities = [
    {"name": "Pune", "query": "pune"},
    {"name": "Ahmedabad", "query": "ahmedabad"},
]

# WAQI API token (free tier allows ~1000 requests/day)
api_token = "demo"  # Use 'demo' for testing, get your own token from waqi.info

for city in cities:
    try:
        # Fetch data from WAQI API
        url = f"https://api.waqi.info/feed/{city['query']}/"
        params = {"token": api_token}
        
        response = requests.get(url, params=params, timeout=10)
        if response.status_code == 200:
            data = response.json()
            if data.get('status') == 'ok':
                # Process and store the data
                processed_data = process_waqi_data(city, data['data'])
                
                try:
                    # Store in MongoDB
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
        params = {"token": "demo"}
        
        response = requests.get(url, params=params, timeout=10)
        if response.status_code == 200:
            data = response.json()
            if data.get('status') == 'ok':
                city_info = {"name": f"Location ({lat:.2f}, {lng:.2f})", "query": "geo"}
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
        params = {"token": "demo"}
        
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
    """Get air quality data for major Indian cities"""
    # In a real implementation, this would fetch from OpenAQ API
    # For now, return mock data for demonstration
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

# Root endpoint
@app.get("/")
def read_root():
    return {"message": "AirAware API is running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

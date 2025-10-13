from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict, Any
import logging
import json
import os
import uuid
from openai import OpenAI, OpenAIError
from fastapi.responses import Response
from dotenv import load_dotenv

# Explicitly specify the path to the .env file
load_dotenv(dotenv_path="/app/.env")

# Configure logging to ensure all messages are displayed in the terminal
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

api_key = os.environ.get("GROQ_API_KEY")
if not api_key:
    # This will stop the server on startup if the key is missing,
    # providing a clear error message.
    raise ValueError("GROQ_API_KEY environment variable not found. Please create a .env file and add your key.")

client = OpenAI(
    api_key=api_key,
    base_url="https://api.groq.com/openai/v1",
)

# Read model from env so we can change it without editing code / rebuilding often.
# Set GROQ_MODEL in your .env or environment to a currently supported Groq model.
DEFAULT_MODEL = os.environ.get("GROQ_MODEL", "llama3-8b-8192")


app = FastAPI()

# Allow requests from the React frontend which runs on localhost:3000 or 3001
origins = [
    "http://localhost:3000",  # The default origin for a React development server
    "http://localhost:3001",  # Alternative port if 3000 is busy
    # You can add other origins here if needed, e.g., your deployed frontend URL
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Message(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    content: str
    sender: str  # "user" or "bot"

MEMORY_FILE = "memory.json"

# In-memory list to store messages, starting with a welcome message.
messages_db: List[Message] = [
    Message(content="Hey Deepu!!🤩, Missed Me ?🤍🌸", sender="bot"),
]

def load_memory() -> Dict[str, Any]:
    """Loads key-value memory from a JSON file."""
    try:
        with open(MEMORY_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        logging.warning(f"{MEMORY_FILE} not found or is invalid. Using default empty memory.")
        return {}


def get_active_models_from_api(max_models: int = 10) -> List[str]:
    """Query the Groq /models endpoint (via the OpenAI client) and return a list
    of model ids that are marked active. This is used as a runtime fallback when
    configured candidates are decommissioned so the server can pick a replacement
    without a rebuild.

    If the models endpoint cannot be reached (TLS/network issue or API key
    problem), this returns an empty list and the normal local fallback will be used.
    """
    try:
        logging.info("Querying Groq /models endpoint for active models...")
        # The OpenAI client wrapper exposes a models.list() method. We call it
        # and extract model ids where active is truthy.
        resp = client.models.list()
        data = getattr(resp, 'data', None) or resp.get('data') if isinstance(resp, dict) else None
        if not data:
            logging.warning("No data field in models.list() response; returning empty list.")
            return []
        active = []
        for item in data:
            # item may be a dict-like or object depending on client version
            model_id = item.get('id') if isinstance(item, dict) else getattr(item, 'id', None)
            is_active = item.get('active') if isinstance(item, dict) else getattr(item, 'active', None)
            if model_id and is_active:
                active.append(model_id)
                if len(active) >= max_models:
                    break
        logging.info(f"Found active models from API: {active}")
        return active
    except Exception as e:
        logging.error(f"Could not retrieve models list from API: {e}", exc_info=True)
        return []

@app.get('/favicon.ico', include_in_schema=False)
async def favicon():
    """Handler for browser favicon requests."""
    # Return a 200 OK with an empty body and appropriate media type
    # This is often more robust than 204 No Content for favicon requests
    return Response(content=b"", media_type="image/x-icon", status_code=200)

@app.get("/")
async def read_root():
    return {"message": "Welcome to the AQI Chatbot API!"}

@app.get("/api/messages", response_model=List[Message])
def get_messages():
    """Retrieve all messages."""
    logging.info("GET /api/messages: Retrieving all messages for initial chat load.")
    return messages_db



@app.post("/api/messages", response_model=Message)
def post_message(message: Message):
    logging.info("Endpoint /api/messages hit. Processing new message.")
    # Add the user's message to our in-memory database
    messages_db.append(message)

    # --- Load memory and construct the system prompt ---
    memory = load_memory()
    bot_name = memory.get("bot_name", "Rino")
    user_name = memory.get("user_name", "the user")

    # Start with a base prompt
    system_prompt_parts = [
        f"You are {bot_name}, a helpful and friendly chatbot.",
        f"You are currently talking to {user_name}.",
    ]
    # Add any other facts from memory, ignoring bot/user names
    other_facts = {k: v for k, v in memory.items() if k not in ["bot_name", "user_name"]}
    if other_facts:
        fact_string = ", ".join([f"{key.replace('_', ' ')} is {value}" for key, value in other_facts.items()])
        system_prompt_parts.append(f"Remember these facts: {fact_string}.")

    system_prompt = " ".join(system_prompt_parts)

    # Prepare the conversation history for the API call
    history = [{"role": "system", "content": system_prompt}]
    for msg in messages_db:
        # The API uses "assistant" for the bot's role
        role = "assistant" if msg.sender == "bot" else "user"
        history.append({"role": role, "content": msg.content})

    logging.info("--- Sending data to Groq API ---")
    logging.info(f"History payload: {history}")

    # Build a list of candidate models to try in order. This lets the server attempt alternatives
    # without requiring a rebuild every time a model is deprecated.
    env_candidates = os.environ.get("GROQ_MODEL_CANDIDATES", "").strip()
    candidates = [c.strip() for c in ([DEFAULT_MODEL] + (env_candidates.split(",") if env_candidates else [])) if c.strip()]
    logging.info(f"Model candidates (ordered): {candidates}")

    bot_reply = None
    used_model = None
    for candidate in candidates:
        logging.info(f"Attempting model: {candidate}")
        try:
            response = client.chat.completions.create(
                model=candidate,
                messages=history,
                max_tokens=150,
                temperature=0.7,
            )
            logging.info(f"--- Received successful response from API using model {candidate} ---")
            logging.info(f"API Response object: {response}")
            bot_reply = response.choices[0].message.content.strip() if response.choices[0].message.content else "I'm not sure how to respond to that."
            used_model = candidate
            break
        except OpenAIError as e:
            logging.error(f"!!! OpenAI API Error with model {candidate}: {e}", exc_info=True)
            err_text = str(e)
            # If the model is decommissioned, try the next candidate.
            if 'model_decommissioned' in err_text or 'decommissioned' in err_text:
                logging.warning(f"Model {candidate} decommissioned; trying next candidate if available.")
                # continue to the next configured candidate
                continue
            else:
                # For other API errors, stop trying and return an error message.
                bot_reply = "Sorry, there was an API error. Please check the server logs."
                used_model = candidate
                break
        except Exception as e:
            logging.error(f"!!! Unexpected error when calling model {candidate}: {type(e).__name__} - {e}", exc_info=True)
            bot_reply = "An unexpected error occurred on the server. Please check the logs."
            used_model = candidate
            break

    # If none of the candidates returned a reply, provide a local fallback to keep chat responsive.
    if bot_reply is None:
        # As a last-ditch effort, query the models endpoint at runtime and try
        # a few active models (excluding ones we already tried). This avoids
        # requiring a rebuild when Groq decommissions a model.
        runtime_models = get_active_models_from_api(max_models=8)
        # Remove any models already in 'candidates' to avoid retrying.
        runtime_candidates = [m for m in runtime_models if m not in candidates]
        if runtime_candidates:
            logging.info(f"Runtime-discovered candidates (excluding tried): {runtime_candidates}")
            for candidate in runtime_candidates:
                logging.info(f"Attempting runtime candidate model: {candidate}")
                try:
                    response = client.chat.completions.create(
                        model=candidate,
                        messages=history,
                        max_tokens=150,
                        temperature=0.7,
                    )
                    logging.info(f"--- Received successful response from API using runtime model {candidate} ---")
                    logging.info(f"API Response object: {response}")
                    bot_reply = response.choices[0].message.content.strip() if response.choices[0].message.content else "I'm not sure how to respond to that."
                    used_model = candidate
                    break
                except Exception as e:
                    logging.error(f"Runtime candidate {candidate} failed: {type(e).__name__} - {e}", exc_info=True)
                    continue

    # If still no bot_reply, fall back locally
    if bot_reply is None:
        last_user = next((m.content for m in reversed(messages_db) if m.sender == 'user'), message.content)
        bot_reply = f"(Local fallback) I couldn't reach any configured models ({', '.join(candidates)}). You said: '{last_user}'. Please set GROQ_MODEL to a supported model and rebuild the backend."
        logging.error(f"No candidate models succeeded. Candidates tried: {candidates}")

    # Create the bot's response and add it to the database
    logging.info(f"Final bot reply: '{bot_reply}'")
    bot_response = Message(content=bot_reply, sender="bot")
    messages_db.append(bot_response)
    return bot_response


@app.get('/health')
def health_check():
    """Simple health endpoint: reports whether we can reach Groq's models endpoint
    and includes a short sample of active models when available. This helps debug
    TLS/network issues quickly without sending a full chat message.
    """
    try:
        models = get_active_models_from_api(max_models=5)
        reachable = bool(models)
        return {"ok": reachable, "models_sample": models}
    except Exception as e:
        logging.error(f"Health check failed: {e}", exc_info=True)
        return {"ok": False, "error": str(e)}
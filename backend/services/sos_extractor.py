import os
import json
import uuid
from typing import Any, Dict

import requests
from dotenv import load_dotenv
from pathlib import Path
from .sos_schema import SOSExtraction


# ============================================================
# LOAD ENVIRONMENT VARIABLES
# ============================================================

load_dotenv(
    Path(__file__).resolve().parent / ".env"
)

LYZR_API_KEY = os.getenv("LYZR_API_KEY")
LYZR_AGENT_ID = os.getenv("LYZR_AGENT_ID")
LYZR_USER_ID = os.getenv("LYZR_USER_ID", "floodguard")

LYZR_URL = "https://agent-prod.studio.lyzr.ai/v3/inference/chat/"


if not LYZR_API_KEY:
    raise RuntimeError(
        "LYZR_API_KEY not found. "
        "Check your .env file."
    )

if not LYZR_AGENT_ID:
    raise RuntimeError(
        "LYZR_AGENT_ID not found. "
        "Check your .env file."
    )


# ============================================================
# LYZR SOS EXTRACTION
# ============================================================

def extract_sos_llm(message: str) -> Dict[str, Any]:
    """
    Extract structured SOS information using the
    FloodGuard SOS Extractor Lyzr agent.

    The function keeps the same interface as the
    previous Gemini implementation so the rest of
    Feature 3 does not need to change.
    """

    if not message or not message.strip():
        raise ValueError("Message cannot be empty.")

    # --------------------------------------------------------
    # Create a fresh session for each SOS.
    #
    # This prevents one SOS conversation from influencing
    # another SOS message.
    # --------------------------------------------------------

    session_id = str(uuid.uuid4())

    payload = {
        "user_id": LYZR_USER_ID,
        "agent_id": LYZR_AGENT_ID,
        "session_id": session_id,
        "message": message
    }

    headers = {
        "Content-Type": "application/json",
        "x-api-key": LYZR_API_KEY
    }

    # --------------------------------------------------------
    # Call Lyzr Agent API
    # --------------------------------------------------------

    response = requests.post(
        LYZR_URL,
        headers=headers,
        json=payload,
        timeout=60
    )

    # Raise an exception for HTTP errors
    response.raise_for_status()

    # --------------------------------------------------------
    # Parse Lyzr response
    # --------------------------------------------------------

    data = response.json()

    print("\nLYZR RAW RESPONSE:")
    print(
        json.dumps(
            data,
            indent=2,
            ensure_ascii=False
        )
    )

    # --------------------------------------------------------
    # Extract agent response
    # --------------------------------------------------------

    raw_output = data.get("response")

    if raw_output is None:
        raise RuntimeError(
            "Lyzr response did not contain "
            "'response'. Full response:\n"
            + json.dumps(
                data,
                indent=2,
                ensure_ascii=False
            )
        )

    # --------------------------------------------------------
    # Convert JSON string → Python dictionary
    # --------------------------------------------------------

    if isinstance(raw_output, str):

        raw_output = raw_output.strip()

        # Handle markdown JSON fences if returned
        if raw_output.startswith("```"):

            raw_output = raw_output.replace(
                "```json",
                ""
            )

            raw_output = raw_output.replace(
                "```",
                ""
            )

            raw_output = raw_output.strip()

        try:
            extracted_data = json.loads(
                raw_output
            )

        except json.JSONDecodeError as e:

            raise RuntimeError(
                "Lyzr returned invalid JSON:\n"
                + raw_output
            ) from e

    elif isinstance(raw_output, dict):

        extracted_data = raw_output

    else:

        raise RuntimeError(
            "Unexpected Lyzr response type: "
            + str(type(raw_output))
        )

    # --------------------------------------------------------
    # Validate using existing Feature 3 schema
    # --------------------------------------------------------

    validated = SOSExtraction.model_validate(
        extracted_data
    )

    # --------------------------------------------------------
    # Return exactly the same type expected by
    # the rest of Feature 3
    # --------------------------------------------------------

    return validated.model_dump()
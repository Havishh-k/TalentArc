import os
import json
import asyncio
from typing import List, Dict, Any
from anthropic import AsyncAnthropic
from tenacity import retry, wait_exponential, stop_after_attempt, retry_if_exception_type
from dotenv import load_dotenv

load_dotenv()

# We only instantiate the client if we're actually going to use it (Phase 2).
# This prevents Anthropic dependency issues in Phase 3.
def get_llm_client():
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        raise ValueError("ANTHROPIC_API_KEY is not set.")
    return AsyncAnthropic(api_key=api_key)

# The prompt asks the LLM to extract verified skills and action verbs.
# We instruct it to return strict JSON matching our parquet schema needs.
EXTRACTION_PROMPT = """
You are an expert technical recruiter and auditor. 
Your task is to extract "Action-Object Decoupled" skills from a candidate's career history.
For every distinct skill or technology the candidate claims, find the STRONGEST action verb associated with it in their responsibilities.

Evaluate the 'verb_strength_score' from 0.0 to 1.0 (e.g., "Built", "Architected", "Spearheaded" = 0.9-1.0; "Used", "Maintained", "Participated" = 0.3-0.5; "Familiar with" = 0.1).
If a skill is listed but has no supporting narrative action in their responsibilities, set 'verified_boolean' to false and 'verb_strength_score' to 0.0.

Return ONLY a JSON array of objects with this exact structure:
[
  {
    "skill_name": "string",
    "action_verb": "string (the primary verb they used)",
    "verified_boolean": boolean,
    "verb_strength_score": float
  }
]
"""

@retry(
    wait=wait_exponential(multiplier=1, min=2, max=10),
    stop=stop_after_attempt(3),
    retry=retry_if_exception_type(Exception)
)
async def extract_candidate_skills(client: AsyncAnthropic, candidate_id: str, career_history: List[Dict]) -> List[Dict]:
    """
    Calls Anthropic Haiku to extract decoupled skills.
    Retries up to 3 times on failure using tenacity.
    """
    if not career_history:
        return []
        
    # Simplify career history into a text block to save tokens
    history_text = ""
    for role in career_history:
        history_text += f"Role: {role.get('role_title', 'Unknown')} at {role.get('company', 'Unknown')}\n"
        history_text += f"Responsibilities: {', '.join(role.get('responsibilities', []))}\n"
        history_text += f"Technologies listed: {', '.join(role.get('technologies', []))}\n\n"

    try:
        message = await client.messages.create(
            model="claude-3-haiku-20240307",
            max_tokens=1000,
            temperature=0.0,
            system=EXTRACTION_PROMPT,
            messages=[
                {"role": "user", "content": f"Analyze this candidate's history:\n\n{history_text}"}
            ]
        )
        
        # Parse the JSON response
        response_text = message.content[0].text.strip()
        # Handle potential markdown code blocks
        if response_text.startswith("```json"):
            response_text = response_text[7:-3].strip()
        elif response_text.startswith("```"):
            response_text = response_text[3:-3].strip()
            
        extracted = json.loads(response_text)
        
        # Inject candidate_id into the results
        for item in extracted:
            item["candidate_id"] = candidate_id
            
        return extracted
        
    except Exception as e:
        print(f"[Agent] Failed to extract for {candidate_id}: {str(e)}")
        raise e

async def batch_extract_skills(candidates: List[Dict], concurrency: int = 5) -> List[Dict]:
    """
    Processes a list of candidates concurrently using a semaphore.
    """
    client = get_llm_client()
    semaphore = asyncio.Semaphore(concurrency)
    
    async def bound_extract(candidate):
        async with semaphore:
            return await extract_candidate_skills(
                client, 
                candidate["candidate_id"], 
                candidate.get("career_history", [])
            )
            
    tasks = [bound_extract(c) for c in candidates]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    
    # Flatten the list of lists and ignore exceptions for the cache
    flattened = []
    for res in results:
        if isinstance(res, list):
            flattened.extend(res)
    return flattened

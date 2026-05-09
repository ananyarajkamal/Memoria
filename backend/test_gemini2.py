import os
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()

print("Testing Gemini API...")
print(f"API Key present: {bool(os.getenv('GOOGLE_API_KEY'))}")
print(f"Model: gemini-1.5-flash")

try:
    genai.configure(api_key=os.getenv('GOOGLE_API_KEY'))
    model = genai.GenerativeModel('gemini-1.5-flash')
    response = model.generate_content('Say hello in one word')
    print(f"✅ SUCCESS! Response: {response.text}")
except Exception as e:
    print(f"❌ ERROR: {str(e)}")
    print(f"Error type: {type(e).__name__}")
    import traceback
    traceback.print_exc()

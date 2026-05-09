import os
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()

try:
    genai.configure(api_key=os.getenv('GOOGLE_API_KEY'))
    model = genai.GenerativeModel('gemini-2.5-flash')
    response = model.generate_content('Hello, test message')
    print('SUCCESS! Response:', response.text)
except Exception as e:
    print('ERROR:', str(e))
    print('Error type:', type(e).__name__)

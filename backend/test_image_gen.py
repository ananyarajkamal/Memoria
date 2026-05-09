import os
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()

print("Testing Image Generation...")
print(f"API Key present: {bool(os.getenv('GOOGLE_API_KEY'))}")

try:
    genai.configure(api_key=os.getenv('GOOGLE_API_KEY'))
    
    # Try the image generation model
    model = genai.GenerativeModel('gemini-2.0-flash-exp-image-generation')
    
    print("Generating image of 'a red apple on a table'...")
    response = model.generate_content("Generate an image of a red apple on a wooden table")
    
    print(f"Response received: {response}")
    print(f"Response parts: {response.parts}")
    
    # Check for inline data
    if response.parts:
        for i, part in enumerate(response.parts):
            print(f"Part {i}: {type(part)}")
            if hasattr(part, 'inline_data'):
                print(f"  - Has inline_data: {part.inline_data is not None}")
                if part.inline_data:
                    print(f"  - MIME type: {part.inline_data.mime_type}")
                    print(f"  - Data length: {len(part.inline_data.data)} bytes")
            elif hasattr(part, 'text'):
                print(f"  - Text: {part.text[:100]}...")
    else:
        print("No parts in response")
        print(f"Full response text: {response.text}")
        
except Exception as e:
    print(f"ERROR: {str(e)}")
    import traceback
    traceback.print_exc()

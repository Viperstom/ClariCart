import re

def clean_text(text):
    if not text:
        return ""
    # Remove HTML tags (e.g., <br>, <div>)
    text = re.sub(r'<[^>]+>', '', text)
    # Remove multiple spaces
    text = re.sub(r'\s+', ' ', text).strip()
    return text
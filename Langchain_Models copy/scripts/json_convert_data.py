import gzip
import json
import ast
import os

# Configuration
INPUT_PATH = "data/qa_Software.json.gz"
OUTPUT_PATH = "data/viewable_data.json"

def convert_gzip_to_json(num_records=100):
    """
    Reads the compressed Amazon file, converts the Python-dict format to JSON,
    and saves a sample for viewing.
    """
    if not os.path.exists(INPUT_PATH):
        print(f"❌ Error: File not found at {INPUT_PATH}")
        return

    print(f"📖 Reading the first {num_records} records from {INPUT_PATH}...")
    extracted_data = []
    
    try:
        with gzip.open(INPUT_PATH, 'rb') as f:
            for i, line in enumerate(f):
                if i >= num_records:
                    break
                
                # The Amazon data uses single quotes (Python dict syntax)
                # We use ast.literal_eval to safely parse this into a real object
                record = ast.literal_eval(line.decode('utf-8'))
                extracted_data.append(record)
        
        # Write back as standard, readable JSON (double quotes, indented)
        with open(OUTPUT_PATH, 'w') as out_f:
            json.dump(extracted_data, out_f, indent=4)
            
        print(f"✅ Success! Converted data saved to: {OUTPUT_PATH}")
        print("👉 Go to your 'data' folder and open 'viewable_data.json' to see the Questions & Answers.")
        
    except Exception as e:
        print(f"❌ An error occurred: {e}")

if __name__ == "__main__":
    # You can change 100 to a larger number if you want to see more data
    convert_gzip_to_json(1000)
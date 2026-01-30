
import json
import uuid
from datetime import datetime
import random

CROP_LOSS_FILE = "crop_loss_data.json"

crops = ["Wheat", "Rice", "Cotton", "Maize", "Potato", "Soybean"]
causes = ["Pest Attack (Pink Bollworm)", "Unexpected Hailstorm", "Flooding", "Drought", "Fungal Disease (Rust)"]
locations = ["Punjab", "Haryana", "Maharashtra", "Madhya Pradesh", "Uttar Pradesh"]

def generate_cases():
    cases = []
    for i in range(5):
        damage = random.randint(30, 90)
        est_loss = random.randint(50000, 200000)
        
        case = {
            'id': f"case_{str(uuid.uuid4())[:8]}",
            'farmerName': f"Farmer {chr(65+i)}",
            'crop': random.choice(crops),
            'damagePercentage': damage,
            'cause': random.choice(causes),
            'status': 'Pending',
            'timestamp': datetime.now().isoformat(),
            'location': random.choice(locations),
            'estimatedLoss': est_loss,
            'suggestedCompensation': int(est_loss * 0.7) # 70% comp
        }
        cases.append(case)
    return cases

if __name__ == "__main__":
    data = generate_cases()
    with open(CROP_LOSS_FILE, 'w') as f:
        json.dump(data, f, indent=4)
    print(f"Seeded {len(data)} sample crop loss cases into {CROP_LOSS_FILE}")

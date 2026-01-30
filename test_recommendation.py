import unittest
from recommendation_engine import engine_run

class TestRecommendationEngine(unittest.TestCase):
    
    def test_rice_low_nutrients(self):
        # Input: Rice, Low NPK
        data = {
            "crop": "rice",
            "soil_n": "low",
            "soil_p": "low",
            "soil_k": "low",
            "soil_moisture": 50,
            "rainfall": 0
        }
        result = engine_run(data)
        
        # Check Fertilizer (Rule: Low N=120, P=60, K=40 for Rice)
        self.assertEqual(result['fertilizer']['nitrogen'], "120 kg/ha")
        self.assertEqual(result['fertilizer']['phosphorus'], "60 kg/ha")
        self.assertEqual(result['fertilizer']['potassium'], "40 kg/ha")

    def test_rice_high_nutrients(self):
        # Input: Rice, High NPK
        data = {
            "crop": "rice",
            "soil_n": "high",
            "soil_p": "high",
            "soil_k": "high",
            "soil_moisture": 50,
            "rainfall": 0
        }
        result = engine_run(data)
        
        # Check Fertilizer (Rule: High N=40, P=20, K=0 for Rice)
        self.assertEqual(result['fertilizer']['nitrogen'], "40 kg/ha")
        self.assertEqual(result['fertilizer']['phosphorus'], "20 kg/ha")
        self.assertEqual(result['fertilizer']['potassium'], "0 kg/ha")

    def test_irrigation_dry_no_rain(self):
        # Input: Dry soil, no rain
        data = {
            "soil_moisture": 20, # < 30
            "rainfall": 0
        }
        result = engine_run(data)
        self.assertEqual(result['irrigation']['status'], "Irrigate Immediately")
        self.assertNotEqual(result['irrigation']['water_amount'], "0 mm")

    def test_irrigation_dry_heavy_rain(self):
        # Input: Dry soil, heavy rain coming
        data = {
            "soil_moisture": 20, # < 30
            "rainfall": 20 # > 10
        }
        result = engine_run(data)
        self.assertEqual(result['irrigation']['status'], "Delay Irrigation")
        self.assertEqual(result['irrigation']['water_amount'], "0 mm")

if __name__ == '__main__':
    unittest.main()

import time
import random
from datetime import datetime, timezone
from supabase import create_client, Client

SUPABASE_URL = "https://dvihcmjxeooanargzpxb.supabase.co"
SUPABASE_KEY = "sb_publishable_IV9_rKRHgagioYNfVquMlA_O7p-ux7B"  # Paste your key here

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Operational base configurations for the 3 plants
PLANTS_CONFIG = [
    {
        "table": "telemetry_payra",
        "capacity": 1320.0,
        "base_voltage": 400.0,
        "fuel_base": 480.0,     # Equivalent coal flow rate (MT/h)
        "temp_base": 540.0,     # Main steam temp in °C
        "carbon_factor": 0.82
    },
    {
        "table": "telemetry_titas",
        "capacity": 450.0,
        "base_voltage": 230.0,
        "fuel_base": 280.0,     # Gas flow rate (1000 m³/h)
        "temp_base": 480.0,     # Gas turbine exhaust temp in °C
        "carbon_factor": 0.44
    },
    {
        "table": "telemetry_sirajganj",
        "capacity": 68.0,
        "base_voltage": 132.0,
        "fuel_base": 0.0,       # Solar consumes zero fuel
        "temp_base": 42.0,      # Inverter / PV cell temp in °C
        "carbon_factor": 0.02
    }
]

print("Starting live telemetry stream. Pushing to 3 tables every 5s...")
print("Press Ctrl+C in terminal to stop anytime.\n")

while True:
    try:
        now_iso = datetime.now(timezone.utc).isoformat()

        for plant in PLANTS_CONFIG:
            cap = plant["capacity"]
            # Realistic power generation fluctuations (82% to 97% of capacity)
            power = round(random.uniform(cap * 0.82, cap * 0.97), 2)
            
            # Grid parameters around Bangladesh nominal operating standards
            voltage = round(plant["base_voltage"] * random.uniform(0.99, 1.01), 1)
            freq = round(random.uniform(49.88, 50.12), 2)  # 50.00 Hz nominal target
            temp = round(plant["temp_base"] + random.uniform(-4.0, 5.0), 1)
            fuel = round(plant["fuel_base"] * (power / cap) + random.uniform(-2.0, 3.0), 1) if plant["fuel_base"] > 0 else 0.0
            efficiency = round(random.uniform(38.0, 44.0) if "payra" in plant["table"] else random.uniform(88.0, 94.0), 1)
            load = round((power / cap) * 100, 1)
            co2 = round(power * plant["carbon_factor"], 1)
            status = "WARNING" if freq < 49.90 or temp > (plant["temp_base"] + 4.5) else "OPTIMAL"

            record = {
                "timestamp": now_iso,
                "power_output_mw": power,
                "voltage_kv": voltage,
                "frequency_hz": freq,
                "fuel_consumption_rate": fuel,
                "efficiency_pct": efficiency,
                "grid_load_pct": load,
                "carbon_intensity_kg": co2,
                "temperature_c": temp,
                "status": status
            }

            # Insert snapshot directly into this plant's dedicated table
            supabase.table(plant["table"]).insert(record).execute()

        print(f"[{datetime.now().strftime('%H:%M:%S')}] Snapshot pushed to telemetry_payra, telemetry_titas, and telemetry_sirajganj")

    except Exception as e:
        print("Telemetry insert error:", e)

    time.sleep(5)  # Wait 5 seconds before the next stream pulse
GridDecision AI • National Power Telemetry & Supervisory Monitor

Repository Overview:

A real-time supervisory telemetry and AI-assisted decision-support platform for national power generation monitoring. Features horizontal PostgreSQL time-series partitioning (Supabase), sub-second WebSocket CDC streaming, and a two-page React dashboard tracking 8 dynamic grid metrics across thermal, CCGT, and solar assets. Developed entirely in a local sandboxed environment and published as a consolidated initial release.

About The Project

GridDecision AI bridges high-frequency industrial power telemetry with real-time web visualization and heuristic decision support. The platform models real-time operational dynamics across base-load thermal, flexible combined-cycle, and renewable generation facilities benchmarked on national grid infrastructure (specifically the Payra 1320 MW Coal Plant, Titas 450 MW CCGT, and Sirajganj 68 MW Solar Park).

The platform continuously evaluates 8 mission-critical operational parameters per facility, calculates live synchronous frequency deviation (Delta-f) against statutory 50.00 Hz standards, and runs an automated decision engine delivering load-balancing, spinning reserve, and thermal-stress mitigation advisories.

Development Note: This platform was architected, integrated, and verified end-to-end within an isolated local development environment before being committed and published to version control as a single consolidated initial release.

System Architecture

The application decouples generation, ingestion, replication, and visualization across three distinct layers:

[ Python Physics Simulator (generator.py) ]
          │
          │ (Calculates 8 physical telemetry parameters every 5s)
          ▼ (HTTPS REST / PostgREST)
[ Supabase Managed PostgreSQL Database ]
   ├── powerplants (Asset Registry & Operational Metadata)
   ├── telemetry_payra (Partitioned Time-Series Store)
   ├── telemetry_titas (Partitioned Time-Series Store)
   └── telemetry_sirajganj (Partitioned Time-Series Store)
          │
          │ (Change Data Capture / Logical Replication from WAL)
          ▼
[ Supabase Realtime Engine (WebSockets) ]
          │
          │ (Sub-150ms JSON frame push on committed INSERT)
          ▼
[ React 18 + Tailwind CSS Supervisory Dashboard ]
   ├── Home View: Fleet aggregation, clean energy share, macro frequency
   └── Unit Console: 8-parameter telemetry dials, dynamic AI advisories,
                     live rolling Recharts trajectory, and one-click CSV export


Monitored Generation Fleet

Facility Name

Unit Code

Rated Capacity

Technology / Primary Fuel

Dedicated Partition Table

Payra Thermal Power Plant

PYR-COAL

1320 MW

Ultra-Supercritical Coal

telemetry_payra

Titas Combined Cycle Plant

TIT-GAS

450 MW

Combined Cycle Gas Turbine (CCGT)

telemetry_titas

Sirajganj Solar Park

SRJ-SOLAR

68 MW

Photovoltaic (PV) Solar Array

telemetry_sirajganj

Monitored Telemetry Parameters (The 8 Sensor Metrics)

Each unit telemetry record captures 8 operational variables every 5 seconds:

Active Power Output (MW): Real power delivered to the national transmission grid.

Substation Bus Voltage (kV): High-voltage switchyard potential (400 kV at Payra, 230 kV at Titas, 132 kV at Sirajganj) regulated via excitation systems and Automatic Voltage Regulators (AVR).

Grid Frequency (Hz): Real-time rotational frequency of the synchronous grid, measuring national supply-demand equilibrium against the 50.00 Hz baseline ($N_s = 120f / P$).

Operating / Exhaust Temperature (°C): Main steam temperature for coal boilers (540.0°C baseline), turbine exhaust gas temperature for CCGT (480.0°C baseline), or inverter/PV cell temperature for solar (42.0°C baseline).

Fuel Consumption Rate (Units/h): Volumetric/mass consumption rate (metric tons/h for coal, thousand m³/h for gas, 0.00 for solar).

Thermal Efficiency (%): First-law thermodynamic conversion efficiency and heat-rate tracking.

Grid Dispatch Load (%): Percentage of total nameplate capacity actively scheduled and dispatched by the National Load Despatch Centre (NLDC).

Carbon Intensity (kg CO2/MWh): Specific environmental emissions factor per generated energy unit.

Core Capabilities & Engineering Features

1. Dual-View Supervisory Interface

Fleet Overview (Home): Aggregates real-time generation across all active partitions, monitors gross fleet utilization against 1838 MW total installed capacity, and calculates the Clean Energy Penetration Share (%) in real time:


$$\text{Clean Energy Share} = \left(\frac{\text{Sirajganj Solar Generation}}{\text{Total Grid Generation}}\right) \times 100$$

Asset-Level SCADA Console (Dashboard): Detailed telemetry inspection with plant-switching controls, physical sensor readouts, health status indicators (OPTIMAL vs. WARNING), and rolling time-series trends.

2. Live Synchronous Frequency Deviation ($\Delta f$) Tracking

Calculates immediate frequency offset from the nominal 50.00 Hz grid code:


$$\Delta f = f_{\text{actual}} - 50.00\text{ Hz}$$


A negative deviation indicates a generation deficit causing kinetic rotor deceleration; a positive deviation indicates a supply surplus accelerating turbine shafts. Deviations exceeding $\pm 0.08\text{ Hz}$ automatically update status indicators and trigger advisory flags.

3. AI-Assisted Decision-Support Engine

An integrated heuristic expert-system rule engine evaluates incoming multi-variable payloads in real time:

Renewable Merit-Order Priority: Prioritizes zero-marginal-cost solar dispatch, recommending curtailment prevention and thermal throttle-backs during generation peaks.

Primary Frequency Response: Detects sub-nominal grid frequency dips ($\Delta f \le -0.08\text{ Hz}$) and advises instantaneous $+15\text{ MW}$ spinning reserve ramp setpoints from flexible gas assets.

Thermal Stress Mitigation: Identifies boiler over-temperature conditions ($> 544.5^\circ\text{C}$) to flag tube fouling risks and recommend auxiliary soot-blowing cycles.

Confidence & Action Scoring: Assigns deterministic confidence percentages and recommended dispatch setpoints for grid operators.

4. One-Click Research Dataset Exporter (.CSV)

A built-in data pipeline allows researchers to extract the latest 60 historical telemetry rows from PostgreSQL directly into client-side memory (Blob serialization) and download a timestamped .csv file for offline analysis in Python, MATLAB, or PyTorch.

5. Memory-Safe Rolling Visualizer

The Recharts time-series engine enforces an in-memory sliding window buffer (slice(-14)) for incoming WebSocket data, maintaining constant $O(1)$ memory consumption and preventing DOM degradation during long-running supervisory sessions.

Database Architecture & Design

Master Plant Registry (powerplants)

Column

Type

Constraints

Description

id

BIGINT

Primary Key

Unique asset identifier

name

TEXT

NOT NULL

Official station name

plant_code

VARCHAR(10)

UNIQUE, NOT NULL

Industry asset code (PYR-COAL, etc.)

capacity_mw

NUMERIC

NOT NULL

Maximum rated capacity

fuel_type

VARCHAR(50)

NOT NULL

Fuel and thermodynamic cycle classification

table_name

VARCHAR(50)

NOT NULL

Target time-series partition table

Time-Series Partition Schema

Each plant writes directly into its dedicated time-series partition table:

CREATE TABLE telemetry_payra (
    id BIGSERIAL PRIMARY KEY,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    power_output_mw NUMERIC(6,2),
    voltage_kv NUMERIC(5,2),
    frequency_hz NUMERIC(4,2),
    temperature_c NUMERIC(5,2),
    fuel_consumption_rate NUMERIC(7,2),
    efficiency_pct NUMERIC(4,2),
    grid_load_pct NUMERIC(4,2),
    carbon_intensity_kg NUMERIC(6,2),
    status VARCHAR(20)
);


Why Separate Tables Instead of a Monolith?

Write-Lock Isolation: Continuous 5-second ingestion across multiple generators creates write contention on shared B-Tree indexes. Partitioning by asset isolates index modifications.

Query Optimization: Time-series range queries (ORDER BY timestamp DESC LIMIT 14) execute via targeted partition scans without scanning unindexed rows from other facilities.

WebSocket Channel Scoping: Allows frontend clients to subscribe exclusively to updates from a specific station without filtering out unwanted global telemetry messages.

Repository Structure

grid_telemetry/
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── App.jsx              # Main SPA router, UI views & AI logic
│   │   ├── supabaseClient.js    # Supabase credentials & initialization
│   │   ├── index.css            # Tailwind CSS directives & layout
│   │   └── main.jsx             # React DOM entry point
│   ├── package.json             # Frontend dependencies & scripts
│   ├── tailwind.config.js       # Tailwind style configuration
│   └── vite.config.js           # Vite development server configuration
├── simulator/
│   ├── generator.py             # Physics-grounded multi-plant telemetry generator
│   └── requirements.txt         # Python runtime dependencies
├── .gitignore                   # Root exclusion configuration (node_modules, venvs)
└── README.md                    # Technical documentation


Installation & Setup

Prerequisites

Node.js (v18.0.0 or higher)

Python (v3.9 or higher)

Supabase project with an active PostgreSQL instance and Realtime replication enabled on telemetry tables.

1. Database Setup

Execute the following setup inside your Supabase SQL Editor:

Create the powerplants metadata table and populate it with Payra, Titas, and Sirajganj records.

Create the three dedicated telemetry tables: telemetry_payra, telemetry_titas, and telemetry_sirajganj.

Enable replication for each telemetry table under Database -> Replication in the Supabase Dashboard.

2. Frontend Configuration

Navigate to the frontend directory and install the required dependencies:

cd frontend
npm install


Configure your Supabase credentials in frontend/src/supabaseClient.js:

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'YOUR_SUPABASE_PROJECT_URL';
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);


Start the local development server:

npm run dev


The web dashboard will be accessible at http://localhost:5173/.

3. Simulator Execution

Open a separate terminal window and start the Python telemetry simulator:

cd simulator
pip install -r requirements.txt
python generator.py


The simulator will begin streaming realistic 8-parameter snapshots to PostgreSQL every 5 seconds, immediately triggering real-time UI updates via WebSockets.

Tech Stack

Frontend: React 18, Vite, Tailwind CSS, Recharts (SVG Time-Series Visualization), Lucide React (Icons)

Backend & Database: Supabase, PostgreSQL 15, PostgREST, Supabase Realtime Engine (Elixir-based WAL Change Data Capture)

Simulator: Python 3, supabase-py, httpx

License

This project is developed for academic research, grid engineering evaluation, and prototype decision-support analysis. Distributed under the MIT License.

⚡ GridDecision AI

Next-Gen Supervisory Telemetry & AI-Assisted Grid Dispatch Platform

[!IMPORTANT]
Repository Release Notice:

This platform was architected, integrated, and verified end-to-end within an isolated local sandboxed environment. The entire verified codebase—comprising the physics telemetry generator, partitioned PostgreSQL schema, and real-time reactive dashboard—was subsequently committed and published to version control as a single consolidated initial release.

📌 Table of Contents

Overview & Research Motivation

System Architecture

Monitored Generation Fleet

The 8 Sensor Telemetry Parameters

Core Engineering Features

Database Architecture & Partitioning

Repository Structure

Getting Started & Installation

Tech Stack

License

🌐 Overview & Research Motivation

GridDecision AI bridges high-frequency industrial power telemetry with real-time web visualization and heuristic decision support. Modern national dispatchers often rely on asynchronous tabular reports or delayed SCADA overviews. GridDecision AI replaces static monitoring with an active, automated supervisory interface:

Sub-150ms Ingestion: Tracks high-capacity thermal, flexible combined cycle, and renewable solar generation across Bangladesh's interconnected grid nodes.

Synchronous Equilibrium: Calculates live frequency deviation ($\Delta f$) against the nominal 50.00 Hz baseline ($N_s = 120f / P$).

Intelligent Dispatch Support: Runs a real-time rule engine that issues actionable setpoints for spinning reserve ramps, thermal stress mitigation, and economic clean energy merit-order prioritization.

🏗️ System Architecture

The pipeline is completely decoupled into three scalable layers:

┌────────────────────────────────────────────────────────┐
│      1. Data Generation: generator.py (Python 3)       │
│  Physics simulation engine generating 8 sensor metrics │
│        every 5 seconds under thermodynamic limits       │
└──────────────────────────┬─────────────────────────────┘
                           │ HTTPS POST (REST / PostgREST)
                           ▼
┌────────────────────────────────────────────────────────┐
│     2. Cloud Relational Ingestion: Supabase (Postgres)  │
│  - powerplants (Metadata Registry)                     │
│  - telemetry_payra (Time-Series Partition)             │
│  - telemetry_titas (Time-Series Partition)             │
│  - telemetry_sirajganj (Time-Series Partition)         │
└──────────────────────────┬─────────────────────────────┘
                           │ Logical Decoding / WAL Change Data Capture
                           ▼
┌────────────────────────────────────────────────────────┐
│      3. Real-Time Streaming: Supabase Realtime Engine  │
│  Elixir daemon broadcasting JSON payload over WebSocket│
└──────────────────────────┬─────────────────────────────┘
                           │ Sub-150ms WebSocket Frame Push
                           ▼
┌────────────────────────────────────────────────────────┐
│     4. Reactive Web Application: React 18 + Tailwind    │
│  - Home View: Macro aggregation, clean energy share    │
│  - Dashboard: 8 live dials, SVG chart, AI engine, CSV  │
└────────────────────────────────────────────────────────┘


🏭 Monitored Generation Fleet

The prototype models three benchmark power stations representing distinct dispatch roles:

Asset Name

Code

Rated Capacity

Fuel & Technology

Grid Role

Dedicated Table

Payra Thermal Power Plant

PYR-COAL

1320 MW

Ultra-Supercritical Coal

BASELOAD

telemetry_payra

Titas Combined Cycle Station

TIT-GAS

450 MW

Combined Cycle Gas (CCGT)

LOAD-FOLLOWING

telemetry_titas

Sirajganj Solar Park

SRJ-SOLAR

68 MW

High-Efficiency Photovoltaic (PV)

ZERO-MARGINAL-COST

telemetry_sirajganj

📊 The 8 Sensor Telemetry Parameters

Each generation unit commits 8 physical parameters every 5 seconds:

├── 1. Active Power Output (MW)     ── Real active electrical power exported to transmission lines
├── 2. Substation Bus Voltage (kV)  ── Switchyard potential (400 kV / 230 kV / 132 kV) via AVR
├── 3. Grid Frequency (Hz)          ── Rotor synchronous speed (Nominal target: 50.00 Hz)
├── 4. Core Operating Temp (°C)     ── Boiler main steam / gas turbine exhaust / PV cell temp
├── 5. Fuel Consumption Rate (U/h)  ── Coal metric tons/h, Gas k-m³/h, or 0.00 for solar
├── 6. Thermal Efficiency (%)       ── Thermodynamic first-law conversion efficiency
├── 7. Grid Dispatch Load (%)       ── (Current Generation MW / Installed Capacity MW) * 100
└── 8. Carbon Intensity (kg/MWh)    ── Direct carbon emissions generated per Megawatt-hour


🚀 Core Engineering Features

1. Dual-View Supervisory Interface

Fleet Overview (Home View): Aggregates gross active generation across all facilities against total fleet capacity (1838 MW), tracks macro grid frequency compliance, and computes the real-time Clean Energy Penetration Share (%):


$$\text{Clean Energy Share} = \left(\frac{\text{Sirajganj Solar Generation}}{\text{Total Grid Generation}}\right) \times 100$$

Asset-Level SCADA Console (Dashboard View): Deep inspection console with rapid plant toggling, high-contrast parameter cards, live status badges (OPTIMAL vs. WARNING), and rolling time-series trends.

2. Synchronous Frequency Deviation ($\Delta f$) Tracking

Calculates the exact deviation from the nominal 50.00 Hz synchronous baseline:


$$\Delta f = f_{\text{actual}} - 50.00\text{ Hz}$$

$\Delta f < -0.08\text{ Hz}$: Indicates load dragging generators down; triggers visual amber warnings.

$\Delta f \ge 0.00\text{ Hz}$: Indicates sufficient system kinetic inertia and power generation headroom.

3. AI-Assisted Decision-Support Engine

An expert-system rule engine evaluates multivariate parameters in real time to provide prescriptive operational advice:

☀️ Renewable Merit-Order Priority: Detects active solar generation and advises zero-fuel-cost transmission priority over fossil thermal assets.

⚡ Primary Frequency Response: Automatically advises a $+15\text{ MW}$ spinning reserve fast-ramp whenever frequency drops below 49.92 Hz.

🔥 Thermal Strain Mitigation: Warns operators when Payra's steam temperature exceeds $544.5^\circ\text{C}$ ($+4.5^\circ\text{C}$ over baseline) to prevent boiler tube fouling.

🎯 Confidence Scoring: Displays confidence ratings (e.g., 94.8% Confidence) alongside clear action directives.

4. Researcher Telemetry Exporter (.CSV)

[!TIP]
Click the Export Telemetry (.CSV) button in the dashboard to query the last 60 database snapshots and trigger a direct browser download of structured .csv time-series data for offline machine learning analysis in Python, MATLAB, or PyTorch.

5. Memory-Safe Rolling Visualizer

The Recharts line chart uses an in-memory sliding window buffer (slice(-14)) for incoming WebSocket data, maintaining constant $O(1)$ memory consumption and preventing DOM memory leaks during multi-hour runtime sessions.

🗄️ Database Architecture & Partitioning

The database runs on cloud PostgreSQL hosted on Supabase, structured into metadata and partitioned time-series tables:

Master Registry Schema (powerplants)

CREATE TABLE powerplants (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name TEXT NOT NULL,
    plant_code VARCHAR(10) UNIQUE NOT NULL,
    capacity_mw NUMERIC NOT NULL,
    fuel_type VARCHAR(50) NOT NULL,
    table_name VARCHAR(50) NOT NULL
);


Time-Series Partition Schema (telemetry_payra, telemetry_titas, telemetry_sirajganj)

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

CREATE INDEX idx_payra_timestamp ON telemetry_payra (timestamp DESC);


[!NOTE]
Why Partition Tables by Asset?

In continuous SCADA systems, writing multiple plant streams into a single unpartitioned table causes write-lock contention and index bloat. Isolating each facility into its own table guarantees sub-millisecond query execution (ORDER BY timestamp DESC LIMIT 14) and clean WebSocket channel filtering.

📁 Repository Structure

grid_telemetry/
│
├── 📂 frontend/                     # React 18 SPA Client
│   ├── 📂 public/                   # Static assets & favicons
│   ├── 📂 src/
│   │   ├── 📄 App.jsx               # Main SPA router, dashboard views & AI logic
│   │   ├── 📄 supabaseClient.js     # Supabase initialization client
│   │   ├── 📄 index.css             # Tailwind CSS custom styles & font imports
│   │   └── 📄 main.jsx              # React DOM mounting entry point
│   ├── 📄 package.json              # NPM dependencies & scripts
│   ├── 📄 tailwind.config.js        # Tailwind CSS utility configuration
│   └── 📄 vite.config.js            # Vite bundler build settings
│
├── 📂 simulator/                    # Python Telemetry Engine
│   ├── 📄 generator.py              # Physics-grounded 5-second multi-plant simulator
│   └── 📄 requirements.txt          # Python dependencies (supabase, httpx)
│
├── 📄 .gitignore                    # Root exclusion file (node_modules, venvs, dist)
└── 📄 README.md                     # Comprehensive project documentation


⚙️ Getting Started & Installation

Prerequisites

Node.js: v18.0.0 or higher

Python: v3.9 or higher

Supabase Account: Free-tier PostgreSQL database instance

1. Database Provisioning

Open the SQL Editor inside your Supabase project dashboard and execute:

Create and populate the powerplants registry.

Create the three partitioned tables (telemetry_payra, telemetry_titas, telemetry_sirajganj).

Enable replication for all three telemetry tables under Database -> Replication to activate Change Data Capture (CDC).

2. Frontend Setup

Navigate to the frontend/ directory, install packages, and start the development server:

cd frontend
npm install
npm run dev


The interface will be live at http://localhost:5173/.

3. Telemetry Simulator Execution

In a separate terminal, initialize the Python simulation engine:

cd simulator
pip install -r requirements.txt
python generator.py


The simulator will immediately begin computing 8-parameter snapshots and pushing them to PostgreSQL every 5 seconds, triggering live real-time WebSocket updates across the dashboard.

🛠️ Tech Stack

Domain

Technology

Purpose

Frontend Framework

React 18

Single Page Application (SPA) architecture

Build Tooling

Vite

Instant Hot Module Replacement (HMR) & bundling

Styling & UI

Tailwind CSS

Industrial high-contrast dark-mode styling

Data Visualization

Recharts

Hardware-accelerated SVG time-series line charts

Iconography

Lucide React

Clean operational SCADA icons

Cloud Database

PostgreSQL 15 (Supabase)

Relational metadata & time-series partitions

Streaming / CDC

Supabase Realtime (Elixir)

Sub-150ms WebSocket push notifications via WAL

Physics Simulation

Python 3 + supabase-py

Physics-constrained telemetry generator

📄 License

This project is open-source and distributed under the MIT License. Engineered for academic evaluation, grid research, and prototype decision-support analysis.

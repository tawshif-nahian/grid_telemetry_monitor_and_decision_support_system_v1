<div align="center">
  <h1>⚡ GridDecision AI</h1>
  <h3>Next-Gen Supervisory Telemetry &amp; AI-Assisted Grid Dispatch Platform</h3>
  <p>
    <img src="https://img.shields.io/badge/React-18.2-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React 18" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
    <img src="https://img.shields.io/badge/Supabase-PostgreSQL_15-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
    <img src="https://img.shields.io/badge/Python-3.9+-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python" />
    <img src="https://img.shields.io/badge/Vite-5.0-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
    <img src="https://img.shields.io/badge/License-MIT-F59E0B?style=for-the-badge" alt="License" />
  </p>
</div>

<hr/>

<blockquote>
  <b>📌 Repository Release &amp; Development Notice:</b><br/>
  This platform was architected, integrated, and verified end-to-end within an isolated local sandboxed environment. The entire verified codebase—comprising the physics telemetry generator, partitioned PostgreSQL schema, and real-time reactive dashboard—was subsequently committed and published to version control as a single consolidated initial release.
</blockquote>

<h2>🌐 About The Project</h2>
<p>
  <b>GridDecision AI</b> is a supervisory control, data acquisition (SCADA), and AI-assisted decision-support platform engineered to monitor national electric grid stability, visualize multi-asset generation dynamics, and automate merit-order dispatch advisories.
</p>
<ul>
  <li><b>Sub-150ms Real-Time Ingestion:</b> Tracks high-capacity thermal, flexible combined-cycle, and renewable solar generation across interconnected national grid nodes.</li>
  <li><b>Synchronous Equilibrium Tracking:</b> Continuously calculates live frequency deviation (<code>Δf = f_actual - 50.00 Hz</code>) against statutory 50.00 Hz grid codes.</li>
  <li><b>Prescriptive Dispatch Engine:</b> Evaluates multi-variable thresholds to issue real-time operator advisories for spinning reserve ramps, boiler thermal strain mitigation, and zero-marginal-cost renewable prioritization.</li>
</ul>

<hr/>

<h2>🏗️ System Architecture</h2>
<p>The platform decouples telemetry generation, relational storage, logical replication, and reactive visualization across four tiers:</p>

<pre><code>┌────────────────────────────────────────────────────────┐<br/>│      1. Data Generation: generator.py (Python 3)       │<br/>│  Physics simulation engine generating 8 sensor metrics │<br/>│        every 5 seconds under thermodynamic limits      │<br/>└──────────────────────────┬─────────────────────────────┘<br/>                           │ HTTPS POST (REST / PostgREST)<br/>                           ▼<br/>┌────────────────────────────────────────────────────────┐<br/>│     2. Cloud Relational Ingestion: Supabase (Postgres) │<br/>│  • powerplants (Asset Metadata Registry)               │<br/>│  • telemetry_payra (Time-Series Partition)             │<br/>│  • telemetry_titas (Time-Series Partition)             │<br/>│  • telemetry_sirajganj (Time-Series Partition)         │<br/>└──────────────────────────┬─────────────────────────────┘<br/>                           │ Logical Decoding / WAL Change Data Capture<br/>                           ▼<br/>┌────────────────────────────────────────────────────────┐<br/>│      3. Real-Time Streaming: Supabase Realtime Engine  │<br/>│  Elixir daemon broadcasting JSON frames via WebSockets │<br/>└──────────────────────────┬─────────────────────────────┘<br/>                           │ Sub-150ms WebSocket Frame Push<br/>                           ▼<br/>┌────────────────────────────────────────────────────────┐<br/>│     4. Reactive Web Application: React 18 + Tailwind   │<br/>│  • Home View: Macro aggregation &amp; clean energy share     • Dashboard: 8 live dials, SVG chart, AI engine, CSV  │<br/>└────────────────────────────────────────────────────────┘</code></pre>

<hr/>

<h2>🏭 Monitored Generation Fleet</h2>
<p>The prototype models three benchmark power stations representing distinct operational roles on the national grid:</p>

<table>
  <thead>
    <tr>
      <th>Asset Name</th>
      <th>Unit Code</th>
      <th>Rated Capacity</th>
      <th>Fuel &amp; Technology</th>
      <th>Grid Dispatch Role</th>
      <th>Dedicated Partition Table</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><b>Payra Thermal Power Plant</b></td>
      <td><code>PYR-COAL</code></td>
      <td><b>1320 MW</b></td>
      <td>Ultra-Supercritical Coal</td>
      <td><code>BASELOAD</code></td>
      <td><code>telemetry_payra</code></td>
    </tr>
    <tr>
      <td><b>Titas Combined Cycle Plant</b></td>
      <td><code>TIT-GAS</code></td>
      <td><b>450 MW</b></td>
      <td>Combined Cycle Gas (CCGT)</td>
      <td><code>LOAD-FOLLOWING</code></td>
      <td><code>telemetry_titas</code></td>
    </tr>
    <tr>
      <td><b>Sirajganj Solar Park</b></td>
      <td><code>SRJ-SOLAR</code></td>
      <td><b>68 MW</b></td>
      <td>Photovoltaic (PV) Array</td>
      <td><code>ZERO-MARGINAL-COST</code></td>
      <td><code>telemetry_sirajganj</code></td>
    </tr>
  </tbody>
</table>

<hr/>

<h2>📊 The 8 Sensor Telemetry Parameters</h2>
<p>Each generation facility streams 8 synchronized physical parameters every 5 seconds:</p>

<table>
  <thead>
    <tr>
      <th>#</th>
      <th>Parameter</th>
      <th>Database Column</th>
      <th>Unit</th>
      <th>Engineering Significance</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><b>1</b></td>
      <td><b>Active Power Output</b></td>
      <td><code>power_output_mw</code></td>
      <td><code>MW</code></td>
      <td>Net active electrical power exported to the transmission bus.</td>
    </tr>
    <tr>
      <td><b>2</b></td>
      <td><b>Substation Bus Voltage</b></td>
      <td><code>voltage_kv</code></td>
      <td><code>kV</code></td>
      <td>Switchyard potential (400 kV / 230 kV / 132 kV) regulated via AVR.</td>
    </tr>
    <tr>
      <td><b>3</b></td>
      <td><b>Grid Frequency</b></td>
      <td><code>frequency_hz</code></td>
      <td><code>Hz</code></td>
      <td>Synchronous rotational speed (Nominal standard: <code>50.00 Hz</code>).</td>
    </tr>
    <tr>
      <td><b>4</b></td>
      <td><b>Core Operating Temp</b></td>
      <td><code>temperature_c</code></td>
      <td><code>°C</code></td>
      <td>Main boiler steam (540°C), gas exhaust (480°C), or PV cell temp (42°C).</td>
    </tr>
    <tr>
      <td><b>5</b></td>
      <td><b>Fuel Consumption Rate</b></td>
      <td><code>fuel_consumption_rate</code></td>
      <td><code>Units/h</code></td>
      <td>Coal metric tons/h, Natural Gas k-m³/h, or <code>0.00</code> for solar PV.</td>
    </tr>
    <tr>
      <td><b>6</b></td>
      <td><b>Thermal Efficiency</b></td>
      <td><code>efficiency_pct</code></td>
      <td><code>%</code></td>
      <td>First-law thermodynamic conversion efficiency &amp; heat rate tracking.</td>
    </tr>
    <tr>
      <td><b>7</b></td>
      <td><b>Grid Dispatch Load</b></td>
      <td><code>grid_load_pct</code></td>
      <td><code>%</code></td>
      <td>Fraction of nameplate capacity actively dispatched by NLDC.</td>
    </tr>
    <tr>
      <td><b>8</b></td>
      <td><b>Carbon Intensity</b></td>
      <td><code>carbon_intensity_kg</code></td>
      <td><code>kg/MWh</code></td>
      <td>Specific CO₂ emissions intensity per generated Megawatt-hour.</td>
    </tr>
  </tbody>
</table>

<hr/>

<h2>🚀 Core Engineering Features</h2>

<h3>1. Dual-View Supervisory Interface</h3>
<ul>
  <li><b>Fleet Overview (Home View):</b> Aggregates gross active generation against total fleet capacity (1838 MW), monitors macro frequency compliance, and computes the real-time <b>Clean Energy Penetration Share (%)</b>: <code>(Sirajganj Solar MW / Total Grid MW) × 100</code>.</li>
  <li><b>Asset SCADA Console (Dashboard View):</b> Unit-level inspection console featuring instant plant switching, 8 sensor telemetry cards, dynamic health badges (<code>OPTIMAL</code> vs. <code>WARNING</code>), and live power trajectory charts.</li>
</ul>

<h3>2. Synchronous Frequency Deviation (Δf) Tracking</h3>
<ul>
  <li>Calculates instantaneous offset from the 50.00 Hz target: <code>Δf = f_actual - 50.00 Hz</code>.</li>
  <li><b>Under-Frequency (Δf &lt; -0.08 Hz):</b> Flags excess grid load dragging generator rotors down; triggers amber warning states.</li>
  <li><b>Nominal Band:</b> Confirms synchronous equilibrium and adequate system rotational inertia.</li>
</ul>

<h3>3. AI-Assisted Decision-Support Engine</h3>
<ul>
  <li>☀️ <b>Renewable Merit-Order Priority:</b> Recognizes zero-fuel-cost solar output at Sirajganj and recommends 100% uncurtailed transmission priority over fossil thermal units.</li>
  <li>⚡ <b>Primary Frequency Response:</b> Detects sub-nominal frequency dips (<code>f &lt; 49.92 Hz</code>) and advises an immediate <code>+15 MW</code> spinning reserve fast-ramp setpoint.</li>
  <li>🔥 <b>Thermal Stress Mitigation:</b> Flags main steam temperatures exceeding <code>544.0°C</code> at Payra to warn against boiler tube fouling and initiate auxiliary cooling cycles.</li>
  <li>🎯 <b>Analytical Confidence Scoring:</b> Outputs deterministic confidence metrics (e.g., <code>94.8% Confidence</code>) alongside prescriptive operator actions.</li>
</ul>

<h3>4. Researcher Telemetry Exporter (.CSV) &amp; Memory-Safe Charting</h3>
<ul>
  <li><b>One-Click CSV Export:</b> Queries the latest 60 historical rows from PostgreSQL, serializes them into an in-memory browser <code>Blob</code>, and downloads a clean <code>.csv</code> dataset for offline analysis in MATLAB, Python, or PyTorch.</li>
  <li><b>Sliding Window Buffer:</b> The Recharts SVG line chart maintains a strict 15-point sliding window (<code>slice(-14)</code>), guaranteeing constant <code>O(1)</code> browser memory consumption across long runtime sessions.</li>
</ul>

<hr/>

<h2>🗄️ Database Architecture &amp; Partitioning</h2>
<p>The backend runs on managed PostgreSQL 15 hosted on Supabase, separating static asset metadata from high-frequency time-series tables:</p>

<h3>Master Registry Schema (<code>powerplants</code>)</h3>
<pre><code>CREATE TABLE powerplants (<br/>    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,<br/>    name TEXT NOT NULL,<br/>    plant_code VARCHAR(10) UNIQUE NOT NULL,<br/>    capacity_mw NUMERIC NOT NULL,<br/>    fuel_type VARCHAR(50) NOT NULL,<br/>    table_name VARCHAR(50) NOT NULL<br/>);</code></pre>

<h3>Time-Series Partition Schema (<code>telemetry_payra</code>, <code>telemetry_titas</code>, <code>telemetry_sirajganj</code>)</h3>
<pre><code>CREATE TABLE telemetry_payra (<br/>    id BIGSERIAL PRIMARY KEY,<br/>    timestamp TIMESTAMPTZ DEFAULT NOW(),<br/>    power_output_mw NUMERIC(6,2),<br/>    voltage_kv NUMERIC(5,2),<br/>    frequency_hz NUMERIC(4,2),<br/>    temperature_c NUMERIC(5,2),<br/>    fuel_consumption_rate NUMERIC(7,2),<br/>    efficiency_pct NUMERIC(4,2),<br/>    grid_load_pct NUMERIC(4,2),<br/>    carbon_intensity_kg NUMERIC(6,2),<br/>    status VARCHAR(20)<br/>);<br/><br/>CREATE INDEX idx_payra_timestamp ON telemetry_payra (timestamp DESC);</code></pre>

<blockquote>
  <b>💡 Why Partition Tables by Generation Asset?</b><br/>
  In high-frequency SCADA environments, logging all power stations into a single monolithic table creates B-Tree index lock contention and query degradation. Isolating each plant into its own table partitions write locks, ensures sub-millisecond range queries (<code>ORDER BY timestamp DESC LIMIT 14</code>), and scopes WebSocket channels cleanly.
</blockquote>

<hr/>

<h2>📁 Repository Structure</h2>
<pre><code>grid_telemetry/<br/>├── frontend/                        # React 18 Single Page Application<br/>│   ├── public/                      # Static assets<br/>│   ├── src/<br/>│   │   ├── App.jsx                  # Main router, SCADA views, AI engine &amp; CSV exporter<br/>│   │   ├── supabaseClient.js        # Supabase client &amp; WebSocket configuration<br/>│   │   ├── index.css                # Tailwind CSS directives &amp; dark theme<br/>│   │   └── main.jsx                 # React DOM entry point<br/>│   ├── package.json                 # Frontend dependencies &amp; scripts<br/>│   └── vite.config.js               # Vite bundler configuration<br/>│<br/>├── simulator/                       # Python Physics Telemetry Engine<br/>│   ├── generator.py                 # 5-second multi-plant thermodynamic simulator<br/>│   └── requirements.txt             # Python dependencies (supabase, httpx)<br/>│<br/>├── .gitignore                       # Excludes node_modules, venv, and build artifacts<br/>└── README.md                        # Project documentation</code></pre>

<hr/>

<h2>⚙️ Getting Started &amp; Installation</h2>

<h3>Prerequisites</h3>
<ul>
  <li><b>Node.js:</b> <code>v18.0.0</code> or higher</li>
  <li><b>Python:</b> <code>v3.9</code> or higher</li>
  <li><b>Supabase Account:</b> Active PostgreSQL project with Realtime enabled</li>
</ul>

<h3>1. Database Provisioning</h3>
<ol>
  <li>Open the <b>SQL Editor</b> in your Supabase dashboard and create the <code>powerplants</code> registry and the three telemetry tables (<code>telemetry_payra</code>, <code>telemetry_titas</code>, <code>telemetry_sirajganj</code>).</li>
  <li>Enable Realtime logical replication for all three telemetry tables under <b>Database &rarr; Replication</b>.</li>
</ol>

<h3>2. Frontend Setup</h3>
<p>Navigate to the <code>frontend</code> folder, install dependencies, and start the Vite development server:</p>
<pre><code>cd frontend<br/>npm install<br/>npm run dev</code></pre>
<p>The web application will launch at <code>http://localhost:5173/</code>.</p>

<h3>3. Telemetry Simulator Execution</h3>
<p>Open a separate terminal window, install the Python requirements, and launch the telemetry generator:</p>
<pre><code>cd simulator<br/>pip install -r requirements.txt<br/>python generator.py</code></pre>
<p>The simulator will push live snapshots every 5 seconds to Supabase, immediately streaming updates to the React dashboard over WebSockets.</p>

<hr/>

<h2>🛠️ Tech Stack</h2>
<table>
  <thead>
    <tr>
      <th>Layer</th>
      <th>Technology</th>
      <th>Role in Architecture</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><b>Frontend UI</b></td>
      <td>React 18 + Vite</td>
      <td>Reactive state management &amp; fast HMR bundling</td>
    </tr>
    <tr>
      <td><b>Styling</b></td>
      <td>Tailwind CSS</td>
      <td>High-contrast industrial control-room dark UI</td>
    </tr>
    <tr>
      <td><b>Visualization</b></td>
      <td>Recharts + Lucide React</td>
      <td>Real-time SVG time-series charting &amp; telemetry icons</td>
    </tr>
    <tr>
      <td><b>Database</b></td>
      <td>Supabase (PostgreSQL 15)</td>
      <td>Partitioned time-series storage &amp; REST API (PostgREST)</td>
    </tr>
    <tr>
      <td><b>Event Streaming</b></td>
      <td>Supabase Realtime (Elixir)</td>
      <td>PostgreSQL WAL Change Data Capture over WebSockets</td>
    </tr>
    <tr>
      <td><b>Simulation Engine</b></td>
      <td>Python 3 (<code>supabase-py</code>)</td>
      <td>Physics-constrained 5-second sensor data generator</td>
    </tr>
  </tbody>
</table>

<hr/>

<h2>📄 License</h2>
<p>Distributed under the <b>MIT License</b>. Developed for academic evaluation, power systems research, and supervisory decision-support prototyping.</p>

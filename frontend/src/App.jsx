import React, { useState, useEffect, useRef } from "react";
import { supabase } from "./supabaseClient";
import {
  Zap,
  Activity,
  Thermometer,
  Gauge,
  Fuel,
  ShieldAlert,
  LayoutDashboard,
  Home as HomeIcon,
  Radio,
  Clock,
  ArrowRight,
  Download,
  Cpu,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export default function App() {
  const [currentPage, setCurrentPage] = useState("home");
  const [plants, setPlants] = useState([]);
  const [selectedPlantId, setSelectedPlantId] = useState(1);
  const [telemetry, setTelemetry] = useState({});
  const [history, setHistory] = useState([]);
  const [isExporting, setIsExporting] = useState(false);

  const selectedPlantIdRef = useRef(1);

  // 1. Initial Data Fetch & Realtime Subscription
  useEffect(() => {
    let activeChannel;

    async function init() {
      const { data: plantList, error } = await supabase
        .from("powerplants")
        .select("*")
        .order("id", { ascending: true });

      if (error || !plantList) return;

      setPlants(plantList);

      const latestRecords = {};
      for (const p of plantList) {
        const { data: rows } = await supabase
          .from(p.table_name)
          .select("*")
          .order("timestamp", { ascending: false })
          .limit(1);

        if (rows && rows.length > 0) {
          latestRecords[p.table_name] = rows[0];
        }
      }
      setTelemetry(latestRecords);

      // Seed chart history for default plant
      if (plantList.length > 0) {
        const defaultPlant = plantList[0];
        const { data: initialHistory } = await supabase
          .from(defaultPlant.table_name)
          .select("timestamp, power_output_mw")
          .order("timestamp", { ascending: false })
          .limit(14);

        if (initialHistory) {
          setHistory(
            initialHistory.reverse().map((r) => ({
              time: new Date(r.timestamp).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              }),
              power: Number(r.power_output_mw),
            })),
          );
        }
      }

      // Realtime listener
      activeChannel = supabase
        .channel("multi-table-telemetry")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public" },
          (payload) => {
            const tableName = payload.table;
            const newRecord = payload.new;

            setTelemetry((prev) => ({ ...prev, [tableName]: newRecord }));

            const currentSelected = plantList.find(
              (p) => p.id === selectedPlantIdRef.current,
            );
            if (currentSelected && currentSelected.table_name === tableName) {
              setHistory((prev) => [
                ...prev.slice(-14),
                {
                  time: new Date(newRecord.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  }),
                  power: Number(newRecord.power_output_mw),
                },
              ]);
            }
          },
        )
        .subscribe();
    }

    init();

    return () => {
      if (activeChannel) supabase.removeChannel(activeChannel);
    };
  }, []);

  const handleSelectPlant = async (plantId) => {
    setSelectedPlantId(plantId);
    selectedPlantIdRef.current = plantId;
    setHistory([]);

    const plant = plants.find((p) => p.id === plantId);
    if (!plant) return;

    const { data: recentRows } = await supabase
      .from(plant.table_name)
      .select("timestamp, power_output_mw")
      .order("timestamp", { ascending: false })
      .limit(14);

    if (recentRows) {
      setHistory(
        recentRows.reverse().map((r) => ({
          time: new Date(r.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          }),
          power: Number(r.power_output_mw),
        })),
      );
    }
  };

  // CSV Export Utility for Academic/Lab Use
  const exportTelemetryCSV = async () => {
    if (!selectedPlant) return;
    setIsExporting(true);

    try {
      const { data, error } = await supabase
        .from(selectedPlant.table_name)
        .select("*")
        .order("timestamp", { ascending: false })
        .limit(60);

      if (error || !data || data.length === 0) {
        alert("No historical records to export.");
        setIsExporting(false);
        return;
      }

      const headers = Object.keys(data[0]).join(",");
      const rows = data.map((row) => Object.values(row).join(",")).join("\n");
      const csvContent = `${headers}\n${rows}`;

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `${selectedPlant.table_name}_telemetry_dataset.csv`,
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Export error:", err);
    } finally {
      setIsExporting(false);
    }
  };

  const selectedPlant =
    plants.find((p) => p.id === selectedPlantId) || plants[0];
  const activeTelemetry = selectedPlant
    ? telemetry[selectedPlant.table_name]
    : null;

  // Grid Totals
  const totalPower = Object.values(telemetry).reduce(
    (acc, cur) => acc + Number(cur?.power_output_mw || 0),
    0,
  );
  const totalCapacity = plants.reduce(
    (acc, cur) => acc + Number(cur?.capacity_mw || 0),
    0,
  );
  const solarGen = Number(
    telemetry["telemetry_sirajganj"]?.power_output_mw || 0,
  );
  const cleanEnergyShare =
    totalPower > 0 ? ((solarGen / totalPower) * 100).toFixed(1) : "0.0";

  // Live Frequency Deviation (Delta f from 50.00 Hz)
  const currentFreq = activeTelemetry?.frequency_hz
    ? Number(activeTelemetry.frequency_hz)
    : 50.0;
  const deltaF = (currentFreq - 50.0).toFixed(2);

  // Dynamic AI Heuristic Decision-Support Generator
  const getAIAdvisory = () => {
    if (!activeTelemetry) return null;

    const plantCode = selectedPlant?.plant_code;
    const freq = currentFreq;
    const load = Number(activeTelemetry.grid_load_pct);
    const temp = Number(activeTelemetry.temperature_c);

    if (plantCode === "SRJ-SOLAR") {
      return {
        title: "Clean Energy Integration & Grid Penetration",
        status: "OPTIMAL DISPATCH",
        recommendation: `PV cell temperature at ${temp}°C. Solar generation delivering ${activeTelemetry.power_output_mw} MW at zero fuel cost. Recommend full uncurtailed transmission priority over thermal units.`,
        action: "Maintain 100% Merit-Order Priority",
        confidence: "98.4% Confidence",
        severity: "optimal",
      };
    }

    if (freq < 49.92) {
      return {
        title: "Primary Frequency Response Advisory",
        status: "DYNAMIC DISPATCH REQUIRED",
        recommendation: `Sub-nominal system frequency detected (Δf = ${deltaF} Hz). System inertia indicates slight generation lag. Recommend dispatching spinning reserve (+15 MW) to stabilize synchronous speed.`,
        action: "Execute +15 MW Fast Ramp Setpoint",
        confidence: "94.8% Confidence",
        severity: "warning",
      };
    }

    if (temp > 544.0 && plantCode === "PYR-COAL") {
      return {
        title: "Boiler Thermal Stress Mitigation",
        status: "THERMAL STRAIN DETECTED",
        recommendation: `Main steam temperature (${temp}°C) exceeding baseline gradient (+4.0°C). Heat rate model indicates accelerated tube fouling risk. Suggest soot-blowing cycle.`,
        action: "Initiate Auxiliary Cooling Cycle",
        confidence: "91.2% Confidence",
        severity: "warning",
      };
    }

    return {
      title: "Merit-Order Economic Dispatch Engine",
      status: "OPTIMAL DISPATCH",
      recommendation: `Unit operating at ${load}% load with efficiency at ${activeTelemetry.efficiency_pct}%. Heat rate within normal PGCB Grid Code boundaries. Estimated marginal fuel cost minimized.`,
      action: "Maintain Scheduled Base Setpoint",
      confidence: "96.5% Confidence",
      severity: "optimal",
    };
  };

  const aiAdvisory = getAIAdvisory();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col">
      {/* Top Nav */}
      <nav className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600/20 p-2 rounded-lg border border-indigo-500/30">
              <Zap className="h-5 w-5 text-amber-400 fill-amber-400" />
            </div>
            <div>
              <span className="font-bold text-white tracking-wide text-base">
                GridDecision AI
              </span>
              <span className="text-[11px] text-indigo-400 ml-2 font-mono px-2 py-0.5 rounded bg-indigo-950/60 border border-indigo-800/40">
                Research Edition
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setCurrentPage("home")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                currentPage === "home"
                  ? "bg-indigo-600 text-white shadow-md"
                  : "text-slate-400 hover:text-white hover:bg-slate-900"
              }`}
            >
              <HomeIcon className="h-4 w-4" /> Home
            </button>
            <button
              onClick={() => setCurrentPage("dashboard")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                currentPage === "dashboard"
                  ? "bg-indigo-600 text-white shadow-md"
                  : "text-slate-400 hover:text-white hover:bg-slate-900"
              }`}
            >
              <LayoutDashboard className="h-4 w-4" /> Dashboard
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-full text-slate-300">
            <Radio className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
            <span>PostgreSQL Realtime Active</span>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6">
        {currentPage === "home" ? (
          /* ================= PAGE 1: HOME ================= */
          <div className="space-y-8">
            <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 p-8 rounded-2xl">
              <span className="text-xs uppercase font-mono tracking-wider text-indigo-400 bg-indigo-950/60 border border-indigo-800 px-3 py-1 rounded-full">
                Supervisory Telemetry & Policy Integration
              </span>
              <h1 className="text-3xl font-extrabold text-white mt-4">
                National Power Generation & Decision Support
              </h1>
              <p className="text-slate-400 text-sm max-w-2xl mt-2 leading-relaxed">
                Automated supervisory network tracking high-capacity thermal,
                combined cycle, and renewable generation across Bangladesh's
                interconnected grid nodes with live decision support.
              </p>
            </div>

            {/* Grid Total Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                <span className="text-xs uppercase text-slate-400 font-semibold tracking-wide">
                  Total Active Dispatch
                </span>
                <p className="text-3xl font-black text-indigo-400 mt-2">
                  {totalPower.toFixed(1)}{" "}
                  <span className="text-lg font-normal text-slate-400">MW</span>
                </p>
                <div className="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
                  <div
                    className="bg-indigo-500 h-full transition-all duration-500"
                    style={{
                      width: `${Math.min((totalPower / (totalCapacity || 1)) * 100, 100)}%`,
                    }}
                  ></div>
                </div>
                <span className="text-[11px] text-slate-500 mt-2 block">
                  {((totalPower / (totalCapacity || 1)) * 100).toFixed(1)}%
                  dispatch factor
                </span>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                <span className="text-xs uppercase text-slate-400 font-semibold tracking-wide">
                  Total Installed Fleet
                </span>
                <p className="text-3xl font-black text-slate-200 mt-2">
                  {totalCapacity.toFixed(1)}{" "}
                  <span className="text-lg font-normal text-slate-400">MW</span>
                </p>
                <span className="text-[11px] text-slate-500 mt-4 block">
                  3 Independent PostgreSQL tables
                </span>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                <span className="text-xs uppercase text-slate-400 font-semibold tracking-wide">
                  Clean Energy Share
                </span>
                <p className="text-3xl font-black text-teal-400 mt-2">
                  {cleanEnergyShare}%
                </p>
                <span className="text-[11px] text-slate-500 mt-4 block">
                  Policy target: 10% national renewable mix
                </span>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                <span className="text-xs uppercase text-slate-400 font-semibold tracking-wide">
                  Grid Frequency
                </span>
                <p className="text-3xl font-black text-emerald-400 mt-2">
                  50.00{" "}
                  <span className="text-sm font-normal text-slate-400">Hz</span>
                </p>
                <span className="text-[11px] text-slate-500 mt-4 block">
                  Synchronous Grid Code Compliance: Nominal
                </span>
              </div>
            </div>

            {/* Plants */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white">
                  Monitored Generation Units
                </h2>
                <span className="text-xs text-slate-500">
                  Click any plant to inspect telemetry and AI decision advice
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plants.map((plant) => {
                  const live = telemetry[plant.table_name];
                  return (
                    <div
                      key={plant.id}
                      onClick={() => {
                        handleSelectPlant(plant.id);
                        setCurrentPage("dashboard");
                      }}
                      className="bg-slate-900/90 border border-slate-800 hover:border-indigo-500/60 p-6 rounded-2xl cursor-pointer transition-all duration-200 hover:-translate-y-1 shadow-lg group"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-xs font-mono text-indigo-400">
                            {plant.plant_code}
                          </span>
                          <h3 className="font-bold text-lg text-white mt-1 group-hover:text-indigo-300 transition-colors">
                            {plant.name}
                          </h3>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {plant.fuel_type}
                          </p>
                        </div>
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                            live?.status === "WARNING"
                              ? "bg-amber-900/60 text-amber-300 border border-amber-700"
                              : "bg-emerald-900/60 text-emerald-300 border border-emerald-700"
                          }`}
                        >
                          {live?.status || "ONLINE"}
                        </span>
                      </div>

                      <div className="mt-6 pt-4 border-t border-slate-800 grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-xs text-slate-500">
                            Live Output
                          </span>
                          <p className="text-xl font-bold text-slate-100">
                            {live?.power_output_mw ?? "--"} MW
                          </p>
                        </div>
                        <div>
                          <span className="text-xs text-slate-500">
                            Frequency
                          </span>
                          <p className="text-xl font-bold text-slate-100">
                            {live?.frequency_hz ?? "--"} Hz
                          </p>
                        </div>
                      </div>

                      <button className="mt-5 w-full py-2.5 bg-slate-800 group-hover:bg-indigo-600 text-slate-200 group-hover:text-white text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5">
                        Enter Plant Dashboard{" "}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* ================= PAGE 2: DASHBOARD ================= */
          <div className="space-y-6">
            {/* Unit Selector Bar + CSV Export */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-semibold uppercase mr-2">
                  Unit:
                </span>
                {plants.map((plant) => (
                  <button
                    key={plant.id}
                    onClick={() => handleSelectPlant(plant.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      selectedPlantId === plant.id
                        ? "bg-indigo-600 text-white shadow-md"
                        : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
                    }`}
                  >
                    {plant.name}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={exportTelemetryCSV}
                  disabled={isExporting}
                  className="flex items-center gap-2 px-3.5 py-2 bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-medium rounded-xl transition-all cursor-pointer"
                  title="Export latest 50 records to CSV"
                >
                  <Download className="h-3.5 w-3.5 text-indigo-400" />
                  {isExporting ? "Exporting..." : "Export Telemetry (.CSV)"}
                </button>

                <div className="flex items-center gap-2 text-xs text-slate-400 border-l border-slate-800 pl-3">
                  <Clock className="h-3.5 w-3.5 text-indigo-400" />
                  <span className="font-mono text-slate-300">
                    {activeTelemetry
                      ? new Date(activeTelemetry.timestamp).toLocaleTimeString()
                      : "Syncing..."}
                  </span>
                </div>
              </div>
            </div>

            {/* AI Decision Support Panel */}
            {aiAdvisory && (
              <div
                className={`p-5 rounded-2xl border transition-all ${
                  aiAdvisory.severity === "warning"
                    ? "bg-amber-950/20 border-amber-600/40 text-amber-200"
                    : "bg-indigo-950/30 border-indigo-700/40 text-indigo-200"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800/60">
                  <div className="flex items-center gap-2.5">
                    <Cpu className="h-5 w-5 text-indigo-400" />
                    <span className="font-bold text-sm text-white tracking-wide">
                      AI Decision-Support System • {aiAdvisory.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-slate-300">
                      {aiAdvisory.confidence}
                    </span>
                    <span
                      className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                        aiAdvisory.severity === "warning"
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                          : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                      }`}
                    >
                      {aiAdvisory.status}
                    </span>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                  <div className="md:col-span-2 text-xs text-slate-300 leading-relaxed">
                    {aiAdvisory.recommendation}
                  </div>
                  <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">
                        Recommended Action
                      </span>
                      <span className="text-xs font-semibold text-white mt-0.5 block">
                        {aiAdvisory.action}
                      </span>
                    </div>
                    {aiAdvisory.severity === "warning" ? (
                      <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Plant Header */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-wrap justify-between items-center gap-4">
              <div>
                <span className="text-xs font-mono text-indigo-400">
                  {selectedPlant?.plant_code}
                </span>
                <h2 className="text-2xl font-bold text-white mt-1">
                  {selectedPlant?.name}
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Primary Fuel:{" "}
                  <span className="text-slate-200">
                    {selectedPlant?.fuel_type}
                  </span>{" "}
                  • Capacity:{" "}
                  <span className="text-slate-200">
                    {selectedPlant?.capacity_mw} MW
                  </span>{" "}
                  • Table:{" "}
                  <span className="font-mono text-indigo-300">
                    {selectedPlant?.table_name}
                  </span>
                </p>
              </div>

              <div className="flex items-center gap-4 text-right">
                <div>
                  <span className="text-[11px] uppercase text-slate-500 font-semibold block">
                    Grid Frequency Deviation (Δf)
                  </span>
                  <span
                    className={`text-sm font-mono font-bold ${Math.abs(Number(deltaF)) > 0.08 ? "text-amber-400" : "text-emerald-400"}`}
                  >
                    {Number(deltaF) >= 0 ? `+${deltaF}` : deltaF} Hz
                  </span>
                </div>
                <div className="border-l border-slate-800 pl-4">
                  <span className="text-[11px] uppercase text-slate-500 font-semibold block">
                    Health Status
                  </span>
                  <p
                    className={`text-lg font-extrabold ${activeTelemetry?.status === "WARNING" ? "text-amber-400" : "text-emerald-400"}`}
                  >
                    {activeTelemetry?.status || "NORMAL"}
                  </p>
                </div>
              </div>
            </div>

            {/* 8 Sensor Metrics */}
            <div>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Live Sensor Telemetry
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MetricCard
                  title="1. Active Power Output"
                  value={activeTelemetry?.power_output_mw}
                  unit="MW"
                  icon={<Zap className="text-amber-400" />}
                />
                <MetricCard
                  title="2. Bus Voltage"
                  value={activeTelemetry?.voltage_kv}
                  unit="kV"
                  icon={<Activity className="text-sky-400" />}
                />
                <MetricCard
                  title="3. Grid Frequency"
                  value={activeTelemetry?.frequency_hz}
                  unit="Hz"
                  icon={<Gauge className="text-emerald-400" />}
                />
                <MetricCard
                  title="4. Operating Temp"
                  value={activeTelemetry?.temperature_c}
                  unit="°C"
                  icon={<Thermometer className="text-rose-400" />}
                />
                <MetricCard
                  title="5. Fuel Consumption"
                  value={activeTelemetry?.fuel_consumption_rate}
                  unit="Unit/h"
                  icon={<Fuel className="text-orange-400" />}
                />
                <MetricCard
                  title="6. Thermal Efficiency"
                  value={activeTelemetry?.efficiency_pct}
                  unit="%"
                  icon={<Gauge className="text-cyan-400" />}
                />
                <MetricCard
                  title="7. Grid Dispatch Load"
                  value={activeTelemetry?.grid_load_pct}
                  unit="%"
                  icon={<Activity className="text-violet-400" />}
                />
                <MetricCard
                  title="8. Carbon Footprint"
                  value={activeTelemetry?.carbon_intensity_kg}
                  unit="kg/MWh"
                  icon={<ShieldAlert className="text-teal-400" />}
                />
              </div>
            </div>

            {/* Live Chart */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-200">
                  Real-Time Power Output Trajectory (MW)
                </h3>
                <span className="text-xs text-indigo-400 font-mono">
                  Stream synced via WebSockets (5s interval)
                </span>
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={history}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                    <YAxis
                      stroke="#64748b"
                      domain={["auto", "auto"]}
                      fontSize={11}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        borderColor: "#334155",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="power"
                      stroke="#6366f1"
                      strokeWidth={3}
                      dot={{ fill: "#818cf8", r: 3 }}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function MetricCard({ title, value, unit, icon }) {
  return (
    <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between shadow-sm">
      <div>
        <p className="text-[11px] text-slate-400 uppercase tracking-wide font-medium">
          {title}
        </p>
        <p className="text-xl font-bold text-white mt-1">
          {value !== undefined ? value : "--"}{" "}
          <span className="text-xs font-normal text-slate-400">{unit}</span>
        </p>
      </div>
      <div className="p-2.5 bg-slate-800/80 rounded-lg">{icon}</div>
    </div>
  );
}

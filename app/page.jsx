"use client";

import { useState, useMemo } from "react";
import results from "../results.json";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  CartesianGrid,
  BarChart,
  Bar,
  Cell,
} from "recharts";

const YEARS = Object.keys(results.annual).map(Number).sort();

const SCENARIOS = [
  { key: "item_static", reform: "Itemized only", ubi: "No", behavioral: "Static" },
  { key: "item_dynamic", reform: "Itemized only", ubi: "No", behavioral: "Dynamic" },
  { key: "item_static_ubi", reform: "Itemized only", ubi: "Yes", behavioral: "Static" },
  { key: "item_dynamic_ubi", reform: "Itemized only", ubi: "Yes", behavioral: "Dynamic" },
  { key: "both_static", reform: "All deductions", ubi: "No", behavioral: "Static" },
  { key: "both_dynamic", reform: "All deductions", ubi: "No", behavioral: "Dynamic" },
  { key: "both_static_ubi", reform: "All deductions", ubi: "Yes", behavioral: "Static" },
  { key: "both_dynamic_ubi", reform: "All deductions", ubi: "Yes", behavioral: "Dynamic" },
];

const COLORS = {
  item_static: "#319795",
  item_dynamic: "#2C7A7B",
  both_static: "#E53E3E",
  both_dynamic: "#C53030",
};

function fmt(n) {
  if (n == null) return "N/A";
  if (Math.abs(n) >= 1000) return `$${(n / 1000).toFixed(1)}T`;
  return `$${Math.round(n)}B`;
}

function fmtUbi(n) {
  if (n == null) return "—";
  return `$${n.toLocaleString()}`;
}

export default function Home() {
  const [reformFilter, setReformFilter] = useState("both");
  const [showUbi, setShowUbi] = useState(false);
  const [showBehavioral, setShowBehavioral] = useState(true);

  const activeScenarios = useMemo(() => {
    return SCENARIOS.filter((s) => {
      const reformMatch =
        reformFilter === "both"
          ? s.key.startsWith("both_")
          : s.key.startsWith("item_");
      const ubiMatch = showUbi ? s.ubi === "Yes" : s.ubi === "No";
      return reformMatch && ubiMatch;
    });
  }, [reformFilter, showUbi]);

  const visibleKeys = useMemo(() => {
    const keys = [];
    for (const s of activeScenarios) {
      if (s.behavioral === "Static") keys.push(s.key);
      if (s.behavioral === "Dynamic" && showBehavioral) keys.push(s.key);
    }
    return keys;
  }, [activeScenarios, showBehavioral]);

  const chartData = useMemo(() => {
    return YEARS.map((yr) => {
      const row = { year: yr };
      for (const key of visibleKeys) {
        const d = results.annual[String(yr)]?.[key];
        if (d) row[key] = d.federal;
      }
      return row;
    });
  }, [visibleKeys]);

  const tenYearTotals = useMemo(() => {
    const totals = {};
    for (const s of SCENARIOS) {
      let sum = 0;
      let count = 0;
      for (const yr of YEARS) {
        const d = results.annual[String(yr)]?.[s.key];
        if (d && d.federal != null) {
          sum += d.federal;
          count++;
        }
      }
      totals[s.key] = count === YEARS.length ? Math.round(sum) : null;
    }
    return totals;
  }, []);

  const summaryData = useMemo(() => {
    return activeScenarios
      .filter((s) => showBehavioral || s.behavioral === "Static")
      .map((s) => ({
        ...s,
        tenYear: tenYearTotals[s.key],
      }));
  }, [activeScenarios, showBehavioral, tenYearTotals]);

  const barData = useMemo(() => {
    const staticKey = visibleKeys.find((k) => k.includes("static"));
    const dynamicKey = visibleKeys.find(
      (k) => k.includes("dynamic") && !k.includes("static"),
    );
    const items = [];
    if (staticKey) {
      items.push({
        name: "Static",
        value: tenYearTotals[staticKey],
        color: "#319795",
      });
    }
    if (dynamicKey && showBehavioral) {
      items.push({
        name: "Dynamic (CBO)",
        value: tenYearTotals[dynamicKey],
        color: "#2C7A7B",
      });
    }
    return items;
  }, [visibleKeys, showBehavioral, tenYearTotals]);

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-[--pe-color-teal-700] text-white px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <h1 className="text-xl font-bold">Deduction repeal analysis</h1>
          <span className="text-sm opacity-75">PolicyEngine</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Controls */}
        <div className="flex flex-wrap gap-6 items-center">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Reform
            </label>
            <select
              value={reformFilter}
              onChange={(e) => setReformFilter(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm"
            >
              <option value="both">Repeal all deductions</option>
              <option value="item">Repeal itemized only</option>
            </select>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showUbi}
              onChange={(e) => setShowUbi(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm">Revenue-neutral UBI</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showBehavioral}
              onChange={(e) => setShowBehavioral(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm">CBO behavioral responses</span>
          </label>
        </div>

        {/* 10-year summary bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {barData.map((d) => (
            <div
              key={d.name}
              className="bg-gray-50 rounded-xl p-6 border border-gray-100"
            >
              <p className="text-sm text-gray-500">{d.name} 10-year score</p>
              <p className="text-3xl font-bold mt-1" style={{ color: d.color }}>
                {fmt(d.value)}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Federal income tax revenue, 2026-2035
              </p>
            </div>
          ))}
          {showUbi && visibleKeys.length > 0 && (
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
              <p className="text-sm text-gray-500">Budget-neutral UBI</p>
              <p className="text-3xl font-bold mt-1 text-amber-600">
                {fmtUbi(
                  results.annual["2026"]?.[visibleKeys[0]]?.ubi_per_person,
                )}
                -
                {fmtUbi(
                  results.annual["2035"]?.[visibleKeys[0]]?.ubi_per_person,
                )}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Per person per year (non-taxable)
              </p>
            </div>
          )}
        </div>

        {/* Annual timeseries */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">
            Annual federal revenue increase
          </h2>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="year" />
              <YAxis
                tickFormatter={(v) => `$${v}B`}
                label={{
                  value: "Federal revenue ($B)",
                  angle: -90,
                  position: "insideLeft",
                  offset: 10,
                }}
              />
              <Tooltip
                formatter={(v, name) => [
                  `$${Math.round(v)}B`,
                  name.includes("dynamic") ? "Dynamic (CBO)" : "Static",
                ]}
                labelFormatter={(yr) => `Year ${yr}`}
              />
              <Legend
                formatter={(value) =>
                  value.includes("dynamic") ? "Dynamic (CBO)" : "Static"
                }
              />
              <ReferenceLine
                x={2030}
                stroke="#E53E3E"
                strokeDasharray="5 5"
                label={{
                  value: "OBBBA expires",
                  position: "top",
                  fill: "#E53E3E",
                  fontSize: 12,
                }}
              />
              {visibleKeys.map((key) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={
                    key.includes("dynamic")
                      ? "#2C7A7B"
                      : "#319795"
                  }
                  strokeWidth={key.includes("dynamic") ? 2 : 3}
                  strokeDasharray={key.includes("dynamic") ? "5 5" : undefined}
                  dot={{ r: 4 }}
                  name={key}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
          {reformFilter === "both" && (
            <p className="text-xs text-gray-400 mt-2 text-center">
              Revenue jumps in 2030 when OBBBA&apos;s higher standard deduction
              ($32K joint) reverts to pre-TCJA levels (~$16K).
            </p>
          )}
        </div>

        {/* Detail table */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 overflow-x-auto">
          <h2 className="text-lg font-semibold mb-4">Annual detail</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2 pr-4">Year</th>
                {visibleKeys.map((key) => (
                  <th key={key} className="py-2 px-3 text-right">
                    {key.includes("dynamic") ? "Dynamic" : "Static"}
                    {key.includes("ubi") ? " + UBI" : ""}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {YEARS.map((yr) => (
                <tr
                  key={yr}
                  className={`border-b ${yr === 2030 ? "bg-red-50" : ""}`}
                >
                  <td className="py-2 pr-4 font-medium">{yr}</td>
                  {visibleKeys.map((key) => {
                    const d = results.annual[String(yr)]?.[key];
                    return (
                      <td key={key} className="py-2 px-3 text-right tabular-nums">
                        {d ? fmt(d.federal) : "—"}
                        {d?.ubi_per_person != null && (
                          <span className="text-xs text-gray-400 ml-1">
                            (UBI {fmtUbi(d.ubi_per_person)})
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
              <tr className="font-bold border-t-2">
                <td className="py-2 pr-4">10-year</td>
                {visibleKeys.map((key) => (
                  <td key={key} className="py-2 px-3 text-right tabular-nums">
                    {fmt(tenYearTotals[key])}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Methodology */}
        <details className="bg-gray-50 rounded-xl border border-gray-100 p-6">
          <summary className="text-sm font-semibold cursor-pointer">
            Methodology
          </summary>
          <div className="mt-4 text-sm text-gray-600 space-y-2">
            <p>
              Microsimulation using PolicyEngine US with the Enhanced Current
              Population Survey (CPS). Each year is simulated independently.
            </p>
            <p>
              <strong>Itemized deduction repeal</strong> zeros out SALT cap,
              mortgage interest cap, charitable ceiling, and medical expense
              floor (set to 100% AGI).
            </p>
            <p>
              <strong>Standard deduction repeal</strong> additionally sets the
              basic and aged/blind standard deduction amounts to $0 for all
              filing statuses.
            </p>
            <p>
              <strong>CBO behavioral elasticities:</strong> labor supply
              substitution 0.22-0.31 by income decile (0.27 secondary earners),
              income elasticity -0.05, capital gains realization -0.79.
            </p>
            <p>
              <strong>UBI recycling:</strong> non-taxable flat per-person
              transfer, rounded to nearest $100/year, set to approximate
              budget neutrality with federal revenue.
            </p>
          </div>
        </details>
      </main>

      <footer className="border-t mt-12 py-6 text-center text-sm text-gray-400">
        Built with{" "}
        <a
          href="https://policyengine.org"
          className="text-teal-600 hover:underline"
        >
          PolicyEngine
        </a>
      </footer>
    </div>
  );
}

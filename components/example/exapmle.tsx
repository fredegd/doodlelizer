import React, { useState } from "react";

// Points from the SVG file
const points: { x: number; y: number }[] = [
  { x: 0, y: 100 },
  { x: 0, y: 521.05 },
  { x: 93.33, y: 521.05 },
  { x: 93.33, y: 100 },
  { x: 186.67, y: 100 },
  { x: 186.67, y: 521.05 },
  { x: 280, y: 521.05 },
  { x: 280, y: 100 },
  { x: 373.33, y: 100 },
  { x: 373.33, y: 521.05 },
  { x: 466.67, y: 521.05 },
  { x: 466.67, y: 100 },
  { x: 560, y: 100 },
];

function convertToLinePath(points: { x: number; y: number }[]) {
  return points
    .map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`))
    .join(" ");
}

function convertToCurvePath(
  points: { x: number; y: number }[],
  smoothness = 0.1
) {
  if (points.length < 2) return "";

  // Start with the first point
  let path = `M ${points[0].x} ${points[0].y}`;

  // Calculate control points for each actual vertex
  for (let i = 0; i < points.length - 1; i++) {
    const current = points[i];
    const next = points[i + 1];

    // For the first point, use itself as the "previous" point
    const previous = i > 0 ? points[i - 1] : current;

    // For the last point pair, the "next next" point is the last point itself
    const nextNext = i < points.length - 2 ? points[i + 2] : next;

    // Calculate control points that ensure the curve passes through all vertices
    // Calculate direction vectors
    const v1 = {
      x: next.x - previous.x,
      y: next.y - previous.y,
    };

    const v2 = {
      x: nextNext.x - current.x,
      y: nextNext.y - current.y,
    };

    // Calculate control point distances
    const len1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
    const len2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);

    // Normalize vectors and scale by smoothness
    const distance1 = Math.min(len1 * smoothness, len1 / 2);
    const distance2 = Math.min(len2 * smoothness, len2 / 2);

    // Calculate control points
    const cp1 = {
      x: current.x + (v1.x / len1) * distance1,
      y: current.y + (v1.y / len1) * distance1,
    };

    const cp2 = {
      x: next.x - (v2.x / len2) * distance2,
      y: next.y - (v2.y / len2) * distance2,
    };

    // Add the curve segment
    path += ` C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${next.x} ${next.y}`;
  }

  return path;
}

export default function PathConverter() {
  const [mode, setMode] = useState("line");
  const [smoothness, setSmoothness] = useState(0.1);

  const pathD =
    mode === "line"
      ? convertToLinePath(points)
      : convertToCurvePath(points, smoothness);

  return (
    <div className="flex flex-col items-center gap-4 p-6 ">
      <h1 className="text-2xl font-bold">SVG-Pfad-Konverter</h1>
      <div className="flex gap-4">
        <button
          onClick={() => setMode("line")}
          className={`px-4 py-2 rounded-xl ${mode === "line" ? "bg-blue-500 text-white" : "bg-gray-200"
            }`}
        >
          Gerade Linien
        </button>
        <button
          onClick={() => setMode("curve")}
          className={`px-4 py-2 rounded-xl ${mode === "curve" ? "bg-blue-500 text-white" : "bg-gray-200"
            }`}
        >
          Kurven
        </button>
      </div>

      {mode === "curve" && (
        <div className="w-64">
          <p className="text-sm">Glättung: {smoothness.toFixed(2)}</p>
          <input
            type="range"
            min="0.05"
            max="0.7"
            step="0.01"
            value={smoothness}
            onChange={(e) => setSmoothness(parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>
      )}

      <svg
        viewBox="0 0 600 750"
        className="w-full max-w-3xl h-96 border border-gray-300 bg-slate-50"
      >
        <path d={pathD} stroke="black" fill="none" strokeWidth="2" />

        {/* Add dots for each point to better visualize */}
        {points.map((point, index) => (
          <circle key={index} cx={point.x} cy={point.y} r="4" fill="red" />
        ))}

        {/* Display control points and handles in curve mode for better visualization */}
        {mode === "curve" &&
          points.map((point, i) => {
            if (i < points.length - 1) {
              // For the first point, use itself as the "previous" point
              const previous = i > 0 ? points[i - 1] : point;

              // For the last point pair, the "next next" point is the last point itself
              const next = points[i + 1];
              const nextNext = i < points.length - 2 ? points[i + 2] : next;

              // Calculate direction vectors
              const v1 = {
                x: next.x - previous.x,
                y: next.y - previous.y,
              };

              const v2 = {
                x: nextNext.x - point.x,
                y: nextNext.y - point.y,
              };

              // Calculate control point distances
              const len1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
              const len2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);

              // Normalize vectors and scale by smoothness
              const distance1 = Math.min(len1 * smoothness, len1 / 2);
              const distance2 = Math.min(len2 * smoothness, len2 / 2);

              // Calculate control points
              const cp1 = {
                x: point.x + (v1.x / len1) * distance1,
                y: point.y + (v1.y / len1) * distance1,
              };

              const cp2 = {
                x: next.x - (v2.x / len2) * distance2,
                y: next.y - (v2.y / len2) * distance2,
              };

              return (
                <g key={`controls-${i}`}>
                  {/* Control point 1 */}
                  <circle
                    cx={cp1.x}
                    cy={cp1.y}
                    r="3"
                    fill="blue"
                    opacity="0.5"
                  />
                  <line
                    x1={point.x}
                    y1={point.y}
                    x2={cp1.x}
                    y2={cp1.y}
                    stroke="blue"
                    strokeWidth="1"
                    opacity="0.5"
                  />

                  {/* Control point 2 */}
                  <circle
                    cx={cp2.x}
                    cy={cp2.y}
                    r="3"
                    fill="green"
                    opacity="0.5"
                  />
                  <line
                    x1={next.x}
                    y1={next.y}
                    x2={cp2.x}
                    y2={cp2.y}
                    stroke="green"
                    strokeWidth="1"
                    opacity="0.5"
                  />
                </g>
              );
            }
            return null;
          })}
      </svg>
    </div>
  );
}

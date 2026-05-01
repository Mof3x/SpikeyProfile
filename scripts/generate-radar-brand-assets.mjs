import fs from "node:fs";
import path from "node:path";
import { Resvg } from "@resvg/resvg-js";

const OUT_DIR = path.join(process.cwd(), "assets", "images");

const BRAND = {
  backgroundDark: "#0A0E14",
  primary: "#7C9FCC",
  secondary: "#A8C5A1",
  accent: "#E8B86D",
  dividerDark: "#2A3142",
  white: "#FFFFFF",
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const makeRadarSvg = ({ background, grid, layers, dotLayerIndex }) => {
  // Use a stable viewBox so we can render to multiple PNG sizes.
  const VB = 1024;
  const center = VB / 2;
  const safePadding = 160;
  const radius = center - safePadding;
  const axisCount = 8;
  const startAngle = -Math.PI / 2;
  const angleStep = (Math.PI * 2) / axisCount;
  const maxScore = 5;

  const axes = Array.from({ length: axisCount }, (_, i) => {
    const angle = startAngle + i * angleStep;
    const x = center + radius * Math.cos(angle);
    const y = center + radius * Math.sin(angle);
    return { angle, x, y };
  });

  const gridLevels = [1, 2, 3, 4, 5];
  const gridPolys = gridLevels
    .map((level) => {
      const r = (radius * level) / maxScore;
      const points = axes
        .map(({ angle }) => {
          const x = center + r * Math.cos(angle);
          const y = center + r * Math.sin(angle);
          return `${x},${y}`;
        })
        .join(" ");
      return `<polygon points="${points}" fill="none" stroke="${grid}" stroke-width="10" />`;
    })
    .join("\n");

  const spokes = axes
    .map(
      (a) =>
        `<line x1="${center}" y1="${center}" x2="${a.x}" y2="${a.y}" stroke="${grid}" stroke-width="10" />`,
    )
    .join("\n");

  const getPolygonPoints = (values) =>
    values
      .map((value, i) => {
        const safe = clamp(value, 1, 5);
        const r = (radius * safe) / maxScore;
        const angle = axes[i].angle;
        const x = center + r * Math.cos(angle);
        const y = center + r * Math.sin(angle);
        return { x, y };
      })
      .map((p) => `${p.x},${p.y}`)
      .join(" ");

  const layerSvgs = layers
    .map((layer) => {
      const points = getPolygonPoints(layer.values);
      return `<polygon points="${points}" fill="${layer.fill}" fill-opacity="${layer.fillOpacity}" stroke="${layer.stroke}" stroke-width="${layer.strokeWidth}" stroke-linejoin="round" />`;
    })
    .join("\n");

  const dotLayer =
    typeof dotLayerIndex === "number" ? layers[dotLayerIndex] : null;
  const dots = dotLayer
    ? dotLayer.values
        .map((value, i) => {
          const safe = clamp(value, 1, 5);
          const r = (radius * safe) / maxScore;
          const angle = axes[i].angle;
          const x = center + r * Math.cos(angle);
          const y = center + r * Math.sin(angle);
          return `<circle cx="${x}" cy="${y}" r="14" fill="${dotLayer.stroke}" />`;
        })
        .join("\n")
    : "";

  const backgroundRect = background
    ? `<rect width="${VB}" height="${VB}" fill="${background}" />`
    : "";

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VB} ${VB}">
  ${backgroundRect}
  ${gridPolys}
  ${spokes}
  ${layerSvgs}
  ${dots}
</svg>`;
};

const renderPng = ({ svg, size, outPath }) => {
  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: size },
  });
  const pngData = resvg.render().asPng();
  fs.writeFileSync(outPath, pngData);
};

const main = () => {
  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }

  // Three overlaid radar graphs (static) — layered, colorful, and recognizable.
  const baseLayers = [
    {
      values: [4, 3, 5, 4, 2, 3, 2, 3],
      stroke: BRAND.primary,
      fill: BRAND.primary,
      fillOpacity: 0.16,
      strokeWidth: 18,
    },
    {
      values: [3, 4, 3, 2, 3, 4, 4, 2],
      stroke: BRAND.secondary,
      fill: BRAND.secondary,
      fillOpacity: 0.14,
      strokeWidth: 16,
    },
    {
      values: [2, 2, 4, 3, 4, 2, 3, 4],
      stroke: BRAND.accent,
      fill: BRAND.accent,
      fillOpacity: 0.14,
      strokeWidth: 16,
    },
  ];

  const iconSvg = makeRadarSvg({
    background: BRAND.backgroundDark,
    grid: BRAND.dividerDark,
    layers: baseLayers,
    dotLayerIndex: 0,
  });

  const transparentSvg = makeRadarSvg({
    background: null,
    grid: BRAND.dividerDark,
    layers: baseLayers,
    dotLayerIndex: 0,
  });

  const monochromeSvg = makeRadarSvg({
    background: null,
    grid: BRAND.white,
    layers: baseLayers.map((layer, i) => ({
      ...layer,
      stroke: BRAND.white,
      fill: BRAND.white,
      fillOpacity: i === 0 ? 0.16 : 0.1,
    })),
    dotLayerIndex: 0,
  });

  renderPng({
    svg: iconSvg,
    size: 1024,
    outPath: path.join(OUT_DIR, "icon.png"),
  });

  renderPng({
    svg: iconSvg,
    size: 48,
    outPath: path.join(OUT_DIR, "favicon.png"),
  });

  // Used by expo-splash-screen plugin with imageWidth=200.
  renderPng({
    svg: transparentSvg,
    size: 200,
    outPath: path.join(OUT_DIR, "splash-icon.png"),
  });

  // Android adaptive icon foreground should be transparent.
  renderPng({
    svg: transparentSvg,
    size: 432,
    outPath: path.join(OUT_DIR, "android-icon-foreground.png"),
  });

  // Optional themed icon support (kept in repo for platform tooling).
  renderPng({
    svg: monochromeSvg,
    size: 432,
    outPath: path.join(OUT_DIR, "android-icon-monochrome.png"),
  });

  console.log("Generated radar brand assets in", OUT_DIR);
};

main();

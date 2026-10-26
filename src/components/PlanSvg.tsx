import { memo, useId, useRef, useState, type PointerEvent } from "react";
import { getCatalog, type Shape } from "../data/catalog";
import {
  bounds,
  footprint,
  formatLength,
  inRoom,
  overlaps,
  pointerToWorld,
  snap,
} from "../lib/geometry";
import type { Item, Project } from "../lib/model";
interface Props {
  project: Project;
  selected?: string | null;
  onSelect?: (id: string | null) => void;
  onMove?: (id: string, x: number, y: number) => void;
  grid?: boolean;
  measurements?: boolean;
  zoom?: number;
  pan?: { x: number; y: number };
  onPan?: (x: number, y: number) => void;
  panMode?: boolean;
  className?: string;
  id?: string;
}
export const FurnitureShape = memo(function FurnitureShape({
  shape,
  width: w,
  depth: h,
  color,
}: {
  shape: Shape;
  width: number;
  depth: number;
  color: string;
}) {
  const line = "#626b58",
    s = Math.max(12, Math.min(w, h) * 0.025);
  const common = { fill: color, stroke: line, strokeWidth: s };
  return (
    <g>
      {shape === "plant" ? (
        <>
          <circle
            cx={w / 2}
            cy={h / 2}
            r={w * 0.29}
            fill="#b6b8a2"
            stroke={line}
            strokeWidth={s}
          />
          {[0, 60, 120, 180, 240, 300].map((d) => (
            <ellipse
              key={d}
              cx={w * 0.5}
              cy={h * 0.31}
              rx={w * 0.135}
              ry={h * 0.3}
              fill={d % 120 === 0 ? "#6e8060" : "#8e9e79"}
              stroke="#677758"
              strokeWidth={s * 0.5}
              transform={`rotate(${d} ${w / 2} ${h / 2})`}
            />
          ))}
          <circle cx={w / 2} cy={h / 2} r={w * 0.07} fill="#536b4a" />
        </>
      ) : shape === "rug" ? (
        <>
          <rect
            x="0"
            y="0"
            width={w}
            height={h}
            rx="35"
            fill={color}
            stroke="#c6b9a4"
            strokeWidth={s}
          />
          <rect
            x="70"
            y="70"
            width={Math.max(10, w - 140)}
            height={Math.max(10, h - 140)}
            rx="20"
            fill="url(#rug-stripes)"
            stroke="#cfc2ad"
            strokeWidth="10"
          />
        </>
      ) : shape === "sofa" || shape === "sectional" ? (
        <>
          <rect width={w} height={h} rx="100" {...common} />
          <rect
            x={w * 0.06}
            y={h * 0.23}
            width={w * 0.88}
            height={h * 0.67}
            rx="60"
            fill={color}
            stroke={line}
            strokeWidth={s}
          />
          {[1, 2].map((i) => (
            <path
              key={i}
              d={`M ${(w * i) / 3} ${h * 0.24} V ${h * 0.9}`}
              stroke={line}
              strokeWidth={s * 0.65}
            />
          ))}
          <rect
            x={w * 0.025}
            y={h * 0.18}
            width={w * 0.08}
            height={h * 0.7}
            rx="35"
            {...common}
          />
          <rect
            x={w * 0.895}
            y={h * 0.18}
            width={w * 0.08}
            height={h * 0.7}
            rx="35"
            {...common}
          />
          {shape === "sectional" && (
            <rect
              x={w * 0.67}
              y={h * 0.3}
              width={w * 0.3}
              height={h * 0.65}
              rx="50"
              {...common}
            />
          )}
        </>
      ) : shape === "bed" ? (
        <>
          <rect width={w} height={h} rx="30" {...common} />
          <rect
            x="40"
            y="40"
            width={w - 80}
            height={h - 80}
            rx="45"
            fill="#f5f0e6"
            stroke={line}
            strokeWidth={s}
          />
          <rect
            x={w * 0.08}
            y={h * 0.05}
            width={w * 0.38}
            height={h * 0.19}
            rx="45"
            fill="#eee8dc"
            stroke="#aa9f8b"
            strokeWidth={s * 0.6}
          />
          <rect
            x={w * 0.54}
            y={h * 0.05}
            width={w * 0.38}
            height={h * 0.19}
            rx="45"
            fill="#eee8dc"
            stroke="#aa9f8b"
            strokeWidth={s * 0.6}
          />
          <path
            d={`M 40 ${h * 0.34} H ${w - 40} V ${h - 40} H 40 Z`}
            fill={color}
            stroke="#aa9f8b"
            strokeWidth={s}
          />
          <path
            d={`M 40 ${h * 0.43} H ${w - 40}`}
            stroke="#b6ac98"
            strokeWidth={s}
          />
        </>
      ) : shape === "chair" ? (
        <>
          <rect
            x={w * 0.08}
            y={h * 0.08}
            width={w * 0.84}
            height={h * 0.84}
            rx={w * 0.2}
            {...common}
          />
          <rect
            x={w * 0.19}
            y={h * 0.3}
            width={w * 0.62}
            height={h * 0.56}
            rx={w * 0.14}
            fill={color}
            stroke={line}
            strokeWidth={s}
          />
          <path
            d={`M ${w * 0.17} ${h * 0.13} Q ${w / 2} 0 ${w * 0.83} ${h * 0.13}`}
            fill="none"
            stroke={line}
            strokeWidth={s * 2}
          />
        </>
      ) : shape === "round" || shape === "lamp" ? (
        <>
          <ellipse
            cx={w / 2}
            cy={h / 2}
            rx={w / 2 - s}
            ry={h / 2 - s}
            {...common}
          />
          <ellipse
            cx={w / 2}
            cy={h / 2}
            rx={w * 0.4}
            ry={h * 0.4}
            fill="none"
            stroke="#e4d0b3"
            strokeWidth={s}
          />
          {shape === "lamp" && (
            <circle cx={w / 2} cy={h / 2} r={w * 0.08} fill={line} />
          )}
        </>
      ) : shape === "storage" ? (
        <>
          <rect width={w} height={h} rx="15" {...common} />
          {[1, 2, 3].map((i) => (
            <path
              key={i}
              d={`M ${(w * i) / 4} 0 V ${h}`}
              stroke={line}
              strokeWidth={s * 0.6}
            />
          ))}
          <path
            d={`M 0 ${h * 0.77} H ${w}`}
            stroke={line}
            strokeWidth={s * 0.6}
          />
        </>
      ) : (
        <>
          <rect
            width={w}
            height={h}
            rx={shape === "table" ? 90 : 20}
            {...common}
          />
          <rect
            x="35"
            y="35"
            width={Math.max(w - 70, 10)}
            height={Math.max(h - 70, 10)}
            rx="60"
            fill="none"
            stroke="#e0c5a4"
            strokeWidth={s * 0.6}
          />
          {shape === "desk" && (
            <>
              <rect
                x={w * 0.3}
                y={h * 0.15}
                width={w * 0.4}
                height={h * 0.35}
                rx="15"
                fill="#dce1d7"
                stroke={line}
                strokeWidth={s}
              />
              <path
                d={`M ${w * 0.34} ${h * 0.65} H ${w * 0.66}`}
                stroke={line}
                strokeWidth={s * 3}
              />
            </>
          )}
        </>
      )}
    </g>
  );
});
export const PlanSvg = memo(function PlanSvg({
  project,
  selected,
  onSelect,
  onMove,
  grid = false,
  measurements = true,
  zoom = 1,
  pan = { x: 0, y: 0 },
  onPan,
  panMode = false,
  className = "",
  id,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null),
    pattern = useId().replaceAll(":", "");
  const [drag, setDrag] = useState<{ id: string; x: number; y: number } | null>(
    null,
  );
  const active = useRef<{
    id: string;
    startX: number;
    startY: number;
    itemX: number;
    itemY: number;
    pointer: number;
    transform?: DOMMatrix;
  } | null>(null);
  const b = bounds(project.rooms),
    pad = Math.max(b.width, b.depth) * 0.15;
  const fullW = b.width + pad * 2,
    fullH = b.depth + pad * 2;
  const view = {
    x: b.x - pad + (fullW - fullW / zoom) / 2 + pan.x,
    y: b.y - pad + (fullH - fullH / zoom) / 2 + pan.y,
    width: fullW / zoom,
    height: fullH / zoom,
  };
  const point = (e: PointerEvent<SVGSVGElement | SVGGElement>) => {
    const matrix = svgRef.current?.getScreenCTM();
    if (matrix)
      return new DOMPoint(e.clientX, e.clientY).matrixTransform(
        matrix.inverse(),
      );
    return pointerToWorld(
      { x: e.clientX, y: e.clientY },
      svgRef.current!.getBoundingClientRect(),
      { ...view, height: view.height },
    );
  };
  function start(e: PointerEvent<SVGGElement>, i: Item) {
    if (panMode) return;
    if (!onSelect) return;
    e.stopPropagation();
    onSelect(i.id);
    if (!onMove) return;
    const p = point(e);
    active.current = {
      id: i.id,
      startX: p.x,
      startY: p.y,
      itemX: i.x,
      itemY: i.y,
      pointer: e.pointerId,
      transform: svgRef.current?.getScreenCTM()?.inverse(),
    };
    svgRef.current?.setPointerCapture(e.pointerId);
  }
  function move(e: PointerEvent<SVGSVGElement>) {
    const a = active.current;
    if (!a) return;
    const p = a.transform
      ? new DOMPoint(e.clientX, e.clientY).matrixTransform(a.transform)
      : point(e);
    if (a.id === "__pan") {
      onPan?.(a.itemX - (p.x - a.startX), a.itemY - (p.y - a.startY));
      return;
    }
    const i = project.furniture.find((i) => i.id === a.id),
      r = project.rooms.find((r) => r.id === i?.roomId);
    if (!i || !r) return;
    const f = footprint(i);
    const x = a.itemX + p.x - a.startX,
      y = a.itemY + p.y - a.startY;
    setDrag({
      id: a.id,
      x: Math.max(r.x, Math.min(grid ? snap(x) : x, r.x + r.width - f.width)),
      y: Math.max(r.y, Math.min(grid ? snap(y) : y, r.y + r.depth - f.depth)),
    });
  }
  function end() {
    if (drag) onMove?.(drag.id, drag.x, drag.y);
    active.current = null;
    setDrag(null);
  }
  return (
    <svg
      ref={svgRef}
      id={id}
      className={`plan-svg ${className}`}
      viewBox={`${view.x} ${view.y} ${view.width} ${view.height}`}
      role="img"
      aria-label={`Floor plan of ${project.name}. ${project.rooms.length} rooms and ${project.furniture.length} furniture items.`}
      onPointerMove={move}
      onPointerUp={end}
      onPointerCancel={() => {
        active.current = null;
        setDrag(null);
      }}
      onPointerDown={(e) => {
        if (panMode && onPan) {
          const p = point(e);
          active.current = {
            id: "__pan",
            startX: p.x,
            startY: p.y,
            itemX: pan.x,
            itemY: pan.y,
            pointer: e.pointerId,
            transform: svgRef.current?.getScreenCTM()?.inverse(),
          };
          e.currentTarget.setPointerCapture(e.pointerId);
        } else onSelect?.(null);
      }}
      style={{ touchAction: onMove ? "none" : "auto" }}
    >
      <defs>
        <pattern
          id={`floor-${pattern}`}
          width="300"
          height="300"
          patternUnits="userSpaceOnUse"
        >
          <rect width="300" height="300" fill="#f2eee3" />
          <path
            d="M 0 0 V 300 M 150 0 V 300"
            stroke="#d8cfbc"
            strokeWidth="5"
            opacity=".45"
          />
          <path
            d="M 15 0 V 300 M 35 0 V 300 M 180 0 V 300 M 270 0 V 300"
            stroke="#e6decd"
            strokeWidth="2"
          />
        </pattern>
        <pattern
          id={`dots-${pattern}`}
          width="250"
          height="250"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="4" cy="4" r="7" fill="#8b917e" opacity=".3" />
        </pattern>
        <pattern
          id="rug-stripes"
          width="48"
          height="48"
          patternUnits="userSpaceOnUse"
        >
          <path d="M 0 0 V 48" stroke="#c9bca5" strokeWidth="9" opacity=".4" />
        </pattern>
        <filter
          id={`shadow-${pattern}`}
          x="-30%"
          y="-30%"
          width="160%"
          height="160%"
        >
          <feDropShadow
            dx="18"
            dy="25"
            stdDeviation="24"
            floodColor="#65533e"
            floodOpacity=".15"
          />
        </filter>
      </defs>
      {project.rooms.map((r) => (
        <g key={r.id}>
          <rect
            x={r.x}
            y={r.y}
            width={r.width}
            height={r.depth}
            fill={`url(#floor-${pattern})`}
            stroke="#5d6253"
            strokeWidth="65"
          />
          {grid && (
            <rect
              x={r.x}
              y={r.y}
              width={r.width}
              height={r.depth}
              fill={`url(#dots-${pattern})`}
            />
          )}
          <rect
            x={r.x + 50}
            y={r.y + 50}
            width={r.width - 100}
            height={r.depth - 100}
            fill="none"
            stroke="#b2b29f"
            strokeWidth="9"
          />
          <text
            x={r.x + r.width / 2}
            y={r.y + r.depth * 0.81}
            textAnchor="middle"
            fill="#59634f"
            fontSize={Math.max(95, b.width * 0.016)}
            letterSpacing="15"
            fontFamily="Arial, sans-serif"
          >
            {r.name.toUpperCase()}
          </text>
          {measurements && (
            <g fill="#68715f" stroke="#7d8672" strokeWidth="9">
              <path
                d={`M ${r.x} ${r.y - 240} H ${r.x + r.width} M ${r.x} ${r.y - 310} V ${r.y - 170} M ${r.x + r.width} ${r.y - 310} V ${r.y - 170}`}
              />
              <rect
                x={r.x + r.width / 2 - 400}
                y={r.y - 340}
                width="800"
                height="190"
                fill="#f1efe6"
                stroke="none"
              />
              <text
                x={r.x + r.width / 2}
                y={r.y - 205}
                textAnchor="middle"
                stroke="none"
                fontSize="150"
                fontFamily="Arial, sans-serif"
              >
                {formatLength(r.width, project.unit)}
              </text>
              <path
                d={`M ${r.x - 270} ${r.y} V ${r.y + r.depth} M ${r.x - 340} ${r.y} H ${r.x - 200} M ${r.x - 340} ${r.y + r.depth} H ${r.x - 200}`}
              />
              <text
                transform={`translate(${r.x - 350} ${r.y + r.depth / 2}) rotate(-90)`}
                textAnchor="middle"
                stroke="none"
                fontSize="150"
                fontFamily="Arial, sans-serif"
              >
                {formatLength(r.depth, project.unit)}
              </text>
            </g>
          )}
        </g>
      ))}
      {project.openings.map((o) => {
        const r = project.rooms.find((r) => r.id === o.roomId);
        if (!r) return null;
        const horizontal = o.wall === "top" || o.wall === "bottom",
          length = horizontal ? r.width : r.depth,
          w = Math.min(o.width, length),
          offset = Math.max(
            0,
            Math.min(length - w, o.position * length - w / 2),
          );
        const x = horizontal
            ? r.x + offset
            : o.wall === "left"
              ? r.x
              : r.x + r.width,
          y = horizontal
            ? o.wall === "top"
              ? r.y
              : r.y + r.depth
            : r.y + offset;
        return (
          <g
            key={o.id}
            transform={`translate(${x} ${y}) rotate(${horizontal ? 0 : 90})`}
          >
            <path d={`M 0 0 H ${w}`} stroke="#f2eee3" strokeWidth="90" />
            {o.kind === "window" ? (
              <>
                <path
                  d={`M 0 -25 H ${w} M 0 25 H ${w}`}
                  stroke="#758d84"
                  strokeWidth="16"
                />
                <path d={`M 0 0 H ${w}`} stroke="#c4d5cd" strokeWidth="15" />
              </>
            ) : (
              <g
                transform={o.wall === "bottom" ? "scale(1,-1)" : undefined}
                stroke="#8e9680"
                fill="none"
                strokeWidth="12"
              >
                <path
                  d={`M 0 0 V ${w} A ${w} ${w} 0 0 0 ${w} 0`}
                  strokeDasharray="25 18"
                />
                <path
                  d={`M 0 0 V ${w}`}
                  strokeDasharray="none"
                  strokeWidth="24"
                />
              </g>
            )}
          </g>
        );
      })}
      {[...project.furniture]
        .sort(
          (a, b) =>
            (getCatalog(a.catalogId).layer === "floor" ? -1 : 0) -
            (getCatalog(b.catalogId).layer === "floor" ? -1 : 0),
        )
        .map((original) => {
          const i =
              drag?.id === original.id
                ? { ...original, x: drag.x, y: drag.y }
                : original,
            c = getCatalog(i.catalogId),
            f = footprint(i);
          const invalid = !inRoom(
              i,
              project.rooms.find((r) => r.id === i.roomId)!,
            ),
            overlap =
              c.layer === "solid" &&
              project.furniture.some(
                (other) =>
                  other.id !== i.id &&
                  getCatalog(other.catalogId).layer === "solid" &&
                  overlaps(i, other),
              );
          const isSelected = i.id === selected;
          return (
            <g
              key={i.id}
              transform={`translate(${i.x} ${i.y})`}
              onPointerDown={(e) => start(e, i)}
              style={{ cursor: onSelect ? "grab" : undefined }}
            >
              <title>
                {i.name} · {formatLength(i.width, project.unit)} ×{" "}
                {formatLength(i.depth, project.unit)}
                {overlap ? " · Furniture overlap" : ""}
              </title>
              <g
                transform={`translate(${f.width / 2} ${f.depth / 2}) rotate(${i.rotation}) translate(${-i.width / 2} ${-i.depth / 2})`}
                filter={
                  c.layer === "floor" ? undefined : `url(#shadow-${pattern})`
                }
              >
                <FurnitureShape
                  shape={c.shape}
                  width={i.width}
                  depth={i.depth}
                  color={i.color}
                />
              </g>
              {(isSelected || invalid) && (
                <rect
                  x="-35"
                  y="-35"
                  width={f.width + 70}
                  height={f.depth + 70}
                  rx="20"
                  fill="none"
                  stroke={invalid ? "#ac4d34" : "#314a3d"}
                  strokeWidth="20"
                  strokeDasharray={invalid ? "40 25" : undefined}
                />
              )}
              {isSelected && (
                <>
                  {[
                    [0, 0],
                    [f.width, 0],
                    [0, f.depth],
                    [f.width, f.depth],
                  ].map(([x, y], idx) => (
                    <rect
                      key={idx}
                      x={x - 35}
                      y={y - 35}
                      width="70"
                      height="70"
                      fill="#fffdf5"
                      stroke="#314a3d"
                      strokeWidth="15"
                    />
                  ))}
                  <g transform={`translate(${f.width / 2} -160)`}>
                    <rect
                      x="-520"
                      y="-160"
                      width="1040"
                      height="190"
                      rx="50"
                      fill="#314a3d"
                    />
                    <text
                      textAnchor="middle"
                      y="-30"
                      fill="#fffdf5"
                      fontSize="115"
                      fontFamily="Arial, sans-serif"
                    >
                      {formatLength(i.width, project.unit)} ×{" "}
                      {formatLength(i.depth, project.unit)}
                    </text>
                  </g>
                </>
              )}
            </g>
          );
        })}
    </svg>
  );
});

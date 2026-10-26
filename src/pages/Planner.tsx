import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowDownToLine,
  Armchair,
  Check,
  ChevronDown,
  Copy,
  Expand,
  Grid2X2,
  Hand,
  HelpCircle,
  Layers,
  Minus,
  MousePointer2,
  Plus,
  Redo2,
  RotateCw,
  Ruler,
  Search,
  Trash2,
  Undo2,
  X,
} from "lucide-react";
import { Logo } from "../components/Brand";
import { PlanSvg, FurnitureShape } from "../components/PlanSvg";
import { catalog, categories, getCatalog } from "../data/catalog";
import {
  area,
  formatArea,
  formatLength,
  inRoom,
  inputLength,
  overlaps,
  parseLength,
} from "../lib/geometry";
import { useEditor } from "../lib/editor";
import { useProject } from "../lib/useProject";
import { exportJSON, exportPNG } from "../lib/persistence";
import { uid, type Item, type Unit } from "../lib/model";
import { Dialog } from "../components/Dialog";
import { useAuth } from "../lib/auth";
function DimensionInput({
  label,
  value,
  unit,
  onChange,
  max = 30000,
}: {
  label: string;
  value: number;
  unit: Unit;
  onChange: (n: number) => void;
  max?: number;
}) {
  const [draft, setDraft] = useState(inputLength(value, unit)),
    [error, setError] = useState("");
  useEffect(() => {
    setDraft(inputLength(value, unit));
    setError("");
  }, [value, unit]);
  function commit() {
    try {
      if (draft === inputLength(value, unit)) return;
      const n = parseLength(draft, unit);
      if (n > max) throw Error(`The maximum is ${formatLength(max, unit)}.`);
      onChange(n);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Enter a valid size.");
    }
  }
  return (
    <label className="dimension-field">
      <span>{label}</span>
      <input
        aria-label={label}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            commit();
            e.currentTarget.blur();
          }
        }}
        aria-invalid={Boolean(error)}
      />
      {error && (
        <span className="field-error" role="alert">
          {error}
        </span>
      )}
    </label>
  );
}
function Properties({
  roomId,
  onClose,
}: {
  roomId: string;
  onClose: () => void;
}) {
  const s = useEditor(),
    p = s.project!,
    item = p.furniture.find((i) => i.id === s.selected),
    room = p.rooms.find((r) => r.id === roomId) || p.rooms[0];
  const warnings = useMemo(
    () =>
      p.furniture.flatMap((i) => {
        const r = p.rooms.find((r) => r.id === i.roomId)!;
        const messages: string[] = [];
        if (!inRoom(i, r)) messages.push(`${i.name} is outside ${r.name}.`);
        if (getCatalog(i.catalogId).layer === "solid") {
          if (
            p.furniture.some(
              (b) =>
                b.id !== i.id &&
                getCatalog(b.catalogId).layer === "solid" &&
                overlaps(i, b),
            )
          )
            messages.push(`${i.name} overlaps another piece.`);
          for (const o of p.openings.filter(
            (o) => o.kind === "door" && o.roomId === i.roomId,
          )) {
            const horizontal = o.wall === "top" || o.wall === "bottom";
            const length = horizontal ? r.width : r.depth;
            const width = Math.min(o.width, length);
            const offset = Math.max(
              0,
              Math.min(length - width, o.position * length - width / 2),
            );
            const door: Item = {
              ...i,
              x: horizontal
                ? r.x + offset
                : o.wall === "left"
                  ? r.x
                  : r.x + r.width - width,
              y: horizontal
                ? o.wall === "top"
                  ? r.y
                  : r.y + r.depth - width
                : r.y + offset,
              width,
              depth: width,
              rotation: 0,
            };
            if (overlaps(i, door))
              messages.push(`${i.name} is in a door swing area.`);
          }
        }
        return messages;
      }),
    [p],
  );
  const outside = p.furniture.filter(
    (i) =>
      !inRoom(
        i,
        p.rooms.find((r) => r.id === i.roomId)!,
      ),
  );
  return (
    <aside className="properties-panel">
      <div className="panel-heading">
        <span>{item ? "The finer details" : "Your room, precisely"}</span>
        <button
          className="icon-button mobile-only"
          aria-label="Close properties"
          onClick={onClose}
        >
          <X size={17} />
        </button>
      </div>
      {item ? (
        <>
          <div className="property-preview">
            <svg
              viewBox={`-100 -100 ${item.width + 200} ${item.depth + 200}`}
              role="img"
              aria-label={item.name}
            >
              <FurnitureShape
                shape={getCatalog(item.catalogId).shape}
                width={item.width}
                depth={item.depth}
                color={item.color}
              />
            </svg>
          </div>
          <span className="eyebrow">
            {getCatalog(item.catalogId).category.toUpperCase()}
          </span>
          <h2>{item.name}</h2>
          <label>
            Item name
            <input
              value={item.name}
              maxLength={100}
              onChange={(e) => {
                if (e.target.value.trim())
                  s.updateItem(item.id, { name: e.target.value });
              }}
            />
          </label>
          <div className="properties-row">
            <DimensionInput
              label="Item width"
              value={item.width}
              unit={p.unit}
              max={6000}
              onChange={(width) => s.updateItem(item.id, { width })}
            />
            <DimensionInput
              label="Item depth"
              value={item.depth}
              unit={p.unit}
              max={6000}
              onChange={(depth) => s.updateItem(item.id, { depth })}
            />
          </div>
          <div className="properties-row">
            <label>
              Position X (cm)
              <input
                aria-label="Position X (cm)"
                type="number"
                step="5"
                value={+(item.x / 10).toFixed(1)}
                onChange={(e) => {
                  const n = e.target.valueAsNumber;
                  if (Number.isFinite(n)) s.updateItem(item.id, { x: n * 10 });
                }}
              />
            </label>
            <label>
              Position Y (cm)
              <input
                aria-label="Position Y (cm)"
                type="number"
                step="5"
                value={+(item.y / 10).toFixed(1)}
                onChange={(e) => {
                  const n = e.target.valueAsNumber;
                  if (Number.isFinite(n)) s.updateItem(item.id, { y: n * 10 });
                }}
              />
            </label>
          </div>
          <div className="rotation-control">
            <span>Rotation</span>
            <strong>{item.rotation}°</strong>
            <button
              className="icon-button"
              aria-label="Rotate selected furniture"
              title="Rotate 90°"
              onClick={() =>
                s.updateItem(item.id, {
                  rotation: ((item.rotation + 90) % 360) as Item["rotation"],
                })
              }
            >
              <RotateCw size={18} />
            </button>
          </div>
          <label className="color-field">
            Material color
            <input
              type="color"
              value={item.color}
              onChange={(e) => s.updateItem(item.id, { color: e.target.value })}
            />
          </label>
          <div className="item-actions">
            <button onClick={s.duplicate}>
              <Copy size={16} /> Duplicate
            </button>
            <button onClick={s.remove}>
              <Trash2 size={16} /> Remove
            </button>
          </div>
          <p className="form-note">
            Typical example dimensions. Measure your actual piece, including its
            frame. Bed footprints include a sample frame.
          </p>
        </>
      ) : (
        <>
          <div className="room-property-icon">
            <Ruler size={36} strokeWidth={1} />
          </div>
          <span className="eyebrow">ROOM DETAILS</span>
          <h2>{room.name}</h2>
          <label>
            Room name
            <input
              aria-label="Room name"
              value={room.name}
              maxLength={100}
              onChange={(e) => {
                if (e.target.value.trim())
                  s.edit((p) => {
                    p.rooms.find((r) => r.id === room.id)!.name =
                      e.target.value;
                  });
              }}
            />
          </label>
          <DimensionInput
            label="Room width"
            value={room.width}
            unit={p.unit}
            onChange={(width) =>
              s.edit((p) => {
                p.rooms.find((r) => r.id === room.id)!.width = width;
              })
            }
          />
          <DimensionInput
            label="Room depth"
            value={room.depth}
            unit={p.unit}
            onChange={(depth) =>
              s.edit((p) => {
                p.rooms.find((r) => r.id === room.id)!.depth = depth;
              })
            }
          />
          <div className="room-area">
            <span>Room area</span>
            <strong>{formatArea(room.width * room.depth, p.unit)}</strong>
          </div>
          <label>
            Notes
            <textarea
              aria-label="Room notes"
              rows={3}
              maxLength={2000}
              placeholder="A morning reading corner…"
              value={room.notes}
              onChange={(e) =>
                s.edit((p) => {
                  p.rooms.find((r) => r.id === room.id)!.notes = e.target.value;
                })
              }
            />
          </label>
          <p className="form-note">
            Select a furniture piece to adjust its dimensions, position, and
            material.
          </p>
        </>
      )}
      {outside.length > 0 && (
        <p className="notice error" role="alert">
          {outside.length} {outside.length === 1 ? "item is" : "items are"}{" "}
          outside a resized room. Select each item to move it back inside.
        </p>
      )}
      {warnings.length > 0 && (
        <div className="layout-notices">
          <strong>Things to consider</strong>
          {[...new Set(warnings)].slice(0, 5).map((w) => (
            <p key={w}>{w}</p>
          ))}
          <small>
            Overlaps can be intentional. These are planning hints, not safety or
            building-code checks.
          </small>
        </div>
      )}
      <Link className="planner-help" to="/help">
        <HelpCircle size={15} /> A little planning help{" "}
        <ArrowLeft size={14} style={{ transform: "rotate(180deg)" }} />
      </Link>
    </aside>
  );
}
export default function Planner() {
  const { projectId } = useParams(),
    { user } = useAuth(),
    { loading, error, status, retry, saveCopy, flush, reloadLatest } =
      useProject(projectId),
    s = useEditor();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"furniture" | "rooms">("furniture"),
    [category, setCategory] = useState("All furniture"),
    [search, setSearch] = useState(""),
    [grid, setGrid] = useState(true),
    [measurements, setMeasurements] = useState(true),
    [zoom, setZoom] = useState(1),
    [pan, setPan] = useState({ x: 0, y: 0 }),
    [panMode, setPanMode] = useState(false),
    [roomId, setRoomId] = useState(""),
    [sheet, setSheet] = useState<"catalog" | "properties" | null>(null),
    [exportOpen, setExportOpen] = useState(false),
    [exportError, setExportError] = useState(""),
    [help, setHelp] = useState(false);
  const p = s.project;
  useEffect(() => {
    function key(e: KeyboardEvent) {
      if (
        (e.target as HTMLElement).closest(
          "input,textarea,select,[contenteditable=true]",
        ) ||
        document.querySelector("dialog[open]")
      )
        return;
      const state = useEditor.getState();
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) state.redo();
        else state.undo();
        return;
      }
      if (e.key === "Escape") {
        state.select(null);
        setSheet(null);
        setPanMode(false);
      }
      const item = state.project?.furniture.find(
        (i) => i.id === state.selected,
      );
      if (!item) return;
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        state.remove();
      }
      const directions: Record<string, [number, number]> = {
        ArrowLeft: [-1, 0],
        ArrowRight: [1, 0],
        ArrowUp: [0, -1],
        ArrowDown: [0, 1],
      };
      if (directions[e.key]) {
        e.preventDefault();
        const [x, y] = directions[e.key],
          step = e.shiftKey ? 250 : 50;
        state.updateItem(item.id, {
          x: item.x + x * step,
          y: item.y + y * step,
        });
      }
    }
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  useEffect(() => {
    if (s.selected) setSheet("properties");
  }, [s.selected]);
  if (loading)
    return (
      <main className="planner-loading">
        <Logo />
        <span>Making a little room for your ideas…</span>
      </main>
    );
  if (!p)
    return (
      <main className="empty-state">
        <h1>This space needs a fresh start.</h1>
        <p role="alert">{error || "Choose a space to open the planner."}</p>
        <Link className="button" to="/my-spaces">
          Back to my spaces
        </Link>
      </main>
    );
  const activeRoom = p.rooms.find((r) => r.id === roomId) || p.rooms[0];
  const filtered = catalog.filter(
    (c) =>
      (category === "All furniture" || c.category === category) &&
      c.name.toLowerCase().includes(search.toLowerCase()),
  );
  function addRoom() {
    if (p!.rooms.length >= 30) {
      useEditor.setState({ message: "A project can contain up to 30 rooms." });
      return;
    }
    const right = Math.max(...p!.rooms.map((r) => r.x + r.width));
    const id = uid();
    s.edit((p) => {
      p.rooms.push({
        id,
        name: `Room ${p.rooms.length + 1}`,
        x: right,
        y: 0,
        width: 3000,
        depth: 3500,
        notes: "",
      });
      p.openings.push(
        {
          id: uid(),
          roomId: id,
          kind: "door",
          wall: "bottom",
          position: 0.8,
          width: 800,
        },
        {
          id: uid(),
          roomId: id,
          kind: "window",
          wall: "top",
          position: 0.5,
          width: 1200,
        },
      );
    });
    setRoomId(id);
    s.select(null);
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }
  return (
    <main
      id="main"
      className="planner-shell"
      onClickCapture={(e) => {
        const link = (e.target as HTMLElement).closest("a[href]");
        const href = link?.getAttribute("href");
        if (
          href?.startsWith("/") &&
          !e.ctrlKey &&
          !e.metaKey &&
          !e.shiftKey &&
          e.button === 0
        ) {
          e.preventDefault();
          void flush().then((saved) => {
            if (saved) navigate(href);
          });
        }
      }}
    >
      <header className="planner-header">
        <div className="planner-brand">
          <Logo />
          <span className="header-divider" />
          <Link
            to="/my-spaces"
            className="icon-button"
            aria-label="Back to my spaces"
            title="Back to my spaces"
          >
            <ArrowLeft size={17} />
          </Link>
          <div className="project-title">
            <input
              aria-label="Project title"
              value={p.name}
              maxLength={100}
              onChange={(e) => {
                if (e.target.value.trim())
                  s.edit((p) => {
                    p.name = e.target.value;
                  });
              }}
            />
            <span
              className={
                status.includes("failed") ? "save-state failed" : "save-state"
              }
              role="status"
            >
              <span className="status-dot" />
              {status}
            </span>
          </div>
        </div>
        <div className="planner-top-actions">
          <div className="history-buttons">
            <button
              className="icon-button"
              aria-label="Undo"
              title="Undo (Ctrl/⌘ Z)"
              disabled={!s.past.length}
              onClick={s.undo}
            >
              <Undo2 size={18} />
            </button>
            <button
              className="icon-button"
              aria-label="Redo"
              title="Redo (Ctrl/⌘ Shift Z)"
              disabled={!s.future.length}
              onClick={s.redo}
            >
              <Redo2 size={18} />
            </button>
          </div>
          <div className="export-wrap">
            <button
              className="button small secondary"
              onClick={() => setExportOpen(!exportOpen)}
              aria-expanded={exportOpen}
            >
              <ArrowDownToLine size={16} />
              <span>Export</span>
              <ChevronDown size={13} />
            </button>
            {exportOpen && (
              <div className="card-menu export-menu">
                <button
                  onClick={() => {
                    exportJSON(p);
                    setExportOpen(false);
                  }}
                >
                  Project backup (.json)
                </button>
                <button
                  onClick={() => {
                    const svg = document.getElementById(
                      "planner-canvas",
                    ) as unknown as SVGSVGElement;
                    void exportPNG(svg, p.name).catch((e) =>
                      setExportError(
                        e instanceof Error ? e.message : "Image export failed.",
                      ),
                    );
                    setExportOpen(false);
                  }}
                >
                  Floor plan image (.png)
                </button>
              </div>
            )}
          </div>
          <button
            className="icon-button help-button"
            aria-label="Keyboard and planner help"
            onClick={() => setHelp(true)}
          >
            <HelpCircle size={20} />
          </button>
          <Link
            className="account-avatar"
            to="/sign-in"
            aria-label={user ? "Account" : "Sign in"}
          >
            {user ? user.email?.[0].toUpperCase() : "G"}
          </Link>
        </div>
      </header>
      <div className="planner-subbar">
        <span>
          <span className="status-dot" />
          {user ? "ACCOUNT WORKSPACE" : "GUEST WORKSPACE"}
          <span className="subbar-caption">
            A little planning. A better fit.
          </span>
        </span>
        <span>
          {formatArea(area(p), p.unit)}
          <span className="subbar-dot">·</span>
          {p.rooms.length} {p.rooms.length === 1 ? "room" : "rooms"}
          <span className="subbar-dot">·</span>
          {p.furniture.length} {p.furniture.length === 1 ? "piece" : "pieces"}
        </span>
      </div>
      {(error || s.message || exportError) && (
        <div className={`planner-message ${error ? "error" : ""}`} role="alert">
          <span>{error || s.message || exportError}</span>
          {error && (
            <>
              <button onClick={retry}>Retry</button>
              <button onClick={() => void saveCopy()}>Save a copy</button>
              <button onClick={() => void reloadLatest()}>Reload latest</button>
            </>
          )}
          <button
            aria-label="Dismiss message"
            onClick={() => {
              useEditor.setState({ message: "" });
              setExportError("");
            }}
          >
            <X size={14} />
          </button>
        </div>
      )}
      <div className="planner-workspace">
        <aside
          className={`catalog-panel ${sheet === "catalog" ? "sheet-open" : ""}`}
        >
          <div className="catalog-tabs">
            <button
              className={tab === "furniture" ? "active" : ""}
              onClick={() => setTab("furniture")}
            >
              <Armchair size={17} />
              Furniture
            </button>
            <button
              className={tab === "rooms" ? "active" : ""}
              onClick={() => setTab("rooms")}
            >
              <Layers size={17} />
              Rooms
            </button>
            <button
              className="icon-button mobile-only"
              aria-label="Close catalog"
              onClick={() => setSheet(null)}
            >
              <X size={17} />
            </button>
          </div>
          {tab === "furniture" ? (
            <>
              <div className="catalog-intro">
                <h2>Find your perfect fit.</h2>
                <p>A few pieces. So many possibilities.</p>
              </div>
              <div className="search-field">
                <Search size={16} />
                <input
                  aria-label="Search furniture"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search furniture…"
                />
              </div>
              <select
                className="category-select"
                aria-label="Furniture category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option>All furniture</option>
                {categories.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
              <label className="add-to-room">
                Add to
                <select
                  aria-label="Add furniture to room"
                  value={activeRoom.id}
                  onChange={(e) => setRoomId(e.target.value)}
                >
                  {p.rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="catalog-count">
                {filtered.length} PIECES · CLICK TO ADD
              </div>
              <div className="furniture-grid">
                {filtered.map((c) => (
                  <button
                    className="furniture-card"
                    key={c.id}
                    onClick={() => {
                      s.add(c.id, activeRoom.id);
                    }}
                    title={`Add ${c.name}`}
                    aria-label={`Add ${c.name}`}
                  >
                    <div className="furniture-thumb">
                      <svg
                        viewBox={`-150 -150 ${c.width + 300} ${c.depth + 300}`}
                        aria-hidden="true"
                      >
                        <FurnitureShape
                          shape={c.shape}
                          width={c.width}
                          depth={c.depth}
                          color={c.color}
                        />
                      </svg>
                      <span>
                        <Plus size={13} />
                      </span>
                    </div>
                    <strong>{c.name}</strong>
                    <small>
                      {formatLength(c.width, p.unit)} ×{" "}
                      {formatLength(c.depth, p.unit)}
                    </small>
                  </button>
                ))}
              </div>
              {!filtered.length && (
                <p className="catalog-empty">
                  No pieces found. Try another search.
                </p>
              )}
              <p className="catalog-footnote">
                Illustrative furniture, real possibilities.
                <br />
                Adjust sizes to match your actual pieces.
              </p>
            </>
          ) : (
            <div className="room-list">
              <h2>The rooms of your life.</h2>
              <p>Combine rectangles to plan a larger space.</p>
              {p.rooms.map((r) => (
                <button
                  className={
                    activeRoom.id === r.id ? "room-card active" : "room-card"
                  }
                  key={r.id}
                  onClick={() => {
                    setRoomId(r.id);
                    s.select(null);
                    setSheet("properties");
                  }}
                >
                  <Layers size={22} />
                  <span>
                    <strong>{r.name}</strong>
                    <small>
                      {formatLength(r.width, p.unit)} ×{" "}
                      {formatLength(r.depth, p.unit)}
                    </small>
                  </span>
                  <span>{formatArea(r.width * r.depth, p.unit)}</span>
                </button>
              ))}
              <button className="button secondary full" onClick={addRoom}>
                <Plus size={16} /> Add a room
              </button>
              <p className="form-note">
                New rooms connect to the right side of your layout. Doors and
                windows stay anchored to each room’s walls.
              </p>
            </div>
          )}
        </aside>
        <section
          className={`editor-canvas ${panMode ? "pan-mode" : ""}`}
          aria-label="Planning workspace"
        >
          <div className="canvas-top-left">
            <span>{activeRoom.name}</span>
            <span>CONCEPTUAL FLOOR PLAN</span>
          </div>
          <div className="canvas-tools">
            <button
              className={`icon-button ${!panMode ? "active" : ""}`}
              aria-label="Selection tool"
              aria-pressed={!panMode}
              title="Select & move furniture"
              onClick={() => setPanMode(false)}
            >
              <MousePointer2 size={17} />
            </button>
            <button
              className={`icon-button ${panMode ? "active" : ""}`}
              aria-label="Pan tool"
              aria-pressed={panMode}
              title="Pan the canvas"
              onClick={() => setPanMode(true)}
            >
              <Hand size={18} />
            </button>
            <span />
            <button
              className={`icon-button ${measurements ? "active" : ""}`}
              aria-label="Show measurements"
              aria-pressed={measurements}
              title="Show or hide dimensions"
              onClick={() => setMeasurements(!measurements)}
            >
              <Ruler size={18} />
            </button>
          </div>
          <PlanSvg
            id="planner-canvas"
            project={p}
            selected={s.selected}
            grid={grid}
            measurements={measurements}
            zoom={zoom}
            pan={pan}
            onPan={(x, y) => setPan({ x, y })}
            panMode={panMode}
            onSelect={(id) => {
              if (!panMode) s.select(id);
            }}
            onMove={(id, x, y) => s.updateItem(id, { x, y })}
          />
          <div className="canvas-bottom-hint">
            <MousePointer2 size={13} />
            <span>
              {s.selected
                ? "Arrow keys to move · Shift for larger steps · Delete to remove"
                : panMode
                  ? "Drag to explore your layout"
                  : "Click a piece to make it yours. Drag to see what fits."}
            </span>
          </div>
          <div className="canvas-status">
            <Check size={13} /> BUILT AROUND YOUR REAL DIMENSIONS
          </div>
        </section>
        <div
          className={`properties-container ${sheet === "properties" ? "sheet-open" : ""}`}
        >
          <Properties roomId={activeRoom.id} onClose={() => setSheet(null)} />
        </div>
      </div>
      <footer className="planner-bottom">
        <div className="bottom-left">
          <span className="storage-badge">
            <span className="status-dot" />
            {user ? "Account storage" : "This browser"}
          </span>
          <span className="bottom-tip">Small moves. Big possibilities.</span>
        </div>
        <div className="view-controls">
          <button
            className="icon-button"
            aria-label="Zoom out"
            disabled={zoom <= 0.4}
            onClick={() => setZoom(Math.max(0.4, zoom - 0.2))}
          >
            <Minus size={16} />
          </button>
          <span>{Math.round(zoom * 100)}%</span>
          <button
            className="icon-button"
            aria-label="Zoom in"
            disabled={zoom >= 3}
            onClick={() => setZoom(Math.min(3, zoom + 0.2))}
          >
            <Plus size={16} />
          </button>
          <button
            className="icon-button"
            aria-label="Fit layout and reset view"
            title="Fit & reset view"
            onClick={() => {
              setZoom(1);
              setPan({ x: 0, y: 0 });
            }}
          >
            <Expand size={16} />
          </button>
          <span className="control-divider" />
          <button
            className={`icon-button ${grid ? "active" : ""}`}
            aria-label="Snap to grid"
            aria-pressed={grid}
            title="Grid & snap (50 mm)"
            onClick={() => setGrid(!grid)}
          >
            <Grid2X2 size={16} />
          </button>
          <select
            value={p.unit}
            aria-label="Measurement units"
            onChange={(e) =>
              s.edit((p) => {
                p.unit = e.target.value as Unit;
              })
            }
          >
            <option value="imperial">ft / in</option>
            <option value="metric">cm</option>
          </select>
        </div>
      </footer>
      <div className="mobile-planner-nav">
        <button
          onClick={() => {
            setTab("furniture");
            setSheet(sheet === "catalog" ? null : "catalog");
          }}
        >
          <Armchair size={19} /> Furniture
        </button>
        <button
          onClick={() => {
            setTab("rooms");
            setSheet("catalog");
          }}
        >
          <Layers size={19} /> Rooms
        </button>
        <button
          onClick={() => setSheet(sheet === "properties" ? null : "properties")}
        >
          <Ruler size={19} /> {s.selected ? "Item details" : "Room details"}
        </button>
      </div>
      {help && (
        <Dialog
          title="A little planning know-how."
          onClose={() => setHelp(false)}
        >
          <p>
            Select furniture on the plan, or click a piece in the catalog to add
            it. Edit exact sizes and positions in the details panel.
          </p>
          <div className="shortcut-list">
            <span>Move selected furniture</span>
            <kbd>Arrow keys</kbd>
            <span>Move in larger steps</span>
            <kbd>Shift + Arrow</kbd>
            <span>Undo / redo</span>
            <kbd>Ctrl / ⌘ + Z / Shift + Z</kbd>
            <span>Delete a piece</span>
            <kbd>Delete / Backspace</kbd>
            <span>Clear selection</span>
            <kbd>Escape</kbd>
          </div>
          <p>
            Use the hand tool to pan, + / − to zoom, and the fit button to reset
            the view. Rugs can sit below other furniture. Door and overlap
            notices are planning hints.
          </p>
          <Link className="text-link" to="/help">
            Read the planning guide
          </Link>
        </Dialog>
      )}
    </main>
  );
}

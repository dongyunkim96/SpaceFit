import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  LayoutGrid,
  Ruler,
} from "lucide-react";
import { createProject, templates } from "../data/templates";
import { localProjects } from "../lib/persistence";
import { cloudProjects } from "../lib/firebase";
import { useAuth } from "../lib/auth";
import { inputLength, parseLength } from "../lib/geometry";
import { PlanSvg } from "../components/PlanSvg";
import type { Unit } from "../lib/model";
const schema = z.object({
  name: z.string().trim().min(1, "Give your space a name.").max(100),
  room: z.string().trim().min(1, "Enter a room name.").max(100),
  width: z.string().min(1, "Enter the width."),
  depth: z.string().min(1, "Enter the depth."),
});
type Values = z.infer<typeof schema>;
export default function NewSpace() {
  const [params] = useSearchParams(),
    navigate = useNavigate(),
    { user } = useAuth();
  const template = templates.find((t) => t.id === params.get("template"));
  const [unit, setUnit] = useState<Unit>("imperial"),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [furnished, setFurnished] = useState(params.get("furnished") !== "false");
  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: template?.name || "My new space",
      room: "Living room",
      width: "14' 9\"",
      depth: "16' 5\"",
    },
  });
  async function submit(v: Values) {
    setError("");
    setBusy(true);
    try {
      const p = createProject(template, furnished);
      p.name = v.name;
      p.unit = unit;
      if (!template) {
        p.rooms[0] = {
          ...p.rooms[0],
          name: v.room,
          width: parseLength(v.width, unit),
          depth: parseLength(v.depth, unit),
        };
      }
      await (user ? cloudProjects(user.uid) : localProjects).save(p, 0);
      navigate(`/planner/${p.id}`);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Your space could not be created. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <main id="main" className="page-width setup-page">
      <Link className="back-link" to="/templates">
        <ArrowLeft size={16} /> Back to possibilities
      </Link>
      <div className="setup-grid">
        <div>
          <span className="eyebrow">01 / LET’S MAKE ROOM</span>
          <h1>
            Start with
            <br />
            <em>your space.</em>
          </h1>
          <p>
            A few details. A fresh perspective.
            <br />
            You can change every measurement later.
          </p>
          <div className="setup-assurances">
            <span>
              <Check size={16} /> No account needed
            </span>
            <span>
              <Check size={16} /> Saved in{" "}
              {user ? "your account" : "this browser"}
            </span>
            <span>
              <Check size={16} /> Yours to rearrange
            </span>
          </div>
          {template ? (
            <div className={`setup-preview ${template.tone}`}>
              <PlanSvg
                project={createProject(template, furnished)}
                measurements={false}
              />
              <span>
                {template.type} · {template.rooms.length}{" "}
                {template.rooms.length === 1 ? "room" : "rooms"}
              </span>
            </div>
          ) : (
            <div className="setup-diagram">
              <div>
                <Ruler size={42} strokeWidth={1} />
                <span>YOUR POSSIBILITIES GO HERE</span>
              </div>
            </div>
          )}
        </div>
        <form className="form-panel" onSubmit={handleSubmit(submit)} noValidate>
          <div className="form-heading">
            <LayoutGrid size={20} />
            <h2>
              {template ? "Make this layout yours" : "A room of your own"}
            </h2>
          </div>
          <label htmlFor="project-name">Name your space</label>
          <input
            id="project-name"
            {...register("name")}
            autoComplete="off"
            aria-invalid={Boolean(errors.name)}
          />
          {errors.name && <p className="field-error">{errors.name.message}</p>}
          {!template && (
            <>
              <label htmlFor="room-name">Room name</label>
              <input id="room-name" {...register("room")} />
              {errors.room && (
                <p className="field-error">{errors.room.message}</p>
              )}
            </>
          )}
          <label htmlFor="display-units">Display measurements in</label>
          <select
            id="display-units"
            value={unit}
            onChange={(e) => {
              const next = e.target.value as Unit;
              for (const field of ["width", "depth"] as const) {
                try {
                  setValue(
                    field,
                    inputLength(parseLength(getValues(field), unit), next),
                  );
                } catch {
                  /* Keep invalid input visible for correction. */
                }
              }
              setUnit(next);
            }}
          >
            <option value="imperial">Feet & inches</option>
            <option value="metric">Centimeters</option>
          </select>
          {!template && (
            <>
              <div className="form-row">
                <div>
                  <label htmlFor="width">Width</label>
                  <input
                    id="width"
                    {...register("width")}
                    placeholder={unit === "imperial" ? `14' 9"` : "450"}
                  />
                  {errors.width && (
                    <p className="field-error">{errors.width.message}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="depth">Depth</label>
                  <input
                    id="depth"
                    {...register("depth")}
                    placeholder={unit === "imperial" ? `16' 5"` : "500"}
                  />
                  {errors.depth && (
                    <p className="field-error">{errors.depth.message}</p>
                  )}
                </div>
              </div>
              <p className="form-note">
                {unit === "imperial"
                  ? `Use feet and inches (14' 9") or total inches (177).`
                  : "Enter dimensions in centimeters (450)."}{" "}
                Room sizes: 10–3,000 cm.
              </p>
            </>
          )}
          {template && (
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={furnished}
                onChange={(e) => setFurnished(e.target.checked)}
              />{" "}
              Include the suggested furniture
            </label>
          )}
          {error && (
            <p className="notice error" role="alert">
              {error}
            </p>
          )}
          <button className="button full" disabled={busy}>
            {busy ? "Creating your space…" : "Let’s start planning"}
            <ArrowUpRight size={18} />
          </button>
          <p className="form-note">
            {user
              ? "Saved to your account."
              : "Your draft stays on this browser. Export a backup anytime."}
          </p>
        </form>
      </div>
    </main>
  );
}

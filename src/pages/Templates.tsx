import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Search, SlidersHorizontal } from "lucide-react";
import { templates } from "../data/templates";
import { TemplateCard } from "../components/TemplateCard";
import { FinalCTA } from "../components/Brand";
import { area } from "../lib/geometry";
export default function Templates() {
  const [type, setType] = useState("All spaces"),
    [size, setSize] = useState("any"),
    [variant, setVariant] = useState("furnished"),
    [query, setQuery] = useState("");
  const filtered = templates.filter(
    (t) =>
      (type === "All spaces" ||
        (type === "Apartments" ? t.rooms.length > 1 : t.type === type)) &&
      (size === "any" ||
        (size === "small" ? area(t) < 20e6 : area(t) >= 20e6)) &&
      `${t.name} ${t.type}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <main id="main">
      <section className="page-width page-heading">
        <span className="eyebrow">YOUR NEXT CHAPTER STARTS HERE</span>
        <h1>
          A little structure.
          <br />
          <em>Endless possibility.</em>
        </h1>
        <div className="heading-bottom">
          <p>
            Thoughtfully considered layouts, ready for your life.
            <br />
            Pick a starting point. Change absolutely everything.
          </p>
          <Link className="text-link" to="/new">
            Start with a blank room <ArrowUpRight size={18} />
          </Link>
        </div>
      </section>
      <section className="page-width templates-section">
        <div className="filter-bar">
          <div className="filter-chips" aria-label="Room type">
            {[
              "All spaces",
              "Living room",
              "Bedroom",
              "Home office",
              "Dining room",
              "Apartments",
            ].map((t) => (
              <button
                key={t}
                className={type === t ? "active" : ""}
                aria-pressed={type === t}
                onClick={() => setType(t)}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="secondary-filters">
            <div className="search-field">
              <Search size={17} />
              <input
                aria-label="Search templates"
                placeholder="Find your space"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <label>
              <SlidersHorizontal size={15} />
              <select
                aria-label="Floor area"
                value={size}
                onChange={(e) => setSize(e.target.value)}
              >
                <option value="any">Any floor area</option>
                <option value="small">Under 215 sq ft</option>
                <option value="large">215 sq ft and above</option>
              </select>
            </label>
            <select
              aria-label="Furnishing"
              value={variant}
              onChange={(e) => setVariant(e.target.value)}
            >
              <option value="furnished">Furnished layouts</option>
              <option value="blank">Blank layouts</option>
            </select>
          </div>
        </div>
        <div className="results-line">
          <span>
            {filtered.length} starting{" "}
            {filtered.length === 1 ? "point" : "points"} for a better fit
          </span>
          <span>CONCEPTUAL LAYOUTS · REAL DIMENSIONS</span>
        </div>
        <div className="templates-grid">
          {filtered.map((t) => (
            <TemplateCard
              key={t.id}
              template={t}
              furnished={variant === "furnished"}
            />
          ))}
        </div>
        {!filtered.length && (
          <div className="empty-state">
            <Search size={32} />
            <h2>A little more room to search.</h2>
            <p>Try another room type or remove a filter.</p>
            <button
              className="button"
              onClick={() => {
                setType("All spaces");
                setSize("any");
                setQuery("");
              }}
            >
              Clear filters
            </button>
          </div>
        )}
        <p className="concept-note">
          These layouts are conceptual planning examples, not building or
          construction drawings. Areas are calculated from each room’s actual
          dimensions.
        </p>
      </section>
      <FinalCTA />
    </main>
  );
}

import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { createProject, type Template } from "../data/templates";
import { area, bounds, formatArea, formatLength } from "../lib/geometry";
import { PlanSvg } from "./PlanSvg";
export function TemplateCard({
  template,
  furnished = true,
}: {
  template: Template;
  furnished?: boolean;
}) {
  const p = createProject(template, furnished),
    b = bounds(p.rooms);
  return (
    <article className="template-card">
      <Link
        to={`/new?template=${template.id}&furnished=${furnished}`}
        className={`template-preview ${template.tone}`}
        aria-label={`Use ${template.name}`}
      >
        <span className="preview-tag">{template.type}</span>
        <PlanSvg project={p} measurements={false} />
        <span className="card-arrow">
          <ArrowUpRight size={22} />
        </span>
      </Link>
      <div className="template-meta">
        <span>{template.type.toUpperCase()}</span>
        <span>{formatArea(area(p))}</span>
      </div>
      <h3>
        <Link to={`/new?template=${template.id}&furnished=${furnished}`}>
          {template.name}
        </Link>
      </h3>
      <p>{template.description}</p>
      <div className="template-details">
        {p.rooms.length} {p.rooms.length === 1 ? "room" : "rooms"} ·{" "}
        {formatLength(b.width)} × {formatLength(b.depth)}
      </div>
      <Link
        className="use-layout"
        to={`/new?template=${template.id}&furnished=${furnished}`}
      >
        Use this layout <ArrowUpRight size={15} />
      </Link>
    </article>
  );
}

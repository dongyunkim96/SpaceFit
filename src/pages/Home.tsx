import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowDown,
  ArrowUpRight,
  ArrowRight,
  Check,
  ChevronDown,
  Expand,
  Move,
  Plus,
  Ruler,
  Armchair,
  Bookmark,
  LayoutGrid,
  MousePointer2,
} from "lucide-react";
import { createDemo, templates } from "../data/templates";
import { PlanSvg } from "../components/PlanSvg";
import { TemplateCard } from "../components/TemplateCard";
import { FinalCTA, TextLink } from "../components/Brand";
import { formatLength } from "../lib/geometry";
const faqs = [
  [
    "Do I need an account to start?",
    "No. Open a demo or create a space right away. Guest projects save in this browser using IndexedDB. An account is only needed for cloud storage when Firebase is configured.",
  ],
  [
    "Can I use my own room dimensions?",
    "Absolutely. Enter your room width and depth in feet and inches or centimeters. You can change dimensions later without losing your furniture.",
  ],
  [
    "How accurate are the furniture sizes?",
    "The catalog uses illustrative, typical furniture footprints. Edit each item to match the full dimensions of your actual piece, including its frame. Always verify measurements before buying.",
  ],
  [
    "Can I save and come back later?",
    "Yes. Your guest projects autosave on this device. Find them under My spaces, or export a JSON backup to keep a portable copy.",
  ],
  [
    "Is SPACEFIT a construction or 3D design tool?",
    "SPACEFIT is a conceptual 2D room planning tool. It does not provide construction drawings, building-code checks, structural advice, or 3D renderings.",
  ],
];
export default function Home() {
  const initial = useMemo(createDemo, []);
  const [project, setProject] = useState(initial),
    [layout, setLayout] = useState(0),
    [selected, setSelected] = useState<string | null>(
      initial.furniture.find((i) => i.catalogId === "three-seat-sofa")!.id,
    );
  const [faq, setFaq] = useState<number | null>(0),
    [after, setAfter] = useState(true);
  function choose(n: number) {
    setLayout(n);
    setProject({
      ...initial,
      furniture: initial.furniture.map((i) =>
        n === 0
          ? i
          : n === 1
            ? {
                ...i,
                x: Math.min(
                  i.x + 200,
                  6000 - (i.rotation % 180 === 0 ? i.width : i.depth),
                ),
                y: Math.min(
                  i.y + 150,
                  4800 - (i.rotation % 180 === 0 ? i.depth : i.width),
                ),
              }
            : {
                ...i,
                x: 6000 - i.x - (i.rotation % 180 === 0 ? i.width : i.depth),
              },
      ),
    });
  }
  const item = project.furniture.find((i) => i.id === selected);
  return (
    <main id="main">
      <section className="hero page-width">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="tiny-line" /> THOUGHTFUL SPACES. BETTER LIVING.
          </div>
          <h1>
            Your space.
            <br />
            Thoughtfully
            <br />
            <em>arranged.</em>
            <svg
              className="heading-swoosh"
              viewBox="0 0 300 20"
              aria-hidden="true"
            >
              <path
                d="M3 15Q150 -4 294 8"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
              />
            </svg>
          </h1>
          <p>
            Plan your room, test your furniture, and find a layout that feels
            right—before moving a thing.
          </p>
          <div className="hero-actions">
            <Link to="/new" className="button">
              Plan my space <ArrowUpRight size={18} />
            </Link>
            <Link to="/demo" state={{ project }} className="demo-link">
              <span className="play-triangle" aria-hidden="true">
                ▷
              </span>{" "}
              Explore a demo
            </Link>
          </div>
          <div className="hero-note">
            <Check size={14} /> No downloads. No account needed. Just
            possibilities.
          </div>
          <a href="#how-it-works" className="discover-link">
            <ArrowDown size={15} /> A little planning. A lot more possibility.
          </a>
        </div>
        <div className="hero-visual">
          <div className="plan-editor-preview">
            <div className="preview-toolbar">
              <span>
                <span className="status-dot" /> A little room to breathe
              </span>
              <span className="preview-mode">
                LIVE PREVIEW <span className="live-dot" />
              </span>
            </div>
            <div className="preview-canvas">
              <div className="preview-compass">
                N<span>↑</span>
              </div>
              <PlanSvg
                project={project}
                selected={selected}
                onSelect={setSelected}
                onMove={(id, x, y) =>
                  setProject((p) => ({
                    ...p,
                    furniture: p.furniture.map((i) =>
                      i.id === id ? { ...i, x, y } : i,
                    ),
                  }))
                }
              />
              <div className="preview-hint">
                <Move size={12} /> Go ahead. Move something.
              </div>
              <Link
                to="/demo"
                state={{ project }}
                className="expand-preview"
                aria-label="Open full planner"
              >
                <Expand size={17} />
              </Link>
            </div>
            <div className="preview-bottom">
              <div className="layout-tabs" aria-label="Preview arrangement">
                {["The everyday", "Open & airy", "A new perspective"].map(
                  (l, i) => (
                    <button
                      key={l}
                      aria-pressed={layout === i}
                      className={layout === i ? "active" : ""}
                      onClick={() => choose(i)}
                    >
                      {`0${i + 1}`}
                      <span>{l}</span>
                    </button>
                  ),
                )}
              </div>
              <span className="scale-label">1 : 50</span>
            </div>
          </div>
          <div className="floating-item">
            <div className="floating-icon">
              <Armchair size={27} strokeWidth={1.3} />
            </div>
            <div>
              <span className="floating-eyebrow">
                {item ? "SELECTED FURNITURE" : "YOUR SPACE, YOUR WAY"}
              </span>
              <strong>{item?.name || "Select a piece"}</strong>
              <small>
                {item
                  ? `${formatLength(item.width)} × ${formatLength(item.depth)}`
                  : "Click any furniture to explore"}
              </small>
            </div>
            <span className="item-dot" />
          </div>
          <div className="floating-caption">
            <span className="caption-star">✳</span>
            <span>
              A good fit changes
              <br />
              <em>everything.</em>
            </span>
          </div>
          <div className="visual-annotation">
            A REAL PLAN. REAL POSSIBILITIES.
          </div>
        </div>
      </section>
      <div className="benefit-strip">
        <div className="page-width">
          {[
            [Ruler, "Real dimensions. Real confidence."],
            [Armchair, "Furniture that fits your life."],
            [LayoutGrid, "Room for a new perspective."],
            [Bookmark, "Your ideas, saved for later."],
          ].map(([Icon, text], i) => {
            const I = Icon as typeof Ruler;
            return (
              <div key={i}>
                <I size={19} strokeWidth={1.4} />
                <span>{text as string}</span>
              </div>
            );
          })}
        </div>
      </div>
      <section className="section page-width steps-section" id="how-it-works">
        <div className="section-intro">
          <div>
            <span className="eyebrow">FROM WHAT IF TO WHAT FITS</span>
            <h2>
              A better space.
              <br />
              <em>Three simple steps.</em>
            </h2>
          </div>
          <p>
            You don’t need a design degree.
            <br />
            Just a few measurements and a little curiosity.
          </p>
        </div>
        <div className="steps-grid">
          {[
            {
              icon: Ruler,
              title: "Measure your space",
              copy: "Start with your room’s dimensions, or choose a ready-made layout. Every great fit begins here.",
              detail: "01 / GET TO KNOW YOUR ROOM",
            },
            {
              icon: Armchair,
              title: "Arrange what matters",
              copy: "Try the sofa over there. Make a little room here. Move, rotate, and explore until it feels like you.",
              detail: "02 / EXPLORE THE POSSIBILITIES",
            },
            {
              icon: Bookmark,
              title: "Keep the one you love",
              copy: "Save your favorite arrangement. Come back, fine-tune, and turn a thoughtful plan into everyday living.",
              detail: "03 / MAKE IT YOURS",
            },
          ].map((s, i) => (
            <article className="step" key={s.title}>
              <div className="step-illustration">
                <s.icon size={57} strokeWidth={1} />
                {i === 0 ? (
                  <span className="step-dimension">12′ 0″</span>
                ) : i === 1 ? (
                  <span className="step-plus">
                    <Plus size={20} />
                  </span>
                ) : (
                  <span className="step-check">
                    <Check size={17} />
                  </span>
                )}
              </div>
              <span className="step-number">{s.detail}</span>
              <h3>{s.title}</h3>
              <p>{s.copy}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="comparison-section">
        <div className="page-width comparison-grid">
          <div className="comparison-visual">
            <div className="comparison-top">
              <span>SAME ROOM. NEW PERSPECTIVE.</span>
              <div className="segmented">
                <button
                  onClick={() => setAfter(false)}
                  aria-pressed={!after}
                  className={!after ? "active" : ""}
                >
                  Before
                </button>
                <button
                  onClick={() => setAfter(true)}
                  aria-pressed={after}
                  className={after ? "active" : ""}
                >
                  After
                </button>
              </div>
            </div>
            <PlanSvg
              project={{
                ...initial,
                furniture: initial.furniture.map((i) =>
                  after
                    ? i
                    : {
                        ...i,
                        x: Math.max(
                          0,
                          Math.min(
                            6000 - (i.rotation % 180 === 0 ? i.width : i.depth),
                            i.x +
                              (i.catalogId === "coffee-table" ? 1700 : -500),
                          ),
                        ),
                        y: Math.max(
                          0,
                          Math.min(
                            4800 - (i.rotation % 180 === 0 ? i.depth : i.width),
                            i.y + (i.catalogId === "armchair" ? 1000 : 300),
                          ),
                        ),
                      },
                ),
              }}
              measurements={false}
            />
            <div className="comparison-note">
              <span className="status-dot" />
              {after
                ? "A little more flow. A lot more room to live."
                : "An illustrative starting point with less open space."}
            </div>
          </div>
          <div className="comparison-copy">
            <span className="eyebrow">IT’S ALL IN THE ARRANGEMENT</span>
            <h2>
              Same room.
              <br />
              <em>Different feeling.</em>
            </h2>
            <p>
              Sometimes, a better home doesn’t need more space. It just needs a
              fresh way of looking at it.
            </p>
            <p>
              Explore the possibilities before lifting a thing. A few thoughtful
              moves can make all the difference.
            </p>
            <TextLink to="/demo">Find your room’s potential</TextLink>
          </div>
        </div>
      </section>
      <section className="section page-width">
        <div className="section-intro">
          <div>
            <span className="eyebrow">A PLACE TO BEGIN</span>
            <h2>
              Every space has
              <br />
              <em>a starting point.</em>
            </h2>
          </div>
          <div>
            <p>
              From a cozy corner to a whole new home.
              <br />
              Find a layout, then make it your own.
            </p>
            <TextLink to="/templates">Explore all templates</TextLink>
          </div>
        </div>
        <div className="featured-grid">
          {[templates[5], templates[2], templates[3]].map((t) => (
            <TemplateCard key={t.id} template={t} />
          ))}
        </div>
      </section>
      <section className="brand-story page-width">
        <div className="story-art" aria-hidden="true">
          <div className="story-line one" />
          <div className="story-line two" />
          <div className="story-line three" />
          <span>
            LESS GUESSWORK.
            <br />
            MORE POSSIBILITY.
          </span>
          <div className="story-symbol">sf.</div>
          <span className="story-art-footer">
            CONSIDERED BY DESIGN. PERSONAL BY NATURE.
          </span>
        </div>
        <div className="story-copy">
          <span className="eyebrow">SPACE FOR WHAT MATTERS</span>
          <h2>
            A home should fit
            <br />
            <em>the way you live.</em>
          </h2>
          <p>
            We believe good spaces start with understanding the people who live
            in them. The morning coffee. The work-from-home days. The friends
            who stay a little longer.
          </p>
          <p>
            SPACEFIT helps you plan around real life—with a little clarity, a
            little confidence, and plenty of room to be yourself.
          </p>
          <TextLink to="/about">Our thoughtful approach</TextLink>
        </div>
      </section>
      <section className="section page-width faq-section">
        <div>
          <span className="eyebrow">A LITTLE CLARITY</span>
          <h2>
            Room for
            <br />
            <em>questions.</em>
          </h2>
          <TextLink to="/help">Visit the planning guide</TextLink>
        </div>
        <div className="faq-list">
          {faqs.map(([q, a], i) => (
            <div className="faq-item" key={q}>
              <h3>
                <button
                  aria-expanded={faq === i}
                  aria-controls={`faq-${i}`}
                  onClick={() => setFaq(faq === i ? null : i)}
                >
                  {q}
                  <ChevronDown
                    size={19}
                    className={faq === i ? "rotated" : ""}
                  />
                </button>
              </h3>
              <div id={`faq-${i}`} hidden={faq !== i}>
                <p>{a}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
      <FinalCTA />
      <div className="little-footnote">
        <MousePointer2 size={13} />
        <span>Made for the possibilities of your everyday.</span>
        <ArrowRight size={13} />
      </div>
    </main>
  );
}

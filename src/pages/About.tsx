import { ArrowUpRight, Compass, Heart, Leaf, Ruler } from "lucide-react";
import { Link } from "react-router-dom";
import { FinalCTA } from "../components/Brand";
import { PlanSvg } from "../components/PlanSvg";
import { createDemo } from "../data/templates";
const demo = createDemo();
export default function About() {
  return (
    <main id="main">
      <section className="page-width page-heading about-heading">
        <span className="eyebrow">A MORE THOUGHTFUL APPROACH</span>
        <h1>
          Good living begins
          <br />
          with <em>a little room.</em>
        </h1>
        <div className="heading-bottom">
          <p>
            Room to think. Room to move. Room to be yourself.
            <br />
            We’re here to help you find it.
          </p>
          <span className="about-heading-note">
            SPACEFIT
            <br />
            CONSIDERED BY DESIGN.
          </span>
        </div>
      </section>
      <section className="about-feature">
        <div className="page-width about-feature-grid">
          <div className="about-quote">
            <span className="eyebrow">OUR STARTING POINT</span>
            <h2>
              “A home should be
              <br />
              designed around life.
              <br />
              <em>
                Not the other way
                <br />
                around.”
              </em>
            </h2>
            <p>THE SPACEFIT PHILOSOPHY</p>
          </div>
          <div className="about-plan">
            <PlanSvg project={demo} measurements={true} />
            <span>REAL DIMENSIONS. ROOM FOR POSSIBILITY.</span>
          </div>
        </div>
      </section>
      <section className="section page-width about-story">
        <span className="eyebrow">LESS GUESSWORK. MORE LIVING.</span>
        <div>
          <h2>
            Before the moving.
            <br />
            Before the buying.
            <br />
            <em>A moment to see.</em>
          </h2>
          <p>
            A sofa that looked smaller in the store. A desk that blocks the
            light. A room that has everything you need, yet somehow never feels
            quite right.
          </p>
          <p>
            SPACEFIT makes room for a more considered beginning. It’s a simple
            way to understand your space, explore a few arrangements, and make
            decisions with a clearer picture.
          </p>
          <p>
            We’re a fictional product concept with a practical purpose: help you
            plan a home around the way you actually live. No design degree
            required.
          </p>
          <Link className="text-link" to="/demo">
            See the idea in action <ArrowUpRight size={17} />
          </Link>
        </div>
      </section>
      <section className="principles-section">
        <div className="page-width">
          <span className="eyebrow">THE THINGS WE BUILD AROUND</span>
          <h2>
            Thoughtful by nature.
            <br />
            <em>Useful by design.</em>
          </h2>
          <div className="principles-grid">
            {[
              [
                Heart,
                "Life comes first.",
                "Good spaces begin with understanding how people live. Start with what your room needs to do for you.",
              ],
              [
                Leaf,
                "Small deserves thoughtful.",
                "A small room isn’t a limitation. It’s an invitation to make every piece and every placement count.",
              ],
              [
                Ruler,
                "Clarity creates confidence.",
                "Real measurements help turn an idea into something you can actually see, compare, and decide on.",
              ],
              [
                Compass,
                "Keep it approachable.",
                "Useful design tools should feel welcoming. A few simple moves should be enough to explore something better.",
              ],
            ].map(([I, title, copy], i) => {
              const Icon = I as typeof Heart;
              return (
                <article key={i}>
                  <Icon size={30} strokeWidth={1} />
                  <span>0{i + 1}</span>
                  <h3>{title as string}</h3>
                  <p>{copy as string}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>
      <section className="section page-width capabilities">
        <div>
          <span className="eyebrow">A CLEAR PICTURE</span>
          <h2>
            Made for planning.
            <br />
            <em>Made for you.</em>
          </h2>
        </div>
        <div>
          <h3>What you can explore</h3>
          <p>
            Create rectangular rooms, combine them into a larger space, and
            place furniture with editable dimensions. Compare arrangements, undo
            a move, save your plans, and export them to keep or share.
          </p>
          <h3>A thoughtful set of boundaries</h3>
          <p>
            SPACEFIT is a 2D conceptual planning tool. Our templates and
            furniture are examples, not certified building plans or
            brand-specific product specifications. We don’t offer structural
            guidance, construction documents, or building-code checks.
          </p>
          <Link className="text-link" to="/help">
            A closer look at how it works <ArrowUpRight size={17} />
          </Link>
        </div>
      </section>
      <FinalCTA />
    </main>
  );
}

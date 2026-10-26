import { Link, useLocation } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
export default function Supporting() {
  const { pathname } = useLocation();
  const privacy = pathname === "/privacy",
    help = pathname === "/help";
  return (
    <main id="main" className="page-width supporting-page">
      <span className="eyebrow">
        {privacy
          ? "YOUR IDEAS ARE PERSONAL"
          : help
            ? "A LITTLE GUIDANCE"
            : "A LITTLE OFF PLAN"}
      </span>
      <h1>
        {privacy ? (
          <>
            Your space.
            <br />
            <em>Your privacy.</em>
          </>
        ) : help ? (
          <>
            A clear path
            <br />
            to <em>a better fit.</em>
          </>
        ) : (
          <>
            Let’s find
            <br />
            <em>your way home.</em>
          </>
        )}
      </h1>
      {privacy ? (
        <div className="prose">
          <h2>Guest drafts stay in this browser.</h2>
          <p>
            SPACEFIT stores guest projects in IndexedDB on your device. Project
            names, room dimensions, notes, and furniture arrangements are saved
            locally. Clearing your browser’s site data, switching browsers, or
            using private browsing may remove these drafts.
          </p>
          <h2>Accounts connect to Firebase when configured.</h2>
          <p>
            If this installation has Firebase configured, email and password
            authentication is handled by Firebase Authentication. Signed-in
            projects are stored in Cloud Firestore under your user ID. Ownership
            rules limit access to your account. Pending account edits may also
            be cached locally under your user ID for offline recovery.
          </p>
          <h2>You choose what moves.</h2>
          <p>
            Guest drafts are never automatically imported into an account. You
            can choose to import copies from My spaces. Project exports download
            to your device. JSON exports include the complete project data; PNG
            exports include the visible floor plan.
          </p>
          <h2>No analytics or advertising trackers.</h2>
          <p>
            This application does not add advertising, analytics, or third-party
            image requests. System fonts and locally bundled artwork are used.
            Hosting providers and Firebase may process request information under
            their own policies.
          </p>
          <h2>Keep a copy of what matters.</h2>
          <p>
            Browser storage can fail or be cleared by your device. Export JSON
            backups regularly. You can delete guest or account projects from My
            spaces, with confirmation before removal.
          </p>
        </div>
      ) : help ? (
        <div className="prose">
          <h2>1. Get to know your room.</h2>
          <p>
            Measure the width and depth of your room. Start with a blank room or
            choose one of eight conceptual templates. Use feet and inches, such
            as 12' 6", or centimeters. Display-unit changes never alter the
            stored millimeter geometry.
          </p>
          <h2>2. Bring in what matters.</h2>
          <p>
            Click a piece in the furniture catalog to add it to your selected
            room. Search by name or filter by category. Select furniture on the
            plan to edit its full width, depth, position, rotation, and color.
          </p>
          <h2>3. See what fits.</h2>
          <p>
            Drag furniture, or use arrow keys to move a selected piece by 50 mm.
            Hold Shift to move 250 mm. Rotate in 90° steps with the details
            panel. Use Undo and Redo to explore freely. Rugs are allowed
            underneath other furniture. Solid furniture overlaps and door swing
            areas produce planning notices.
          </p>
          <h2>4. Make room for a bigger picture.</h2>
          <p>
            Use the hand tool to pan and the bottom controls to zoom or fit the
            layout. Add rooms from the Rooms panel; each new rectangle attaches
            to the right of the plan. Rooms currently stay in that position.
            Doors and windows are wall-anchored and adapt to room resizing;
            custom opening editing is not yet available.
          </p>
          <h2>5. Keep your possibilities.</h2>
          <p>
            Changes autosave after a short pause. Check the save indicator
            before leaving. Guest projects stay in this browser. Export a JSON
            backup to reimport later, or a PNG of the current canvas view. If
            another tab or device changes a project, save a copy or reload the
            latest version.
          </p>
          <h2>Planning on a smaller screen.</h2>
          <p>
            Use the Furniture, Rooms, and Details buttons along the bottom. Tap
            a piece on the plan to open its details. Exact position fields and
            the rotate button let you arrange without dragging.
          </p>
          <h2>Useful, with clear limits.</h2>
          <p>
            This is a conceptual 2D planning tool. Verify real furniture
            dimensions, door clearance, and room measurements before making
            decisions. It does not evaluate building codes, structural safety,
            accessibility compliance, or construction requirements.
          </p>
        </div>
      ) : (
        <p className="not-found-copy">
          This page isn’t part of the plan. Your next great space is just a
          click away.
        </p>
      )}
      <Link
        className="button"
        to={privacy ? "/my-spaces" : help ? "/new" : "/"}
      >
        {privacy
          ? "Back to my spaces"
          : help
            ? "Let’s start planning"
            : "Back to home"}
        <ArrowUpRight size={18} />
      </Link>
    </main>
  );
}

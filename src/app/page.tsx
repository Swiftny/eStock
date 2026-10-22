import { LandingMotion } from "@/components/landing-motion";
import { SiteHeader } from "@/components/site-header";

const workflow = [
  ["Record sales and stock", "Employees keep sales, stock movements and deliveries up to date."],
  [
    "Get a reorder suggestion",
    "AI estimates demand. eStock suggests what to reorder, when to buy and how many units to order.",
  ],
  [
    "Get reminded. Make the call.",
    "Reorder prompts appear in the workspace when a purchase needs review. A manager checks and approves it before a supplier request is created.",
  ],
];

function words(text: string, delay = 0) {
  return Array.from(text.matchAll(/\S+|\s+/g), (match) =>
    match[0].trim() ? (
      <span
        className="animated-word"
        key={match.index}
        style={{ animationDelay: `${delay + Math.min(match.index, 24) * 12}ms` }}
      >
        {match[0]}
      </span>
    ) : (
      match[0]
    ),
  );
}

export default function Home() {
  return (
    <div id="page-top" className="refined-site simple-landing">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <SiteHeader />
      <LandingMotion />
      <main id="main" tabIndex={-1}>
        <section className="landing-hero container" aria-labelledby="hero-title">
          <p className="landing-eyebrow">{words("Stock planning for SMEs")}</p>
          <h1 id="hero-title">
            <span>{words("Know when to reorder.", 80)}</span>
            <span className="headline-accent">{words("Know how much.", 180)}</span>
          </h1>
          <p className="landing-motto">{words("Less guesswork. More control.", 260)}</p>
          <p className="landing-description">
            {words(
              "Turn sales and stock records into your next order, with approval in your hands.",
              320,
            )}
          </p>
          <div className="landing-actions">
            <a href="/demo" className="button button-primary">
              Open demo
            </a>
            <a href="#how-it-works" className="landing-text-link hero-workflow-link">
              How it works
            </a>
          </div>
        </section>
        <section
          id="roles"
          className="landing-roles container"
          aria-label="Employee and manager roles, and what the AI does"
        >
          <article className="role-card" data-reveal>
            <h2>{words("For employees")}</h2>
            <h3>
              {words("Keep stock")}
              <br />
              {words("up to date.", 80)}
            </h3>
            <p>
              {words(
                "Record what goes out and what comes in, so the team works from the same stock records.",
              )}
            </p>
            <ul>
              <li>{words("Record sales and stock movements")}</li>
              <li>{words("Receive confirmed deliveries", 60)}</li>
              <li>{words("Check stock and activity", 120)}</li>
            </ul>
          </article>
          <article className="role-card role-card-manager" data-reveal>
            <h2>{words("For managers")}</h2>
            <h3>
              {words("Make the call")}
              <br />
              {words("on every order.", 80)}
            </h3>
            <p>{words("Review the quantity, cost and delivery before approving a purchase.")}</p>
            <ul>
              <li>{words("Approve, adjust or reject an order")}</li>
              <li>{words("Set buying rules and limits", 60)}</li>
              <li>{words("Track supplier requests and receiving", 120)}</li>
            </ul>
          </article>
          <article className="ai-explainer" data-reveal>
            <div>
              <h2>{words("What the AI does")}</h2>
              <h3>
                {words("What to order.")}
                <br />
                {words("When. And how much.", 80)}
              </h3>
            </div>
            <div className="ai-explanation">
              <p>
                {words(
                  "AI’s role is to estimate demand from sales history. eStock combines that estimate with your stock, incoming deliveries and buying rules to suggest what to order, when and how much. Reorder prompts remind a manager to review the purchase.",
                )}
              </p>
              <p className="ai-demo-note">
                {words(
                  "Current demo: a baseline calculation. Live AI forecasting is not connected.",
                )}
              </p>
            </div>
          </article>
        </section>
        <section
          id="how-it-works"
          className="landing-workflow container"
          aria-labelledby="workflow-title"
          data-reveal
        >
          <p className="workflow-eyebrow">{words("How it works")}</p>
          <h2 id="workflow-title">
            {words("A clear path", 40)}
            <br />
            <span>{words("from stock to order.", 140)}</span>
          </h2>
          <ol className="landing-steps">
            {workflow.map(([title, detail], index) => (
              <li key={title}>
                <span className="step-number">0{index + 1}</span>
                <h3>{words(title)}</h3>
                <p>{words(detail)}</p>
              </li>
            ))}
          </ol>
        </section>
      </main>
      <footer className="landing-footer container" data-reveal>
        <p>{words("Synthetic demo · Simulated supplier messages")}</p>
        <p>{words("TooGoodToBeTrue · SDC Hackathon 2026")}</p>
      </footer>
    </div>
  );
}

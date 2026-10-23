import { LandingMotion } from "@/components/landing-motion";
import { SiteHeader } from "@/components/site-header";

const workflow = [
  [
    "Scan a supplier document",
    "A manager photographs or uploads a document. AI prepares the product lines for review.",
  ],
  [
    "Review products and quantities",
    "Match each line to a product, correct unclear details and convert quantities into the product’s base unit.",
  ],
  [
    "Confirm receipt. Update stock.",
    "A manager confirms what actually arrived and approves the intake. Stock and movement history update together.",
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
          <p className="landing-eyebrow">{words("AI-assisted stock entry")}</p>
          <h1 id="hero-title">
            <span>{words("From receipt to stock.", 80)}</span>
            <span className="headline-accent">{words("With your approval.", 180)}</span>
          </h1>
          <p className="landing-motto">{words("Less retyping. More control.", 260)}</p>
          <p className="landing-description">
            {words("Turn supplier documents into stock updates you can review and approve.", 320)}
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
          aria-label="Staff and manager roles, and what the AI does"
        >
          <article className="role-card" data-reveal>
            <h2>{words("FOR STAFF")}</h2>
            <h3>
              {words("Take. Return.")}
              <br />
              {words("Get on with your day.", 80)}
            </h3>
            <p>{words("Find an item, enter a quantity, and keep stock up to date.")}</p>
            <ul>
              <li>{words("Find the right product")}</li>
              <li>{words("Record what you take", 60)}</li>
              <li>{words("Return usable items to stock", 120)}</li>
            </ul>
          </article>
          <article className="role-card role-card-manager" data-reveal>
            <h2>{words("FOR MANAGERS")}</h2>
            <h3>
              {words("Start with a photo.")}
              <br />
              {words("Stay in control.", 80)}
            </h3>
            <p>
              {words(
                "Upload a supplier document. Review the details, make any corrections, and approve the stock update.",
              )}
            </p>
            <ul>
              <li>{words("Less retyping from receipts")}</li>
              <li>{words("Product matches you can check", 60)}</li>
              <li>{words("A clear record of every approval", 120)}</li>
            </ul>
          </article>
          <article className="ai-explainer" data-reveal>
            <div>
              <h2>{words("WHAT THE AI DOES")}</h2>
              <h3>
                {words("A first draft.")}
                <br />
                {words("A lot less typing.", 80)}
              </h3>
            </div>
            <div className="ai-explanation">
              <p>
                {words(
                  "AI reads product names, quantities and dates from your documents. eStock suggests matching products, ready for your review. Stock changes only after you approve.",
                )}
              </p>
              <p className="ai-demo-note">
                {words(
                  "In the demo, managers can upload a sample supplier document and approve the resulting stock entry.",
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
            <span>{words("from document to stock.", 140)}</span>
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
        <p>{words("One shop. One warehouse.")}</p>
        <p>{words("TooGoodToBeTrue · SDC Hackathon 2026")}</p>
      </footer>
    </div>
  );
}

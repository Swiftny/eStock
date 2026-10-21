import { LandingMotion } from "@/components/landing-motion";
import { SiteHeader } from "@/components/site-header";
import { DemoLaunchButton, RecommendationDemo } from "@/components/recommendation-demo";
import { Wordmark } from "@/components/ui";

const workflow = [
  ["Record", "Save sales and stock movements. Close the day when records are complete."],
  ["Analyse", "Estimate demand from complete history, then apply your buying rules."],
  ["Review", "A manager checks quantity, cost, delivery and any warnings."],
  ["Follow through", "Track the supplier request, confirmation and usable goods received."],
];

export default function Home() {
  return (
    <div id="page-top" className="refined-site">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <SiteHeader />
      <LandingMotion />
      <main id="main" tabIndex={-1}>
        <section className="hero container" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="eyebrow">A clearer next purchase</p>
            <h1 id="hero-title">
              Know when
              <br />
              to reorder.
              <br />
              <span>Know how much.</span>
            </h1>
            <p>
              Turn sales and stock data into supplier purchase recommendations, ready for your
              approval.
            </p>
            <div className="hero-actions">
              <a href="/demo" className="button button-primary">
                Open demo
              </a>
              <a href="#how-it-works" className="button button-text">
                See how it works
              </a>
            </div>
          </div>
          <div className="hero-preview compact-preview">
            <div className="preview-heading">
              <span>Next stock review</span>
              <span>Synthetic example</span>
            </div>
            <div className="compact-product">
              <span>Paper cups</span>
              <span className="preview-status">Awaiting approval</span>
            </div>
            <dl className="compact-facts">
              <div>
                <dt>Stock remaining</dt>
                <dd>
                  45 <small>units</small>
                </dd>
              </div>
              <div>
                <dt>Coverage from stock</dt>
                <dd>
                  4.5 <small>days</small>
                </dd>
              </div>
            </dl>
            <div className="compact-order">
              <p>Suggested order</p>
              <strong>
                60 <span>units</span>
              </strong>
              <p>5 packs of 12 · Review today</p>
            </div>
            <p className="compact-reason">
              Cover the next 10 days, keep a 20-unit buffer and account for 25 confirmed incoming
              units.
            </p>
            <a href="/demo" className="button button-outline">
              Try with saved stock data
            </a>
            <p className="preview-disclaimer">Fixed PRD arithmetic, not a model result.</p>
          </div>
        </section>
        <section
          className="problem-section container"
          data-reveal="side"
          aria-labelledby="problem-title"
        >
          <h2 id="problem-title">
            Less piecing
            <br />
            things together.
          </h2>
          <div>
            <p>Sales in one place. Stock in a spreadsheet. Supplier updates in a chat.</p>
            <p>
              Bring those records into one purchase decision, with the reason close enough to check.
            </p>
          </div>
        </section>
        <section
          id="how-it-works"
          tabIndex={-1}
          className="workflow-section"
          aria-labelledby="workflow-title"
        >
          <div className="container">
            <div className="workflow-intro" data-reveal="rise">
              <span className="section-label">How it works</span>
              <h2 id="workflow-title">
                From today’s sale
                <br />
                to the next delivery.
              </h2>
            </div>
            <ol className="connected-workflow" data-reveal="stagger">
              {workflow.map(([name, detail], i) => (
                <li key={name}>
                  <span>0{i + 1}</span>
                  <h3>{name}</h3>
                  <p>{detail}</p>
                </li>
              ))}
            </ol>
            <p className="workflow-footnote">
              Approval creates a purchase order. Physical stock changes only when usable goods
              arrive.
            </p>
          </div>
        </section>
        <section
          id="features"
          tabIndex={-1}
          className="recommendation-section container"
          aria-labelledby="example-title"
        >
          <div className="example-intro" data-reveal="rise">
            <span className="section-label">The recommendation</span>
            <h2 id="example-title">
              A quantity you
              <br />
              can account for.
            </h2>
            <p>
              Demand, delivery dates, safety stock and packaging each have a part in the decision.
              Open the example to inspect the calculation and try a manager review.
            </p>
          </div>
          <div data-reveal="side">
            <details className="landing-example">
              <summary>Inspect the synthetic 60-unit example</summary>
              <RecommendationDemo />
            </details>
          </div>
        </section>
        <section
          id="human-control"
          tabIndex={-1}
          className="human-control-section"
          aria-labelledby="control-title"
        >
          <div className="container control-layout" data-reveal="rise">
            <div>
              <span className="section-label">Your decision</span>
              <h2 id="control-title">
                Check the reason.
                <br />
                Make the call.
              </h2>
              <p>
                Review the supplier, estimated cost and expected arrival. Adjust the quantity with a
                note, approve it or reject it. Your decision stays in the activity record.
              </p>
              <DemoLaunchButton className="button button-outline">
                Try the example review
              </DemoLaunchButton>
              <p className="small-disclosure">
                This example resets on refresh. The demo app saves records.
              </p>
            </div>
            <ol className="decision-ledger">
              <li>
                <span>Manager approval</span>
                <strong>Permission to purchase</strong>
              </li>
              <li>
                <span>Supplier confirmation</span>
                <strong>A separate acknowledgement</strong>
              </li>
              <li>
                <span>Goods received</span>
                <strong>Usable stock added to the ledger</strong>
              </li>
            </ol>
          </div>
        </section>
        <section
          className="closing-section container"
          data-reveal="rise"
          aria-labelledby="closing-title"
        >
          <h2 id="closing-title">
            Put your next
            <br />
            <span>reorder to the test.</span>
          </h2>
          <p>
            Record a sale. Review a recommendation.
            <br />
            Follow it through to receiving.
          </p>
          <a className="button button-primary" href="/demo">
            Open the working demo
          </a>
        </section>
      </main>
      <footer className="site-footer">
        <div className="container footer-top">
          <a href="#page-top" className="home-link" aria-label="eStock home">
            <Wordmark />
          </a>
          <p>TooGoodToBeTrue · SDC Hackathon 2026</p>
          <p>Synthetic data · Simulated supplier channel</p>
        </div>
      </footer>
    </div>
  );
}

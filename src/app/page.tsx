import { SiteHeader } from "@/components/site-header";
import { DemoLaunchButton, RecommendationDemo } from "@/components/recommendation-demo";
import { Icon, StatusLabel, Wordmark } from "@/components/ui";

const workflow = [
  { name: "Sales & stock data", detail: "Start with complete daily records.", icon: "records" },
  { name: "Demand forecast", detail: "Estimate the days ahead.", icon: "forecast" },
  {
    name: "Purchase recommendation",
    detail: "Apply your stock and buying rules.",
    icon: "recommend",
  },
  { name: "Manager approval", detail: "Review, adjust, approve or reject.", icon: "approval" },
  { name: "Supplier request", detail: "Request supply, then confirm it.", icon: "request" },
  { name: "Receiving", detail: "Record usable goods and the audit trail.", icon: "receive" },
] as const;

export default function Home() {
  return (
    <div id="page-top">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <SiteHeader />
      <main id="main" tabIndex={-1}>
        <section className="hero container" aria-labelledby="hero-title">
          <div className="hero-copy">
            <h1 id="hero-title">
              <span>Know when to reorder.</span>
              <span>Know how much.</span>
            </h1>
            <p>
              eStock turns sales and stock data into supplier purchase recommendations, ready for
              your approval.
            </p>
            <a href="#how-it-works" className="button button-primary hero-cta">
              See how it works
            </a>
          </div>
          <div className="hero-preview">
            <RecommendationDemo />
          </div>
        </section>

        <section className="problem-section container" aria-labelledby="problem-title">
          <div className="section-intro split-intro">
            <h2 id="problem-title">
              A restock decision.
              <br />
              <span>Several places to check.</span>
            </h2>
            <p>
              Sales in one place. Stock in a spreadsheet. Supplier updates in a chat. Before you can
              decide what to buy, you have to put the pieces together.
            </p>
          </div>
          <div className="scattered-records">
            <div className="source-record">
              <span className="source-label">
                <Icon name="records" />
                Sales records
              </span>
              <div className="source-line">
                <span>Example daily sales</span>
                <strong>10 units</strong>
              </div>
              <p>What has been going out?</p>
            </div>
            <div className="source-record">
              <span className="source-label">
                <Icon name="receive" />
                Stock spreadsheet
              </span>
              <div className="source-line">
                <span>Paper cups on hand</span>
                <strong>45 units</strong>
              </div>
              <p>What is actually available?</p>
            </div>
            <div className="source-record">
              <span className="source-label">
                <Icon name="request" />
                Supplier update
              </span>
              <div className="source-line">
                <span>Confirmed for day 3</span>
                <strong>25 units</strong>
              </div>
              <p>What will arrive, and when?</p>
            </div>
          </div>
          <p className="small-disclosure">Illustrative records from the synthetic example.</p>
        </section>

        <section id="how-it-works" className="workflow-section" aria-labelledby="workflow-title">
          <div className="container">
            <span className="section-label">How it works</span>
            <div className="section-intro split-intro">
              <h2 id="workflow-title">
                One connected
                <br />
                restocking workflow.
              </h2>
              <p>
                See the need, understand the quantity, and keep the purchase in your hands. Each
                step carries the information into the next.
              </p>
            </div>
            <ol className="workflow-track">
              {workflow.map((step, index) => (
                <li key={step.name} className={index === 3 ? "manager-step" : ""}>
                  <div className="workflow-symbol">
                    <Icon name={step.icon} />
                  </div>
                  <span className="workflow-index">0{index + 1}</span>
                  <h3>{step.name}</h3>
                  <p>{step.detail}</p>
                </li>
              ))}
            </ol>
            <p className="workflow-footnote">
              Supplier acknowledgement is a separate step after the request. Stock increases only
              when usable goods are received.
            </p>
          </div>
        </section>

        <section
          id="features"
          className="features-section container"
          aria-labelledby="features-title"
        >
          <span className="section-label">Inside eStock</span>
          <div className="section-intro">
            <h2 id="features-title">
              The context behind
              <br />
              every reorder.
            </h2>
            <p>The workflow we’re building, shown with synthetic records.</p>
          </div>

          <article className="feature-row records-feature">
            <div className="feature-copy">
              <span className="feature-number">01 / Connected records</span>
              <h3>
                Start with the
                <br />
                same stock picture.
              </h3>
              <p>
                Connect sales and stock movements in one record. Keep what sold separate from
                damage, adjustments and incoming supply.
              </p>
              <span className="feature-note">A clear starting point for the next decision.</span>
            </div>
            <div className="record-preview">
              <div className="mini-preview-title">
                <span>
                  <Icon name="records" />
                  Stock movements
                </span>
                <span className="small-label">Synthetic</span>
              </div>
              <div className="record-product">
                <strong>Paper cups</strong>
                <span>20 Oct 2026</span>
              </div>
              <table>
                <caption className="sr-only">
                  Synthetic paper cup movements: opening balance 55, sale 10, closing available
                  stock 45 units.
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Movement</th>
                    <th scope="col">Quantity</th>
                    <th scope="col">On hand</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th scope="row">Opening balance</th>
                    <td>+55</td>
                    <td>55</td>
                  </tr>
                  <tr>
                    <th scope="row">Sale</th>
                    <td>−10</td>
                    <td>45</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr>
                    <th scope="row" colSpan={2}>
                      Available stock
                    </th>
                    <td>
                      45 <span>units</span>
                    </td>
                  </tr>
                </tfoot>
              </table>
              <div className="record-inbound">
                <Icon name="receive" />
                <span>
                  25 units confirmed inbound
                  <br />
                  <small>Due on day 3. Not yet on hand.</small>
                </span>
              </div>
            </div>
          </article>

          <article className="feature-row quantity-feature">
            <div className="calculation-preview">
              <div className="mini-preview-title">
                <span>Why 60 units?</span>
                <span className="small-label">Synthetic</span>
              </div>
              <dl className="calculation-lines">
                <div>
                  <dt>
                    Expected demand <span>10 days × 10 units</span>
                  </dt>
                  <dd>100</dd>
                </div>
                <div>
                  <dt>Safety buffer</dt>
                  <dd>+20</dd>
                </div>
                <div>
                  <dt>Available stock</dt>
                  <dd>−45</dd>
                </div>
                <div>
                  <dt>Confirmed incoming stock</dt>
                  <dd>−25</dd>
                </div>
                <div className="calculation-total">
                  <dt>Raw purchase need</dt>
                  <dd>50</dd>
                </div>
              </dl>
              <div className="pack-result">
                <span>Rounded to packs of 12</span>
                <strong>
                  60 <span>units</span>
                </strong>
              </div>
              <p className="calculation-caption">Fixed arithmetic example, not a live forecast.</p>
            </div>
            <div className="feature-copy">
              <span className="feature-number">02 / Timing & quantity</span>
              <h3>
                A recommendation
                <br />
                you can follow.
              </h3>
              <p>
                AI estimates future demand. Deterministic rules calculate the purchase quantity
                using stock, dated incoming supply, lead time, your buffer and pack size.
              </p>
              <p>
                Arrival dates matter. A delivery that comes too late should never hide an earlier
                shortage.
              </p>
            </div>
          </article>

          <div className="supporting-features">
            <article className="approval-feature">
              <span className="feature-number">03 / Manager review</span>
              <h3>Ready for your decision.</h3>
              <p>
                Review the reason, change the quantity with a note, or reject the recommendation.
              </p>
              <div className="approval-slip">
                <div>
                  <Icon name="approval" />
                  <strong>Paper cups</strong>
                  <span>60 units</span>
                </div>
                <StatusLabel tone="pending">Awaiting manager approval</StatusLabel>
                <span className="small-label">Illustrative review state</span>
              </div>
            </article>
            <article className="tracking-feature">
              <span className="feature-number">04 / Request & receiving</span>
              <h3>Follow through to arrival.</h3>
              <p>
                Keep the supplier request, acknowledgement and usable goods received as distinct
                events.
              </p>
              <ol className="order-track">
                <li>
                  <span>Purchase request</span>
                  <small>After manager approval</small>
                </li>
                <li>
                  <span>Supplier confirmation</span>
                  <small>Explicit acknowledgement</small>
                </li>
                <li>
                  <span>Goods received</span>
                  <small>Record usable quantity</small>
                </li>
              </ol>
            </article>
          </div>
        </section>

        <section
          id="human-control"
          className="human-control-section"
          aria-labelledby="control-title"
        >
          <div className="container human-control-inner">
            <div>
              <span className="section-label">Human control</span>
              <h2 id="control-title">
                Your stock.
                <br />
                Your final say.
              </h2>
              <p>
                Check the reasoning before you act. Change a quantity with a note, approve it, or
                send it back. AI never approves a purchase on its own.
              </p>
              <DemoLaunchButton>Try a manager review</DemoLaunchButton>
              <span className="control-disclosure">A local demo. No messages or purchases.</span>
            </div>
            <div className="decision-sheet">
              <div className="decision-sheet-heading">
                <Icon name="approval" />
                <span>Manager’s decision</span>
              </div>
              <div className="control-option">
                <span>01</span>
                <div>
                  <h3>Inspect the reasons</h3>
                  <p>Demand, stock, incoming supply and buying rules, together.</p>
                </div>
              </div>
              <div className="control-option">
                <span>02</span>
                <div>
                  <h3>Adjust with a note</h3>
                  <p>Keep a record of what changed and why.</p>
                </div>
              </div>
              <div className="control-option">
                <span>03</span>
                <div>
                  <h3>Approve or reject</h3>
                  <p>The purchase waits for a manager’s decision.</p>
                </div>
              </div>
              <div className="decision-sheet-footer">
                <Icon name="check" />
                <span>A decision with a traceable reason.</span>
              </div>
            </div>
          </div>
        </section>

        <section className="closing-section container" aria-labelledby="closing-title">
          <span className="section-label">A clearer next purchase</span>
          <h2 id="closing-title">
            Keep the reasoning close.
            <br />
            <span>Keep the decision yours.</span>
          </h2>
          <p>
            From the daily stock picture to the next delivery,
            <br className="desktop-break" /> give every reorder a clear path forward.
          </p>
          <a className="button button-primary" href="#recommendation-preview">
            Revisit the recommendation
          </a>
        </section>
      </main>
      <footer className="site-footer">
        <div className="container">
          <div className="footer-top">
            <a href="#page-top" className="home-link" aria-label="eStock home">
              <Wordmark />
            </a>
            <p>
              TooGoodToBeTrue
              <br />
              <span>SDC Hackathon 2026 · Domain 2</span>
            </p>
            <a href="#how-it-works" className="footer-link">
              How it works
            </a>
          </div>
          <div className="footer-bottom">
            <p>Prototype landing page. All previews use synthetic data.</p>
            <p>Inventory, live forecasting and supplier integrations are not connected.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

# Demo palette, motion and landing copy verification

24 October 2026, MYT. Scope: user-requested alignment of the current demo with the existing landing page, plus the user's final landing hero copy. One source editor; no backend contract or dependency change.

## Result and direction

PASS for this visual/copy update. The final headline is “Less time typing.” in ink and “Faster stock updates.” in blue. Bold supporting copy: “Stock entry starts with a photo.” Description: “AI reads product names and quantities from your supplier documents.”

Design read declared before editing: a calm inventory workspace for Managers and Staff, ENERGY 2 / RHYTHM 2 / MOTION 2.

- Colour: inherit the existing landing tokens so blue, ink, muted text, paper and status surfaces stay consistent.
- Typography: reuse the existing Manrope font and eStock wordmark styling to preserve the product identity.
- Layout/spacing: retain the task-specific inventory, review and history layouts; readable compact controls remain useful during stock work.
- Panels: the pending-review panel uses the landing Manager card's blue wash to distinguish work awaiting approval.
- Motion: 500ms/12px page and sign-in entrances match the landing section reveal; 180ms underlines match landing navigation; 160ms colour transitions acknowledge hover/selection.
- Dialog motion: 180ms/6px entrance acknowledges the action without delaying input; no animation event controls application correctness.
- Elevation: shadow and dimming apply to the active dialog, indicating its relationship to the workspace.
- No new illustration, icon, avatar, font, logo asset, animation library or theme toggle.

## Executed checks

| Check | Actual result |
| --- | --- |
| Scoped Biome, three edited source files | Pass |
| TypeScript | Pass |
| Final production build after final copy revision | Pass |
| Retained isolated browser suite | All 11 journeys pass |
| Demo responsive checks | Overview, Inventory, Scan receipt, Drafts and History at 320/375/768/1440px; no page overflow |
| Final production landing and sign-in | Same four widths; exact final copy and no page overflow |
| Text contrast, sampled visual fixtures | Overview 37 text nodes, minimum 5.43:1; Inventory 45, Scan 26, empty Drafts 17, empty History 27 and movement-dialog view 57, each minimum 5.81:1; no failures |
| Landing text contrast before final shortening | 259 text nodes at each tested width, minimum 5.81:1; final text retains the same foreground/background pairs |
| Motion | Computed 500ms ease-out screen/sign-in and 180ms dialog entrance |
| Reduced motion | Computed screen/sign-in animation none; navigation and control transitions disabled |
| Keyboard | Visible blue 3px focus outline, Enter activation, Escape dialog dismissal |
| Final production console | No errors, warnings or page exceptions during landing/sign-in checks |
| Browser workflow diagnostics | No page exceptions; expected HTTP 502/403/409 only in deliberate outage/permission/conflict scenarios |
| Preservation | Initial README/runtime documentation edits retained; generated next-env import change restored |

The existing scope checker passes the explicit landing-file check. It does not map the current eStock component or CSS module and reports those as shared/integration. This task explicitly coordinated those two files plus the landing page with one editor, reviewed that source allowlist, and left the map unchanged. Documentation integration is recorded separately; no single-area full-tree pass is claimed.

## Recorded interaction evidence

| Element / flow | Observed result |
| --- | --- |
| Landing Skip to content | Keyboard Enter targets main |
| Landing wordmark and Overview | Targets page top |
| Your team | Targets roles |
| Both How it works links | Target the workflow section |
| Sign in | Existing /login redirect opens /demo sign-in |
| Both Open demo links | Open /demo sign-in |
| Manager/Staff radio choices | Selection changes |
| Manager and Staff sign-in | Real local sessions resolve the correct role in the isolated test schema |
| All five Manager section controls | Open their corresponding view |
| Overview View all inventory / Open inventory / View history | Open Inventory / Inventory / History |
| Refresh drafts / Refresh history | Request and redisplay records |
| Add product / product submission | Creates Opening 0 or positive product in isolated schema |
| Product Cancel / Close / Escape | Dismiss dialog |
| Product search and Edit / Save name | Filter records and persist corrected name |
| Upload / Create draft | Synthetic local provider returns saved draft without posting stock |
| Comparison details / choose / change / remove image | Preview changes without another extraction request |
| Draft selectors / correction fields / product selector | Reopen and edit saved structured values |
| Create new product during review | Starts product at Opening 0 |
| Exclude line / exclusion reason / Save draft | Saves justified exclusion and review corrections |
| Actual-receipt checkbox / Approve stock intake | Approval becomes available and posts included lines once |
| Provider outage / retry | Displays actionable error and allows explicit retry |
| Discard draft / Yes, discard draft | Terminal discard without receipt stock |
| Take / Return / Confirm | Save movement and show refreshed stock |
| History Receipt history / Stock activity | Switch between receipt groups and movements |
| Receipt search / date / View receipt details | Filter and reveal approval details |
| Activity search / movement type | Filter Shared Staff and Manager Opening records |
| Staff Sign out | Returns to sign-in |

## Delivery Gate

Each line applies to the edited visual/copy scope and the recorded checks above.

### Hard Gate

- R-02 PASS: no em dash in the edited product-source text.
- R-03 PASS: tested widths have no page overflow; controls and long-name review screenshots remain usable.
- R-17 PASS: displayed stock/count values come from application records or explicitly synthetic test fixtures; no invented business statistics added.
- R-18 PASS: no testimonials introduced.
- R-23 PASS: reused existing wordmark/font/assets; user supplied the copy and visual reference.
- R-24 PASS: all nine landing links activated with actual targets; all Manager sections opened.
- R-25 PASS: sampled text pairs meet AA, minimum measured 5.43:1.
- R-26 PASS: recorded links, section controls, refresh, dialogs and workflow actions execute their intended behaviour.
- R-27 PASS: empty Inventory/History, loading/extraction and provider-error states exercised by retained suite.
- R-28 PASS: no FAQ introduced.
- R-32 PASS: keyboard activation, blue focus indicator and Escape dismissal checked.
- R-33 PASS: source edited directly with apply_patch; no feature implemented by a source-rewriting script.
- R-34 PASS: the existing light brand theme remains the only shipped theme.
- R-35 PASS: types/build and 11 isolated browser journeys pass; interaction record and screenshot review above.
- R-36 PASS: no invented security, numeric performance, compliance or customer claims.
- R-37 PASS: explicit existing-landing reference controls the update; DESIGN.md records the current direction.
- R-38 PASS: user-authored copy and existing product behaviour; visual fixtures identified as synthetic.

### Purpose Gate

- R-01 PASS: existing blue brand tokens reused; no gradient/glow added.
- R-04 PASS: no new icon set or decorative glyph.
- R-06 PASS: existing Manrope/wordmark retained for consistent identity and readable stock labels.
- R-07 PASS: no background pattern.
- R-08 PASS: no decorative button arrows introduced.
- R-09 PASS: retained status/count labels describe actual stock or draft state.
- R-10 PASS: no glassmorphism.
- R-12 PASS: shadow marks dialog elevation only.
- R-13 PASS: no glow.
- R-14 PASS: panels retain distinct review/summary roles.
- R-19 PASS: entrance/selection motion has the written orientation/feedback purpose above and respects reduced motion.
- R-22 PASS: no illustration introduced.

### Liveliness

- Dials PASS: ENERGY 2 / RHYTHM 2 / MOTION 2 declared.
- Consistency PASS: quiet blue emphasis, task-specific composition and short transitions match those dials.
- Focal point PASS: review panel or current primary task leads each workspace view.
- Whitespace PASS: existing task/field grouping retained.
- Accent PASS: blue identifies primary actions and selected sections; amber/red retain warning/error meaning.
- Identity PASS: shared blue eStock wordmark, Manrope and blue-wash review motif.
- Design Read PASS: declared before implementation and retained above.

### Craftsmanship and quality locks

- C-1 PASS: major choices have written reasons above.
- C-2 PASS: interaction record confirms useful actions.
- C-3 PASS: existing product-task composition retained.
- C-4 PASS: responsive, keyboard, empty/loading/error/conflict and reduced-motion checks complete for this scope.
- C-5 PASS: no invented evidence or customer claim.
- R-05 PASS: no new template sections; task layouts retained.
- R-11 PASS: existing rectangular controls and modest panel radii retained.
- R-15 PASS: action labels remain specific, including Take, Return and Approve stock intake.
- R-16 PASS: no new AI marketing buzzwords.
- R-20 PASS: landing and workspace now share the established eStock identity.
- R-21 PASS: fixed light appearance follows the explicit supplied landing reference.
- R-29 PASS: shared blue/neutral brand palette; amber/red reserved for textual status.
- R-30 PASS: visual reference is this product's existing landing page.
- R-31 PASS: colour, type, layout, spacing, panels, motion and elevation each have a stated purpose.

## Evidence boundaries

Visual fixture review used intercepted synthetic catalogue responses, with no stock mutation. The retained suite separately exercised real local PostgreSQL/session/API behaviour in a uniquely owned schema and a local provider stub. All 11 journeys passed and the owned schema was removed. The earlier temporary preview's owned schema was also stopped for cleanup. Screenshots/results are local ignored artifacts under .artifacts/estock-palette-20261024 and .artifacts/estock-mvp.

The existing port-3000 development browser session produced HMR WebSocket errors; final verification used the actual production build on local port 3009 and had no console/runtime errors. That local preview remains running for user review. No change to the pre-existing development process was made. This is local verification, not deployment or live OCR evidence. Physical phones/cameras and live Gemini remain unverified. No real receipts, paid model calls, operational stock changes, secrets, infrastructure, commit, push or publication were involved.

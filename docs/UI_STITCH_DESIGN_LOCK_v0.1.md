# Ratio Essendi — Stitch UI Design Lock v0.1

Status: LOCKED
Branch: `feature/stitch-ui-1to1`
Source: uploaded Stitch export `stitch_ratio_essendi_os.zip`

## Decision

The Stitch export is the visual source of truth. The implementation must reproduce it 1:1 rather than reinterpret it.

Locked screens:

1. Command Center — desktop
2. Command Center — mobile
3. Lead Engine Operations
4. Operator Cockpit / Admin

## Visual invariants

- Background: near-black surfaces with subtle technical grid.
- Primary accent: cyan.
- Secondary operational accent: magenta.
- Warning accent: yellow.
- Typography: Plus Jakarta Sans for display/body hierarchy and JetBrains Mono for system labels, metrics, stamps and terminal output.
- Sharp industrial cards, thin borders, restrained glow, no rounded SaaS-dashboard look.
- Desktop left navigation and top command bar remain visually aligned with the Stitch source.
- Mobile uses the dedicated Stitch composition, not a compressed desktop grid.
- Card sizes, spacing, hierarchy, labels, progress bars, terminal blocks, badges and system stamps follow the supplied screenshots and HTML.

## Functional rule

The Stitch HTML is a visual reference only. Existing Ratio Essendi domain logic remains authoritative.

Every visible action must execute a real existing operation or be explicitly disabled with a clear reason. No decorative buttons, fake counters, modal placeholders or dead navigation.

## Tools

- GitHub: source of truth and branch control.
- Existing TypeScript HTTP runtime: current domain/API execution.
- Stitch HTML/screenshots: visual reference.
- Playwright/browser QA: desktop and mobile screenshot comparison.
- Vercel: preview deployment.

## Architecture

```text
Stitch UI components
  -> view-model adapter
      -> existing FactoryState / Lead Engine state
          -> existing POST action endpoints
              -> FactoryStore
                  -> PersistencePort
                      -> Json adapter (local/test)
                      -> Supabase Postgres adapter (production)
```

The UI layer must not duplicate business rules or persistence logic.

## Planned repo structure

```text
ui/
  tokens.ts
  shell/
    DesktopShell.ts
    MobileShell.ts
  command-center/
    CommandCenterDesktop.ts
    CommandCenterMobile.ts
  lead-engine/
    LeadEngineOperations.ts
  operator-cockpit/
    OperatorCockpit.ts
  components/
    SystemCard.ts
    MetricBlock.ts
    StatusBadge.ts
    TerminalFeed.ts
    ActionButton.ts
  view-models/
    command-center.ts
    lead-engine.ts
    operator-cockpit.ts
```

Final file placement may be adjusted to fit the current server-rendered TypeScript runtime, but boundaries above remain locked.

## Execution flow

1. Extract shared tokens and layout primitives from Stitch.
2. Rebuild Command Center desktop 1:1.
3. Rebuild dedicated mobile Command Center 1:1.
4. Rebuild Lead Engine Operations 1:1.
5. Rebuild Operator Cockpit 1:1.
6. Bind current state and existing forms/actions.
7. Remove the old visual layer only after parity and action validation.

## Validation flow

- TypeScript typecheck.
- Existing test suite.
- Vercel bundle build.
- Desktop screenshot comparison at the Stitch reference viewport.
- Mobile screenshot comparison at the Stitch reference viewport.
- Verify every button/link/form performs a real action.
- Verify lead-thread and operator-action persistence survives a cold start.
- Verify the factory never sends an external message autonomously.

## Deployment flow

1. Push implementation commits to `feature/stitch-ui-1to1`.
2. Generate Vercel preview.
3. Run desktop/mobile live QA.
4. Merge only after visual parity and interaction checks pass.

## Rollback / safety

- Keep the current renderer intact until the new renderer passes parity checks.
- Make UI switching reversible through one isolated integration commit.
- Do not alter PersistencePort, Supabase tables or domain contracts as part of this UI task.
- If preview validation fails, revert the UI integration commit without touching stored data.

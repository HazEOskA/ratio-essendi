# Safety Boundaries

Ratio Essendi must be autonomous only inside defined boundaries.

Autonomy without boundaries is drift.

## Hard Boundaries

Agents cannot:

- spend money without budget rule,
- contact clients outside an explicit, bounded outreach policy,
- publish externally without approval,
- access secrets without permission,
- create new permissions for themselves,
- change their own purpose,
- promote themselves to production,
- override Security / Risk / Finance policies,
- activate a shadow cell without failover rule.

## Risk / Security / Finance Cells

Risk, Security and Finance cells can block actions.

A block is not rebellion.

A block is system protection.

## Approval Gates

Approval is required for:

- external client contact, unless the operator has enabled the bounded Client Acquisition policy,
- paid campaigns,
- production deploy,
- public launch,
- financial action,
- legal-risk content,
- irreversible data change,
- permission expansion.

## Safe Mode

Safe mode activates when:

- root config is missing,
- ownership conflict happens,
- budget breach occurs,
- secret exposure is detected,
- repeated drift appears,
- multiple cells fail,
- event log becomes inconsistent.

Safe mode means:

```txt
stop external actions
preserve state
log issue
wait for recovery or operator decision
```

## Bounded Client Acquisition Exception

The operator may grant standing approval for the Client Acquisition Loop by
setting `ACQUISITION_AUTO_SEND=true` and configuring an HTTPS outreach webhook.
This permission is narrow: verified public business email only, public source
evidence required, one message per prospect, a hard maximum of 3 contacts per
day, persistent deduplication, opt-out support, and a complete event trail.
It does not grant permission to send delivery packs, publish content, spend
money, contact unverified recipients, or mark a prospect as a client without
an interested reply plus proof of agreement or payment.
On public Vercel preview deployments, the acquisition surface is locked unless
Basic Auth is configured, and external outreach remains disabled because the
ephemeral store cannot enforce durable quotas.

# Safety Boundaries

Ratio Essendi must be autonomous only inside defined boundaries.

Autonomy without boundaries is drift.

## Hard Boundaries

Agents cannot:

- spend money without budget rule,
- contact clients without approval,
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

- external client contact,
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

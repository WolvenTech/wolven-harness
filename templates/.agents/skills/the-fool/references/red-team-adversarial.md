# Red Team Adversarial

Mode: **Attack This**. Ask: *"If someone wanted to break, exploit, or game this, how would they?"* Beyond security: competitors, careless users, perverse incentives, regulators.

## Process

1. Identify the asset under assessment
2. Construct specific adversary personas (not a generic "attacker")
3. Map attack vectors per persona
4. Rank by likelihood × impact
5. Design defenses for the highest-ranked vectors

## Persona fields

| Field | Ask |
|-------|-----|
| Role | Who is this adversary? |
| Motivation | Why attack? |
| Capability | Resources and skills |
| Access | What do they already have? |
| Constraints | What limits them? |

## Common personas

| Persona | Motivation | Typical vectors |
|---------|-----------|-----------------|
| External attacker | Gain / data theft | API abuse, injection, credential stuffing |
| Competitor | Market advantage | Copy, FUD, talent poaching |
| Disgruntled insider | Revenge / gain | Privilege abuse, exfiltration |
| Careless user | Accidental | Misconfig, weak secrets, sharing access |
| Regulator | Enforcement | Audit findings, data-handling gaps |
| Opportunistic gamer | Personal benefit | Business-logic loopholes, referral fraud |

## Attack vector categories

| Category | Examples |
|----------|----------|
| Technical | Injection, auth bypass, race, SSRF |
| Business logic | Workflow bypass, price/state tampering |
| Social | Phishing, pretexting, authority abuse |
| Operational | Supply chain, dependency poisoning |
| Information | Enumeration, metadata / timing leaks |
| Economic | Resource exhaustion, denial-of-wallet |

For complex systems, sketch a short attack tree (goal → paths → leaf exploits).

## Perverse incentives

| Question | Reveals |
|----------|---------|
| How will people game this? | Logic loopholes |
| What behavior does this reward that we don't want? | Misaligned incentives |
| If we measure X, what Y gets sacrificed? | Goodhart's Law |
| Who benefits from this failing? | Motive |

## Output template

```markdown
## Red Team Analysis: [Target]

### Asset Under Assessment
[What we're protecting and why]

### Adversary Profiles

#### Adversary 1: [Role]
- **Motivation:** …
- **Capability:** …
- **Access:** …

### Attack Vectors (Ranked)

| # | Vector | Adversary | Likelihood | Impact |
|---|--------|-----------|-----------|--------|
| 1 | [Specific] | … | H/M/L | H/M/L |

### Perverse Incentives

| Incentive | Unintended behavior | Severity |
|-----------|---------------------|----------|
| … | … | H/M/L |

### Recommended Defenses

| Vector | Defense | Effort | Priority |
|--------|---------|--------|----------|
| #1 | [Specific] | L/M/H | Immediate / Next / Backlog |
```

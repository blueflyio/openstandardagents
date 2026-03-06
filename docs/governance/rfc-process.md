# Open Standard Agents (OSSA) RFC Process

## 1. Introduction
The OSSA Request for Comments (RFC) process is the primary mechanism for proposing major new features, specifications, and protocol changes to the Open Standard Agents ecosystem (including UADP and manifest schemas).

Our governance model is designed to be **neutral, decentralized, and community-driven**, inspired by the IETF, Rust RFCs, and W3C mechanisms.

## 2. When is an RFC necessary?
You need to follow the RFC process if you intend to make "substantial" changes to the Open Standard Agents specifications or its reference implementations. What constitutes a "substantial" change is evolving, but may include:
- A new feature that creates new API surface area for UADP.
- The removal of features that already shipped as part of a stable manifest schema (`v0.5.0` and above).
- The introduction of new cryptographic trust tiers or signature requirements.

## 3. The RFC Life-cycle
1. **Drafting (Phase 0):** The author writes the RFC using the template provided below.
2. **Community Review (Phase 1):** The RFC is submitted as a Pull Request to the `openstandardagents/rfcs` repository. The community discusses and refines the proposal.
3. **Final Comment Period (Phase 2):** When the proposal reaches consensus, a member of the core steering committee proposes a motion to accept it, triggering a 14-day Final Comment Period (FCP).
4. **Acceptance (Phase 3):** If no substantial new objections are raised, the PR is merged, and the RFC becomes "Active".
5. **Implementation (Phase 4):** Code is written. The RFC is only considered "Implemented" once at least **two independent implementations** successfully conform to the drafted specification.

## 4. RFC Template Structure

* **Feature Name:** `feature_name`
* **Start Date:** `YYYY-MM-DD`
* **RFC PR:** `openstandardagents/rfcs#0000` (leave blank until PR exists)

### Summary
One paragraph explanation of the feature.

### Motivation
Why are we doing this? What use cases does it support? What is the expected outcome?

### Detailed Design
This is the bulk of the RFC. Explain the design in enough detail that somebody familiar with OSSA and UADP could understand it.

### Decentralization & Trust Impact
How does this change affect the decentralization of the UADP registry model? Does it alter how identity or trust is resolved?

### Drawbacks
Why should we *not* do this?

### Alternatives
What other designs have been considered? What is the impact of not doing this?

### Unresolved questions
What parts of the design are still TBD?

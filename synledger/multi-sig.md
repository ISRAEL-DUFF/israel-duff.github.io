# Understanding Multi-Sig Approval & Auto-Release with Oracles in SynLedger
Multi-Sig Approval & Auto-Release with Oracles means that SynLedger can **securely manage payments either through collective human agreement or through verified external events** — combining **trust** and **automation** in a single escrow system.
> Multi-Sig Approval & Auto-Release with Oracles is part of SynLedger’s Core Concepts.

### High-Level System Overview
<!-- ![High Level overview](./assets/multi-sig-high-level.svg "High-Level System Overview") -->
```mermaid
flowchart LR
  subgraph Users
    C["Client Wallet"]
    F["Freelancer Wallet"]
    A["Arbitrator Wallet (optional)"]
  end

  subgraph App["SynLedger DApp"]
    UI["Web/App UI"]
    API["SynLedger API"]
  end

  subgraph L2["Arbitrum L2"]
    ESC["Escrow Smart Contract"]
    ORC["Oracle Consumer Module"]
  end

  subgraph Oracles
    CL["Chainlink / Pyth / SynLedger Oracle"]
  end

  C --> UI --> API --> ESC
  F --> UI
  A --> UI
  CL --> ORC --> ESC
  ESC -. "events" .-> API -. "notifications" .-> Users
```

---

## Meaning

In the context of **SynLedger**, Multi-Sig Approval & Auto-Release with Oracles means:

> Once a client has funded the escrow, **the release of those funds** can happen in one of two ways:  
> either **manually approved by multiple authorized wallets** (*multi-sig approval*),  
> or **automatically released when an on-chain/off-chain condition is verified** (*auto-release via oracle*).

These two options allow SynLedger to support both **human trust workflows** and **automated programmable payments**.

<!-- ![Meaning](./assets/multi-sig-meaning.svg "Multi-Signature") -->
```mermaid
flowchart LR
  FND["Client funds escrow"] --> DEC{Release Mode}
  DEC -- "Multi-sig" --> MSFLOW["Collect >= threshold approvals"]
  DEC -- "Oracle" --> ORFLOW["Oracle verifies condition"]
  MSFLOW --> REL["releaseFunds()"]
  ORFLOW --> REL
  REL --> DONE["Funds to Freelancer"]
```

---

## 1. Multi-Sig Approval

### Definition
Multi-signature (multi-sig) approval means that **more than one address must sign** a transaction before the funds are released from escrow.

#### Escrow Lifecycle (Overview)
<!-- ![Life Cycle Overview](./assets/multi-sig-life-cycle.svg "Life Cycle Overview") -->
```mermaid
stateDiagram-v2
  [*] --> Draft
  Draft --> Funded: client funds escrow (ERC20)
  Funded --> InProgress: work begins / milestones created
  InProgress --> ReadyForRelease: milestone marked complete
  ReadyForRelease --> Released: Multi-sig >= threshold OR Oracle condition true
  InProgress --> Cancelled: cancellable && client cancels before start
  Funded --> Refunded: cancellable && cancellation before start
  Released --> [*]
  Cancelled --> [*]
  Refunded --> [*]
```


### Example (2-of-3 model)
- **Client**, **Freelancer**, and **SynLedger Arbitration Address** are all signers.
- The escrow contract requires at least **two of the three** to approve a release before it executes.

### Process
1. Client and freelancer agree the work is complete.  
2. Each signs an approval message (on-chain or via EIP-712 off-chain signature).  
3. Once the threshold (e.g., 2-of-3) is reached, the contract executes `releaseFunds()`.

### Benefits
- Prevents unilateral fund releases.  
- Increases transparency and security.  
- No single party can cheat or lock funds unfairly.

### Implementation in SynLedger
- **OpenZeppelin’s AccessControl** + **EIP-712 signature verification**.  
- Optional integration with **Gnosis Safe modules** for institutional use.

### Actors & Threshold (2-of-3)
<!-- ![Actors and Threshold](./assets/multi-sig-actors.svg "Actors & Threshold (2-of-3)") -->
```mermaid
classDiagram
  class Escrow {
    +client: address
    +freelancer: address
    +arbiter: address
    +threshold: uint8
    +approvals: mapping(address=>bool)
    +releaseFunds()
  }
  class Wallet{
    +sign(message)
  }
  Wallet <|-- ClientWallet
  Wallet <|-- FreelancerWallet
  Wallet <|-- ArbiterWallet
```


#### Sequence Flow (Signature Collection (EIP-712))
<!-- ![Sequence flow](./assets/multi-sig-sequence-flow.svg "Signature Collection (EIP-712)") -->
```mermaid
sequenceDiagram
  participant C as Client Wallet
  participant F as Freelancer Wallet
  participant A as Arbiter Wallet (optional)
  participant UI as SynLedger UI/API
  participant ESC as Escrow Contract

  Note over UI,ESC: Milestone is ReadyForRelease
  C->>UI: Sign EIP-712 approval
  UI->>ESC: submitApproval(sig_C)
  ESC-->>UI: record approval (C=true)
  F->>UI: Sign EIP-712 approval
  UI->>ESC: submitApproval(sig_F)
  ESC-->>UI: record approval (F=true)
  alt approvals >= threshold (e.g., 2 of 3)
    UI->>ESC: releaseFunds(milestoneId)
    ESC-->>UI: transfer to Freelancer
  else not enough approvals
    ESC-->>UI: revert("Not enough approvals")
  end
```

#### Decision Logic
<!-- ![Decision Logic](./assets/multi-sig-decision-logic.svg "Decision Logic") -->
```mermaid
flowchart TD
  S((Start)) --> Q{Approvals >= threshold?}
  Q -- "Yes" --> R["releaseFunds()"]
  R --> E((End))
  Q -- "No" --> W["Wait/collect more signatures"]
  W --> Q
```
---


## 2. Auto-Release with Oracles

### Definition
An **oracle** is an on-chain data feed or service that delivers verified off-chain data to smart contracts.  
Auto-release means funds are released **automatically** when the oracle confirms a predefined condition.


#### Auto-Release with Oracles
<!-- ![Auto trigger](./assets/multi-sig-auto-trigger.svg "Auto-Release with Oracles") -->
```mermaid
flowchart LR
  subgraph Triggers
    GH["GitHub milestone complete"]
    CO["Courier delivery confirmed"]
    TM["Time lock: block.timestamp > unlock"]
    SLA["Uptime >= SLA target"]
  end
  GH --> O["Oracle"]
  CO --> O
  TM --> O
  SLA --> O
  O -->|"postCondition()/report"| OC["Oracle Consumer Module"]
  OC -->|"conditionMet()"| ESC["Escrow Contract"]
  ESC -->|"releaseFunds()"| PAY["Funds to Freelancer"]
```

#### Release Sequence
<!-- ![Release Sequence](./assets/multi-sig-auto-release-sequence.svg "Release Sequence") -->
```mermaid
sequenceDiagram
  participant S as External System/API
  participant OR as Oracle Node/Network
  participant OC as Oracle Consumer (on-chain)
  participant ESC as Escrow Contract

  S->>OR: Event/Reading (e.g., "milestone complete")
  OR->>OC: postCondition(data, proof/signature)
  OC->>ESC: assert conditionMet(data)
  alt valid & authorized
    ESC->>ESC: releaseFunds()
  else invalid/unauthorized
    ESC-->>OC: revert("Condition not met")
  end
```

#### Authorization & Validation
<!-- ![Authorization & Validation](./assets/multi-sig-authorization.svg "Authorization & Validation") -->
```mermaid
flowchart TD
  S((Start)) --> A{msg.sender == oracleAddress?}
  A -- "No" --> X["revert(Unauthorized oracle)"]
  A -- "Yes" --> B{validateProof-data}
  B -- "Fail" --> Y["revert(Invalid proof)"]
  B -- "Pass" --> C{ conditionMet-data? }
  C -- "No" --> Z["revert(Condition not met)"]
  C -- "Yes" --> R["releaseFunds()"]
  R --> E((End))
```

### Use Case Examples

| Use Case | Oracle Condition | Result |
|-----------|-----------------|--------|
| Freelance project | GitHub API marks milestone complete | Funds released |
| Delivery escrow | Courier API confirms delivery | Funds released |
| Time-based escrow | `block.timestamp > unlockTime` | Funds released automatically |
| Service contract | Uptime oracle verifies SLA | Funds released |

### Process
1. Oracle (e.g., Chainlink, Pyth, or SynLedger Oracle) monitors the agreed condition.  
2. When true, it posts a transaction to the contract.  
3. Contract verifies oracle signature and triggers `releaseFunds()` automatically.

### Benefits
- Removes manual approval for objective events.  
- Enables **“smart automation”** for milestone-based or recurring payments.  
- Reduces friction and human error.

---


## 3. Hybrid Mode (Oracle Trigger + Multi-Sig Fallback)
#### Authorization & Validation
<!-- ![Hybrid Mode](./assets/multi-sig-hybrid.svg "Hybrid Mode") -->
```mermaid
stateDiagram-v2
  [*] --> AwaitingTrigger
  AwaitingTrigger --> OracleTriggered: Oracle condition true
  OracleTriggered --> Released: releaseFunds()
  AwaitingTrigger --> ManualPath: Oracle timeout or disputed signal
  ManualPath --> CollectingApprovals: gather EIP-712 signatures
  CollectingApprovals --> Released: approvals >= threshold
  CollectingApprovals --> Dispute: threshold not met + time elapsed
  Dispute --> ArbitrationOutcome: arbiter decides
  ArbitrationOutcome --> Released: releaseFunds()
  ArbitrationOutcome --> Refunded: refund client
```


## 🧠 Why SynLedger Supports Both

SynLedger supports **both systems** for flexibility:

| Use Case | Recommended Mode |
|-----------|------------------|
| Freelance work | Multi-sig approval |
| On-chain dev bounties | Oracle-based auto-release |
| Marketplaces | Hybrid (Oracle trigger + Multi-sig fallback) |
| Automated uptime payments | Oracle auto-release |

This dual approach means SynLedger can fit:
- manual, human-verified agreements, and  
- fully automated smart contract workflows.

#### Why Support Both
<!-- ![Why Support Both](./assets/multi-sig-why-hybrid.svg "Why Support Both") -->
```mermaid
journey
  title Choosing Release Mode
  section Human-Verified Work
    Freelance engagement: 4: Client
    Needs consensus on quality: 4: Freelancer
    Optional neutral arbiter: 3: Arbiter
  section Automated Conditions
    On-chain bounties: 4: Protocol
    SLA / uptime payments: 5: DevOps/Infra
    Delivery confirmations: 4: Commerce
```

#### Security & Safeguards (Both Modes)
<!-- ![Security & Safeguards (Both Modes)](./assets/multi-sig-hybrid-safeguard.svg "Security & Safeguards (Both Modes)") -->
```mermaid
flowchart LR
  I((Initiate Release)) --> A{Mode == MULTISIG?}
  A -- "Yes" --> M["Check approvals >= threshold"]
  M -->|"No"| W["Wait/collect signatures"]
  M -->|"Yes"| RF["releaseFunds()"]
  A -- "No" --> O["Oracle path: sender==oracleAddress"]
  O -->|"No"| U["revert Unauthorized"]
  O -->|"Yes"| V["validate proof + conditionMet()"]
  V -->|"Fail"| R1["revert"]
  V -->|"Pass"| RF
  RF --> EVT["Emit events + update state"]
  EVT --> DONE((Complete))
```

---


## Summary

| Term | Meaning | Benefit |
|------|----------|----------|
| **Multi-sig approval** | Requires two or more parties to sign before releasing funds | Guarantees consensus and fairness |
| **Auto-release with oracles** | Automatically triggers payout when a verified condition is met | Enables automation and efficiency |
| **Why it matters** | SynLedger supports both manual trust and automated logic | Fits diverse user needs |

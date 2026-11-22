# Cricket Auction System

A real-time auction management and spectator platform for conducting category-based player auctions with live wheel spinning and team purse tracking.

## Language

### Core Entities

**Auction**:
The overarching event where players are auctioned category by category across teams within fixed purse limits.
_Avoid_: Bidding contest, draft

**Category**:
The skill or tier classification of players (e.g., Category A, B, Bowler, C, D, E, F) auctioned one group at a time.
_Avoid_: Tier, division, pool

**Player**:
An individual participant eligible to be picked, auctioned, and assigned to a team.
_Avoid_: Candidate, participant

**Team**:
A competing franchise with an allocated purse and designated squad slots across categories.
_Avoid_: Franchise, club

**Purse**:
The total budget (starting at ₹1,00,000) allocated to a team to acquire players during the auction.
_Avoid_: Budget, bank, balance

**Chit**:
A special wildcard or blind-draw player slot on the team roster that has a dedicated bid cost.
_Avoid_: Lucky draw, token, wildcard slot

### Auction States & Workflow

**In Auction**:
The status of players currently loaded onto the wheel for the active category round.
_Avoid_: Active, on deck, queued

**Sold**:
The status of a player who has been successfully acquired by a team for a winning bid.
_Avoid_: Bought, acquired

**Unsold**:
The status of a player who received no bids during a category round, eligible for a subsequent round.
_Avoid_: Passed, rejected, leftover

### System Roles & Views

**Admin View**:
The control interface (`/auction/admin`) used by auctioneers to paste player rosters, spin the wheel, and transition player statuses.
_Avoid_: Host panel, dashboard, operator

**Viewer View**:
The spectator interface (`/auction`) displaying the live wheel spin, current picks, and Men's/Women's purse tables.
_Avoid_: User view, public screen, client

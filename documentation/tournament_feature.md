# **Context**

You are a Senior Full Stack Developer. You are tasked with adding a "Tournament Platform" feature to an existing application.  
The app is built with Next.js, Tailwind CSS, and Supabase (PostgreSQL).

# **Core Requirements**

1. **Integration:** You must use the existing public.profiles, public.local\_members, and public.organizations tables. Do not create new user tables.  
2. **Namespace:** All new database tables must use the prefix t\_ to avoid collisions.  
3. **Language:** The entire UI must be in **Swedish**.  
4. **Flexibility:** The system relies on "Rules Engines" stored in JSONB columns for both **Scoring** and **Registration**.  
5. **Routing & Access:**  
   * **Staff:** /staff/tournament/...  
   * **Users:** /app/tournament/... and /app/fritidsgardar/\[slug\] (Organization Page).

# **Database Schema (Supabase/PostgreSQL)**

\-- 1\. TOURNAMENT SEASONS  
create table public.t\_seasons (  
  id uuid not null default gen\_random\_uuid () primary key,  
  created\_at timestamp with time zone default now(),  
  organization\_id uuid references public.organizations(id), \-- LINKS TO ORG PAGE  
  name text not null, \-- e.g., "La Liga HT25"  
  is\_active boolean default true,  
    
  \-- SCORING ENGINE:  
  \-- Example: {"goal": 1, "assist": 2, "win": 12}  
  point\_config jsonb not null default '{}'::jsonb,

  \-- REGISTRATION ENGINE:  
  \-- Example: {  
  \--   "method": "automatic",  
  \--   "access": "members\_only",  
  \--   "min\_age": 13,  
  \--   "max\_age": 19,  
  \--   "allowed\_genders": \["id\_male", "id\_female"\],  
  \--   "allowed\_groups": \["id\_group\_a"\]  
  \-- }  
  registration\_config jsonb not null default '{"method": "manual"}'::jsonb  
);

\-- 2\. PLAYER STATS (The Roster)  
create table public.t\_player\_stats (  
  id uuid not null default gen\_random\_uuid () primary key,  
  season\_id uuid references public.t\_seasons(id),  
  profile\_id uuid references public.profiles(id),  
  total\_points int default 0,  
  goals int default 0,  
  assists int default 0,  
  matches\_played int default 0,  
  badges jsonb default '\[\]'::jsonb,  
  unique (season\_id, profile\_id)  
);

\-- 3\. MATCH DAYS  
create table public.t\_match\_days (  
  id uuid not null default gen\_random\_uuid () primary key,  
  season\_id uuid references public.t\_seasons(id),  
  date timestamp with time zone not null,  
  status text default 'open\_for\_rsvp',  
  rsvp\_list jsonb default '{}'::jsonb,   
  generated\_teams jsonb default '\[\]'::jsonb,
  matches jsonb default '\[\]'::jsonb,  \-- Array of match objects
  match\_duration\_seconds int default 240,  \-- Default 4 minutes per match
  current\_match\_index int  \-- Index of active match (null = no active)
);

\-- Match object structure in matches array:
\-- {
\--   "id": "uuid",
\--   "team\_a\_index": 0,  \-- Index in generated\_teams
\--   "team\_b\_index": 1,
\--   "status": "pending" | "in\_progress" | "completed",
\--   "score\_a": 0,
\--   "score\_b": 0,
\--   "time\_remaining\_seconds": 240,
\--   "is\_paused": false,
\--   "started\_at": null,
\--   "ended\_at": null,
\--   "winner\_team\_index": null  \-- 0, 1, or null for draw
\-- }

\-- 4\. MATCH EVENTS  
create table public.t\_match\_events (  
  id uuid not null default gen\_random\_uuid () primary key,  
  match\_day\_id uuid references public.t\_match\_days(id),  
  match\_id text,  \-- References match.id in matches array
  profile\_id uuid references public.profiles(id),  
  event\_type text not null,  
  points\_awarded int not null,  
  team\_id text,  
  team\_index int,  \-- 0 or 1 (which team scored)
  created\_at timestamp default now()  
);

# **Feature Logic & Specifications**

## **1\. Registration System (New)**

### **Staff Settings UI (/staff)**

* **Location:** Inside Tournament Settings.  
* **Fields:**  
  * **Hantering:** Dropdown \[Manuell | Automatisk\].  
  * **Behörighet (If Automatic):** Dropdown \[Öppen för alla | Endast medlemmar | Utvalda medlemmar\].  
  * **Begränsningar:**  
    * Åldersgräns (Min/Max inputs).  
    * Kön (Multi-select from public.gender).  
    * Målgrupp (Multi-select from public.target\_subgroups).  
* **Storage:** Save these values into t\_seasons.registration\_config.

### **User Registration Flow (/app/fritidsgardar/\[slug\])**

* **Display:** Fetch active seasons linked to this Organization ID.  
* **Logic:** When a logged-in user views the page:  
  1. Check registration\_config.method. If "Manuell", hide "Gå med" button (show "Kontakta personal" instead).  
  2. If "Automatisk", validate User Profile against constraints:  
     * **Membership:** Check public.local\_members if access is "Endast medlemmar".  
     * **Age:** Calculate age from user profile/member data.  
     * **Gender/Group:** Compare IDs.  
  3. **Action:** If valid, show "Gå med" (Join) button.  
  4. **On Click:** Create a new row in t\_player\_stats for this user and season.

## **2\. The Rules Engine (Scoring)**

* **Dynamic Points:** When Staff clicks "Mål" (Goal), do **NOT** use hardcoded values.  
* **Logic:**  
  1. Fetch active season's point\_config.  
  2. Read value (e.g., goal \= 1).  
  3. Insert into t\_match\_events (Snapshot value).  
  4. Update t\_player\_stats (Increment total & specific counter).

## **3\. Match Day Manager**

### **Snake Draft:**
* Trigger: "Generera Lag".  
* Logic: Sort Checked-in players by Points → Top 4 are Captains → Distribute rest via Snake Pattern (1-2-3-4, 4-3-2-1...).  
* Storage: t\_match\_days.generated\_teams.

### **Team Editor:**
After teams are generated, staff can:
* **Rename teams:** Click edit icon next to team name
* **Change colors:** Click colored dot to open color picker (8 options)
* **Set captain:** Click crown icon on any player
* **Move players:** Drag-and-drop between teams, or use arrow menu
* **Regenerate:** "Regenerera lag" button to start fresh

Teams are disabled for editing when match day is in\_progress or completed.

## **4\. Match System & Live Scoring**

### **Match Generation**
After teams are generated via Snake Draft:
1. **Auto-generate matches**: Create match pairs (Lag 1 vs Lag 2, Lag 3 vs Lag 4, etc.)
2. **Round-robin option**: If 4 teams, generate 6 matches (each team plays each other once)
3. **Storage**: Save to `t_match_days.matches` as JSONB array
4. **Default duration**: 4 minutes per match (configurable)

### **Match List View**
* **Display**: List of all matches for the day with status badges (Väntar, Pågår, Avslutad)
* **Reorder**: Staff can drag-drop to reorder pending matches
* **Actions per match**:
  * "Starta match" (if pending and no other match in progress)
  * "Visa" (if in progress - go to active match)
  * "Resultat" (if completed - show summary)

### **Active Match View (Live Scoring)**

**Layout:**
```
┌──────────────────────────────────────────────────────────┐
│                    LAG 1 vs LAG 2                        │
│                       2 - 1                              │
│                                                          │
│                      ⏱️ 03:24                            │
│                   [⏸️ Pausa]                             │
├────────────────────────┬─────────────────────────────────┤
│  🔴 LAG 1 (2 mål)      │  🔵 LAG 2 (1 mål)               │
├────────────────────────┼─────────────────────────────────┤
│ 👤 Spelare 1           │ 👤 Spelare 3                    │
│ [Mål] [Assist]         │ [Mål] [Assist]                  │
│                        │                                 │
│ 👤 Spelare 2           │ 👤 Spelare 4                    │
│ [Mål] [Assist]         │ [Mål] [Assist]                  │
├────────────────────────┴─────────────────────────────────┤
│ [Ångra senaste händelse]        [Avsluta match tidigt]   │
└──────────────────────────────────────────────────────────┘
```

### **Timer Logic**
1. **Start**: Staff clicks "Starta match" → Timer starts from `match_duration_seconds`
2. **Pause**: Staff clicks pause → Timer stops, `is_paused = true`
3. **Resume**: Staff clicks resume → Timer continues from `time_remaining_seconds`
4. **Client-side countdown**: Timer runs on client, syncs to server every 10 seconds
5. **End conditions**:
   * Timer reaches 0:00 → Auto-complete
   * Staff clicks "Avsluta match" → Manual end
6. **On end**:
   * Compare goals: Higher score wins
   * Award win/loss points from `point_config` to ALL players on winning/losing team
   * Update match status to "completed"
   * Set `winner_team_index`

### **Post-Match Flow**
When match ends, show modal:
1. **Result**: "🎉 Lag 1 vann 2-1!" or "⚖️ Oavgjort 1-1"
2. **Stats summary**: Goals and assists for this match
3. **Actions**:
   * "Nästa match" → Start next pending match
   * "Visa topplista" → Show updated leaderboard
   * "Tillbaka till matcher" → Return to match list
   * "Avsluta dagen" → Complete match day (if all matches done)

### **Event Recording**
When staff clicks Mål/Assist:
1. Create `t_match_events` record with `match_id` and `team_index`
2. Update `t_player_stats` (goals/assists count, points from `point_config`)
3. Update match score in `matches` array (`score_a` or `score_b`)
4. Real-time broadcast to connected clients

### **Undo Logic**
* "Ångra senaste händelse" button
* Deletes last `t_match_events` record for this match
* Reverts `t_player_stats` counters
* Recalculates match score from remaining events

## **5\. UI Components**

| Component | Location | Purpose |
|-----------|----------|---------|
| `MatchList` | Staff match day page | Shows all matches with status and actions |
| `ActiveMatchView` | Staff match day page | Live scoring interface with timer |
| `MatchTimer` | Component | Countdown with pause/resume |
| `TeamScorePanel` | Component | Team players with goal/assist buttons |
| `MatchResultModal` | Modal | Post-match summary and navigation |

# **Implementation Steps**

1. **Database:** Run Schema script.  
2. **Services:**  
   * RegistrationService.ts: Handle validation logic (Age, Membership check).  
   * TournamentService.ts: Handle Scoring & Draft logic.  
3. **UI Components:**  
   * OrgTournamentList: The public widget for /app/fritidsgardar/\[slug\].  
   * RegistrationSettingsForm: The staff config panel.  
   * MatchDayDashboard: The scoring tool.

# **Important Constraints**

* **Language:** Swedish labels (e.g., "Gå med", "Mål", "Tabell").  
* **Validation:** strictly enforce registration rules on the backend (RLS or API endpoint) to prevent unauthorized joins via API calls.
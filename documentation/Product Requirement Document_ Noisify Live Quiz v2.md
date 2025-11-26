# **Product Requirement Document: Noisify Live Quiz**

Date: 2025-11-25

## **1\. Overview**

A real-time, interactive quiz feature (similar to Kahoot\!) designed to increase engagement at youth centers. Staff members create and host quizzes via the Staff Dashboard (/staff), while youths participate via their mobile devices in the App (/app) by entering a unique game PIN.

**Core Value Proposition:**

* **Staff:** Easy tool to organize group activities, educational events, or "fredagsmys" (Friday cozy time). Share resources with other youth centers to save time.  
* **Youth:** Fun, competitive, real-time interaction using their phones.

## **2\. User Roles & Permissions**

| Role | Action | Access Route |
| :---- | :---- | :---- |
| **Staff (Role 2, 3, 4\)** | Create, Edit, Delete Quizzes. Host live sessions. Publish to Community. Clone Public Quizzes. | /staff/quiz |
| **Vikarie (Role 1\)** | Host *existing* quizzes (cannot create/edit). | /staff/quiz |
| **Youth (Member)** | Join via PIN, answer questions, view personal score. | /app/quiz |
| **Guest (Public)** | Join "Open" sessions via PIN (if enabled by Host). | /join (Public URL) |

## **3\. User Stories**

### **Staff**

1. **As a Staff member**, I want to create a quiz with multiple choice questions so that I can prepare for tonight's activity.  
2. **As a Staff member**, I want to share my quiz with the "Community Library" so other youth centers in the municipality can use it.  
3. **As a Staff member**, I want to browse and clone quizzes created by other organizations to save time on preparation.  
4. **As a Staff member**, I want to host an "Open" session where members from other youth centers can join for a joint competition.  
5. **As a Host**, I want to control the flow (Next Question, Show Leaderboard) to manage the pace of the excitement.

### **Youth**

1. **As a Member**, I want to enter a PIN code in the app to join the lobby.  
2. **As a Member**, I want to see 4 big color-coded buttons on my screen to answer quickly.  
3. **As a Member**, I want to be in "Game Mode" without seeing other app notifications or menus so I can focus on winning.  
4. **As a Member**, I want the game to feel "alive" with animations and feedback so it feels like a real game show.

## **4\. Functional Requirements**

### **4.1 Quiz Management (Staff)**

* **Create Quiz:** Title, Description, Cover Image (optional).  
* **Sharing Settings:**  
  * **Private (Default):** Only visible to my organization.  
  * **Public (Community):** Visible to all organizations in the Noisify network. Other staff can "Clone" this quiz.  
* **Manage Questions:**  
  * Question text.  
  * Time limit (default 20s).  
  * 2-4 Answer options.  
  * Mark one option as correct.

### **4.2 Community Library (New)**

* **Browse:** A tab in the dashboard to see quizzes published by other organizations.  
* **Filter:** Search by Title, Category (e.g., Music, Sports, Education), or Organization.  
* **Preview:** See the questions before importing.  
* **Clone:** Copy a public quiz into the local organization's library for editing and hosting.

### **4.3 Game Host Mode (Staff View)**

* **Session Settings:**  
  * **Access Level:**  
    * **Org Only:** Only logged-in members of *my* organization can join.  
    * **Open/Public:** Any user with the PIN (including guests or members of other orgs) can join.  
* **Lobby Screen:** Displays Game PIN, QR Code, and joined players.  
* **Real-time Counter & Results:** Standard game flow controls.

### **4.4 Player Mode (Youth View \- Mobile First)**

* **Immersive Focus Mode:** Full-screen UI, no distractions.  
* **Join Screen:** Numeric Keypad to enter 6-digit PIN.  
* **Game Loop:**  
  * **Question Phase:** 4 Large Buttons (Red/Blue/Yellow/Green).  
  * **Feedback Phase:** "Correct/Incorrect" animations, points, streaks.

## **5\. Visual Experience & Animations**

To ensure the game feels "alive" and energetic:

### **5.1 Host Screen (Projector)**

* **Lobby Entry:** Nicknames "pop" onto the screen with a bounce effect.  
* **Countdown:** Pulsing 3-2-1 countdown.  
* **Timer Bar:** Shrinking progress bar (Green \-\> Red).  
* **Answer Reveal:** Bar chart grows upwards.  
* **Leaderboard:** Rows visually swap places when ranks change.  
* **Podium:** Celebratory confetti reveal for Top 3\.

### **5.2 Player Screen (Mobile)**

* **Button Press:** Haptic feedback and visual ripple.  
* **Correct Answer:** Green flash, checkmark, confetti particles.  
* **Incorrect Answer:** Red flash, subtle screen shake.  
* **Streak Fire:** "Fire" icon ignites after 3 correct answers.  
* **Waiting Pulse:** Breathing animation while waiting for host.

## **6\. Technical Specifications**

### **6.1 Database Schema (Updated)**

Added is\_public for sharing and cloned\_from for lineage.

\-- 1\. Static Quiz Container  
CREATE TABLE quizzes (  
  id UUID DEFAULT gen\_random\_uuid() PRIMARY KEY,  
  org\_id UUID REFERENCES organizations(id),  
  created\_by UUID REFERENCES profiles(id),  
  title TEXT NOT NULL,  
  description TEXT,  
  category TEXT, \-- e.g., 'General', 'Music', 'Education'  
  is\_public BOOLEAN DEFAULT false, \-- If true, appears in Community Library  
  cloned\_from UUID REFERENCES quizzes(id), \-- Tracks original if cloned  
  created\_at TIMESTAMPTZ DEFAULT NOW()  
);

\-- 2\. Static Questions  
CREATE TABLE quiz\_questions (  
  id UUID DEFAULT gen\_random\_uuid() PRIMARY KEY,  
  quiz\_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,  
  question\_text TEXT NOT NULL,  
  time\_limit\_seconds INT DEFAULT 20,  
  order\_index INT NOT NULL,  
  options JSONB NOT NULL,   
  created\_at TIMESTAMPTZ DEFAULT NOW()  
);

\-- 3\. Live Game Session  
CREATE TABLE quiz\_sessions (  
  id UUID DEFAULT gen\_random\_uuid() PRIMARY KEY,  
  quiz\_id UUID REFERENCES quizzes(id),  
  host\_id UUID REFERENCES profiles(id),  
  pin\_code TEXT UNIQUE,  
  status TEXT DEFAULT 'LOBBY',   
  access\_policy TEXT DEFAULT 'ORG\_ONLY', \-- 'ORG\_ONLY' or 'OPEN'  
  current\_question\_index INT DEFAULT \-1,  
  current\_state TEXT DEFAULT 'WAITING\_FOR\_ANSWERS',  
  created\_at TIMESTAMPTZ DEFAULT NOW()  
);

\-- 4\. Participants in a Session  
CREATE TABLE quiz\_participants (  
  id UUID DEFAULT gen\_random\_uuid() PRIMARY KEY,  
  session\_id UUID REFERENCES quiz\_sessions(id) ON DELETE CASCADE,  
  user\_id UUID REFERENCES profiles(id), \-- Nullable for guests in OPEN sessions  
  guest\_name TEXT, \-- Used if user\_id is null  
  nickname TEXT NOT NULL, \-- Display name in game  
  score INT DEFAULT 0,  
  streak INT DEFAULT 0,  
  last\_answer\_at TIMESTAMPTZ  
);

### **6.2 Real-time Logic**

* **Channel:** quiz\_game:{pin\_code}  
* **Events:** player\_joined, game\_state\_update, answer\_submitted, show\_results.  
* **Security:**  
  * If access\_policy is 'ORG\_ONLY', Server Action must verify user.org\_id matches session.org\_id before joining.  
  * If 'OPEN', any authenticated user (or guest if enabled) can join.

## **7\. UI/UX Wireframes**

### **Staff (/staff/quiz)**

* **Tabs:** "My Quizzes" | "Community Library"  
* **Community Library:** Grid of cards showing Title, Author Org, Question Count, and "Clone" button.

### **Staff Host View**

* **Header:** PIN Code.  
* **Settings:** Toggle "Allow Guests/External" (Default: Off).

### **Youth App**

* **Immersive Mode:** Standard.  
* **Join Logic:** If a user enters a PIN for an 'ORG\_ONLY' session they don't belong to \-\> Show error "This quiz is for \[Org Name\] members only."

## **8\. Implementation Steps**

1. **Database:** Migrations for quizzes (add public flag), quiz\_sessions (access policy).  
2. **Staff UI \- Library:** Build the "Community Library" view with filtering.  
3. **Staff UI \- Cloning:** Implement "Clone" server action (copies Quiz \+ Questions to new Org).  
4. **Host Logic:** Implement PIN generation and Session creation with Access Policy.  
5. **Player Logic:** Update joinSession action to respect Access Policy permissions.
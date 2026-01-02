# Product Roadmap: Moment App

**Last Updated:** January 2, 2026

---

## Table of Contents

1. [Current Features](#current-features)
2. [Market Trends (2025)](#market-trends-2025)
3. [Feature Recommendations](#feature-recommendations)
4. [Quick Wins](#quick-wins)
5. [Long-Term Vision](#long-term-vision)

---

## Current Features

### Authentication & User Management

- JWT-based authentication with refresh tokens
- Email and username login support
- Secure password hashing
- Avatar upload and editing
- Account deletion with relationship checks

### Relationship Management

- Invite code-based couple pairing system
- One-to-one relationship model
- Editable relationship start date (anniversary tracking)
- Grace period system (7-day window to resume after ending)
- Resume relationship functionality

### Content & Media

- Post creation with rich text
- Emoji picker integration
- Image upload to Cloudflare R2
- Image cropping and editing tools
- Gallery view with video support
- Attachment management

### UI/UX

- Dark/light theme toggle
- Responsive mobile-first design
- Loading states and error handling
- Custom typography (Plus Jakarta Sans, Nunito, Lora)

---

## Market Trends (2025)

### Top-Performing Couple Apps

- **Paired** - 100k+ daily users ($15/month premium)
- **LoveTrack** - Research-backed with 500+ date ideas
- **Between** - Best for long-distance couples
- **Couply** - Gamified relationship building
- **Gottman Card Decks** - Therapist-backed communication
- **Honeydue** - Financial management for couples

### Most Valued Features by Users

#### 1. Daily Questions & Prompts (Highest Engagement)

- Professionally crafted conversation starters
- Partners answer separately then compare responses
- Transforms everyday chats into deeper connections
- Users discover new insights even after years together
- **Key insight:** "Sparks conversations they never thought possible"

#### 2. Date Planning & Ideas

- AI-powered suggestions based on location, budget, interests
- 500+ pre-planned date nights
- Date night goal setting and reminders
- Both at-home activities and adventure ideas

#### 3. Shared Calendars

- Real-time synchronization across devices
- Color-coded events and task assignment
- Built-in reminders and checklists
- Prevents missed appointments
- Creates complete visibility of partner's schedule

#### 4. Communication Tools

- Themed card decks for conversation starters
- Private messaging spaces
- Relationship quizzes
- Guided exercises from therapists

#### 5. Memory & Journaling

- Digital shared journals
- Photo timelines
- Anniversary/milestone trackers
- Mood and gratitude logs
- Document relationship journey

#### 6. Gamification

- Challenges and activities
- Badge earning and streak tracking
- Revives excitement in long-term relationships
- **Important:** Collaborative, not competitive

#### 7. Financial Management

- Joint budget tracking
- Bill reminders
- Spending visibility
- Shared financial goals

### User Preferences & Red Flags

**What Users Love:**

- Features that promote offline interaction (not just app engagement)
- Privacy and encryption
- AI-powered personalization
- Apps that feel like "a relationship coach in your pocket"
- Features that work for long-distance couples

**What Users Dislike:**

- Apps with bugs and lack of maintenance
- Features designed only for cohabiting couples
- Questions meant only for in-person interaction
- Excessive costs for basic features
- Apps designed to maximize time-on-app vs. real connection

**2025 Trend:**
Apps have matured into tools for **intentional connection** - helping couples sync schedules, deepen communication, and bring playfulness while balancing digital engagement with real-world quality time.

---

## Feature Recommendations

### Priority 1: Daily Questions/Prompts

**Impact:** Highest | **Effort:** Medium | **Timeline:** 1-2 weeks

**Why This Feature:**

- #1 most engaging feature across all top apps
- Natural extension of existing journaling system
- Drives daily engagement and retention
- Creates conversation starters that lead to more journaling

**Implementation Details:**

- New tables:
  - `daily_questions` - question text, category, difficulty
  - `question_responses` - userId, questionId, answer, answeredAt
- UI Components:
  - Question of the day card on home page
  - Separate answer forms for each partner
  - Reveal mechanism after both respond
  - Archive view of past Q&As
- Starter Database:
  - 50-100 professionally crafted questions
  - Categories: Dreams, Memories, Future, Values, Fun, Deep
  - Rotation algorithm to avoid repeats

**Future Enhancements:**

- AI-generated personalized questions based on relationship history
- Question difficulty levels (light, medium, deep)
- Custom question submission
- Therapist-recommended question packs

---

### Priority 2: Shared Calendar with Date Planning

**Impact:** High | **Effort:** Medium-High | **Timeline:** 2-3 weeks

**Why This Feature:**

- Second most valued feature by users
- High practical value for daily life
- Complements journaling (plan dates, then journal about them)
- Encourages intentional quality time

**Implementation Details:**

- New tables:
  - `events` - title, description, date, time, type, createdBy, relationshipId
  - `date_ideas` - category, activity, cost level, location type
- Features:
  - Shared calendar view (month/week/day)
  - Event creation with reminders
  - Color-coding by type (date night, reminder, milestone, anniversary)
  - Date ideas database or API integration
  - Date night goal setting (e.g., "1 date per week")
- UI Components:
  - Calendar grid component
  - Event detail modal
  - Date ideas carousel/list
  - Notification system for upcoming events

**Future Enhancements:**

- Recurring events
- Integration with Google Calendar / iCal
- AI-powered date suggestions based on preferences
- Date night budget tracking
- Weather integration for outdoor dates

---

### Priority 3: Memory Timeline & Milestones

**Impact:** High | **Effort:** Low-Medium | **Timeline:** 1 week

**Why This Feature:**

- Leverages existing post system
- Low effort, high emotional value
- You already have `startDate` for anniversary tracking
- Elevates special moments from regular posts

**Implementation Details:**

- Database Changes:
  - Add `isMemory` boolean to posts table
  - New `milestones` table - type, title, date, description, relationshipId
- Features:
  - Mark posts as "memories" (toggle on post creation/edit)
  - Milestone types: First Date, First Kiss, Engagement, Marriage, Trips, etc.
  - Timeline view with filter for memories only
  - Anniversary countdown widget (using existing startDate)
  - Photo highlights from memories
- UI Components:
  - Memory toggle in post creation form
  - Timeline visualization
  - Milestone creation modal
  - Anniversary countdown card

**Future Enhancements:**

- Automatic milestone suggestions based on dates
- Memory book export (PDF)
- "On This Day" feature (memories from past years)
- Photo collages for milestones

---

### Priority 4: Mood & Gratitude Logs

**Impact:** Medium-High | **Effort:** Low-Medium | **Timeline:** 1 week

**Why This Feature:**

- Simple but powerful for relationship awareness
- Complements journaling naturally
- Helps partners understand each other's emotional state
- Backed by relationship research

**Implementation Details:**

- New tables:
  - `mood_logs` - userId, moodType, note, timestamp, relationshipId
  - `gratitude_entries` - userId, content, timestamp, relationshipId
- Features:
  - Daily mood check-in (5 moods: Great, Good, Okay, Down, Stressed)
  - Optional note with mood
  - Partner mood visibility
  - Gratitude journal (separate or as post type)
  - Weekly/monthly mood trends visualization
- UI Components:
  - Mood selector (emoji-based)
  - Mood history timeline
  - Gratitude entry form
  - Mood patterns chart

**Future Enhancements:**

- Mood correlation insights
- Gratitude sharing between partners
- Export gratitude journal
- Mood-based conversation prompts

---

### Priority 5: Streaks & Light Gamification

**Impact:** Medium | **Effort:** Low | **Timeline:** 3-5 days

**Why This Feature:**

- Encourages consistent engagement
- Fun without being gimmicky
- Proven to work in top apps (Couply, Paired)
- Important: Collaborative, not competitive

**Implementation Details:**

- New table:
  - `streaks` - type, currentCount, longestCount, lastActivityDate, relationshipId
- Streak Types:
  - Daily posts (either partner posting counts)
  - Question responses (both must answer)
  - Memory creation
  - Gratitude logging
- Features:
  - Streak counter display
  - Simple badge system for milestones
  - Achievement notifications
  - Streak recovery grace (1 day)
- Badges:
  - 7-day streak, 30-day streak, 100-day streak
  - 10 posts, 50 posts, 100 posts
  - 10 memories, 50 memories
  - First anniversary, 5 years together

**Future Enhancements:**

- Streak challenges (30-day gratitude challenge)
- Badge showcase on profile
- Celebratory animations for milestones
- Custom badges for personal milestones

---

## Quick Wins

These are low-effort features that can be implemented quickly with high perceived value:

### 1. Anniversary Countdown Widget

**Effort:** 1-2 hours | **Value:** High emotional impact

You already have `startDate` in relationships table. Simply display:

- Days together counter
- Next anniversary countdown
- Milestone years (6 months, 1 year, 5 years, etc.)

**Implementation:**

- Create countdown component on home page
- Calculate days from startDate
- Add celebratory styling for milestone days

---

### 2. Partner Activity Indicator

**Effort:** 2-3 hours | **Value:** Connection feeling

Show recent partner activity:

- "Partner posted 2 hours ago"
- "Partner answered today's question"
- "Partner added a new memory"

**Implementation:**

- Query latest activity by partner
- Display on home page with timestamp
- Update in real-time or on page refresh

---

### 3. Post Reactions

**Effort:** 3-4 hours | **Value:** Emotional engagement

Simple emoji reactions to partner's posts:

- Heart, Laugh, Cry, Wow, Support emojis
- Multiple reactions allowed
- Display count and who reacted

**Implementation:**

- New `post_reactions` table
- Reaction picker on posts
- Display reactions under each post

---

### 4. Notification System

**Effort:** 1-2 days | **Value:** Engagement & retention

Basic push/email notifications for:

- Partner posted
- Partner answered daily question
- Upcoming anniversary
- Resume relationship request
- Streak about to break

**Implementation:**

- New `notifications` table
- Email service integration (Resend, SendGrid)
- In-app notification center
- User preference toggles

---

## Long-Term Vision

### Advanced Features (3-6 months)

#### AI-Powered Relationship Insights

- Analyze post sentiment over time
- Identify communication patterns
- Suggest conversation topics based on history
- Personalized date ideas using preferences

#### Communication Tools

- Conflict resolution exercises
- Love languages assessment and tracking
- Conversation card decks (Gottman-style)
- Guided relationship check-ins

#### Financial Management

- Shared expense tracking
- Budget planning for dates
- Saving goals for trips/experiences
- Bill splitting and reminders

#### Long-Distance Support

- Timezone display for partner
- Virtual date ideas
- Countdown to next meetup
- Sync watch party features

#### Premium Features

- Unlimited photo storage
- Advanced analytics and insights
- Therapist-curated content
- Export all data (memory book PDF)
- Custom themes and branding

---

## Implementation Strategy

### Phase 1 (Month 1): Core Engagement

1. Daily Questions/Prompts
2. Memory Timeline & Milestones
3. Quick Wins (countdown, reactions, activity indicator)

**Goal:** Drive daily engagement and emotional connection

---

### Phase 2 (Month 2): Planning & Tracking

1. Shared Calendar with Date Planning
2. Mood & Gratitude Logs
3. Notification System

**Goal:** Add practical value for daily life management

---

### Phase 3 (Month 3): Retention & Delight

1. Streaks & Gamification
2. Advanced Memory Features
3. Communication Tools (basic)

**Goal:** Increase retention and add playful elements

---

### Phase 4 (Months 4-6): Scaling & Premium

1. AI-Powered Insights
2. Financial Management
3. Premium tier features
4. Mobile app (React Native)

**Goal:** Monetization and broader feature set

---

## Success Metrics

### Engagement Metrics

- Daily Active Users (DAU)
- Weekly Active Users (WAU)
- Average session duration
- Posts created per day
- Question response rate
- Return rate after 7, 30, 90 days

### Relationship Health Metrics

- Average streak length
- Memories created per couple
- Calendar events created
- Mood log completion rate
- Average sentiment of posts

### Business Metrics

- User acquisition rate
- Retention rate (cohort analysis)
- Churn rate
- Premium conversion rate (future)
- Lifetime value (LTV)

---

## Research Sources

- [9 Best Couples Apps Every Relationship Needs (2025)](https://lovetrackapp.com/articles/relationship-apps/)
- [10 apps for couples to use in 2025](https://www.nimblechapps.com/blog/10-apps-for-couples-to-use-in-2025)
- [10 Top Relationship Apps for Couples 2025](https://www.onedateidea.com/lifestyle/relationship-apps-for-couples/)
- [Top Apps for Couples to Strengthen Your Relationship in 2025](https://www.cisin.com/coffee-break/apps-for-couples-in-2023-to-improve-relationship.html)
- [The 15 Best Apps for Couples in 2025](https://www.marriage.com/advice/relationship/apps-for-couples/)
- [Best Shared Calendar App for Couples](https://upbase.io/blog/best-shared-calendar-app-for-couples/)
- [Managing Life Together: Calendar Apps for Couples in 2025](https://www.sunsama.com/blog/managing-life-together-the-best-calendar-apps-for-couples-in-2025)

---

## Next Steps

**Immediate Action:** Review this roadmap and decide on first feature to implement.

**Recommendation:** Start with Daily Questions/Prompts feature for highest engagement impact.

**Question to consider:** Should we build for web-only first, or plan for mobile app from the start?

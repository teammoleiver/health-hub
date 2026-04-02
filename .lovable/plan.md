## Phase 1: Frontend Foundation (this response)

### 1. Design System Setup
- Custom colors: primary #1D9E75, dark #0F6E56, warning #BA7517, danger #A32D2D
- Dark/light mode support
- Custom fonts, spacing, animations
- Fast-day purple/indigo accent

### 2. Assets
- Copy user photos (profile, journey, logos) to src/assets
- Generate hero/banner images if needed

### 3. Core Layout
- Mobile bottom navigation: Dashboard | Nutrition | Exercise | Health | Assistant
- Desktop collapsible dark sidebar
- Responsive layout wrapper

### 4. Dashboard Page
- Health score widget (0-100)
- Critical ALT alert banner
- IF 16:8 live fasting widget with countdown
- Today at a glance (water, meals, exercise, weight)
- Trend comparison Feb vs Mar
- Quick action buttons
- Motivational message

### 5. Health Records Page
- Two pre-loaded blood tests (Feb 4 & Mar 27)
- Timeline view with all markers
- Per-marker trend charts (Recharts)
- Delta/change indicators
- Auto-alerts for worsening markers

### 6. Fasting Module
- 16:8 tracker with live countdown & progress ring
- 5:2 planner (disabled by default, toggleable)
- Combined protocol benefits display
- Weekly calendar view

### 7. Other Module Pages (shells)
- Nutrition, Exercise, Body Metrics, AI Assistant, Goals, Settings

### Phase 2 (after Supabase connected):
- Database schema creation
- Auth setup
- Data persistence
- File uploads
- AI integration via edge functions

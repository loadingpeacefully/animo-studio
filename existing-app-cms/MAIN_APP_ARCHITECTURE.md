# Learning Dashboard - Main App Architecture

## Table of Contents

- [Introduction](#introduction)
- [Technology Stack](#technology-stack)
- [Architecture Overview](#architecture-overview)
- [Core Modules](#core-modules)
- [State Management](#state-management)
- [Data Flow](#data-flow)
- [Component Architecture](#component-architecture)
- [Key Features](#key-features)
- [Real-time Communication](#real-time-communication)
- [Services Layer](#services-layer)
- [Routing Structure](#routing-structure)

## Introduction

The Learning Dashboard is a comprehensive student-facing application that provides an interactive learning experience for BrightChamps students. It features gamified learning modules, real-time video classrooms, progress tracking, rewards, assessments, and collaborative learning tools.

## Technology Stack

### Core Technologies

- **React 18.2.0** - UI framework
- **TypeScript 4.9.5** - Type-safe development
- **React Router DOM 6.11.2** - Client-side routing
- **Redux Toolkit 1.9.5** - State management
- **Vite 5.2.13** - Build tool and dev server
- **Sass** - CSS preprocessing

### Key Libraries

#### Video & Communication

- **100ms SDK** (@100mslive/react-sdk) - Real-time video classrooms
- **100ms UI** (@100mslive/react-ui) - Pre-built video UI components
- **100ms Virtual Background** - Video effects

#### Interactive Features

- **Framer Motion** - Animations and transitions
- **React Flow** - Interactive diagrams and flowcharts
- **React Lottie Player** - Animated illustrations
- **Three.js** - 3D visualizations
- **Spine Player** - Character animations

#### Educational Tools

- **Monaco Editor** - Code editing in browser
- **React MathQuill** - Math equation editing
- **React PDF Renderer** - Certificate generation
- **DnD Kit** - Drag-and-drop interactions

#### Analytics & Monitoring

- **Elastic APM** - Application performance monitoring
- **Segment Analytics** - User behavior tracking

## Architecture Overview

The application follows a layered architecture pattern:

```
┌────────────────────────────────────────────────────┐
│               Presentation Layer                    │
│   (Pages, Organisms, Molecules, Atoms)              │
└────────────────────────────────────────────────────┘
                         ↓
┌────────────────────────────────────────────────────┐
│              Application Layer                      │
│   (Contexts, Error Boundaries, Routing)             │
└────────────────────────────────────────────────────┘
                         ↓
┌────────────────────────────────────────────────────┐
│              State Management Layer                 │
│   (Redux Store, Slices, Selectors)                  │
└────────────────────────────────────────────────────┘
                         ↓
┌────────────────────────────────────────────────────┐
│                Service Layer                        │
│   (API Services, HMS, Analytics)                    │
└────────────────────────────────────────────────────┘
                         ↓
┌────────────────────────────────────────────────────┐
│                External Services                    │
│   (Backend APIs, 100ms, ImageKit, Segment)          │
└────────────────────────────────────────────────────┘
```

## Core Modules

### 1. **Home Module** (`src/components/pages/Home/`)

Dashboard and learning path overview:

- Learning path cards
- Progress visualization
- Quick access to modules
- Achievement badges
- Upcoming classes

### 2. **Module System** (`src/components/pages/Module/`)

Interactive learning modules:

- Task-based learning flow
- Progress tracking
- Multi-template task rendering
- Code execution environment
- Interactive activities

**Supported Task Templates**:

- Multiple Choice Questions
- Fill in the Blanks
- Drag and Drop
- Code Editor
- Scratch Programming
- Simulators (3D assembly)
- Card Flip Games
- Crossword Puzzles
- Conversations with Characters
- Subjective Questions
- Grid Selection
- Range Sliders
- And 20+ more...

### 3. **Test & Assessment** (`src/components/pages/Test/`)

Testing and evaluation system:

- Timed assessments
- Question navigation
- Auto-save functionality
- Result reporting
- PDF certificate generation

### 4. **Rewards System** (`src/components/pages/Rewards/`)

Gamification and motivation:

- Coins and points system
- Achievement badges
- Leaderboards
- Milestone celebrations
- Reward redemption

### 5. **Quiz Galaxy** (`src/components/pages/QuizGalaxy/`)

Competitive quiz platform:

- Real-time multiplayer quizzes
- Question battles
- Scoring system
- Leaderboards

### 6. **Live Classroom** (`src/components/100ms/`)

Video conferencing integration:

- Real-time video/audio
- Screen sharing
- Chat functionality
- Whiteboard
- Virtual backgrounds
- Participant management
- Recording capabilities

### 7. **Worksheets** (`src/components/pages/WorkSheet/`)

Printable and digital worksheets:

- Interactive worksheets
- Progress tracking
- Submission system
- Teacher feedback

### 8. **Simulator** (`src/components/pages/Simulator/`)

3D interactive simulations:

- Assembly simulations
- Code integration
- Step-by-step guidance
- Part previews with Three.js
- Real-time feedback

## Data Models & Interfaces

### Core Models (`src/models/`)

#### User Model (`user.ts`)

```typescript
interface UserResponse {
  userId: string;
  studentName: string;
  parentName: string;
  studentId: string | number;
  onboarded: boolean;
  grade?: number;
  gender?: string;
  countryId?: string | number | null;
  classType: StudentClassType; // "demo" | "paid" | "diy" | "online-group"
  attendance: StudentAttendanceType; // "present" | "absent" | "delayed"
  courses: CourseInfo[];
}
```

#### Learning Module Model (`module.ts`)

```typescript
interface LearningModule {
  id: string | number;
  context: LearningModuleContext;
  bookmarkTaskId: string | number | null;
  tasks: Task[];
  submissions?: TaskSubmission;
  badges: ModuleBadge[];
  homeActivityBadges: HomeActivityBadge[];
  lastScreen?: LearningLastScreen;
  finIq?: FinIQData;
  moduleConfig?: ModuleConfig;
  evaluationReport?: Task[];
  startScreen?: ModuleStartScreen;
}
```

#### Task Model (`task.ts`)

Comprehensive task interface with 1100+ lines supporting:

- **50+ Task Types**: MCQ, subjective, drag-drop, crossword, etc.
- **Rich Content**: Text, images, audio, video, animations
- **Interactive Elements**: Buttons, overlays, prompts, feedback
- **Assessment Features**: Scoring, time limits, validation
- **Media Assets**: Background audio, sound effects
- **Navigation**: Next/prev buttons, skip logic, conditional flows

#### Content Structure

```typescript
interface Content {
  type: ContentType; // "text" | "image" | "audio" | "video" | "animation"
  value: string | RichText;
  style?: any;
  contentStyle?: any;
  additionalProps?: any;
}
```

#### Task Submission

```typescript
interface TaskSubmission {
  attemptId: string;
  records: TaskRecord[];
  attemptDetails?: {
    classId?: number | string;
    groupId?: number | string;
    learningPathStepId?: number | string;
  };
}
```

## State Management

### Redux Store Structure

The application uses Redux Toolkit with the following slices:

#### 1. **App Slice** (`redux/slices/appSlice.ts`)

Global application state:

- Loading states
- Modal states
- UI preferences
- Error handling
- Query link expiration
- Teacher popup state
- Attendance popup state

#### 2. **User Slice** (`redux/slices/userSlice.ts`)

User information and authentication:

- User profile data
- Student details
- Teacher information
- Authentication tokens
- Role and permissions
- CMS user details

#### 3. **Module Slice** (`redux/slices/moduleSlice.ts`)

Learning module state:

```typescript
interface ModuleState {
  module: LearningModule | null;
  progressionStep: ModuleStep | null;
  moduleSubmissions: LearningModuleSubmissions | null;
  moduleSubmissionsTracker: LearningModuleSubmissions | null;
  threshold: LearningThreshold | null;
  badgeCount: number;
  badges?: { [key: string]: { count: number; tasks?: TaskInfo[] } };
  isTaskSoundMuted?: boolean;
  isModuleCompleted?: boolean;
  studentLikes: UserModuleLike[];
  usersModuleSummary: UsersModuleSummary[];
  isModuleStarted?: boolean;
  attemptDetails: TaskAttemptDetail;
  currentTagsValues: { [key: string]: number };
}
```

**Key Actions**:

- `setModule` - Load module data
- `setModuleSubmissions` - Store task answers
- `incrementBadgeCount` - Award badges
- `setLearningThreshold` - Rate limiting
- `setModuleCompleted` - Mark completion

#### 4. **Task Slice** (`redux/slices/taskSlice.ts`)

Individual task state:

- Current task data
- Task answers
- Validation state
- Submission status
- Task history

#### 5. **Module Chat Slice** (`redux/slices/moduleChatSlice.ts`)

Chat and messaging:

- Chat messages
- Teacher messages
- AI tutor responses
- Unread counts

#### 6. **Worksheet Slice** (`redux/slices/worksheetSlice.ts`)

Worksheet management:

- Current worksheet
- Attempt data
- Submission state
- Evaluation status

## Data Flow

### Learning Module Flow

```
User Login → Fetch User Data → Load Learning Paths →
Select Module → Load Tasks → Render Task →
User Interaction → Validate Answer → Save Progress →
Next Task or Module Complete
```

### Live Class Flow

```
Join Class URL → Authenticate → Get HMS Token →
Connect to Room → Enable Audio/Video →
Real-time Streaming → Chat/Screen Share →
End Class → Save Session Data
```

### Assessment Flow

```
Start Test → Load Questions → Answer Questions →
Auto-save Progress → Submit Test → Generate Report →
Display Results → Generate Certificate (if passed)
```

## Component Architecture

The application follows Atomic Design principles:

### **Atoms** (`src/components/atoms/`)

Basic building blocks:

- Buttons
- Input fields
- Images
- Icons
- Loading spinners
- Labels

### **Molecules** (`src/components/molecules/`)

Combination of atoms (50+ components):

- ProfileCard
- Timer
- Checkbox
- Slider
- Progress bars
- Menu items
- Tooltips
- Crossword
- Speech bubbles
- Attendance popup
- Teacher popup

### **Organisms** (`src/components/organisms/`)

Complex UI sections (60+ components):

- NavBar - Side navigation
- Header - Top navigation and controls
- ChatBot - AI tutor integration
- VideoPlayer - Media playback
- CodeEditor - Programming tasks
- Whiteboard - Drawing and collaboration
- Leaderboard - Competition rankings

### **Pages** (`src/components/pages/`)

Complete page views:

- Home
- Module
- Test
- Rewards
- QuizGalaxy
- WorkSheet
- OnBoarding
- Simulator
- EvaluationReport

## Key Features

### 1. **Interactive Learning**

- Multi-template task system
- Real-time validation
- Immediate feedback
- Progress tracking
- Adaptive learning paths

### 2. **Gamification**

- Coins and rewards system
- Achievement badges
- Leaderboards
- Milestone celebrations
- Progress visualization

### 3. **Live Classes**

- HD video/audio streaming
- Screen sharing
- Interactive whiteboard
- Real-time chat
- Participant management
- Recording and playback

### 4. **Code Learning**

- Monaco code editor integration
- Syntax highlighting
- Code execution
- Error feedback
- Scratch programming
- Simulator integration

### 5. **Character Interactions**

- Animated characters using Spine
- Conversational learning
- Story-based modules
- Engaging narratives

### 6. **Progress Tracking**

- Module completion tracking
- Task-level analytics
- Time spent analytics
- Performance reports
- Certificates

### 7. **Multi-language Support**

- Language-specific content
- Localized UI (via language ID parameter)

### 8. **Responsive Design**

- Mobile support
- Tablet optimization
- Landscape mode enforcement for tablets
- Touch-friendly interactions

## Real-time Communication

### 100ms Integration

The app uses 100ms for real-time video communication:

**Features**:

- Multi-party video conferencing
- Screen sharing
- Audio/video controls
- Virtual backgrounds
- Chat messaging
- Participant management
- Role-based permissions (teacher/student)

**Architecture**:

```
App Component → Get HMS Token → Initialize HMS Actions →
Join Room → Subscribe to Streams → Render Video Tiles →
Handle Events → Leave Room
```

### Chat System

Real-time messaging via:

- In-module chat (teacher-student)
- Video class chat
- AI tutor chat
- Support chat

## Services Layer

### Core Services (`src/services/`)

#### 1. **Learning Service** (`learningService.ts`)

- Fetch learning paths
- Get module data
- Submit task answers
- Track progress
- Get certificates

#### 2. **User Service** (`userService.ts`)

- User authentication
- Profile management
- User preferences
- Session management

#### 3. **Chat Service** (`chatService.ts`)

- Send messages
- Receive messages
- Chat history
- AI tutor integration

#### 4. **HMS Service** (`hmsService.ts`)

- Get video tokens
- Room management
- Recording controls

#### 5. **Analytics Service** (`analyticsService.ts`)

- Track user events
- Page views
- Task completions
- Error tracking
- Performance metrics

#### 6. **Booking Service** (`bookingService.ts`)

- Class scheduling
- Attendance tracking
- Demo bookings

#### 7. **Worksheet Service** (`worksheetService.ts`)

- Fetch worksheets
- Submit attempts
- Get evaluations

#### 8. **Progression Service** (`progressionService.ts`)

- Track learning progress
- Module completion
- Path progression

#### 9. **Platform Service** (`platformService.ts`)

- Platform configurations
- Feature flags
- System settings

#### 10. **Nano Skill Service** (`nanoSkillService.ts`)

- Micro-learning modules
- Quick skill assessments

## Routing Structure

```
/                                    → Home (Dashboard)
/module/:id                          → Learning Module
/quiz/:id                            → Quiz War Module
/home-activity/:id                   → Home Activity Module
/test/:projectId                     → Assessment/Test
/rewards                             → Rewards & Achievements
/quiz-activity                       → Quiz Galaxy
/typeform/:formId                    → External Typeform
/worksheet/:worksheetAttemptId       → Worksheet
/cms/*                               → CMS (Content Management)
```

## Context Providers

### 1. **AppContext** (`contexts/AppContext.tsx`)

Global app state:

- Background images
- Profile card state
- Global UI state

### 2. **UserContext** (`contexts/UserContext.tsx`)

User information available throughout the app:

- User profile
- Authentication status
- Role and permissions

### 3. **HeaderContext** (`contexts/HeaderContext.tsx`)

Dynamic header management:

- Header type
- Header data
- Current route
- Header actions

### 4. **TeacherContext** (`contexts/TeacherContext.tsx`)

Teacher-specific context:

- Teacher mode
- Teaching tools
- Class management

### 5. **ChatContext** (`contexts/ChatContext.tsx`)

Chat state management:

- Active chats
- Message history
- Unread counts

## Performance Optimizations

### Code Splitting

- Lazy loading of routes
- Dynamic imports for heavy components
- Chunk optimization

### Asset Optimization

- ImageKit CDN for images
- Lazy loading of media
- Responsive image loading
- Audio preloading

### Rendering Optimization

- React.memo for expensive components
- useMemo and useCallback hooks
- Virtual scrolling (react-window)
- Intersection Observer for lazy rendering

### State Optimization

- Redux selectors with reselect
- Normalized state shape
- Minimal re-renders

## Error Handling

### Error Boundary

Component-level error catching:

- Graceful error display
- Error reporting to APM
- User-friendly error messages
- Recovery options

### API Error Handling

- Retry logic
- Timeout handling
- Network error detection
- Fallback mechanisms

## Analytics & Monitoring

### Elastic APM

- Performance monitoring
- Error tracking
- Transaction tracing
- User journey tracking

### Segment Analytics

- User behavior tracking
- Event tracking
- Funnel analysis
- Conversion tracking

### Tracked Events

- Page views
- Task completions
- Module completions
- Assessment submissions
- Video class attendance
- Reward redemptions

## Authentication & Session Management

### Authentication Flow

1. URL parameters with encrypted context
2. Decrypt user credentials
3. Fetch user data from backend
4. Store in SessionStorage and Redux
5. Generate HMS token if classroom session
6. Set up analytics tracking

### Session Persistence

- SessionStorage for current session
- LocalStorage for teacher training mode
- Auto-refresh on page reload
- Query parameter preservation

## Security Considerations

- XSS protection with DOMPurify
- Content Security Policy
- Secure token management
- Input validation
- Role-based access control
- Encrypted URL parameters
- Query link expiration (time-based)

## Multi-platform Support

### Desktop

- Full feature set
- Keyboard shortcuts
- Hover interactions

### Tablet

- Landscape mode enforcement
- Touch-optimized controls
- Orientation detection

### Mobile

- Responsive layouts
- Touch gestures
- Simplified navigation
- Mobile-specific breakpoints (max-width: 768px)

## Integration Points

### External Services

- **100ms** - Video communication
- **ImageKit** - CDN and media optimization
- **Segment** - Analytics
- **Elastic APM** - Monitoring
- **Typeform** - Surveys and feedback

### Backend APIs

- Learning Management System
- User Management Service
- Analytics Service
- Booking Service
- Content Delivery Service

## API Services Layer

### Learning Service (`services/learningService.ts`)

#### Module Operations

```typescript
getModule({
  user,
  moduleId,
  reattempt,
  enableLocalFetch,
  moduleStatus,
  learningPathId,
  learningPathVersionId
}): Promise<LearningModule>
```

#### Assessment Operations

```typescript
getTest({ user, testId, projectId }): Promise<FinIqForm>
submitFinIqTest(projectId, contentId, answers, time): Promise<void>
```

#### Task Submission

```typescript
submitTaskAnswers({
  userId,
  moduleId,
  taskId,
  answers,
  responseTime,
  attemptDetails
}): Promise<ApiResponse>
```

#### Progress Tracking

```typescript
getLearningPath(userId, courseId, grade): Promise<LearningPathSteps>
updateModuleProgress(userId, moduleId, progress): Promise<void>
getUserModuleLikes(userId, moduleId): Promise<UserModuleLike[]>
incrementModuleLikes(userId, moduleId, taskId): Promise<void>
```

#### Certificate Generation

```typescript
generateCertificate(userId, moduleId): Promise<CertificateData>
```

### User Service (`services/userService.ts`)

```typescript
getUser({
  studentId,
  courseId,
  grade,
  studentName,
  teacherName,
  userName,
  role,
  countryId,
  bookingId,
  classType,
  userId,
  learningUserId,
  groupClassId
}): Promise<{ user, details, allUsers }>

updateUserProfile(userId, updates): Promise<User>
markOnboardingComplete(userId): Promise<void>
```

### HMS Service (`services/hmsService.ts`)

100ms video classroom integration:

```typescript
getToken(userId, roomId, role): Promise<string>
```

### Analytics Service (`services/analyticsService.ts`)

Segment and Elastic APM integration:

```typescript
trackEvent(eventName, properties): void
trackPageView(pageName, properties): void
trackModuleCompletion(moduleId, score, time): void
trackTaskInteraction(taskId, action, value): void
```

### Chat Service (`services/chatService.ts`)

```typescript
sendMessage(userId, moduleId, message): Promise<void>
getMessages(userId, moduleId): Promise<Message[]>
sendTeacherMessage(teacherId, studentId, message): Promise<void>
```

### Booking Service (`services/bookingService.ts`)

```typescript
getBookingDetails(bookingId): Promise<BookingInfo>
markAttendance(bookingId, attendance): Promise<void>
scheduleDemo(studentInfo, preferences): Promise<void>
```

### Worksheet Service (`services/worksheetService.ts`)

```typescript
getWorksheet(attemptId): Promise<Worksheet>
submitWorksheet(attemptId, answers): Promise<void>
getWorksheetEvaluation(attemptId): Promise<Evaluation>
```

## Build & Development

### Development Commands

```bash
npm start              # Dev server with HMR (port 3000)
npm run build          # Production build with TypeScript check
npm test               # Run Vitest tests
npm run preview        # Preview production build
npm run eject          # Eject from Vite (one-way)
```

### Environment Configuration

#### Production

```bash
VITE_ENV=production
VITE_CDN_ENABLED=true
VITE_CDN_ENDPOINT=https://ik.imagekit.io/brightchamps/adhyayan2
VITE_CLOUDFRONT_ENDPOINT=https://d25vilx9hlfpwt.cloudfront.net
VITE_SEGMENT_WRITE_KEY=cyq7PbUMXVgsh9xSdHrsiCamzeQCVPMs
VITE_ELASTIC_APM_SERVICE_NAME=learning-dashboard-fe
VITE_ELASTIC_APM_SERVER_URL=https://elasticapm.brightchamps.com
VITE_UNIFIED_SEGMENT_WRITE_KEY=8TOsT6jIPaf7bohvCGLJUCx1CVpN4mIC
```

#### Staging

```bash
VITE_ENV=staging
VITE_ELASTIC_APM_SERVICE_NAME=learning-dashboard-fe-stage
VITE_ELASTIC_APM_SERVER_URL=https://elasticapm-stage.brightchamps.com
# Other variables same as production
```

### Build Configuration (`vite.config.mts`)

```typescript
{
  base: "/",
  plugins: [
    react(),           // React support with Fast Refresh
    viteTsconfigPaths(), // Path aliases from tsconfig
    svgr()            // Import SVG as React components
  ],
  server: {
    open: true,        // Auto-open browser
    port: 3000
  },
  define: {
    global: "globalThis" // Polyfill for libraries
  },
  build: {
    sourcemap: true    // Generate source maps
  }
}
```

### TypeScript Configuration

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "lib": ["dom", "dom.iterable", "esnext"],
    "jsx": "react-jsx",
    "module": "esnext",
    "moduleResolution": "node",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true
  }
}
```

## CI/CD Pipeline

### Continuous Integration

**Trigger**: Pull requests to master/develop/release branches

1. **AI Code Review** (Conditional)

   - Runs if `ENABLE_AI_PR_REVIEW=1`
   - Uses OpenAI/AWS Bedrock/Claude
   - Checks React best practices
   - Validates hooks usage
   - Identifies performance issues
   - Ensures proper component structure

2. **Build & Test**

   - Install dependencies (`npm install`)
   - Run tests (`npm test`)
   - Build application (`npm run build`)
   - Generate artifacts

3. **Security Scan**
   - Git secrets scan
   - Detect hardcoded credentials
   - Check for sensitive data

### Continuous Deployment

#### Staging Pipeline (develop branch)

```
Commit to develop → Build → Test → Security Scan →
Manual Approval → Deploy to S3 Staging →
CloudFront Distribution
```

#### Production Pipeline (master branch)

```
Commit to master → Build → Test → Security Scan →
Manual Approval → Deploy to S3 Production →
CloudFront Distribution
```

### Deployment Architecture

```
Developer Push → Bitbucket →
Node 20 Build Container →
AWS S3 Bucket →
CloudFront CDN (Global) →
End Users (Low Latency)
```

## Task Template System

### Template Rendering Flow

```
Module Load → Parse Tasks Array →
Map Task by Template Type →
Render Appropriate Component →
Handle User Interaction →
Validate Answer →
Store Submission →
Trigger Next Task
```

### Template Categories (40+ Types)

#### Assessment Templates

- **MCQ**: Single/multi-select with feedback
- **Subjective**: Text input with validation
- **Fill Blanks**: Sentence completion with dropdowns/input
- **Drag & Drop**: Match items to categories
- **Table**: Grid-based questions
- **Crossword**: Interactive crossword puzzles
- **Hotspot**: Click areas on images
- **Labelling**: Place labels on diagrams

#### Interactive Templates

- **Card Flip**: Flip to reveal content
- **Card Flip Game**: Memory matching
- **Spin Wheel**: Wheel of fortune
- **Scratch Card**: Scratch to reveal
- **Guess Word**: Word puzzle game
- **Find Letter**: Search and find
- **Jumble Puzzle**: Rearrange puzzle pieces

#### Content Templates

- **Read-Only**: Display content with media
- **Conversation**: Character dialogues
- **Introduction**: Module start screens
- **Summary**: Module end screens
- **Medal**: Achievement screens

#### Specialized Templates

- **Code Editor**: Monaco-based coding
- **Simulator**: 3D assembly tasks
- **Scratch**: Block-based programming
- **Flow Chart**: Interactive diagrams
- **Typeform**: Embedded surveys
- **Quiz**: Timed assessment format

### Template Properties

#### Common Properties

- `id`, `moduleId`, `rank`, `title`
- `template` - Template type identifier
- `active` - Enable/disable task
- `assets` - Media files
- `audio`, `backgroundAudio` - Sound
- `nextButton`, `prevButton` - Navigation
- `solution` - Solution content
- `templateOptions` - Global settings

#### Template-Specific Properties

Each template has unique properties:

- MCQ: `question`, `options`, `multiSelect`
- Drag-Drop: `categories`, `flow`, `validation`
- Conversation: `characters`, `dialogues`, `autoPlay`
- Code: `language`, `initialCode`, `testCases`

## Performance Optimizations

### Code Splitting

```typescript
// Lazy loading major routes
const Home = React.lazy(() => import("./components/pages/Home/Home"));
const Module = React.lazy(() => import("./components/pages/Module/Module"));
const Test = React.lazy(() => import("./components/pages/Test/LearningTest"));
const Cms = React.lazy(() => import("./cms/Cms"));
```

### Asset Optimization

- **ImageKit CDN**: Automatic image optimization
- **Lazy Loading**: Images load on viewport entry
- **Audio Preloading**: Critical sounds preloaded
- **Video Streaming**: HLS/DASH adaptive streaming

### Rendering Optimization

- **React.memo**: Expensive components memoized
- **useMemo/useCallback**: Prevent unnecessary re-renders
- **Virtual Scrolling**: Large lists use react-window
- **Intersection Observer**: Lazy render off-screen content

### State Optimization

- **Normalized State**: Flat Redux state structure
- **Selector Memoization**: Reselect for derived data
- **Batched Updates**: Multiple state updates batched

### Bundle Optimization

- **Tree Shaking**: Unused code eliminated
- **Chunk Splitting**: Vendors/common chunks separated
- **Source Maps**: Debug in production

## Testing Strategy

### Unit Testing (Vitest)

```typescript
// Component tests
describe("TaskMcq", () => {
  it("renders options correctly", () => {
    // Test implementation
  });
});

// Redux tests
describe("moduleSlice", () => {
  it("sets module data", () => {
    // Test implementation
  });
});
```

### Integration Testing

- User flows (login → module → task completion)
- API mocking with MSW
- Context provider testing

### End-to-End Testing

- Critical user journeys
- Cross-browser testing
- Mobile device testing

## Monitoring & Analytics

### Elastic APM

- **Transaction Monitoring**: Page load times
- **Error Tracking**: JavaScript errors
- **Custom Metrics**: Task completion time
- **User Journey**: Navigation tracking

### Segment Analytics

- **Event Tracking**:
  - Module start/completion
  - Task interactions
  - Button clicks
  - Video plays
  - Assessment submissions
- **User Properties**: Grade, course, country
- **Funnel Analysis**: Conversion tracking

### Key Metrics

- Module completion rate
- Task accuracy
- Time per task
- Error frequency
- User engagement

## Troubleshooting Guide

### Common Issues

**Module Not Loading**

- Check user authentication token
- Verify moduleId parameter
- Check Redux state for module data
- Inspect network tab for API errors

**Video Not Playing (100ms)**

- Verify HMS token is valid
- Check room ID is correct
- Ensure proper permissions granted
- Test WebRTC connectivity

**Task Submission Failing**

- Validate answer format
- Check submission API endpoint
- Verify attempt details present
- Inspect Redux submission state

**Performance Issues**

- Check for large images not optimized
- Monitor Redux DevTools for excessive actions
- Profile React components for slow renders
- Analyze bundle size with Vite build

**Audio Not Playing**

- Check browser autoplay policies
- Verify audio file CDN URL
- Test audio file accessibility
- Check volume/mute settings

---

**Last Updated**: February 2026  
**Maintained By**: BrightChamps Engineering Team

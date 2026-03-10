# CMS Architecture - High-Level Overview

## Table of Contents

- [Introduction](#introduction)
- [Technology Stack](#technology-stack)
- [Architecture Overview](#architecture-overview)
- [Core Modules](#core-modules)
- [Data Flow](#data-flow)
- [Directory Structure](#directory-structure)
- [Key Features](#key-features)
- [Authentication & Authorization](#authentication--authorization)
- [State Management](#state-management)

## Introduction

The Content Management System (CMS) is an internal tool designed for content creators and educators to manage learning content for the BrightChamps learning platform. It provides a comprehensive interface for creating, editing, and managing learning paths, projects, modules, tasks, and assets.

## Technology Stack

### Core Technologies

- **React 18.2.0** - UI framework
- **TypeScript 4.9.5** - Type-safe development
- **React Router DOM 6.11.2** - Client-side routing
- **Redux Toolkit 1.9.5** - State management
- **Vite 5.2.13** - Build tool and dev server
- **Sass** - CSS preprocessing

### Key Libraries

- **Monaco Editor (@monaco-editor/react)** - Code editing capabilities
- **React PDF Renderer** - PDF generation
- **DnD Kit** - Drag-and-drop functionality
- **ImageKit.io** - Asset management and CDN

## Architecture Overview

The CMS follows a modular, component-based architecture with the following layers:

```
┌─────────────────────────────────────────────┐
│          Presentation Layer                  │
│  (React Components, Forms, Editors)          │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│         State Management Layer               │
│     (Redux Store, Slices, Actions)           │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│          Service Layer                       │
│   (API Services, Data Transformation)        │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│           Backend APIs                       │
│   (Learning Service, CMS Service)            │
└─────────────────────────────────────────────┘
```

## Core Modules

### 1. **Listings Module** (`src/cms/listings/`)

Provides list views for managing hierarchical learning content:

- **LearningPathsListing** - Top-level learning paths
- **LearningProjectsListing** - Projects within learning paths
- **LearningModulesListing** - Modules within projects
- **LearningTasksListing** - Individual tasks within modules
- **LearningModuleVersionListing** - Version control for modules

**Purpose**: Browse, search, and navigate through the content hierarchy.

### 2. **Editor Module** (`src/cms/editor/`)

Rich editing interfaces for content creation:

- **TaskEditor** - Main task creation and editing interface
- **CodeEditor** - Code snippet editing with syntax highlighting
- **FinIqEditor** - Financial IQ content editor
- **ModuleContent** - Module-level content editor
- **FullScreenViewer** - Preview tasks in full-screen mode

**Purpose**: Create and modify learning content with rich formatting options.

### 3. **Task Editor Forms** (`src/cms/TaskEditorForm/`)

Template-based form system for different task types:

- Interactive tasks (MCQ, Fill Blanks, Drag & Drop)
- Activity tasks (Card Flip, Crossword, Grid Select)
- Content tasks (Conversation, Character Interaction)
- Assessment tasks (Subjective, Rating, Input)

**Purpose**: Provide specialized forms for each task template type.

### 4. **Asset Manager** (`src/cms/AssetManager/`)

Manages media assets and resources:

- **AssetManager** - Main asset management interface
- **LearningModuleAssetsUploader** - Bulk upload functionality
- **LearningModulesAssetsListing** - Browse and organize assets

**Purpose**: Handle images, audio, video, and other media files.

### 5. **Authentication** (`src/cms/Login/`)

User authentication and session management:

- Login interface
- JWT token management
- Session persistence
- Role-based access control

**Purpose**: Secure access to CMS functionality.

## Data Flow

### Content Creation Flow

```
User Action → UI Component → Redux Action →
Service Layer → API Call → Backend →
Response → Redux State Update → UI Re-render
```

### Asset Upload Flow

```
File Selection → AssetManager → ImageKit Upload →
CDN URL → Store in Backend → Update Task References
```

### Task Editing Flow

```
Load Task → Populate Form → User Edits →
Validation → Save Action → API Update →
Refresh Listing
```

## Directory Structure

```
src/cms/
├── AssetManager/          # Media asset management
│   ├── AssetManager.tsx
│   ├── LearningModuleAssetsUploader.tsx
│   └── LearningModulesAssetsListing.tsx
│
├── editor/                # Content editors
│   ├── TaskEditor.tsx     # Main task editor
│   ├── CodeEditor.tsx     # Code editing
│   ├── FinIqEditor.tsx    # Financial IQ editor
│   ├── ModuleContent.tsx  # Module content
│   └── FullScreenViewer.tsx
│
├── listings/              # Content listings
│   ├── LearningPathsListing.tsx
│   ├── LearningProjectsListing.tsx
│   ├── LearningModulesListing.tsx
│   ├── LearningTasksListing.tsx
│   └── LearningModuleVersionListing.tsx
│
├── TaskEditorForm/        # Task template forms
│   ├── TaskEditorForm.tsx
│   └── TemplateForms/     # Individual task type forms
│       ├── TaskMcq.tsx
│       ├── TaskDragAndDrop.tsx
│       ├── TaskFillBlanks.tsx
│       └── ... (30+ templates)
│
├── Login/                 # Authentication
│   └── Login.tsx
│
├── templates/             # Global templates
│   ├── TaskFormGlobals.tsx
│   └── TaskFormReadOnly.tsx
│
├── Cms.tsx               # Main CMS router
├── constants.ts          # CMS-specific constants
├── helper.ts             # Utility functions
└── types.ts              # TypeScript type definitions
```

## Key Features

### 1. **Hierarchical Content Management**

- Learning Paths contain Projects
- Projects contain Modules
- Modules contain Tasks
- Version control at module level

### 2. **Rich Task Templates**

Supports 30+ different task types:

- Multiple Choice Questions (MCQ)
- Fill in the Blanks
- Drag and Drop
- Card Flip Games
- Crossword Puzzles
- Subjective Questions
- Interactive Conversations
- Code Editing Tasks
- And many more...

### 3. **Asset Management**

- Bulk upload capabilities
- CDN integration via ImageKit
- Asset organization by module
- Support for images, audio, animations, and documents

### 4. **Code Editor Integration**

- Monaco Editor for code tasks
- Syntax highlighting
- Multi-language support
- Real-time validation

### 5. **Preview & Testing**

- Full-screen preview mode
- Test tasks before publishing
- Mobile and desktop views

### 6. **Version Control**

- Module versioning
- Track content changes
- Rollback capabilities

## Authentication & Authorization

### Login Flow

1. User enters credentials on `/cms` route
2. Credentials sent to authentication service
3. JWT token received and stored in localStorage
4. Token included in all subsequent API requests
5. Private routes protected by PrivateRoute component

### Session Management

- Token stored in localStorage as `cms-user`
- Redux stores user details in `cmsSlice`
- Automatic logout on token expiration
- Role-based access control for different CMS features

## Data Models

### Core CMS Models (`src/models/cms.ts`)

#### LearningPath

```typescript
interface LearningPath {
  id: string;
  name: string;
  displayName: string;
  grade: number;
  courseId: string;
  classType: StudentClassType;
  countryIds?: number[];
  LearningPathVersions?: LearningPathVersion[];
}
```

#### LearningPathVersion

```typescript
interface LearningPathVersion {
  active: boolean;
  name?: string;
  id: string | number;
  learningPathId: string | number;
  version: string | number;
  activityId: string | number;
}
```

#### LearningProject

```typescript
interface LearningProject {
  id: string;
  name: string;
  displayName: string;
  learningPathId?: string;
  learningPathVersionId?: string | number;
  rank?: number;
  language?: string | number;
}
```

#### LearningModule

```typescript
interface LearningModule {
  id: string;
  name: string;
  displayName: string;
  topic: string;
  rank?: number;
  duration: number;
  durationUnits: "Minutes" | "Hours";
  concepts: string[];
  objectives: string[];
  projectId: string;
  status?: ModuleStatus; // "inReview" | "reviewed" | "published"
  type?: ModuleType; // "normal" | "quiz" | "activity"
  moduleKeyValueMapping?: any;
}
```

#### Task Model

Tasks have 50+ properties supporting 40+ different template types:

- **Base Properties**: id, moduleId, rank, title, template
- **Content**: Task-specific data based on template type
- **Interactive Elements**: mcq, dragAndDrop, fillBlanks, etc.
- **Media**: audio, backgroundAudio, assets
- **Navigation**: nextButton, prevButton, skipToSlideNumber
- **Evaluation**: solution, feedback, templateOptions

### Module Assets Structure

```typescript
interface ModuleAssets {
  animation?: string[];
  audio?: string[];
  character?: string[];
  icon?: string[];
  image?: string[];
  sfx?: string[];
  video?: string[];
}

interface ModuleAssetsResponse {
  globals: ModuleAssets; // Assets available across all modules
  module: ModuleAssets; // Module-specific assets
}
```

## State Management

### Redux Slices

The CMS uses Redux Toolkit for state management with the following slice:

#### CMS Slice (`redux/slices/cmsSlice.ts`)

Manages CMS-specific state:

- **User Authentication**: JWT token, user permissions
- **Current Context**: Selected path/project/module IDs
- **Editor State**: Current task being edited
- **Asset Management**: Uploaded files, CDN URLs
- **Form Validation**: Error states, validation messages

### State Flow

```
Component → Dispatch Action →
Reducer Updates State →
Selector Reads State →
Component Re-renders
```

## API Services (`src/services/cmsService.ts`)

### Learning Paths

- `getLearningPaths()` - Fetch all learning paths
- `createLearningPath(payload)` - Create new learning path
- `updateLearningPath(id, payload)` - Update existing path
- `getAvailableLearningPathsGrades({courseId, countryId, classType})` - Get available grades

### Learning Path Versions

- `getLearningPathVersion(learningPathId)` - Get all versions for a path
- `getLearningPathVersionById(versionId)` - Get specific version
- `createLearningPathVersion(payload)` - Create new version
- `updateLearningPathVersion(versionId, payload)` - Update version

### Projects

- `getLearningProjects(pathId, versionId)` - Get projects in a path
- `createLearningProject(payload)` - Create new project
- `updateLearningProject(projectId, payload)` - Update project
- `deleteLearningProject(projectId)` - Delete project

### Modules

- `getLearningModules(projectId)` - Get modules in a project
- `createLearningModule(payload)` - Create new module
- `updateLearningModule(moduleId, payload)` - Update module
- `changeLearningModuleStatus(moduleId, status)` - Publish/review module

### Tasks

- `getLearningTasks(moduleId, status)` - Get tasks with status filter
- `createLearningTask(payload)` - Create new task
- `updateLearningTask(taskId, payload)` - Update task
- `deleteLearningTask(taskId)` - Delete task
- `updateLearningTaskRank(moduleId, taskRanks)` - Reorder tasks

### Module Content

- `getModuleContent(moduleId, key)` - Get specific content section
- `updateModuleContent(moduleId, key, content)` - Update content section

### Assets

- `getModuleAssets(moduleId)` - Get all assets for a module
- `uploadModuleAsset(moduleId, file)` - Upload asset via ImageKit

## Routing Structure

```
/cms                          → Login page
/cms/paths                    → Learning paths listing
/cms/paths/:pathId/:lpVersionId/projects → Projects listing
/cms/paths/:pathId/projects/:projectId/modules → Modules listing
/cms/paths/:pathId/projects/:projectId/modules/:moduleId/tasks → Tasks listing
/cms/paths/:pathId/projects/:projectId/modules/:moduleId/tasks/editor → Task editor
/cms/paths/:pathId/projects/:projectId/modules/:moduleId/tasks/viewer → Task viewer
/cms/assets                   → Asset manager
/cms/module-versions          → Module version management
```

## Integration Points

### Backend Services

- **CMS Service** (`services/cmsService.ts`) - CRUD operations for content
- **Learning Service** (`services/learningService.ts`) - Content delivery APIs

### External Services

- **ImageKit CDN** - Asset hosting and delivery
- **Monaco Editor** - Code editing functionality

## Development Workflow

1. **Content Creator Login** → Authenticate with CMS credentials
2. **Navigate Hierarchy** → Browse paths → projects → modules → tasks
3. **Create/Edit Content** → Use task editor with appropriate template
4. **Upload Assets** → Add media files via asset manager
5. **Preview** → Test content in full-screen viewer
6. **Publish** → Make content available to students

## Security Considerations

- Private route protection on all CMS pages
- JWT token-based authentication
- Role-based access control
- Input validation on all forms
- Secure asset upload with file type restrictions
- XSS protection via DOMPurify (used in main app)

## Task Template Types

The CMS supports 40+ task templates categorized as follows:

### Assessment Templates

- `task-mcq` - Multiple Choice Questions
- `task-subjective` - Open-ended questions
- `task-table` - Table-based questions
- `task-fill-blanks` - Fill in the blanks
- `task-drag-and-drop` - Drag and drop matching
- `task-crossword` - Crossword puzzles
- `task-quiz` - Timed quiz format

### Interactive Templates

- `task-card-flip` - Flip card interactions
- `task-card-flip-game` - Memory matching game
- `task-card-flip-sequence` - Sequential card reveals
- `task-flip-multi-cards` - Multiple card flips
- `task-spin-the-wheel` - Wheel of fortune style
- `task-scratch-card` - Scratch to reveal

### Content Templates

- `task-readonly` - Display-only content
- `task-conversation` - Character dialogues
- `task-animate-conversation` - Animated dialogues
- `task-character-conversation` - Multi-character interactions
- `task-introduction` - Module introductions
- `task-summary` - Module summaries

### Activity Templates

- `activity-card-flip` - Standalone card activities
- `activity-card-flip-game` - Standalone card games
- `activity-simulator` - 3D simulation tasks
- `activity-scratch` - Scratch programming
- `task-flowchart` - Interactive flowcharts
- `task-hotspot` - Image hotspot clicking
- `task-labelling` - Label placement tasks

### Specialized Templates

- `task-guess-word` - Word guessing games
- `task-word-scramble` - Unscramble words
- `task-find-a-letter` - Letter finding activity
- `task-pick-items` - Item collection game
- `task-range-slider` - Slider-based input
- `task-grid-select` - Grid selection
- `task-typeform` - Embedded surveys
- `task-jumble-puzzle` - Jigsaw puzzles

## Build & Development

### Development Environment

```bash
npm start              # Start dev server on port 3000
npm run build          # Production build
npm test               # Run tests
npm run preview        # Preview production build
```

### Environment Variables

```bash
VITE_ENV=production|staging
VITE_CDN_ENABLED=true
VITE_CDN_ENDPOINT=https://ik.imagekit.io/brightchamps/adhyayan2
VITE_CLOUDFRONT_ENDPOINT=https://d25vilx9hlfpwt.cloudfront.net
VITE_SEGMENT_WRITE_KEY=<segment-key>
VITE_ELASTIC_APM_SERVICE_NAME=learning-dashboard-fe
VITE_ELASTIC_APM_SERVER_URL=https://elasticapm.brightchamps.com
```

### Build Configuration (`vite.config.mts`)

```typescript
{
  base: "/",
  plugins: [react(), viteTsconfigPaths(), svgr()],
  server: { port: 3000, open: true },
  build: { sourcemap: true }
}
```

### Code Quality Tools

- **ESLint**: Code linting with React and TypeScript rules
- **Prettier**: Code formatting (endOfLine: auto)
- **TypeScript**: Strict type checking
- **Git Secrets Scan**: Security scanning in CI/CD

## CI/CD Pipeline (Bitbucket Pipelines)

### Pull Request Process

1. **AI Code Review** - Automated code review using AI
   - Checks for React best practices
   - Validates component structure
   - Identifies performance issues
   - Only runs on master/develop/release branches

### Deployment Pipeline

#### Staging (develop branch)

1. **Build and Test**

   - Install dependencies
   - Run tests
   - Build with staging environment variables
   - Generate artifacts

2. **Security Scan**

   - Git secrets scan for sensitive data

3. **Deploy to Staging** (Manual Trigger)
   - Upload to AWS S3 staging bucket
   - Serve via AWS CloudFront CDN

#### Production (master branch)

1. **Build and Test**

   - Install dependencies
   - Run tests
   - Build with production environment variables
   - Generate artifacts

2. **Security Scan**

   - Git secrets scan

3. **Deploy to Production** (Manual Trigger)
   - Upload to AWS S3 production bucket
   - Serve via AWS CloudFront CDN

### Deployment Architecture

```
Code Commit → Bitbucket Pipeline →
Build & Test → Security Scan →
AWS S3 Bucket → CloudFront CDN → End Users
```

## Content Creation Workflow

### 1. Create Learning Path

- Define grade level, course, and class type
- Set country availability
- Create initial version

### 2. Add Projects

- Create projects within the learning path
- Set project rank for ordering
- Define project display name

### 3. Create Modules

- Add modules to projects
- Set topic, duration, concepts, and objectives
- Define module type (normal/quiz/activity)
- Set initial status (inReview)

### 4. Design Tasks

- Choose appropriate task template
- Configure task properties using TaskEditorForm
- Add content (text, images, audio, animations)
- Define correct answers and feedback
- Set navigation buttons
- Preview in full-screen mode

### 5. Upload Assets

- Navigate to Asset Manager
- Upload media files (images, audio, videos)
- Files are uploaded to ImageKit CDN
- CDN URLs are returned for use in tasks

### 6. Review & Publish

- Change module status to "reviewed"
- Final review by senior content creator
- Change status to "published" for student access

### 7. Version Control

- Create new version for updates
- Maintain multiple active versions
- Roll back if needed

## Performance Optimizations

- **Lazy Loading**: Editor components loaded on-demand
- **Code Splitting**: Task templates split into separate chunks
- **Asset CDN**: ImageKit for optimized media delivery
- **Memoized Selectors**: Redux selectors with reselect
- **Virtual Scrolling**: Large lists use react-window
- **Monaco Editor**: Lazy loaded only for code tasks
- **Debounced Inputs**: Form inputs debounced to reduce re-renders

## Testing Strategy

### Unit Tests

- Component rendering tests
- Redux reducer tests
- Service method tests
- Utility function tests

### Integration Tests

- Task form submission flows
- Asset upload workflows
- Navigation between listings

### Manual Testing

- Full-screen preview of tasks
- Cross-browser compatibility
- Responsive design testing

## Troubleshooting Guide

### Common Issues

**Task Not Saving**

- Check network tab for API errors
- Verify JWT token is valid
- Check Redux state for form data

**Assets Not Loading**

- Verify ImageKit CDN URL format
- Check CORS configuration
- Confirm file was successfully uploaded

**Editor Slow Performance**

- Clear browser cache
- Check for large JSON payloads
- Monitor Redux DevTools for excessive re-renders

**Version Conflicts**

- Ensure only one version is active
- Check learningPathVersionId in URLs
- Verify version mapping in database

---

**Last Updated**: February 2026  
**Maintained By**: BrightChamps Engineering Team

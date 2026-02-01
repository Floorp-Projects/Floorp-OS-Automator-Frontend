# AI Coding Agent Instructions - Floorp-OS-Automator-Frontend

This project is the React-based frontend for the Sapphillon workflow automation system, providing UI for managing workflows, plugins, and AI-powered workflow generation.

## Project Overview

**Tech Stack**:
- React 19 + TypeScript + Vite
- Chakra UI v3 (component library)
- React Router v6 (routing)
- @connectrpc/connect-web (gRPC-Web communication)
- i18next (internationalization)
- Vitest (testing)

**Key Features**:
- Workflow management and execution
- AI-powered workflow generation (agent mode)
- Plugin installation and management
- Real-time workflow progress tracking
- Multi-language support (Japanese, English)

---

## Cross-Project Integration

This frontend is part of a larger ecosystem with Floorp Browser and Sapphillon Backend. Understanding the data flow and integration points is crucial.

### Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Floorp Browser                         │
│                  (Firefox-based browser)                    │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          │ Floorp OS API (OpenAPI)
                          │ openapi.yaml in:
                          │ Floorp-OS-Automator-Backend/plugins/floorp/
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│              Sapphillon Backend (Rust)                  │
│  Location: ../Floorp-OS-Automator-Backend/              │
│  - gRPC Server on localhost:50051 (production)           │
│  - Plugin system (floorp, fetch, filesystem, etc.)       │
│  - Workflow execution engine (Deno Core)                   │
└─────────────────────────┬───────────────────────────────┘
                          │
                          │ gRPC (tonic)
                          │ protobuf definition in:
                          │ vender/Sapphillon_API/proto/
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│         Floorp-OS-Automator-Frontend (This Repo)      │
│  - Vite dev server: port 8081                         │
│  - gRPC-Web client (@connectrpc/connect-web)           │
│  - React UI for workflow management                     │
└─────────────────────────┬───────────────────────────────┘
                          │
                          │ PostMessage (optional, disabled)
                          │
                          ▼
                   ┌───────────────┐
                   │ Floorp        │
                   │ Progress      │
                   │ Window       │
                   └───────────────┘
```

### Integration Points

**1. Floorp → Sapphillon Backend**:
- Floorp exposes browser automation via OpenAPI spec at `Floorp-OS-Automator-Backend/plugins/floorp/api-spec/openapi.yaml`
- Sapphillon's `floorp` plugin consumes this API to control browser (tabs, navigation, etc.)
- Used in workflows to automate browser interactions

**2. Sapphillon Backend → Frontend**:
- gRPC communication using `@connectrpc/connect-web`
- Services defined in `vender/Sapphillon_API/proto/`
- Frontend clients auto-generated from protobuf files in `src/gen/`

**3. Frontend → Floorp (Progress Window)**:
- Currently **disabled** (see `lib/workflow-progress.ts`)
- Uses `window.OSAutomotor?.sendWorkflowProgress()` for real-time updates
- Can be re-enabled to show workflow progress in Floorp browser

**4. Web Store → Sapphillon**:
- Plugin marketplace at `../web-store/`
- Plugins installed via Sapphillon's plugin installer
- External plugins run in separate processes with gRPC communication

### Development Setup for Integration

**Full Stack Development** (recommended):
```bash
# Terminal 1: Start Floorp Browser
cd /Users/user/dev-source/floorp-dev/floorp
deno task dev

# Terminal 2: Start Sapphillon Backend
cd /Users/user/dev-source/sapphillon-dev/Floorp-OS-Automator-Backend
make run  # Starts gRPC server on localhost:50051

# Terminal 3: Start Frontend (production mode)
cd /Users/user/dev-source/sapphillon-dev/Floorp-OS-Automator-Frontend
pnpm dev:prod  # Connects to localhost:50051
```

**Frontend-Only Development**:
```bash
# Terminal 1: Start Frontend with mock server
pnpm dev:mock  # Mock gRPC on port 50099, Vite on 5199
```

---

## Build & Development Commands

### Package Manager
This project uses **pnpm** as the package manager. All commands use `pnpm` not `npm`.

### Primary Commands
```bash
pnpm dev                # Start Vite dev server (port 8081)
pnpm dev:mock            # Start with mock gRPC server (ports 50099 + 5199)
pnpm dev:prod            # Connect to production backend (localhost:50051)
pnpm build               # TypeScript check + Vite build
pnpm test                # Run Vitest tests
pnpm lint                # ESLint
```

### Rust Web Server Commands
```bash
make rust_test           # Run Rust workspace tests
make rust_build          # Build Rust web server
make rust_clean         # Clean Rust artifacts
```

**Note**: This project includes a Rust web server in `web_server/` for serving the frontend statically.

---

## Architecture & Code Organization

### Directory Structure

```
src/
├── components/          # Reusable UI components
│   ├── console/       # Workflow execution console/log viewer
│   ├── layout/        # Layout components (Sidebar, Header, etc.)
│   ├── nav/          # Navigation components
│   ├── workflow/      # Workflow-specific components
│   └── ...          # Other feature components
├── pages/             # Page-level components and hooks
│   ├── agent/         # AI workflow generation (useAgentExecution)
│   ├── generate/      # Workflow prompt-based generation
│   ├── workflows/     # Workflow management (useWorkflowRun)
│   ├── plugins/       # Plugin management
│   └── settings/     # Settings pages
├── lib/              # Core utilities and integrations
│   ├── grpc-clients.ts      # gRPC-Web client configuration
│   ├── workflow-utils.ts    # Workflow helpers & type guards
│   ├── workflow-progress.ts # Floorp progress window integration
│   ├── prompt-templates.ts # Pre-built prompt templates
│   └── query-keys.ts       # TanStack Query key helpers
├── hooks/            # Custom React hooks
├── i18n/            # Internationalization config
├── types/            # TypeScript type definitions
└── contexts/         # React contexts (WorkflowRunProvider)
```

### Component Organization

**Separate types from implementation**: Define types in dedicated files.
```typescript
// Good: types/workflow.ts
export interface RunEvent {
  id: string;
  kind: "message" | "error" | "progress";
  timestamp: number;
}

// pages/workflows/useWorkflowRun.ts
import type { RunEvent } from "@/types/workflow";
```

---

## gRPC-Web Communication

### Client Usage

All gRPC communication is centralized in `lib/grpc-clients.ts`:
```typescript
import { clients } from "@/lib/grpc-clients";

// Simple request
const version = await clients.version.getVersion({});

// Streaming request
for await (const msg of clients.workflow.generateWorkflow({ prompt: "..." })) {
  console.log(msg.workflowDefinition);
}
```

### Error Handling

Always wrap gRPC calls with proper error handling:
```typescript
import { ConnectError, Code } from "@connectrpc/connect";
import { getErrorMessage, isRetryableError } from "@/lib/grpc-clients";

try {
  const result = await clients.plugin.listPlugins({});
} catch (error) {
  if (error instanceof ConnectError) {
    const message = getErrorMessage(error);
    
    switch (error.code) {
      case Code.Unavailable:
        // Service unavailable handling
        break;
      case Code.PermissionDenied:
        // Permission error handling
        break;
    }
  }
}
```

### Adding New Services

1. Add `.proto` file to `vender/Sapphillon_API/proto/`
2. Generate types with `deno task gen` (in Sapphillon_API repo)
3. Import and add client to `lib/grpc-clients.ts`

---

## Custom Hooks Patterns

### Workflow Execution Hooks

**useAgentExecution** (`pages/agent/useAgentExecution.ts`):
- Manages AI-powered workflow generation and execution
- States: `prompt` → `generating` → `confirm` → `executing` → `completed`/`error`
- Returns: `currentStep`, `events`, `generatedWorkflow`, `runWorkflow()`, etc.

**useWorkflowRun** (`pages/workflows/useWorkflowRun.ts`):
- Manages execution of existing workflows
- Returns: `running`, `events`, `runRes`, `runById()`, `runByDefinition()`

### Custom Hook Structure

```typescript
export interface UseMyHookReturn {
  value: SomeType;
  loading: boolean;
  error: Error | null;
  setValue: (val: SomeType) => void;
}

export function useMyHook(): UseMyHookReturn {
  // Hook implementation
  return { value, loading, error, setValue };
}
```

---

## Workflow Management Patterns

### Workflow Status & Results

Use helper functions from `lib/workflow-utils.ts`:
```typescript
import {
  isWorkflowResultSuccess,
  isWorkflowResultFailure,
  hasWorkflowRun,
  type WorkflowStatus,
} from "@/lib/workflow-utils";

// Check result status
if (isWorkflowResultSuccess(latestResult)) {
  console.log("Success");
}

// Check if workflow has been run
if (hasWorkflowRun(workflow)) {
  console.log("Workflow has execution history");
}
```

### Workflow Progress Integration

Floorp browser integration for progress window (currently disabled):
```typescript
import {
  notifyWorkflowStart,
  notifyWorkflowComplete,
  notifyWorkflowError,
} from "@/lib/workflow-progress";

// Notify Floorp of workflow events
notifyWorkflowStart(workflowId, workflowName);
// ... workflow executes ...
notifyWorkflowComplete(workflowId, finalSteps);
```

---

## UI Components & Chakra UI v3

### Chakra UI v3 Patterns

This project uses Chakra UI v3 with slot-based API:
```typescript
// Current pattern (v3 slot API)
import { Button, IconButton, useToast } from "@chakra-ui/react";

const toast = useToast();
toast({
  title: "Success",
  description: "Operation completed",
  status: "success",
});
```

**Note**: See `docs/ui-todos.md` for migration items (Select, Table, Tooltip slots not yet adopted).

### Component Organization

**Feature-based grouping**: Components are organized by feature area (console, layout, nav, workflow, etc.).

**Console Component** (`components/console/`):
- `StreamConsole.tsx`: Main console/log viewer
- `LogRow.tsx`: Individual log entry
- `SeparatorRow.tsx`: Visual separators
- `row-utils.ts`: Log formatting utilities

---

## Internationalization (i18n)

### Setup

Configured in `src/i18n/config.ts`:
```typescript
import i18n from "i18next";
import { useTranslation } from "react-i18next";

function MyComponent() {
  const { t } = useTranslation();

  return <div>{t("welcome.message")}</div>;
}
```

### Adding Translations

1. Add keys to `src/i18n/locales/ja.json` and `en.json`
2. Use the `t()` function with dot notation:
```json
{
  "welcome": {
    "message": "ようこそ！",
    "description": "Floorp OS Automatorへようこそ"
  }
}
```

### Prompt Templates

Pre-built prompts in `lib/prompt-templates.ts`:
```typescript
import { getPromptTemplates } from "@/lib/prompt-templates";

const templates = getPromptTemplates(t);

// Filter by category
const automationTemplates = templates.filter(
  (t) => t.category === "automation"
);
```

---

## Testing

### Vitest Configuration

Tests are in `src/lib/*.test.ts` files:
```typescript
import { describe, it, expect } from "vitest";

describe("utils", () => {
  it("cn joins strings", () => {
    expect(cn("a", "b")).toBe("a b");
  });
});
```

Run tests with:
```bash
npm run test           # Single run
npm run test:watch    # Watch mode
npm run test:ui        # Vitest UI
```

---

## Mock Server

### Mock Development Mode

For frontend-only development:
```bash
npm run dev:mock
```

This starts:
- Mock gRPC server on port 50099
- Vite dev server on port 5199
- Handlers in `mock-server/handlers/`
- Mock data in `mock-server/data/mock-data.ts`

### Adding Mock Handlers

Create handler in `mock-server/handlers/`:
```typescript
import type { MyService } from "@/gen/.../my_service_pb";

export const myHandler: Partial<MyService> = {
  async myMethod(req) {
    // Return mock data
    return { success: true, data: "mock" };
  }
};
```

Register in `mock-server/index.ts`:
```typescript
import { myHandler } from "./handlers/my-handler";
import { MyService } from "@/gen/.../my_service_pb";

router.service(MyService, myHandler);
```

---

## Error Handling Best Practices

### Centralized Error Handling

See `docs/error-handling.md` for detailed patterns:
- Always handle `ConnectError` from gRPC
- Use `getErrorMessage(error)` for user-friendly messages
- Implement retry logic with `isRetryableError(error)`
- Display errors via Toast notifications

### Example Pattern

```typescript
import { useToast } from "@chakra-ui/react";
import { ConnectError } from "@connectrpc/connect";
import { getErrorMessage } from "@/lib/grpc-clients";

function useErrorHandler() {
  const toast = useToast();

  return (error: unknown) => {
    if (error instanceof ConnectError) {
      toast({
        title: "Error",
        description: getErrorMessage(error),
        status: "error",
      });
    }
  };
}
```

---

## TanStack Query Integration

Query keys are centralized in `lib/query-keys.ts`:
```typescript
import { QK } from "@/lib/query-keys";

// In component
const { data } = useQuery({
  queryKey: QK.version.get(),
  queryFn: () => clients.version.getVersion({}),
});
```

---

## Environment Variables

```bash
# Development
VITE_GRPC_BASE_URL=http://localhost:50051
VITE_GRPC_WEB_USE_BINARY=true

# Mock mode
VITE_GRPC_BASE_URL=http://localhost:50099
```

---

## Key Files Reference

| Purpose | File |
|---------|------|
| gRPC client setup | `src/lib/grpc-clients.ts` |
| Error handling utilities | `src/lib/grpc-clients.ts` (getErrorMessage, isRetryableError) |
| Workflow helpers | `src/lib/workflow-utils.ts` |
| Workflow progress | `src/lib/workflow-progress.ts` |
| Prompt templates | `src/lib/prompt-templates.ts` |
| Agent execution hook | `src/pages/agent/useAgentExecution.ts` |
| Workflow run hook | `src/pages/workflows/useWorkflowRun.ts` |
| i18n configuration | `src/i18n/config.ts` |
| Mock server entry | `mock-server/index.ts` |
| Error handling docs | `docs/error-handling.md` |
| UI TODOs | `docs/ui-todos.md` |

---

## Important Conventions

1. **Type Safety**: Always use TypeScript types from generated protobuf files in `src/gen/`
2. **Error Handling**: Wrap all gRPC calls with try-catch, use `getErrorMessage()` for user display
3. **i18n**: Use `useTranslation()` hook, add keys to both `ja.json` and `en.json`
4. **Component Organization**: Group by feature, separate types into dedicated files
5. **Testing**: Write tests for utility functions, use Vitest
6. **Query Keys**: Use centralized `QK` from `lib/query-keys.ts`
7. **Progress Integration**: Use workflow progress utilities for Floorp browser integration

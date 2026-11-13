# Application (`app/`) Documentation

The `app/` directory contains the React Router 8 Framework Mode application. Routes are explicitly registered in `app/routes.ts`, retaining the existing `views/` and `api/` modules and server/client entry points.

## File Structure

```
app/
├── api/          # API routes and handlers
├── components/   # Reusable React components
├── emotion/      # Emotion CSS-in-JS configuration
├── entry.client.tsx # Client-side hydration entry point
├── entry.server.tsx # Server-side rendering entry point
├── hooks/        # Custom React hooks
├── root.tsx      # Root layout component
├── routes.ts     # Explicit route configuration
├── utils/        # Utility functions and configurations (client and server)
└── views/        # Route modules and view components
```

## Key Files

- [`app/entry.client.tsx`](../app/entry.client.tsx): This file is the client-side entry point. It hydrates the React application rendered by the server. It includes setup for Material UI's `ThemeProvider`, Emotion's `ClientCacheProvider`, `LocalizationProvider` for date handling, and Sentry for error tracking and performance monitoring.
- [`app/entry.server.tsx`](../app/entry.server.tsx): Renders every document with the client's provider tree and streaming support for Single Fetch hydration, buffers completed HTML for Emotion critical CSS extraction, and exports Sentry server instrumentation and error reporting. Express handles request logging separately; PDF generation belongs to the registered compensation resource route, not this entry point.
- [`app/root.tsx`](../app/root.tsx): This is the root layout component for the application. It defines the basic HTML structure, including `<head>` and `<body>`. It sets up meta tags, links, scripts, and integrates with Emotion for injecting styles. It also includes an `ErrorBoundary` for catching and rendering errors.

## Subdirectories

- **`api/`**: Contains route modules for handling API requests.
- **`components/`**: Houses reusable React components used throughout the application, including specific components for municipality views and shared components like tables and forms.
- **`emotion/`**: Contains the configuration and setup for Emotion, the CSS-in-JS library used for styling, including both client and server-side implementations.
- **`hooks/`**: Stores custom React hooks used to encapsulate component logic.

  Dialog drafts use `useEditFields(fetcher)`, backed by `useSubmissionState`. Pass its returned `onSubmit` to `EditDialog`, which wires it to the fetcher form. This records the mutation from the actual form event: concurrent React can discard intermediate `submitting` renders, so those renders cannot reliably identify a save. Drafts reset only when that mutation completes with a fresh `{ severity: 'success' }` result. Validation/server errors and GET loads retain the draft. Calling the setter (opening, cancelling or replacing a draft) starts a new editing session, so an older pending submission cannot dismiss a newly opened dialog. The initial value is the reset value for the lifetime of the hook. Lifecycle adjustments are guarded during render, not scheduled through effects or timers; callers must not add their own idle-fetcher reset effects. `AddItem` shares the same lifecycle and wires the hook's third tuple item to its form's `onSubmit`.

- **`utils/`**: A collection of utility functions and configurations. This directory is further divided into `client/` for client-side utilities (e.g., date formatting) and `server/` for server-side utilities (e.g., authentication, logging, database repositories, email services).
- **`views/`**: Contains page/layout route modules registered in `app/routes.ts`.

## Technologies Used

The `app/` directory leverages several key technologies:

- **React Router 8 (Framework Mode)**: Provides routing, server-side rendering, loaders and actions.
- **React**: The JavaScript library for building user interfaces.
- **Material UI**: A popular React UI framework for building responsive and accessible interfaces.
- **Emotion**: A CSS-in-JS library integrated with Material UI for styling.
- **Sentry**: Used for application monitoring, error tracking, and performance monitoring.
- **date-fns**: A utility library for working with dates.

# Application (`app/`) Documentation

The `app/` directory contains the core of the Remix application. It follows the Remix file convention for routing and server/client entry points, and is structured into logical subdirectories for better organization.

## File Structure

```
app/
├── api/          # API routes and handlers
├── components/   # Reusable React components
├── emotion/      # Emotion CSS-in-JS configuration
├── entry.client.tsx # Client-side entry point for Remix
├── entry.server.tsx # Server-side entry point for Remix
├── hooks/        # Custom React hooks
├── root.tsx      # Root layout component
├── utils/        # Utility functions and configurations (client and server)
└── views/        # Route modules and view components
```

## Key Files

- [`app/entry.client.tsx`](app/entry.client.tsx): This file is the client-side entry point. It hydrates the React application rendered by the server. It includes setup for Material UI's `ThemeProvider`, Emotion's `ClientCacheProvider`, `LocalizationProvider` for date handling, and Sentry for error tracking and performance monitoring.
- [`app/entry.server.tsx`](app/entry.server.tsx): This file is the server-side entry point. It handles incoming requests, renders the Remix application to a stream or string, and sets up server-side specific functionalities like logging (`pino-http`), PDF handling, and bot detection. It also integrates with Material UI and Emotion for server-side rendering.
- [`app/root.tsx`](app/root.tsx): This is the root layout component for the application. It defines the basic HTML structure, including `<head>` and `<body>`. It sets up meta tags, links, scripts, and integrates with Emotion for injecting styles. It also includes an `ErrorBoundary` for catching and rendering errors.

## Subdirectories

- **`api/`**: Contains route modules for handling API requests.
- **`components/`**: Houses reusable React components used throughout the application, including specific components for municipality views and shared components like tables and forms.
- **`emotion/`**: Contains the configuration and setup for Emotion, the CSS-in-JS library used for styling, including both client and server-side implementations.
- **`hooks/`**: Stores custom React hooks used to encapsulate component logic.
- **`utils/`**: A collection of utility functions and configurations. This directory is further divided into `client/` for client-side utilities (e.g., date formatting) and `server/` for server-side utilities (e.g., authentication, logging, database repositories, email services).
- **`views/`**: Contains route modules that define the different pages and layouts of the application, following Remix's routing conventions.

## Technologies Used

The `app/` directory leverages several key technologies:

- **Remix**: The web framework providing routing, server-side rendering, and data handling.
- **React**: The JavaScript library for building user interfaces.
- **Material UI**: A popular React UI framework for building responsive and accessible interfaces.
- **Emotion**: A CSS-in-JS library integrated with Material UI for styling.
- **Sentry**: Used for application monitoring, error tracking, and performance monitoring.
- **date-fns**: A utility library for working with dates.
- **isbot**: A library to detect bot user agents.

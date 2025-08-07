# Commands (`cmd/`) Documentation

The `cmd/` directory contains command-line interface (CLI) tools for the CRM system. These scripts are responsible for server startup and scheduled tasks.

## File Structure

```
cmd/
├── cron.ts    # Cron job for cleaning expired sessions
└── server.ts  # Express server entry point
```

## Key Files

- [`cmd/cron.ts`](cmd/cron.ts): This file defines a cron job using the `node-cron` library. The `cleanExpiredSessions` function is scheduled to run daily at 04:00 UTC. It uses Drizzle ORM to delete expired sessions from the database.
- [`cmd/server.ts`](cmd/server.ts): This file is the main entry point for the Express server. It sets up the server, integrates with Remix for handling requests, configures middleware for compression and logging (`pino-http`), serves static assets, and starts the server listening on a specified port. It also starts the `cleanExpiredSessions` cron job.

## Technologies Used

The `cmd/` directory utilizes the following technologies:

- **Express**: A fast, unopinionated, minimalist web framework for Node.js, used to build the server.
- **Remix**: Integrated to handle server-side rendering and routing.
- **node-cron**: A library for scheduling tasks (cron jobs) in Node.js.
- **Drizzle ORM**: Used for interacting with the database in the cron job.
- **pino-http**: A high-speed HTTP logger for Node.js.
- **compression**: A middleware to compress response bodies.
- **Vite**: Used for handling assets in development mode.

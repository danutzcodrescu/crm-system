import { data, Link } from 'react-router';

// Expected misses are normal responses, not exceptions for entry.server/Sentry.
// This route deliberately lives outside the authenticated layout.
export function loader() {
  return data(null, { status: 404 });
}

export const action = loader;

export default function NotFound() {
  return (
    <main>
      <h1>404 Not Found</h1>
      <p>The requested page could not be found.</p>
      <Link to="/signin">Go to sign in</Link>
    </main>
  );
}

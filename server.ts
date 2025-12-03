// server.ts
import express from 'express';
import { handler as astroHandler } from './dist/server/entry.mjs'; // Astro's SSR handler
import { handler as graphQLHandler } from './src/server/api/handler.ts'; // Your GraphQL handler

const app = express();
const PORT = process.env.PORT || 4321; // Using the same port as before

// Mount the GraphQL API endpoint
app.use('/api/graphql', graphQLHandler);

// Use Astro's SSR handler as a fallback for all other routes
app.use(astroHandler);

// Start the Express server
app.listen(PORT, () => {
  console.log(`🚀 Server listening on http://localhost:${PORT}`);
  console.log(`GraphQL endpoint available at http://localhost:${PORT}/api/graphql`);
  console.log(`Astro pages served for all other routes.`);
});

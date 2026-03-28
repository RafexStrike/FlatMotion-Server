// server/src/server.ts
// Entry point for the backend server.
// Initializes the Express application and listens on 0.0.0.0 to ensure Docker compatibility.
import "dotenv/config";
import app from './app';
import config from './config/env';

const PORT = config.port || 5000;

app.listen(PORT as number, "0.0.0.0", () => {
  console.log(`Server is running on port ${PORT}`);
});

// File: src/server.ts
import "dotenv/config";
import app from './app';
import config from './config/env';

const PORT = config.port || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

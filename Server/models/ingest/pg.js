import { Pool } from "pg";
import dotenv from "dotenv";
dotenv.config();

// Create a new pool instance using the environment variables
const pool = new Pool({
  user: process.env.PG_USER, // PostgreSQL user
  host: process.env.PG_HOST, // PostgreSQL host
  database: process.env.PG_DATABASE, // PostgreSQL database name
  password: process.env.PG_PASSWORD, // PostgreSQL password
  port: process.env.PG_PORT || 5432, // PostgreSQL port (default is 5432)
});

export default pool;




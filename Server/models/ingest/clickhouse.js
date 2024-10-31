import { createClient } from "@clickhouse/client"; // or '@clickhouse/client-web'
import dotenv from "dotenv";
dotenv.config();

const client = createClient({
  url: process.env.CLICKHOUSE_URI,
});


export default client
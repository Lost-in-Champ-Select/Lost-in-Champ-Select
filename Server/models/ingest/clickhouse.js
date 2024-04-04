import { createClient } from "@clickhouse/client"; // or '@clickhouse/client-web'

const client = createClient({
   url: 'http://localhost:8123'
});


export default client 
const { Client } = require('pg');
const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function test() {
  try {
    console.log("Connecting to:", process.env.DATABASE_URL.replace(/:[^:@]+@/, ":****@"));
    await client.connect();
    console.log("Connected successfully!");
    const res = await client.query('SELECT NOW()');
    console.log("Date from DB:", res.rows[0].now);
    await client.end();
  } catch (err) {
    console.error("Connection error:", err.message);
    process.exit(1);
  }
}

test();

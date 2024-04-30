import pg from 'pg'

// const pool = new pg.Pool({
//   host: "localhost",
//   user: "postgres",
//   database: "products",
//   password: "password",
//   port: 5432,
//   idleTimeoutMillis: 0,
//   connectionTimeoutMillis: 0,
// });

const pool = new pg.Pool({
  host: 'localhost',
  user: 'lost_in_champ_select',
  database: 'league_matches',
  password: 'Gundam01',
  port: 5432
})

// const pool = new pg.Pool({
//   host: 'localhost',
//   user: 'coryzauss',
//   database: 'league_matches',
//   password: 'password',
//   port: 5432
// })

export default pool;


GRANT ALL PRIVILEGES ON DATABASE league_matches TO lost_in_champ_select;
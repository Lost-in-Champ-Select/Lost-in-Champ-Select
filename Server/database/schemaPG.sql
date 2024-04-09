Drop DATABASE IF EXISTS league_matches;
CREATE DATABASE league_matches;

\c league_matches

DROP TABLE match_ids CASCADE;

CREATE TABLE match_ids (
  match_id VARCHAR PRIMARY KEY
);

CREATE TABLE unseen_matches (
  id SERIAL PRIMARY KEY,
  matches_array VARCHAR
);

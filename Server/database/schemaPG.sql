Drop DATABASE IF EXISTS league_matches;
CREATE DATABASE league_matches;

\c league_matches


CREATE TABLE matches (
    id SERIAL PRIMARY KEY,
    match_id VARCHAR(255) UNIQUE,
    seen BOOLEAN DEFAULT FALSE
);

CREATE TABLE players (
    id SERIAL PRIMARY KEY,
    player_id VARCHAR(255) UNIQUE,
    seen BOOLEAN DEFAULT FALSE
);

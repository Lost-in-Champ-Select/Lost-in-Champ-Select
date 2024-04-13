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

CREATE TABLE unseen_players (
  id SERIAL PRIMARY KEY,
  player VARCHAR
);

-- INSERT INTO unseen_players (player) VALUES ('{
-- "2H0QnLfmiPxeRr7dg9PRiiBpKA086TloQenQzqHygSvVI6mOMc0haAI2o0mqy0qOMheAWXP4zv0J9w": "1",
-- "Fhkv63zUIwjooMSnr5eGLyCQzHJXHAk16mJ5pazNgbbavtplB4Tpl_rQasF71Ir5txtw9crPgDEuFA": "1",
-- "wigtPOCYecfAzFSxjPB0ztTOssZhDK-dx1GrrrqnDQgWhR5IpzY4hBKornwPeUmcqR9P81QMK9X_ig": "1",
-- "x7aOeLIe1GaSRt5jQbr7N96W-T85haVI1tsmi5m9wwJ-YDWzFnOJ7xQeVEBqMXAt6TEqiFXQi_M1SA": "1",
-- "_B971Et4kcqeJHTX6XAp5PkDWXbZHOFwRfiALnoWqbuwZ-H8jj4_x3Huiqd4stnDJS3vf6UR1OuOkQ": "1",
-- "yamARVfBLlJNoSwWfZTU5fWMHs_YB2jkdlpVebG3b39MQMZXOBbA9ObHDORHDFZGo3RGiCq-jFLt_g": "1",
-- "wQy0fUHU-9cfvpulLa2h8HtkM-uZIcgBL9vvPMSTpqzHCLvNPRXE7QKjuGqw4lLlEnK_LL4tOXScwg": "1",
-- "L5Li-6q7vCaml37ejDww2QAsn5wcQgwfgZxMVX_hWB3LSigW1eExw0HOBjitFwoTv0IoEhYccGg3gg": "1",
-- "EJL7qJB407-cFcHp8KJCnJxzX-QkBL3eeV-mHxpCuJ0zwEjrFTkDhK8rHWA14XytSujQpXNuSEGLhw": "1",
-- "YOLlys2zymif6rnxo8Wv12yRPjFOjwvJqmt4oQqwpyxxaYygl45UtHVIUWGCwVLdz5RE2TDCKQNBAw": "1",
-- }');

-- INSERT INTO unseen_matches (matches_array) VALUES ('[
--     "NA1_4897938245",
--     "NA1_4897890605",
--     "NA1_4896923157",
--     "NA1_4896888623",
--     "NA1_4896857059",
--     "NA1_4896823174",
--     "NA1_4896796017",
--     "NA1_4896571949",
--     "NA1_4889742812",
--     "NA1_4889690314"
-- ]');

-- COPY (SELECT player FROM unseen_players) TO '/path/to/exported_file.json';



CREATE TABLE default.aram_matches
(
  game_id UInt64,
  match_id String,
  game_start DateTime,
  game_version String,
  team_one_participants Array(String),
  team_two_participants Array(String),
  team_one_champ_one String,
  team_one_champ_two String,
  team_one_champ_three String,
  team_one_champ_four String,
  team_one_champ_five String,
  team_two_champ_one String,
  team_two_champ_two String,
  team_two_champ_three String,
  team_two_champ_four String,
  team_two_champ_five String,
  team_one_win Bool,
  team_two_win Bool,
)

ENGINE = MergeTree()
ORDER BY (game_start, match_id)
PRIMARY KEY (game_start, match_id)


CREATE TABLE default.classic_matches
(
  game_id UInt64,
  match_id String,
  game_start DateTime,
  game_version String,
  team_one_participants Array(String),
  team_two_participants Array(String),
  team_one_champ_one String,
  team_one_champ_two String,
  team_one_champ_three String,
  team_one_champ_four String,
  team_one_champ_five String,
  team_two_champ_one String,
  team_two_champ_two String,
  team_two_champ_three String,
  team_two_champ_four String,
  team_two_champ_five String,
  team_one_win Bool,
  team_two_win Bool,
)

ENGINE = MergeTree()
ORDER BY (game_start, match_id)
PRIMARY KEY (game_start, match_id)
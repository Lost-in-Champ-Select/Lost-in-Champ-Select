let getBasicWinrates = `
    WITH
    flattened_data AS (
      SELECT
        champion,
        win
      FROM (
        SELECT
          arrayJoin(team1_champions) AS champion,
          team1_win AS win
        FROM
          aram_matches
        UNION ALL
        SELECT
          arrayJoin(team2_champions) AS champion,
          NOT team1_win AS win
        FROM
          aram_matches
      )
    ),
    champion_win_rates AS (
      SELECT
        champion,
        avg(win) AS win_rate
      FROM
        flattened_data
      WHERE
        champion IN (${championArrayString})
      GROUP BY
        champion
    )
  SELECT
    champion,
    win_rate
  FROM
    champion_win_rates
  ORDER BY
    champion;
  `;

//! HARDCODED FOR TEST, dont use this
let _getTenChampsHardcoded = `
WITH
  team1_data AS (
    SELECT
      game_id,
      arrayJoin(team1_champions) AS champion,
      team1_win AS win,
      SUM(team1_champ1_kills) AS champ1_kills,
      SUM(team1_champ1_assists) AS champ1_assists,
      SUM(team1_champ1_deaths) AS champ1_deaths,
      SUM(team1_champ2_kills) AS champ2_kills,
      SUM(team1_champ2_assists) AS champ2_assists,
      SUM(team1_champ2_deaths) AS champ2_deaths,
      SUM(team1_champ3_kills) AS champ3_kills,
      SUM(team1_champ3_assists) AS champ3_assists,
      SUM(team1_champ3_deaths) AS champ3_deaths,
      SUM(team1_champ4_kills) AS champ4_kills,
      SUM(team1_champ4_assists) AS champ4_assists,
      SUM(team1_champ4_deaths) AS champ4_deaths,
      SUM(team1_champ5_kills) AS champ5_kills,
      SUM(team1_champ5_assists) AS champ5_assists,
      SUM(team1_champ5_deaths) AS champ5_deaths,
      SUM(team1_champ1_gold_earned + team1_champ2_gold_earned + team1_champ3_gold_earned + team1_champ4_gold_earned + team1_champ5_gold_earned) AS team_gold_earned,
      SUM(team1_champ1_damage_dealt + team1_champ2_damage_dealt + team1_champ3_damage_dealt + team1_champ4_damage_dealt + team1_champ5_damage_dealt) AS team_damage_dealt,
      team1_win AS win_rate
    FROM aram_matches
    WHERE arrayJoin(team1_champions) IN ('Tryndamere', 'Tristana', 'Fiddlesticks', 'Vi', 'Jinx', 'Janna', 'Nasus', 'Jayce', 'Varus', 'Irelia')
    GROUP BY game_id, champion, team1_win
  ),

  team2_data AS (
    SELECT
      game_id,
      arrayJoin(team2_champions) AS champion,
      team1_win AS win,
      SUM(team2_champ1_kills) AS champ1_kills,
      SUM(team2_champ1_assists) AS champ1_assists,
      SUM(team2_champ1_deaths) AS champ1_deaths,
      SUM(team2_champ2_kills) AS champ2_kills,
      SUM(team2_champ2_assists) AS champ2_assists,
      SUM(team2_champ2_deaths) AS champ2_deaths,
      SUM(team2_champ3_kills) AS champ3_kills,
      SUM(team2_champ3_assists) AS champ3_assists,
      SUM(team2_champ3_deaths) AS champ3_deaths,
      SUM(team2_champ4_kills) AS champ4_kills,
      SUM(team2_champ4_assists) AS champ4_assists,
      SUM(team2_champ4_deaths) AS champ4_deaths,
      SUM(team2_champ5_kills) AS champ5_kills,
      SUM(team2_champ5_assists) AS champ5_assists,
      SUM(team2_champ5_deaths) AS champ5_deaths,
      SUM(team2_champ1_gold_earned + team2_champ2_gold_earned + team2_champ3_gold_earned + team2_champ4_gold_earned + team2_champ5_gold_earned) AS team_gold_earned,
      SUM(team2_champ1_damage_dealt + team2_champ2_damage_dealt + team2_champ3_damage_dealt + team2_champ4_damage_dealt + team2_champ5_damage_dealt) AS team_damage_dealt,
      (1 - team1_win) AS win_rate
    FROM aram_matches
    WHERE arrayJoin(team2_champions) IN ('Tryndamere', 'Tristana', 'Fiddlesticks', 'Vi', 'Jinx', 'Janna', 'Nasus', 'Jayce', 'Varus', 'Irelia')
    GROUP BY game_id, champion, team1_win
  ),

  combined_data AS (
    SELECT * FROM team1_data
    UNION ALL
    SELECT * FROM team2_data
  )

SELECT
  champion,
  AVG(win_rate) AS avg_win_rate,
  AVG((champ1_kills + champ1_assists) / GREATEST(1, champ1_deaths)) AS avg_kda,
  AVG(team_gold_earned) AS avg_gold,
  AVG(team_damage_dealt) AS avg_damage
FROM
  combined_data
GROUP BY
  champion
ORDER BY
  champion;`;

//! Dynamic version
let getTenChampsStats = `
WITH
  team1_data AS (
    SELECT
      game_id,
      arrayJoin(team1_champions) AS champion,
      team1_win AS win,
      SUM(team1_champ1_kills) AS champ1_kills,
      SUM(team1_champ1_assists) AS champ1_assists,
      SUM(team1_champ1_deaths) AS champ1_deaths,
      SUM(team1_champ2_kills) AS champ2_kills,
      SUM(team1_champ2_assists) AS champ2_assists,
      SUM(team1_champ2_deaths) AS champ2_deaths,
      SUM(team1_champ3_kills) AS champ3_kills,
      SUM(team1_champ3_assists) AS champ3_assists,
      SUM(team1_champ3_deaths) AS champ3_deaths,
      SUM(team1_champ4_kills) AS champ4_kills,
      SUM(team1_champ4_assists) AS champ4_assists,
      SUM(team1_champ4_deaths) AS champ4_deaths,
      SUM(team1_champ5_kills) AS champ5_kills,
      SUM(team1_champ5_assists) AS champ5_assists,
      SUM(team1_champ5_deaths) AS champ5_deaths,
      SUM(team1_champ1_gold_earned + team1_champ2_gold_earned + team1_champ3_gold_earned + team1_champ4_gold_earned + team1_champ5_gold_earned) AS team_gold_earned,
      SUM(team1_champ1_damage_dealt + team1_champ2_damage_dealt + team1_champ3_damage_dealt + team1_champ4_damage_dealt + team1_champ5_damage_dealt) AS team_damage_dealt,
      team1_win AS win_rate
    FROM aram_matches
    WHERE arrayJoin(team1_champions) IN (${championArrayString})
    GROUP BY game_id, champion, team1_win
  ),

  team2_data AS (
    SELECT
      game_id,
      arrayJoin(team2_champions) AS champion,
      team1_win AS win,
      SUM(team2_champ1_kills) AS champ1_kills,
      SUM(team2_champ1_assists) AS champ1_assists,
      SUM(team2_champ1_deaths) AS champ1_deaths,
      SUM(team2_champ2_kills) AS champ2_kills,
      SUM(team2_champ2_assists) AS champ2_assists,
      SUM(team2_champ2_deaths) AS champ2_deaths,
      SUM(team2_champ3_kills) AS champ3_kills,
      SUM(team2_champ3_assists) AS champ3_assists,
      SUM(team2_champ3_deaths) AS champ3_deaths,
      SUM(team2_champ4_kills) AS champ4_kills,
      SUM(team2_champ4_assists) AS champ4_assists,
      SUM(team2_champ4_deaths) AS champ4_deaths,
      SUM(team2_champ5_kills) AS champ5_kills,
      SUM(team2_champ5_assists) AS champ5_assists,
      SUM(team2_champ5_deaths) AS champ5_deaths,
      SUM(team2_champ1_gold_earned + team2_champ2_gold_earned + team2_champ3_gold_earned + team2_champ4_gold_earned + team2_champ5_gold_earned) AS team_gold_earned,
      SUM(team2_champ1_damage_dealt + team2_champ2_damage_dealt + team2_champ3_damage_dealt + team2_champ4_damage_dealt + team2_champ5_damage_dealt) AS team_damage_dealt,
      (1 - team1_win) AS win_rate
    FROM aram_matches
    WHERE arrayJoin(team2_champions) IN (${championArrayString})
    GROUP BY game_id, champion, team1_win
  ),

  combined_data AS (
    SELECT * FROM team1_data
    UNION ALL
    SELECT * FROM team2_data
  )

SELECT
  champion,
  AVG(win_rate) AS avg_win_rate,
  AVG((champ1_kills + champ1_assists) / GREATEST(1, champ1_deaths)) AS avg_kda,
  AVG(team_gold_earned) AS avg_gold,
  AVG(team_damage_dealt) AS avg_damage
FROM
  combined_data
GROUP BY
  champion
ORDER BY
  champion;
`;

let queryAllChampStats = `
WITH
  team1_data AS (
    SELECT
      game_id,
      arrayJoin(team1_champions) AS champion,
      team1_win AS win,
      SUM(team1_champ1_kills) AS champ1_kills,
      SUM(team1_champ1_assists) AS champ1_assists,
      SUM(team1_champ1_deaths) AS champ1_deaths,
      SUM(team1_champ2_kills) AS champ2_kills,
      SUM(team1_champ2_assists) AS champ2_assists,
      SUM(team1_champ2_deaths) AS champ2_deaths,
      SUM(team1_champ3_kills) AS champ3_kills,
      SUM(team1_champ3_assists) AS champ3_assists,
      SUM(team1_champ3_deaths) AS champ3_deaths,
      SUM(team1_champ4_kills) AS champ4_kills,
      SUM(team1_champ4_assists) AS champ4_assists,
      SUM(team1_champ4_deaths) AS champ4_deaths,
      SUM(team1_champ5_kills) AS champ5_kills,
      SUM(team1_champ5_assists) AS champ5_assists,
      SUM(team1_champ5_deaths) AS champ5_deaths,
      SUM(team1_champ1_gold_earned + team1_champ2_gold_earned + team1_champ3_gold_earned + team1_champ4_gold_earned + team1_champ5_gold_earned) AS team_gold_earned,
      SUM(team1_champ1_damage_dealt + team1_champ2_damage_dealt + team1_champ3_damage_dealt + team1_champ4_damage_dealt + team1_champ5_damage_dealt) AS team_damage_dealt,
      team1_win AS win_rate
    FROM aram_matches
    GROUP BY game_id, champion, team1_win

  ),

  team2_data AS (
    SELECT
      game_id,
      arrayJoin(team2_champions) AS champion,
      team1_win AS win,
      SUM(team2_champ1_kills) AS champ1_kills,
      SUM(team2_champ1_assists) AS champ1_assists,
      SUM(team2_champ1_deaths) AS champ1_deaths,
      SUM(team2_champ2_kills) AS champ2_kills,
      SUM(team2_champ2_assists) AS champ2_assists,
      SUM(team2_champ2_deaths) AS champ2_deaths,
      SUM(team2_champ3_kills) AS champ3_kills,
      SUM(team2_champ3_assists) AS champ3_assists,
      SUM(team2_champ3_deaths) AS champ3_deaths,
      SUM(team2_champ4_kills) AS champ4_kills,
      SUM(team2_champ4_assists) AS champ4_assists,
      SUM(team2_champ4_deaths) AS champ4_deaths,
      SUM(team2_champ5_kills) AS champ5_kills,
      SUM(team2_champ5_assists) AS champ5_assists,
      SUM(team2_champ5_deaths) AS champ5_deaths,
      SUM(team2_champ1_gold_earned + team2_champ2_gold_earned + team2_champ3_gold_earned + team2_champ4_gold_earned + team2_champ5_gold_earned) AS team_gold_earned,
      SUM(team2_champ1_damage_dealt + team2_champ2_damage_dealt + team2_champ3_damage_dealt + team2_champ4_damage_dealt + team2_champ5_damage_dealt) AS team_damage_dealt,
      (1 - team1_win) AS win_rate
    FROM aram_matches
    GROUP BY game_id, champion, team1_win
  ),

  combined_data AS (
    SELECT * FROM team1_data
    UNION ALL
    SELECT * FROM team2_data
  )

SELECT
  champion,
  AVG(win_rate) AS avg_win_rate,
  AVG((champ1_kills + champ1_assists) / GREATEST(1, champ1_deaths)) AS avg_kda,
  AVG(team_gold_earned) AS avg_gold,
  AVG(team_damage_dealt) AS avg_damage
FROM
  combined_data
GROUP BY
  champion
ORDER BY
  champion;
`;

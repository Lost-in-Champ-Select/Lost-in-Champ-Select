

const teamWinRates = async (winRates) => {
  // Split the win rates into two teams
  let team1 = winRates.slice(0, 5);
  let team2 = winRates.slice(5);

  // Calculate average win rate for each team
  const avgWinRate = (team) => team.reduce((sum, champ) => sum + champ.win_rate, 0) / team.length;

  const avgModifiedWinRate = (team) =>
    team.reduce((sum, champ) => sum + champ.modified_win_rate, 0) / team.length;

  const team1WinRate = avgWinRate(team1);
  const team2WinRate = avgWinRate(team2);

  const team1ModifiedWinRate = avgModifiedWinRate(team1);
  const team2ModifiedWinRate = avgModifiedWinRate(team2);

  // Calculate the chance to win
  const totalWinRate = team1WinRate + team2WinRate;
  const team1Chance = team1WinRate / totalWinRate;
  const team2Chance = team2WinRate / totalWinRate;

  const totalModifiedWinRate = team1ModifiedWinRate + team2ModifiedWinRate;
  const team1ModifiedChance = team1ModifiedWinRate / totalModifiedWinRate;
  const team2ModifiedChance = team2ModifiedWinRate / totalModifiedWinRate;

  return {
    team1Chance: Math.round(team1Chance * 100), // Convert to percentage
    team2Chance: Math.round(team2Chance * 100)  // Convert to percentage
    team1ModifiedChance: Math.round(team1ModifiedChance * 100), // Convert to percentage
    team2ModifiedChance: Math.round(team2ModifiedChance * 100)  // Convert to percentage
  };
}

export default teamWinRates
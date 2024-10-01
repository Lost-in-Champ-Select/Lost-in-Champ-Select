
// Define a function to calculate modified win rates
export const calculateModifiedWinRates = async (champions) => {
  // Calculate baseline values
  const averageKDA =
    champions.reduce((sum, champ) => sum + champ.avg_kda, 0) / champions.length;
  const averageGold =
    champions.reduce((sum, champ) => sum + champ.avg_gold, 0) /
    champions.length;
  const averageDamage =
    champions.reduce((sum, champ) => sum + champ.avg_damage, 0) /
    champions.length;

  // Modify original objects
  champions.forEach((champ) => {
    let modifiedWinRate = champ.avg_win_rate;

    // Modify win rate based on KDA
    if (champ.avg_kda > averageKDA) {
      modifiedWinRate += 0.05; // Increase win rate by 5%
    } else {
      modifiedWinRate -= 0.05; // Decrease win rate by 5%
    }

    // Modify win rate based on gold earned
    if (champ.avg_gold > averageGold) {
      modifiedWinRate += 0.03; // Increase win rate by 3%
    } else {
      modifiedWinRate -= 0.03; // Decrease win rate by 3%
    }

    // Modify win rate based on damage dealt
    if (champ.avg_damage > averageDamage) {
      modifiedWinRate += 0.02; // Increase win rate by 2%
    } else {
      modifiedWinRate -= 0.02; // Decrease win rate by 2%
    }

    // Ensure modified win rate stays within [0, 1]
    modifiedWinRate = Math.max(0, Math.min(1, modifiedWinRate));

    // Round to two decimal places and add it to the champion object
    champ.modified_win_rate = parseFloat(modifiedWinRate.toFixed(2));
  });

  return champions; // Return the modified champion objects
}



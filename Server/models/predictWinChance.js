//! championsData is hardcoded for testing for now until i create testing file
const championsData = [
  {
    champion: "Irelia",
    avg_win_rate: 0.495,
    avg_kda: 3.69,
    avg_gold: 65079.84,
    avg_damage: 310477.95,
  },
  {
    champion: "Janna",
    avg_win_rate: 0.501,
    avg_kda: 4.64,
    avg_gold: 66700.81,
    avg_damage: 321948.69,
  },
  {
    champion: "Jayce",
    avg_win_rate: 0.443,
    avg_kda: 3.88,
    avg_gold: 67668.34,
    avg_damage: 329508.75,
  },
  {
    champion: "Jinx",
    avg_win_rate: 0.524,
    avg_kda: 3.98,
    avg_gold: 65589.84,
    avg_damage: 317324.13,
  },
  {
    champion: "Nasus",
    avg_win_rate: 0.54,
    avg_kda: 3.79,
    avg_gold: 67180.11,
    avg_damage: 332862.39,
  },
  {
    champion: "Tristana",
    avg_win_rate: 0.479,
    avg_kda: 3.81,
    avg_gold: 65573.6,
    avg_damage: 315127.66,
  },
  {
    champion: "Tryndamere",
    avg_win_rate: 0.519,
    avg_kda: 3.81,
    avg_gold: 65480.22,
    avg_damage: 314319.9,
  },
  {
    champion: "Varus",
    avg_win_rate: 0.499,
    avg_kda: 4.12,
    avg_gold: 67682.55,
    avg_damage: 328138.53,
  },
  {
    champion: "Vi",
    avg_win_rate: 0.513,
    avg_kda: 3.8,
    avg_gold: 66740.63,
    avg_damage: 318365.36,
  },
];

// Calculate baseline values
const averageKDA =
  championsData.reduce((sum, champ) => sum + champ.avg_kda, 0) /
  championsData.length;
const averageGold =
  championsData.reduce((sum, champ) => sum + champ.avg_gold, 0) /
  championsData.length;
const averageDamage =
  championsData.reduce((sum, champ) => sum + champ.avg_damage, 0) /
  championsData.length;

//! Define a function to apply modifiers (modify win rates based on custom variables)
function applyModifiers(champions) {
  return champions.map((champ) => {
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

    return {
      champion: champ.champion,
      modified_win_rate: modifiedWinRate,
    };
  });
}

// Apply modifiers and infer winning chances
const modifiedWinRates = applyModifiers(championsData);
console.log(modifiedWinRates);

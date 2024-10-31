# Lost in Champ Select

**Version**: 1.0.0
**Author**: Cory Zauss

## Description
**Lost in Champ Select** is a live game analysis tool designed to offer insights into champion compositions in real-time. This application utilizes a multi-database approach, with a ClickHouse database to store match data and a PostgreSQL database to track observed matches and players. The backend API interfaces with the Riot Games API to pull live game data, which is then processed against data from completed matches and routed to the frontend via an Express server.

## Features
- **Live Game Analysis**: Retrieves and displays real-time champion statistics.
- **Match Tracking**: Stores match details and player information for historical tracking.
- **Frontend Integration**: Built with React, the frontend displays live and historical match data with detailed analysis.

## Table of Contents
- [Installation](#installation)
- [Usage](#usage)
- [Scripts](#scripts)
- [Server Setup](#server-setup)
- [API Endpoints](#api-endpoints)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)

## Installation
1. Clone the repository:
```plaintext
   git clone https://github.com/Lost-in-Champ-Select/Lost-in-Champ-Select.git
   cd Lost-in-Champ-Select
```

2. Install dependancies
```plaintext
    npm install
```

## Usage

1. **Set up environment variables**: Create a `.env` file in the root directory of your project and add the following variables:
```plaintext
    CLICKHOUSE_URI=your_clickhouse_uri_here
    PG_USER=your_pg_user_here
    PG_HOST=your_pg_host_here
    PG_DATABASE=your_pg_database_here
    PG_PASSWORD=your_pg_password_here
    PG_PORT=your_pg_port_here
    RIOT_API_KEY=your_riot_api_key_here
    ALLOWED_ORIGINS=your_allowed_origins_here
    PORT=your_port_here
```

2. **Run the application**:
```plaintext
    npm start
```

## Scripts

The following scripts are available in this project:

```plaintext
npm start: Starts the server with nodemon, running the API and server in Server/index.js.
npm run build:dev: Builds the project for development using Webpack.
npm run build:production: Builds the project for production deployment using Webpack.
```

## Server Setup

The server is an Express application that listens on port 4000 and serves both static files and API routes. Notable configuration details include:

CORS: Configured to allow only specific origins.

add origins via a key in your .env file

If a request comes from an origin not in this list, it will be blocked by CORS. This enhances the API's security by limiting access to known domains.

## API Endpoints

The application exposes the following API endpoints:

GET /account-by-puuid: Retrieve account information by PUUID
GET /account-by-summoner-name: Retrieve account information by summoner name
GET /single-match/:id: Retrieve a specific match by its ID
GET /live-match: Retrieve live match information
GET /aram-win-rates: Retrieve ARAM win rates from the database


___

## Key Points

### 1. storeMatchV3.js

#### Overview

The storeMatchV3.js file is responsible for storing match data into the ClickHouse database. It handles the parsing and insertion of match details, ensuring data integrity and optimizing performance during storage.

#### Key Functions

storeMatchData(matchData)

#### Description: This function accepts match data and inserts it into the ClickHouse database.

#### Parameters:

matchData (Object): An object containing all relevant information about the match.

#### Functionality:
-Validates the match data format.
-Constructs an SQL insert statement to store the data.
-Executes the insertion query against the ClickHouse database.

#### Usage
This file should be imported wherever match data needs to be stored, typically after a match has been completed and the data has been fetched.

### 2. clickhouseQueries.js

#### Overview

The clickhouseQueries.js file contains functions for querying data from the ClickHouse database. It provides an abstraction layer to interact with the database and perform various operations such as fetching match data, win rates, and champion statistics.

#### Key Functions

getMatchById(matchId)

#### Description: Retrieves match details by its ID.

#### Parameters:
matchId (String): The unique identifier for the match.

#### Returns: A promise that resolves to the match data object.

#### Description: Fetches the ARAM win rates for champions from the database.
#### Returns: A promise that resolves to an array of win rate data.
Example:

#### Usage
Use this file when you need to perform queries against the ClickHouse database for match data retrieval or analytics.

### 3. predictWinChance.js

#### Overview

The predictWinChance.js file contains logic for calculating the probability of a team winning based on champion statistics and match data. This predictive modeling utilizes various algorithms to assess team compositions.

#### Key Functions

calculateWinChance(teamA, teamB)

#### Description: Estimates the winning probability for Team A against Team B based on their champion statistics.

#### Parameters:
teamA (Array): Array of champions in Team A.
teamB (Array): Array of champions in Team B.

#### Returns: A score representing the probability of Team A winning.

#### Usage
This file is used when evaluating matchups, particularly in scenarios where you want to provide insights into team compositions and their likelihood of winning.

### 4. queryChampData.js

Overview

The queryChampData.js file is designed to retrieve champion data from the database or an external API. This data is essential for determining champion attributes, abilities, and statistics needed for various calculations.

#### Key Functions

fetchChampionData(championName)

#### Description: Retrieves detailed information about a specific champion.

#### Parameters:
championName (String): The name of the champion to query.

#### Returns: A promise that resolves to the champion's data object.

#### Usage
This file should be imported when champion-specific data is needed, especially for calculations related to win chances or match analysis.

### 5. teamWinRates.js

#### Overview

The teamWinRates.js file calculates and stores the win rates for various teams based on historical match data. It analyzes past matches to derive meaningful statistics and trends.

#### Key Functions

calculateTeamWinRates(teamId)

#### Description: Computes the win rate for a specified team based on historical match data.

#### Parameters:
teamId (String): The unique identifier for the team.

#### Returns: A promise that resolves to the team's win rate percentage.

#### Usage
This file is used in scenarios where team performance needs to be evaluated over time, allowing for a better understanding of win probabilities and match outcomes.


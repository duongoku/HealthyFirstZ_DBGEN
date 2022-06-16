# HealthyFirstZ_DBGEN
A data generator for HealthyFirstZ

## Prerequisites
- [Node.js](https://nodejs.org/en/download/)

## Installation
- Clone the repository and change working directory to the cloned directory
- Run 
```
npm install
```
to install the dependencies
- Create a .env file with a variable "MONGO_URI" and assign your mongodb uri to its value

## Usage
- Run
```
npm start
```
to start generating data

- If you want to custimize the data generation, you can run
```
npx ts-node index.ts [-db] [-file] [-seed <yourseed>]
```

- Note that the script will clear the database before generating data.

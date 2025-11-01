const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

// MongoDB connection URL - adjust as needed
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'palani-web';

async function importLocations() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    // Connect to MongoDB
    await client.connect();
    
    const db = client.db(DB_NAME);
    
    // Drop existing collections to start fresh
    try {
      await db.collection('countries').drop();
      await db.collection('states').drop();
      await db.collection('cities').drop();
    } catch (error) {
      // Collections may not exist, continuing...
    }
    
    // Read the JSON file
    const jsonPath = path.join(__dirname, '..', 'countries+states+cities.json');
    
    const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    
    // Collections
    const countriesCollection = db.collection('countries');
    const statesCollection = db.collection('states');
    const citiesCollection = db.collection('cities');
    
    let countryCount = 0;
    let stateCount = 0;
    let cityCount = 0;
    
    // Process each country
    for (const country of jsonData) {
      // Insert country - using schema-compatible structure
      const countryDoc = {
        _id: country.id.toString(),
        serialNo: countryCount + 1,
        name: country.name,
        code: country.iso2, // Map iso2 to code
        dialingCode: country.phonecode, // Map phonecode to dialingCode
        // Store additional data for reference
        iso2: country.iso2,
        iso3: country.iso3,
        numeric_code: country.numeric_code,
        capital: country.capital,
        currency: country.currency,
        currency_name: country.currency_name,
        currency_symbol: country.currency_symbol,
        tld: country.tld,
        native: country.native,
        population: country.population,
        region: country.region,
        region_id: country.region_id,
        subregion: country.subregion,
        subregion_id: country.subregion_id,
        nationality: country.nationality,
        latitude: country.latitude,
        longitude: country.longitude,
        emoji: country.emoji,
        emojiU: country.emojiU,
        timezones: country.timezones,
        translations: country.translations,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await countriesCollection.insertOne(countryDoc);
      countryCount++;
      
      // Process states for this country
      if (country.states && country.states.length > 0) {
        for (const state of country.states) {
          const stateDoc = {
            _id: state.id.toString(),
            serialNo: stateCount + 1,
            name: state.name,
            code: state.iso2 || state.name.substring(0, 3).toUpperCase(), // Map iso2 to code, fallback to first 3 chars
            countryId: country.id.toString(),
            countryName: country.name,
            // Store additional data for reference
            iso2: state.iso2,
            iso3166_2: state.iso3166_2,
            native: state.native,
            latitude: state.latitude,
            longitude: state.longitude,
            type: state.type,
            timezone: state.timezone,
            countryCode: country.iso2,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          await statesCollection.insertOne(stateDoc);
          stateCount++;
          
          // Process cities for this state
          if (state.cities && state.cities.length > 0) {
            for (const city of state.cities) {
              const cityDoc = {
                _id: city.id.toString(),
                name: city.name,
                latitude: city.latitude,
                longitude: city.longitude,
                timezone: city.timezone,
                stateId: state.id.toString(),
                stateName: state.name,
                stateCode: state.iso2,
                countryId: country.id.toString(),
                countryName: country.name,
                countryCode: country.iso2,
                serialNo: cityCount + 1,
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date()
              };
              
              await citiesCollection.insertOne(cityDoc);
              cityCount++;
            }
          }
        }
      }
      
      // Progress logging
    }
    
    // Create indexes for better performance
    await countriesCollection.createIndex({ name: 1 });
    await countriesCollection.createIndex({ iso2: 1 });
    await countriesCollection.createIndex({ iso3: 1 });
    await countriesCollection.createIndex({ isActive: 1 });
    
    await statesCollection.createIndex({ name: 1 });
    await statesCollection.createIndex({ countryId: 1 });
    await statesCollection.createIndex({ isActive: 1 });
    await statesCollection.createIndex({ countryId: 1, isActive: 1 });
    
    await citiesCollection.createIndex({ name: 1 });
    await citiesCollection.createIndex({ stateId: 1 });
    await citiesCollection.createIndex({ countryId: 1 });
    await citiesCollection.createIndex({ isActive: 1 });
    await citiesCollection.createIndex({ stateId: 1, isActive: 1 });
    await citiesCollection.createIndex({ countryId: 1, isActive: 1 });
    
  } catch (error) {
    console.error('❌ Error importing locations:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

// Run the import
if (require.main === module) {
  importLocations().then(() => {
    process.exit(0);
  }).catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { importLocations };
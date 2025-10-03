const { MongoClient } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://marinandhu659:X1BMVtt0fnEFHrxb@cluster0.rlgy9uh.mongodb.net/palani_pathayathirai';

// Sample states data for different countries
const statesData = [
  // Indian States
  { name: 'Tamil Nadu', code: 'TN', countryName: 'India' },
  { name: 'Karnataka', code: 'KA', countryName: 'India' },
  { name: 'Kerala', code: 'KL', countryName: 'India' },
  { name: 'Andhra Pradesh', code: 'AP', countryName: 'India' },
  { name: 'Telangana', code: 'TG', countryName: 'India' },
  { name: 'Maharashtra', code: 'MH', countryName: 'India' },
  { name: 'Gujarat', code: 'GJ', countryName: 'India' },
  { name: 'Rajasthan', code: 'RJ', countryName: 'India' },
  { name: 'Uttar Pradesh', code: 'UP', countryName: 'India' },
  { name: 'West Bengal', code: 'WB', countryName: 'India' },
  { name: 'Punjab', code: 'PB', countryName: 'India' },
  { name: 'Haryana', code: 'HR', countryName: 'India' },
  { name: 'Himachal Pradesh', code: 'HP', countryName: 'India' },
  { name: 'Uttarakhand', code: 'UK', countryName: 'India' },
  { name: 'Bihar', code: 'BR', countryName: 'India' },
  { name: 'Jharkhand', code: 'JH', countryName: 'India' },
  { name: 'Odisha', code: 'OR', countryName: 'India' },
  { name: 'Chhattisgarh', code: 'CG', countryName: 'India' },
  { name: 'Madhya Pradesh', code: 'MP', countryName: 'India' },
  { name: 'Assam', code: 'AS', countryName: 'India' },
  { name: 'Arunachal Pradesh', code: 'AR', countryName: 'India' },
  { name: 'Manipur', code: 'MN', countryName: 'India' },
  { name: 'Meghalaya', code: 'ML', countryName: 'India' },
  { name: 'Mizoram', code: 'MZ', countryName: 'India' },
  { name: 'Nagaland', code: 'NL', countryName: 'India' },
  { name: 'Sikkim', code: 'SK', countryName: 'India' },
  { name: 'Tripura', code: 'TR', countryName: 'India' },
  { name: 'Goa', code: 'GA', countryName: 'India' },
  
  // US States (sample)
  { name: 'California', code: 'CA', countryName: 'United States' },
  { name: 'Texas', code: 'TX', countryName: 'United States' },
  { name: 'Florida', code: 'FL', countryName: 'United States' },
  { name: 'New York', code: 'NY', countryName: 'United States' },
  { name: 'Pennsylvania', code: 'PA', countryName: 'United States' },
  { name: 'Illinois', code: 'IL', countryName: 'United States' },
  { name: 'Ohio', code: 'OH', countryName: 'United States' },
  { name: 'Georgia', code: 'GA', countryName: 'United States' },
  { name: 'North Carolina', code: 'NC', countryName: 'United States' },
  { name: 'Michigan', code: 'MI', countryName: 'United States' },
  
  // UK Regions
  { name: 'England', code: 'ENG', countryName: 'United Kingdom' },
  { name: 'Scotland', code: 'SCT', countryName: 'United Kingdom' },
  { name: 'Wales', code: 'WLS', countryName: 'United Kingdom' },
  { name: 'Northern Ireland', code: 'NIR', countryName: 'United Kingdom' },
  
  // Canada Provinces
  { name: 'Ontario', code: 'ON', countryName: 'Canada' },
  { name: 'Quebec', code: 'QC', countryName: 'Canada' },
  { name: 'British Columbia', code: 'BC', countryName: 'Canada' },
  { name: 'Alberta', code: 'AB', countryName: 'Canada' },
  { name: 'Manitoba', code: 'MB', countryName: 'Canada' },
  { name: 'Saskatchewan', code: 'SK', countryName: 'Canada' },
  
  // Australia States
  { name: 'New South Wales', code: 'NSW', countryName: 'Australia' },
  { name: 'Victoria', code: 'VIC', countryName: 'Australia' },
  { name: 'Queensland', code: 'QLD', countryName: 'Australia' },
  { name: 'Western Australia', code: 'WA', countryName: 'Australia' },
  { name: 'South Australia', code: 'SA', countryName: 'Australia' },
  { name: 'Tasmania', code: 'TAS', countryName: 'Australia' },
];

async function populateStates() {
  let client;
  
  try {
    console.log('Connecting to MongoDB...');
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const db = client.db();
    const countriesCollection = db.collection('countries');
    const statesCollection = db.collection('states');
    
    console.log('Connected to MongoDB successfully!');
    
    // Clear existing states
    await statesCollection.deleteMany({});
    console.log('Cleared existing states data');
    
    // Get all countries to match with states
    const countries = await countriesCollection.find({}).toArray();
    const countryMap = new Map();
    countries.forEach(country => {
      countryMap.set(country.name, country._id);
    });
    
    console.log(`Found ${countries.length} countries in database`);
    
    // Process states data
    const statesToInsert = [];
    let serialNo = 1;
    
    for (const stateData of statesData) {
      const countryId = countryMap.get(stateData.countryName);
      
      if (countryId) {
        statesToInsert.push({
          serialNo: serialNo++,
          name: stateData.name,
          code: stateData.code,
          countryId: countryId,
          countryName: stateData.countryName,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      } else {
        console.log(`Country not found for state: ${stateData.name} (${stateData.countryName})`);
      }
    }
    
    if (statesToInsert.length > 0) {
      await statesCollection.insertMany(statesToInsert);
      console.log(`Successfully inserted ${statesToInsert.length} states`);
      
      // Create indexes for better performance
      await statesCollection.createIndex({ countryId: 1 });
      await statesCollection.createIndex({ name: 1 });
      await statesCollection.createIndex({ serialNo: 1 });
      console.log('Created database indexes');
    } else {
      console.log('No states were inserted - check if countries exist in database');
    }
    
  } catch (error) {
    console.error('Error populating states:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('Database connection closed');
    }
  }
}

// Run the script
if (require.main === module) {
  populateStates()
    .then(() => {
      console.log('States population completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed to populate states:', error);
      process.exit(1);
    });
}

module.exports = { populateStates };

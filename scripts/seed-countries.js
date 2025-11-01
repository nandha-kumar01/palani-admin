const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

// Read .env.local file
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf8');
  const envVars = envFile.split('\n');
  envVars.forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      process.env[key.trim()] = value.trim();
    }
  });
}

const countriesData = [
  { serialNo: 1, name: 'Afghanistan', code: 'AF', dialingCode: '+93' },
  { serialNo: 2, name: 'Albania', code: 'AL', dialingCode: '+355' },
  { serialNo: 3, name: 'Algeria', code: 'DZ', dialingCode: '+213' },
  { serialNo: 4, name: 'Andorra', code: 'AD', dialingCode: '+376' },
  { serialNo: 5, name: 'Angola', code: 'AO', dialingCode: '+244' },
  { serialNo: 6, name: 'Argentina', code: 'AR', dialingCode: '+54' },
  { serialNo: 7, name: 'Armenia', code: 'AM', dialingCode: '+374' },
  { serialNo: 8, name: 'Australia', code: 'AU', dialingCode: '+61' },
  { serialNo: 9, name: 'Austria', code: 'AT', dialingCode: '+43' },
  { serialNo: 10, name: 'Azerbaijan', code: 'AZ', dialingCode: '+994' },
  { serialNo: 11, name: 'Bahamas', code: 'BS', dialingCode: '+1-242' },
  { serialNo: 12, name: 'Bahrain', code: 'BH', dialingCode: '+973' },
  { serialNo: 13, name: 'Bangladesh', code: 'BD', dialingCode: '+880' },
  { serialNo: 14, name: 'Barbados', code: 'BB', dialingCode: '+1-246' },
  { serialNo: 15, name: 'Belarus', code: 'BY', dialingCode: '+375' },
  { serialNo: 16, name: 'Belgium', code: 'BE', dialingCode: '+32' },
  { serialNo: 17, name: 'Belize', code: 'BZ', dialingCode: '+501' },
  { serialNo: 18, name: 'Benin', code: 'BJ', dialingCode: '+229' },
  { serialNo: 19, name: 'Bhutan', code: 'BT', dialingCode: '+975' },
  { serialNo: 20, name: 'Bolivia', code: 'BO', dialingCode: '+591' },
  { serialNo: 21, name: 'Bosnia and Herzegovina', code: 'BA', dialingCode: '+387' },
  { serialNo: 22, name: 'Botswana', code: 'BW', dialingCode: '+267' },
  { serialNo: 23, name: 'Brazil', code: 'BR', dialingCode: '+55' },
  { serialNo: 24, name: 'Brunei', code: 'BN', dialingCode: '+673' },
  { serialNo: 25, name: 'Bulgaria', code: 'BG', dialingCode: '+359' },
  { serialNo: 26, name: 'Burkina Faso', code: 'BF', dialingCode: '+226' },
  { serialNo: 27, name: 'Burundi', code: 'BI', dialingCode: '+257' },
  { serialNo: 28, name: 'Cambodia', code: 'KH', dialingCode: '+855' },
  { serialNo: 29, name: 'Cameroon', code: 'CM', dialingCode: '+237' },
  { serialNo: 30, name: 'Canada', code: 'CA', dialingCode: '+1' },
  { serialNo: 31, name: 'Cape Verde', code: 'CV', dialingCode: '+238' },
  { serialNo: 32, name: 'Central African Republic', code: 'CF', dialingCode: '+236' },
  { serialNo: 33, name: 'Chad', code: 'TD', dialingCode: '+235' },
  { serialNo: 34, name: 'Chile', code: 'CL', dialingCode: '+56' },
  { serialNo: 35, name: 'China', code: 'CN', dialingCode: '+86' },
  { serialNo: 36, name: 'Colombia', code: 'CO', dialingCode: '+57' },
  { serialNo: 37, name: 'Comoros', code: 'KM', dialingCode: '+269' },
  { serialNo: 38, name: 'Congo', code: 'CG', dialingCode: '+242' },
  { serialNo: 39, name: 'Costa Rica', code: 'CR', dialingCode: '+506' },
  { serialNo: 40, name: 'Croatia', code: 'HR', dialingCode: '+385' },
  { serialNo: 41, name: 'Cuba', code: 'CU', dialingCode: '+53' },
  { serialNo: 42, name: 'Cyprus', code: 'CY', dialingCode: '+357' },
  { serialNo: 43, name: 'Czech Republic', code: 'CZ', dialingCode: '+420' },
  { serialNo: 44, name: 'Denmark', code: 'DK', dialingCode: '+45' },
  { serialNo: 45, name: 'Djibouti', code: 'DJ', dialingCode: '+253' },
  { serialNo: 46, name: 'Dominica', code: 'DM', dialingCode: '+1-767' },
  { serialNo: 47, name: 'Dominican Republic', code: 'DO', dialingCode: '+1-809' },
  { serialNo: 48, name: 'Ecuador', code: 'EC', dialingCode: '+593' },
  { serialNo: 49, name: 'Egypt', code: 'EG', dialingCode: '+20' },
  { serialNo: 50, name: 'El Salvador', code: 'SV', dialingCode: '+503' },
  { serialNo: 51, name: 'Equatorial Guinea', code: 'GQ', dialingCode: '+240' },
  { serialNo: 52, name: 'Eritrea', code: 'ER', dialingCode: '+291' },
  { serialNo: 53, name: 'Estonia', code: 'EE', dialingCode: '+372' },
  { serialNo: 54, name: 'Ethiopia', code: 'ET', dialingCode: '+251' },
  { serialNo: 55, name: 'Fiji', code: 'FJ', dialingCode: '+679' },
  { serialNo: 56, name: 'Finland', code: 'FI', dialingCode: '+358' },
  { serialNo: 57, name: 'France', code: 'FR', dialingCode: '+33' },
  { serialNo: 58, name: 'Gabon', code: 'GA', dialingCode: '+241' },
  { serialNo: 59, name: 'Gambia', code: 'GM', dialingCode: '+220' },
  { serialNo: 60, name: 'Georgia', code: 'GE', dialingCode: '+995' },
  { serialNo: 61, name: 'Germany', code: 'DE', dialingCode: '+49' },
  { serialNo: 62, name: 'Ghana', code: 'GH', dialingCode: '+233' },
  { serialNo: 63, name: 'Greece', code: 'GR', dialingCode: '+30' },
  { serialNo: 64, name: 'Grenada', code: 'GD', dialingCode: '+1-473' },
  { serialNo: 65, name: 'Guatemala', code: 'GT', dialingCode: '+502' },
  { serialNo: 66, name: 'Guinea', code: 'GN', dialingCode: '+224' },
  { serialNo: 67, name: 'Guinea-Bissau', code: 'GW', dialingCode: '+245' },
  { serialNo: 68, name: 'Guyana', code: 'GY', dialingCode: '+592' },
  { serialNo: 69, name: 'Haiti', code: 'HT', dialingCode: '+509' },
  { serialNo: 70, name: 'Honduras', code: 'HN', dialingCode: '+504' },
  { serialNo: 71, name: 'Hungary', code: 'HU', dialingCode: '+36' },
  { serialNo: 72, name: 'Iceland', code: 'IS', dialingCode: '+354' },
  { serialNo: 73, name: 'India', code: 'IN', dialingCode: '+91' },
  { serialNo: 74, name: 'Indonesia', code: 'ID', dialingCode: '+62' },
  { serialNo: 75, name: 'Iran', code: 'IR', dialingCode: '+98' },
  { serialNo: 76, name: 'Iraq', code: 'IQ', dialingCode: '+964' },
  { serialNo: 77, name: 'Ireland', code: 'IE', dialingCode: '+353' },
  { serialNo: 78, name: 'Israel', code: 'IL', dialingCode: '+972' },
  { serialNo: 79, name: 'Italy', code: 'IT', dialingCode: '+39' },
  { serialNo: 80, name: 'Jamaica', code: 'JM', dialingCode: '+1-876' },
  { serialNo: 81, name: 'Japan', code: 'JP', dialingCode: '+81' },
  { serialNo: 82, name: 'Jordan', code: 'JO', dialingCode: '+962' },
  { serialNo: 83, name: 'Kazakhstan', code: 'KZ', dialingCode: '+7' },
  { serialNo: 84, name: 'Kenya', code: 'KE', dialingCode: '+254' },
  { serialNo: 85, name: 'Kiribati', code: 'KI', dialingCode: '+686' },
  { serialNo: 86, name: 'Kuwait', code: 'KW', dialingCode: '+965' },
  { serialNo: 87, name: 'Kyrgyzstan', code: 'KG', dialingCode: '+996' },
  { serialNo: 88, name: 'Laos', code: 'LA', dialingCode: '+856' },
  { serialNo: 89, name: 'Latvia', code: 'LV', dialingCode: '+371' },
  { serialNo: 90, name: 'Lebanon', code: 'LB', dialingCode: '+961' },
  { serialNo: 91, name: 'Lesotho', code: 'LS', dialingCode: '+266' },
  { serialNo: 92, name: 'Liberia', code: 'LR', dialingCode: '+231' },
  { serialNo: 93, name: 'Libya', code: 'LY', dialingCode: '+218' },
  { serialNo: 94, name: 'Liechtenstein', code: 'LI', dialingCode: '+423' },
  { serialNo: 95, name: 'Lithuania', code: 'LT', dialingCode: '+370' },
  { serialNo: 96, name: 'Luxembourg', code: 'LU', dialingCode: '+352' },
  { serialNo: 97, name: 'Madagascar', code: 'MG', dialingCode: '+261' },
  { serialNo: 98, name: 'Malawi', code: 'MW', dialingCode: '+265' },
  { serialNo: 99, name: 'Malaysia', code: 'MY', dialingCode: '+60' },
  { serialNo: 100, name: 'Maldives', code: 'MV', dialingCode: '+960' },
  { serialNo: 101, name: 'Mali', code: 'ML', dialingCode: '+223' },
  { serialNo: 102, name: 'Malta', code: 'MT', dialingCode: '+356' },
  { serialNo: 103, name: 'Marshall Islands', code: 'MH', dialingCode: '+692' },
  { serialNo: 104, name: 'Mauritania', code: 'MR', dialingCode: '+222' },
  { serialNo: 105, name: 'Mauritius', code: 'MU', dialingCode: '+230' },
  { serialNo: 106, name: 'Mexico', code: 'MX', dialingCode: '+52' },
  { serialNo: 107, name: 'Micronesia', code: 'FM', dialingCode: '+691' },
  { serialNo: 108, name: 'Moldova', code: 'MD', dialingCode: '+373' },
  { serialNo: 109, name: 'Monaco', code: 'MC', dialingCode: '+377' },
  { serialNo: 110, name: 'Mongolia', code: 'MN', dialingCode: '+976' },
  { serialNo: 111, name: 'Montenegro', code: 'ME', dialingCode: '+382' },
  { serialNo: 112, name: 'Morocco', code: 'MA', dialingCode: '+212' },
  { serialNo: 113, name: 'Mozambique', code: 'MZ', dialingCode: '+258' },
  { serialNo: 114, name: 'Myanmar', code: 'MM', dialingCode: '+95' },
  { serialNo: 115, name: 'Namibia', code: 'NA', dialingCode: '+264' },
  { serialNo: 116, name: 'Nauru', code: 'NR', dialingCode: '+674' },
  { serialNo: 117, name: 'Nepal', code: 'NP', dialingCode: '+977' },
  { serialNo: 118, name: 'Netherlands', code: 'NL', dialingCode: '+31' },
  { serialNo: 119, name: 'New Zealand', code: 'NZ', dialingCode: '+64' },
  { serialNo: 120, name: 'Nicaragua', code: 'NI', dialingCode: '+505' },
  { serialNo: 121, name: 'Niger', code: 'NE', dialingCode: '+227' },
  { serialNo: 122, name: 'Nigeria', code: 'NG', dialingCode: '+234' },
  { serialNo: 123, name: 'North Korea', code: 'KP', dialingCode: '+850' },
  { serialNo: 124, name: 'North Macedonia', code: 'MK', dialingCode: '+389' },
  { serialNo: 125, name: 'Norway', code: 'NO', dialingCode: '+47' },
  { serialNo: 126, name: 'Oman', code: 'OM', dialingCode: '+968' },
  { serialNo: 127, name: 'Pakistan', code: 'PK', dialingCode: '+92' },
  { serialNo: 128, name: 'Palau', code: 'PW', dialingCode: '+680' },
  { serialNo: 129, name: 'Panama', code: 'PA', dialingCode: '+507' },
  { serialNo: 130, name: 'Papua New Guinea', code: 'PG', dialingCode: '+675' },
  { serialNo: 131, name: 'Paraguay', code: 'PY', dialingCode: '+595' },
  { serialNo: 132, name: 'Peru', code: 'PE', dialingCode: '+51' },
  { serialNo: 133, name: 'Philippines', code: 'PH', dialingCode: '+63' },
  { serialNo: 134, name: 'Poland', code: 'PL', dialingCode: '+48' },
  { serialNo: 135, name: 'Portugal', code: 'PT', dialingCode: '+351' },
  { serialNo: 136, name: 'Qatar', code: 'QA', dialingCode: '+974' },
  { serialNo: 137, name: 'Romania', code: 'RO', dialingCode: '+40' },
  { serialNo: 138, name: 'Russia', code: 'RU', dialingCode: '+7' },
  { serialNo: 139, name: 'Rwanda', code: 'RW', dialingCode: '+250' },
  { serialNo: 140, name: 'Saint Kitts and Nevis', code: 'KN', dialingCode: '+1-869' },
  { serialNo: 141, name: 'Saint Lucia', code: 'LC', dialingCode: '+1-758' },
  { serialNo: 142, name: 'Saint Vincent and the Grenadines', code: 'VC', dialingCode: '+1-784' },
  { serialNo: 143, name: 'Samoa', code: 'WS', dialingCode: '+685' },
  { serialNo: 144, name: 'San Marino', code: 'SM', dialingCode: '+378' },
  { serialNo: 145, name: 'Saudi Arabia', code: 'SA', dialingCode: '+966' },
  { serialNo: 146, name: 'Senegal', code: 'SN', dialingCode: '+221' },
  { serialNo: 147, name: 'Serbia', code: 'RS', dialingCode: '+381' },
  { serialNo: 148, name: 'Seychelles', code: 'SC', dialingCode: '+248' },
  { serialNo: 149, name: 'Sierra Leone', code: 'SL', dialingCode: '+232' },
  { serialNo: 150, name: 'Singapore', code: 'SG', dialingCode: '+65' },
  { serialNo: 151, name: 'Slovakia', code: 'SK', dialingCode: '+421' },
  { serialNo: 152, name: 'Slovenia', code: 'SI', dialingCode: '+386' },
  { serialNo: 153, name: 'Solomon Islands', code: 'SB', dialingCode: '+677' },
  { serialNo: 154, name: 'Somalia', code: 'SO', dialingCode: '+252' },
  { serialNo: 155, name: 'South Africa', code: 'ZA', dialingCode: '+27' },
  { serialNo: 156, name: 'South Korea', code: 'KR', dialingCode: '+82' },
  { serialNo: 157, name: 'South Sudan', code: 'SS', dialingCode: '+211' },
  { serialNo: 158, name: 'Spain', code: 'ES', dialingCode: '+34' },
  { serialNo: 159, name: 'Sri Lanka', code: 'LK', dialingCode: '+94' },
  { serialNo: 160, name: 'Sudan', code: 'SD', dialingCode: '+249' },
  { serialNo: 161, name: 'Suriname', code: 'SR', dialingCode: '+597' },
  { serialNo: 162, name: 'Sweden', code: 'SE', dialingCode: '+46' },
  { serialNo: 163, name: 'Switzerland', code: 'CH', dialingCode: '+41' },
  { serialNo: 164, name: 'Syria', code: 'SY', dialingCode: '+963' },
  { serialNo: 165, name: 'Taiwan', code: 'TW', dialingCode: '+886' },
  { serialNo: 166, name: 'Tajikistan', code: 'TJ', dialingCode: '+992' },
  { serialNo: 167, name: 'Tanzania', code: 'TZ', dialingCode: '+255' },
  { serialNo: 168, name: 'Thailand', code: 'TH', dialingCode: '+66' },
  { serialNo: 169, name: 'Timor-Leste', code: 'TL', dialingCode: '+670' },
  { serialNo: 170, name: 'Togo', code: 'TG', dialingCode: '+228' },
  { serialNo: 171, name: 'Tonga', code: 'TO', dialingCode: '+676' },
  { serialNo: 172, name: 'Trinidad and Tobago', code: 'TT', dialingCode: '+1-868' },
  { serialNo: 173, name: 'Tunisia', code: 'TN', dialingCode: '+216' },
  { serialNo: 174, name: 'Turkey', code: 'TR', dialingCode: '+90' },
  { serialNo: 175, name: 'Turkmenistan', code: 'TM', dialingCode: '+993' },
  { serialNo: 176, name: 'Tuvalu', code: 'TV', dialingCode: '+688' },
  { serialNo: 177, name: 'Uganda', code: 'UG', dialingCode: '+256' },
  { serialNo: 178, name: 'Ukraine', code: 'UA', dialingCode: '+380' },
  { serialNo: 179, name: 'United Arab Emirates', code: 'AE', dialingCode: '+971' },
  { serialNo: 180, name: 'United Kingdom', code: 'GB', dialingCode: '+44' },
  { serialNo: 181, name: 'United States', code: 'US', dialingCode: '+1' },
  { serialNo: 182, name: 'Uruguay', code: 'UY', dialingCode: '+598' },
  { serialNo: 183, name: 'Uzbekistan', code: 'UZ', dialingCode: '+998' },
  { serialNo: 184, name: 'Vanuatu', code: 'VU', dialingCode: '+678' },
  { serialNo: 185, name: 'Vatican City', code: 'VA', dialingCode: '+379' },
  { serialNo: 186, name: 'Venezuela', code: 'VE', dialingCode: '+58' },
  { serialNo: 187, name: 'Vietnam', code: 'VN', dialingCode: '+84' },
  { serialNo: 188, name: 'Yemen', code: 'YE', dialingCode: '+967' },
  { serialNo: 189, name: 'Zambia', code: 'ZM', dialingCode: '+260' },
  { serialNo: 190, name: 'Zimbabwe', code: 'ZW', dialingCode: '+263' },
];

async function seedCountries() {
  if (!process.env.MONGODB_URI) {
    console.error('Please define the MONGODB_URI environment variable inside .env.local');
    process.exit(1);
  }

  const client = new MongoClient(process.env.MONGODB_URI);

  try {
    await client.connect();

    const database = client.db();
    const countries = database.collection('countries');

    // Clear existing countries
    const deleteResult = await countries.deleteMany({});

    // Insert all countries with timestamps
    const countriesWithTimestamps = countriesData.map(country => ({
      ...country,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    const insertResult = await countries.insertMany(countriesWithTimestamps);


    // Create indexes
    await countries.createIndex({ serialNo: 1 }, { unique: true });
    await countries.createIndex({ code: 1 }, { unique: true });
    await countries.createIndex({ name: 1 });
    await countries.createIndex({ dialingCode: 1 });
    await countries.createIndex({ isActive: 1 });
    


  } catch (error) {
    console.error('Error seeding countries:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

// Run the seed function
seedCountries();

const { connectDB } = require('../src/lib/mongodb');

// Sample cities data for Indian states
const citiesData = {
  // Tamil Nadu cities
  'TN': [
    'Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tirunelveli',
    'Erode', 'Vellore', 'Thoothukudi', 'Dindigul', 'Thanjavur', 'Ranipet',
    'Sivakasi', 'Karur', 'Udhagamandalam', 'Hosur', 'Nagercoil', 'Kanchipuram',
    'Kumarakonam', 'Pudukkottai', 'Pollachi', 'Rajapalayam', 'Gudiyatham',
    'Vaniyambadi', 'Ambur', 'Nagapattinam', 'Virudhunagar', 'Aruppukkottai',
    'Coonoor', 'Kumbakonam', 'Mayiladuthurai', 'Gobichettipalayam', 'Neyveli',
    'Palladam', 'Palani', 'Mettupalayam', 'Kovilpatti', 'Perundurai', 'Ariyalur', 'Chengalpattu', 'Viluppuram', 'Villupuram', 'Namakkal', 'Dharmapuri',
  'Krishnagiri', 'Tenkasi', 'Perambalur', 'Tiruvarur', 'Theni', 'Sankagiri',
  'Attur', 'Namakkal', 'Rasipuram', 'Paramakudi', 'Ramanathapuram', 'Keelakarai',
  'Sivaganga', 'Devakottai', 'Karaikudi', 'Manapparai', 'Musiri', 'Kulithalai',
  'Thuraiyur', 'Perambalur', 'Ariyalur', 'Jayankondam', 'Sendurai', 'Lalgudi',
  'Srirangam', 'Mannargudi', 'Thiruthuraipoondi', 'Thiruvarur', 'Koothanallur',
  'Valangaiman', 'Needamangalam', 'Papanasam', 'Orathanadu', 'Pattukkottai',
  'Peravurani', 'Adirampattinam', 'Kumbakonam', 'Swamimalai', 'Thiruvidaimaruthur',
  'Sirkazhi', 'Vedaranyam', 'Nagore', 'Velankanni', 'Kollidam', 'Chidambaram',
  'Portonovo', 'Cuddalore', 'Panruti', 'Nellikuppam', 'Parangipettai', 'Virudhachalam',
  'Bhuvanagiri', 'Srimushnam', 'Thittakudi', 'Auroville', 'Tindivanam', 'Gingee',
  'Kalasapakkam', 'Polur', 'Arani', 'Cheyyar', 'Vandavasi', 'Tiruvannamalai',
  'Padavedu', 'Chetpet', 'Ambattur', 'Avadi', 'Tambaram', 'Pallavaram', 'Chromepet',
  'Guduvanchery', 'Singaperumalkoil', 'Maraimalainagar', 'Sriperumbudur', 'Walajabad',
  'Kanchipuram', 'Thiruporur', 'Kelambakkam', 'Mahabalipuram', 'Thirukazhukundram',
  'Maduranthakam', 'Melmaruvathur', 'Ulundurpet', 'Sankarapuram', 'Kallakurichi',
  'Chinnasalem', 'Kalrayan Hills', 'Pennadam', 'Vriddhachalam', 'Idappadi',
  'Mettur', 'Omalur', 'Edappadi', 'Yercaud', 'Attayampatti', 'Gangavalli',
  'Thammampatti', 'Harur', 'Morappur', 'Pennagaram', 'Pappireddipatti', 'Palacode',
  'Denkanikottai', 'Anchetty', 'Mathur', 'Bargur', 'Uthangarai', 'Pochampalli',
  'Thally', 'Shoolagiri', 'Gudiyattam', 'Vellore Fort Area', 'Katpadi',
  'Arcot', 'Walajapet', 'Sholinghur', 'Arakkonam', 'Thiruthani', 'Peranambut',
  'Pernambut', 'Ambur', 'Natrampalli', 'Vaniyambadi', 'Jolarpettai', 'Tirupattur',
  'Alangayam', 'Ambalur', 'Udumalpet', 'Dharapuram', 'Avinashi', 'Annur',
  'Kodumudi', 'Bhavani', 'Sathyamangalam', 'Anthiyur', 'Ammapet', 'Talavadi',
  'Mulanur', 'Oddanchatram', 'Vedasandur', 'Nilakkottai', 'Usilampatti',
  'Peraiyur', 'Andipatti', 'Bodinayakanur', 'Cumbum', 'Chinnamanur',
  'Theni Allinagaram', 'Kodaikanal', 'Batlagundu', 'Sholavandan', 'Melur',
  'Thirumangalam', 'Aruppukkottai', 'Srivilliputhur', 'Rajapalayam', 'Sattur',
  'Sivakasi', 'Kariapatti', 'Virudhunagar', 'Watrap', 'Kurinjipadi',
  'Manali New Town', 'Ennore', 'Ponneri', 'Gummidipoondi', 'Red Hills',
  'Tiruvallur', 'Tiruttani', 'Uthukottai', 'Thiruvalangadu','Keezhakarai', 'Mandapam', 'Uchipuli', 'Sayalkudi', 'Mudukulathur',
  'Paramakudi', 'Tiruvadanai', 'Ilayangudi', 'Manamadurai', 'Thiruppuvanam',
  'Kalaiyarkoil', 'Singampunari', 'Kottaiyur', 'Ponnamaravathi', 'Alangudi',
  'Aranthangi', 'Avudaiyarkoil', 'Thirumayam', 'Annavasal', 'Keeranur',
  'Viralimalai', 'Illuppur', 'Kunnandarkoil', 'Vedasandur', 'Natham',
  'Batlagundu', 'Nilakottai', 'Shanarpatti', 'Vedachandur', 'Reddiyarchatiram',
  'Thadicombu', 'Ayyalur', 'Palaniyapuram', 'Ayakudi', 'Sevugampatti',
  'Oddanchatram', 'Vedasandur', 'Kannivadi', 'Sembatti', 'Viralimalai',
  'Perambalur Town', 'Veppanthattai', 'Varagur', 'Arumbavur', 'Labbaikudikadu',
  'Kurumbalur', 'Kunnam', 'Pennadam', 'Udayarpalayam', 'Mettupalayam (Tirupur)', 'Kangeyam', 'Vellakoil', 'Kodumudi', 'Gobichettipalayam Rural',
  'Punjaipuliampatti', 'Bhavanisagar', 'Kollegal Border', 'Sathyamangalam Hills',
  'Anthiyur Rural', 'Talavadi Hills', 'Ammapettai', 'Chennimalai', 'Pasur',
  'Perunthurai Rural', 'Velur', 'Komarapalayam', 'Mohanur', 'Puduchatram',
  'Paramathi Velur', 'Sendamangalam', 'Kabilarmalai', 'Erumapatti', 'Elachipalayam',
  'Konganapuram', 'Mecheri', 'Nangavalli', 'Omalur Rural', 'Veerapandi (Salem)',
  'Magudanchavadi', 'Attayampatti Rural', 'Mettur Dam', 'Karumalaikoodal',
  'Poolampatti', 'Edappadi Rural', 'Jalakandapuram', 'Gangavalli Rural',
  'Thammampatti Rural', 'Kadayampatti', 'Thoppur', 'Harur Rural', 'Palacode Rural',
  'Marandahalli', 'Pennagaram Rural', 'Papparapatti', 'Dharmapuri Town Extension',
  'Morappur Rural', 'Kadathur', 'Pappireddipatti Rural', 'Arur', 'Kambainallur',
  'Uthangarai Rural', 'Samalpatti', 'Bargur Rural', 'Mathur (Krishnagiri)',
  'Kelamangalam', 'Denkanikottai Rural', 'Thally Rural', 'Anchetty Hills',
  'Shoolagiri Rural', 'Veppanapalli', 'Pochampalli Rural', 'Upparapatti',
  'Gudiyatham Rural', 'Anaicut', 'Kaniyambadi', 'Kalavai', 'Sholinghur Rural',
  'Nemili', 'Arakkonam Rural', 'Tiruttani Rural', 'Tiruvallur Rural',
  'Poondi', 'Ponneri Rural', 'Minjur', 'Pulicat', 'Gummidipoondi Rural',
  'Uthukottai Rural', 'Manavur', 'Kadambathur', 'Sevvapet Road',
  'Avadi Cantonment', 'Pattabiram', 'Thiruverkadu', 'Poonamallee', 'Mangadu',
  'Porur', 'Ramapuram', 'Maduravoyal', 'Valasaravakkam', 'Nandivaram-Guduvancheri',
  'Padappai', 'Mannivakkam', 'Oragadam', 'Sunguvarchatram', 'Baluchetty Chatram',
  'Kaveripakkam', 'Arcot Rural', 'Arni Rural', 'Polur Rural', 'Aduthurai', 'Alandur', 'Alanganallur', 'Alangulam', 'Alwarkurichi',
  'Amathur', 'Anaiyur', 'Anakaputhur', 'Andankoil East', 'Anjugramam',
  'Annamalai Nagar', 'Anthiyur Town', 'Arakandanallur', 'Arani Municipality',
  'Arasadipalayam', 'Arasur', 'Aruppukottai Rural', 'Ashokapuram', 'Athani',
  'Athimarapatti', 'Athipattu', 'Avanashi', 'Ayothiapattinam', 'B. Mallapuram',
  'Batlagundu Rural', 'Belur (Salem)', 'Bhuvanagiri Rural', 'Boothapandi',
  'Brahmadesam', 'Buthapandi', 'Chatrapatti', 'Chekkal', 'Chellampatti',
  'Chembakkam', 'Chennasamudram', 'Chidambaram Rural', 'Chinnasalem Rural',
  'Chinnathurai', 'Cholapuram', 'Courtallam', 'Cumbum Rural', 'Dakshina Chitra',
  'Dhalavoipuram', 'Dhali', 'Dharapadavedu', 'Dharapuram Rural', 'Dusi',
  'Edayapalayam', 'Ekkattuthangal', 'Elathur', 'Elumalai', 'Eriyur',
  'Ettayapuram', 'Ettimadai', 'Ganapathipuram', 'Gandhinagar (Vellore)',
  'Gangaikondan', 'Gangaikonda Cholapuram', 'Gingee Rural', 'Gudalur (Erode)',
  'Gudalur (Theni)', 'Gudalur (Nilgiris)', 'Gudiyattam Rural', 'Gummidipoondi Town',
  'Harveypatti', 'Ilaiyangudi Rural', 'Inam Karur', 'Injambakkam', 'Irugur',
  'Jambai', 'Jambunathapuram', 'Jayankondam Rural', 'Kadambur', 'Kalakkadu',
  'Kalapatti', 'Kaliyakkavilai', 'Kallidaikurichi', 'Kallukuttam', 'Kalugumalai',
  'Kamuthi', 'Kanadukathan', 'Kanakkampalayam', 'Kanam', 'Kangayam Rural',
  'Kannamangalam', 'Karaikudi Rural', 'Kariamangalam', 'Karumbukkadai',
  'Kasipalayam', 'Kathirvedu', 'Kathujuganapalli', 'Kayalpattinam',
  'Keelakarai Rural', 'Keeranur (Pudukkottai)', 'Keezhpavur', 'Kilakarai Town',
  'Kilvelur', 'Kinathukadavu', 'Kodavasal', 'Kodumudi Rural', 'Koilpatti Rural',
  'Kolathur', 'Kollencode', 'Kollimalai Hills', 'Kolliyur', 'Komaralingam',
  'Koneripalayam', 'Koradacheri', 'Kosapet', 'Kottaiyur Rural', 'Kottakuppam',
  'Kottaram', 'Kottivakkam', 'Koviloor', 'Krishnarayapuram', 'Kulasekarapattinam',
  'Kulasekharapuram', 'Kumarapalayam', 'Kumarapuram', 'Kunnathur', 'Kurichi',
  'Kurinjipadi Rural', 'Kurumbalur Rural', 'Lalgudi Rural', 'Madambakkam',
  'Madathukulam', 'Madipakkam', 'Madukkarai', 'Mahabalipuram Rural',
  'Mallapuram', 'Manachanallur', 'Manalurpettai', 'Manalmedu', 'Manamadurai Rural',
  'Manapparai Rural', 'Mandapam Rural', 'Mangadu Rural', 'Mannargudi Rural',
  'Marakkanam', 'Marandahalli Rural', 'Marapalam', 'Masinagudi', 'Mathigiri',
  'Melachokkanathapuram', 'Melamadai', 'Melathiruppanthuruthi', 'Melpattampakkam',
  'Melur Rural', 'Mettupalayam Rural', 'Mettur Rural', 'Meyyanur', 'Minjur Town',
  'Mohanur Rural', 'Mudukulathur Rural', 'Muthupet', 'Muthur', 'Muttupet',
  'Nachiapuram', 'Naduvattam', 'Nagoor', 'Nallur', 'Nandivaram', 'Nanguneri',
  'Nanjikottai', 'Nannilam', 'Naravarikuppam', 'Nattarasankottai', 'Nattathi',
  'Needamangalam Rural', 'Neelagiri', 'Neelankarai', 'Nellikuppam Rural',
  'Nilgiris Hills', 'Oddanchatram Rural', 'Odugathur', 'Oggiyam',
  'Orathanadu Rural', 'Ottapidaram', 'Pachchal', 'Pachamalai Hills',
  'Padmanabhapuram', 'Paithan', 'Palamedu', 'Palladam Rural', 'Pallapatti',
  'Pallikonda', 'Pammal', 'Panagudi', 'Panruti Rural', 'Papanasam Rural','Pappireddipatti Town', 'Paravai', 'Parvathipuram', 'Pattiveeranpatti',
  'Pennadam Rural', 'Peraiyur Rural', 'Periyakodiveri', 'Periyakulanthai',
  'Periyapattinam', 'Periyasemur', 'Pethanaickenpalayam', 'Pollachi Rural',
  'Puliyangudi', 'Puthiamputhur', 'Puzhal', 'Rajapalayam Rural',
  'Rameswaram', 'Reddiarpalayam', 'Samayapuram', 'Sankarankoil',
  'Sankari', 'Sembanarkoil', 'Shenbakkam', 'Singanallur',
  'Srivaikuntam', 'Srirangam Rural', 'Srirangapatnam', 'Srirappalli',
  'Sriramapuram', 'Srirangam East', 'Srirangam West', 'Srivilliputhur Rural',
  'Sultanpet', 'Sulur', 'Surandai', 'T. Kallupatti', 'Tenkasi Rural',
  ],
  
  // Kerala cities
  'KL': [
    'Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Thrissur', 'Kollam', 'Palakkad',
    'Alappuzha', 'Malappuram', 'Kannur', 'Kasaragod', 'Kottayam', 'Idukki',
    'Ernakulam', 'Pathanamthitta', 'Wayanad', 'Munnar', 'Varkala', 'Guruvayur',
    'Thodupuzha', 'Cherthala', 'Perinthalmanna', 'Chalakudy', 'Changanassery',
    'Kalpetta', 'Kottakkal', 'Nilambur', 'Kayamkulam', 'Neyyattinkara',
    'Paravoor', 'Adoor', 'Attingal', 'Pandalam', 'Ponnani', 'Tirur',
    'Kodungallur', 'Ottappalam', 'Malampuzha', 'Sulthan Bathery', 'Beypore'
  ],
  
  // Karnataka cities
  'KA': [
    'Bengaluru', 'Mysuru', 'Hubli-Dharwad', 'Mangaluru', 'Belagavi', 'Kalaburagi',
    'Davanagere', 'Ballari', 'Bijapur', 'Shimoga', 'Tumakuru', 'Raichur',
    'Bidar', 'Hospet', 'Hassan', 'Gadag-Betageri', 'Udupi', 'Robertson Pet',
    'Bhadravati', 'Chitradurga', 'Kolar', 'Mandya', 'Chikmagalur', 'Gangavati',
    'Bagalkot', 'Ranebennuru', 'Hindupur', 'Karwar', 'Karkala', 'Sirsi',
    'Nipani', 'Sindhanur', 'Koppal', 'Haveri', 'Yadgir', 'Ramanagara',
    'Channapatna', 'Chintamani', 'Gokak', 'Srinivaspur', 'Madhugiri'
  ],
  
  // Andhra Pradesh cities
  'AP': [
    'Visakhapatnam', 'Vijayawada', 'Guntur', 'Nellore', 'Kurnool', 'Rajahmundry',
    'Tirupati', 'Kakinada', 'Anantapur', 'Vizianagaram', 'Eluru', 'Ongole',
    'Nandyal', 'Machilipatnam', 'Adoni', 'Tenali', 'Chittoor', 'Hindupur',
    'Proddatur', 'Bhimavaram', 'Madanapalle', 'Guntakal', 'Dharmavaram',
    'Gudivada', 'Narasaraopet', 'Tadpatri', 'Kadapa', 'Mangalagiri', 'Chilakaluripet',
    'Chirala', 'Bapatla', 'Palakollu', 'Kavali', 'Narsipatnam', 'Amalapuram',
    'Tanuku', 'Rayachoti', 'Srikalahasti', 'Sullurpeta', 'Rajam', 'Bobbili'
  ]
};

async function seedCities() {
  try {
    const db = await connectDB();
    const statesCollection = db.collection('states');
    const citiesCollection = db.collection('cities');
    
    // Get all states
    const states = await statesCollection.find({}).toArray();
    
    let citySerialNo = 1;
    let totalCitiesAdded = 0;
    
    for (const state of states) {
      const stateCode = state.code;
      const stateCities = citiesData[stateCode];
      
      if (stateCities) {
        
        for (const cityName of stateCities) {
          // Check if city already exists
          const existingCity = await citiesCollection.findOne({
            name: cityName,
            stateId: state._id
          });
          
          if (!existingCity) {
            const cityDoc = {
              _id: citySerialNo.toString(),
              name: cityName,
              stateId: state._id,
              stateName: state.name,
              stateCode: state.code,
              countryId: state.countryId,
              countryName: state.countryName,
              countryCode: state.countryCode || 'IN',
              serialNo: citySerialNo,
              isActive: true,
              latitude: null,
              longitude: null,
              timezone: null,
              createdAt: new Date(),
              updatedAt: new Date()
            };
            
            await citiesCollection.insertOne(cityDoc);
            citySerialNo++;
            totalCitiesAdded++;
          }
        }
      }
    }

    
  } catch (error) {
    console.error('Error seeding cities:', error);
  }
}

// Run the seeding function
seedCities();
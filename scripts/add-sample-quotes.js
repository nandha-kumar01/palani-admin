#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

// Use a simplified schema without text indexes for compatibility
const quoteSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000,
  },
  author: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  category: {
    type: String,
    required: true,
    enum: ['motivational', 'spiritual', 'wisdom', 'love', 'success', 'life', 'happiness', 'peace', 'devotional', 'inspirational'],
    default: 'motivational',
  },
  language: {
    type: String,
    required: true,
    enum: ['tamil', 'english', 'hindi', 'sanskrit'],
    default: 'tamil',
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: 50,
  }],
  source: {
    type: String,
    required: false,
    trim: true,
    maxlength: 200,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  isFeatured: {
    type: Boolean,
    default: false,
  },
  priority: {
    type: Number,
    default: 0,
    min: 0,
    max: 10,
  },
  viewCount: {
    type: Number,
    default: 0,
  },
  likeCount: {
    type: Number,
    default: 0,
  },
  shareCount: {
    type: Number,
    default: 0,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  metadata: {
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'easy',
    },
    readingTime: {
      type: Number,
      default: 10,
    },
    sentiment: {
      type: String,
      enum: ['positive', 'neutral', 'negative'],
      default: 'positive',
    },
  },
}, {
  timestamps: true,
});

const Quote = mongoose.model('Quote', quoteSchema);

// Sample quotes data matching the actual model structure
const sampleQuotes = [
  {
    text: "வெற்றி என்பது ஒரு இலக்கு அல்ல, அது ஒரு பயணம். ஒவ்வொரு தோல்வியும் நமக்கு ஒரு பாடம் கற்பிக்கிறது. அந்த பாடங்களை கற்றுக்கொண்டு முன்னேறுபவர்களே வெற்றி பெறுகிறார்கள்.",
    author: "அப்துல் கலாம்",
    category: "motivational",
    language: "tamil",
    tags: ["வெற்றி", "முயற்சி", "பாடம்", "தோல்வி"],
    source: "மிசைல் மேன் கலாம்",
    isFeatured: true,
    priority: 8,
    viewCount: 150,
    likeCount: 23,
    shareCount: 8,
    metadata: {
      difficulty: "easy",
      readingTime: 15,
      sentiment: "positive"
    }
  },
  {
    text: "அன்பு என்பது உலகின் மிகப்பெரிய சக்தி. அது மலைகளை நகர்த்தும், இதயங்களை மாற்றும், உலகத்தை அழகாக்கும். அன்பில்லா வாழ்க்கை பூக்காத மரம் போன்றது.",
    author: "மகாத்மா காந்தி",
    category: "love",
    language: "tamil",
    tags: ["அன்பு", "சக்தி", "இதயம்", "வாழ்க்கை"],
    source: "அகிம்சையின் தந்தை",
    isFeatured: true,
    priority: 9,
    viewCount: 200,
    likeCount: 45,
    shareCount: 12,
    metadata: {
      difficulty: "medium",
      readingTime: 18,
      sentiment: "positive"
    }
  },
  {
    text: "Dreams are not what you see in sleep, dreams are things which do not let you sleep. Chase your dreams with passion and dedication, for they are the blueprints of your future success.",
    author: "A.P.J. Abdul Kalam",
    category: "inspirational",
    language: "english",
    tags: ["dreams", "passion", "success", "future"],
    source: "Wings of Fire",
    isFeatured: false,
    priority: 5,
    viewCount: 89,
    likeCount: 15,
    shareCount: 4,
    metadata: {
      difficulty: "easy",
      readingTime: 20,
      sentiment: "positive"
    }
  },
  {
    text: "கல்வி என்பது அறிவை பெறுவது மட்டுமல்ல, அது நமது சிந்தனையை விரிவுபடுத்துகிறது. நல்ல மனிதனாக மாற்றுகிறது. கல்வி கற்பது நின்று போகக்கூடாது, அது வாழ்நாள் முழுவதும் தொடர வேண்டும்.",
    author: "சுவாமி விவேகானந்த",
    category: "wisdom",
    language: "tamil",
    tags: ["கல்வி", "அறிவு", "சிந்தனை", "வாழ்க்கை"],
    source: "வேதாந்த தர்சனம்",
    isFeatured: false,
    priority: 6,
    viewCount: 134,
    likeCount: 28,
    shareCount: 7,
    metadata: {
      difficulty: "medium",
      readingTime: 22,
      sentiment: "positive"
    }
  },
  {
    text: "Peace comes from within. Do not seek it without. When we learn to quiet our minds and listen to our hearts, we discover the profound peace that has always been there.",
    author: "Buddha",
    category: "spiritual",
    language: "english",
    tags: ["peace", "meditation", "inner strength", "mindfulness"],
    source: "Buddhist Teachings",
    isFeatured: true,
    priority: 7,
    viewCount: 178,
    likeCount: 34,
    shareCount: 9,
    metadata: {
      difficulty: "hard",
      readingTime: 19,
      sentiment: "positive"
    }
  },
  {
    text: "உழைப்பு இல்லாமல் எதுவும் கிடைக்காது. கடினமான உழைப்பு, விடாமுயற்சி, பொறுமை - இவை மூன்றும் சேர்ந்தால் வெற்றி நிச்சயம். வாழ்க்கையில் சார்ட்கட் இல்லை, உழைப்பே வழி.",
    author: "திருவள்ளுவர்",
    category: "success",
    language: "tamil",
    tags: ["உழைப்பு", "முயற்சி", "பொறுமை", "வெற்றி"],
    source: "திருக்குறள்",
    isFeatured: false,
    priority: 4,
    viewCount: 95,
    likeCount: 18,
    shareCount: 5,
    metadata: {
      difficulty: "easy",
      readingTime: 20,
      sentiment: "positive"
    }
  },
  {
    text: "खुशी बाहर नहीं, अंदर से आती है। जब हम अपने मन को शांत रखते हैं और दूसरों की मदद करते हैं, तो सच्ची खुशी मिलती है। खुशी देने से बढ़ती है, बांटने से कम नहीं होती।",
    author: "महात्मा गांधी",
    category: "happiness",
    language: "hindi",
    tags: ["खुशी", "मन", "शांति", "मदद"],
    source: "गांधी जी के विचार",
    isFeatured: false,
    priority: 3,
    viewCount: 67,
    likeCount: 11,
    shareCount: 3,
    metadata: {
      difficulty: "medium",
      readingTime: 18,
      sentiment: "positive"
    }
  },
  {
    text: "நம்பிக்கை என்பது ஒளியற்ற இடத்தில் ஒரு விளக்கு போன்றது. எவ்வளவு பெரிய இருள் இருந்தாலும், ஒரு சிறிய நம்பிக்கை அதை விரட்டிவிடும். நம்பிக்கை இருக்கும் வரை வாழ்க்கை அழகானது.",
    author: "கலைஞர் கருணாநிதி",
    category: "motivational",
    language: "tamil",
    tags: ["நம்பிக்கை", "ஒளி", "இருள்", "வாழ்க்கை"],
    source: "தமிழ் இலக்கிய மேடை",
    isFeatured: true,
    priority: 8,
    viewCount: 156,
    likeCount: 29,
    shareCount: 8,
    metadata: {
      difficulty: "easy",
      readingTime: 17,
      sentiment: "positive"
    }
  },
  {
    text: "Life is not about finding yourself, it's about creating yourself. Every day is a new opportunity to become a better version of who you were yesterday. Embrace change, learn continuously, and never stop growing.",
    author: "George Bernard Shaw",
    category: "life",
    language: "english",
    tags: ["life", "growth", "change", "opportunity"],
    source: "Modern Philosophy",
    isFeatured: false,
    priority: 5,
    viewCount: 78,
    likeCount: 14,
    shareCount: 4,
    metadata: {
      difficulty: "hard",
      readingTime: 21,
      sentiment: "positive"
    }
  },
  {
    text: "வாழ்க்கை என்பது ஒரு பரிசு. அதை மகிழ்ச்சியுடன் வாழ வேண்டும். தன்னலமின்றி சேவை செய்யுங்கள், அன்புடன் பேசுங்கள், நன்றியுடன் வாழுங்கள். இதுவே உன்னதமான வாழ்க்கை.",
    author: "ரமண மகரிஷி",
    category: "spiritual",
    language: "tamil",
    tags: ["வாழ்க்கை", "சேவை", "அன்பு", "நன்றி"],
    source: "அருணாசல திருவண்ணாமலை",
    isFeatured: true,
    priority: 9,
    viewCount: 203,
    likeCount: 41,
    shareCount: 11,
    metadata: {
      difficulty: "medium",
      readingTime: 19,
      sentiment: "positive"
    }
  },
  {
    text: "Knowledge knows no boundaries. ज्ञान की कोई सीमा नहीं. அறிவுக்கு எல்லை இல்லை. When we embrace different languages and cultures, we expand our understanding of the world and become truly global citizens.",
    author: "Nelson Mandela",
    category: "wisdom",
    language: "english",
    tags: ["knowledge", "culture", "global", "unity"],
    source: "Global Peace Foundation",
    isFeatured: false,
    priority: 6,
    viewCount: 112,
    likeCount: 22,
    shareCount: 6,
    metadata: {
      difficulty: "hard",
      readingTime: 23,
      sentiment: "positive"
    }
  },
  {
    text: "நேரம் தான் நமது மிக மதிப்புமிக்க சொத்து. அதை வீணாக்காதீர்கள். ஒவ்வொரு நிமிடமும் பயனுள்ளதாக பயன்படுத்துங்கள். நேரத்தை மதிப்பவர்கள் வாழ்க்கையில் வெற்றி பெறுவார்கள்.",
    author: "பெஞ்சமின் ஃபிராங்க்ளின்",
    category: "life",
    language: "tamil",
    tags: ["நேரம்", "மேலாண்மை", "வெற்றி", "மதிப்பு"],
    source: "நேர மேலாண்மை கையேடு",
    isFeatured: false,
    priority: 4,
    viewCount: 85,
    likeCount: 16,
    shareCount: 4,
    metadata: {
      difficulty: "easy",
      readingTime: 18,
      sentiment: "positive"
    }
  }
];

async function addSampleQuotes() {
  try {
    console.log('Connecting to MongoDB...');
    
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not set');
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB successfully');

    // Check if quotes already exist
    const existingQuotes = await Quote.countDocuments();
    console.log(`Found ${existingQuotes} existing quotes`);

    if (existingQuotes > 0) {
      console.log('  Sample quotes may already exist. Proceeding anyway...');
    }

    console.log('Adding sample quotes...');
    
    // Insert sample quotes
    const result = await Quote.insertMany(sampleQuotes);
    console.log(`Successfully added ${result.length} sample quotes`);

    // Display summary
    const stats = await Quote.aggregate([
      { $match: { isDeleted: false } },
      { $group: { 
          _id: '$category', 
          count: { $sum: 1 },
          languages: { $addToSet: '$language' }
        }},
      { $sort: { count: -1 } }
    ]);

    console.log('\n Quote Statistics:');
    console.log('Categories:');
    stats.forEach(stat => {
      console.log(`  - ${stat._id}: ${stat.count} quotes (${stat.languages.join(', ')})`);
    });

    const totalStats = await Quote.aggregate([
      { $match: { isDeleted: false } },
      { $group: {
          _id: null,
          total: { $sum: 1 },
          totalViews: { $sum: '$viewCount' },
          totalLikes: { $sum: '$likeCount' },
          totalShares: { $sum: '$shareCount' },
          featured: { $sum: { $cond: ['$isFeatured', 1, 0] } }
        }}
    ]);

    if (totalStats.length > 0) {
      const total = totalStats[0];
      console.log(`\n Overall Statistics:`);
      console.log(`  - Total Quotes: ${total.total}`);
      console.log(`  - Featured Quotes: ${total.featured}`);
      console.log(`  - Total Views: ${total.totalViews}`);
      console.log(`  - Total Likes: ${total.totalLikes}`);
      console.log(`  - Total Shares: ${total.totalShares}`);
    }

    console.log('\n Sample data added successfully!');
    console.log(' You can now visit: http://localhost:3000/admin/quotes');

  } catch (error) {
    console.error(' Error adding sample quotes:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log(' Database connection closed');
  }
}

// Run the script
addSampleQuotes();
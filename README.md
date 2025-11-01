# Palani Pathayathirai - Devotional Tracking Platform

A comprehensive platform for managing and tracking devotees on their spiritual journey to Palani. This project includes an admin panel built with Next.js 15, TypeScript, TailwindCSS, and Material UI.

## Features

### Admin Panel
- **Dashboard** - Overview of users, temples, and activities
- **User Management** - Monitor devotees and their journey status
- **Temple Management** - Add/edit sacred places along the route
- **Annadhanam Management** - Manage free food service locations
- **Madangal Management** - Handle accommodation places
- **Songs Management** - Upload and manage devotional songs
- **Gallery Management** - Manage photo collections
- **Live Tracking** - Monitor users in real-time
- **Announcements** - Send notifications to users
- **Analytics** - Detailed reports and insights

### Mobile App Features (To be implemented)
- User registration and authentication
- Real-time location tracking
- Interactive maps with nearby temples, food spots, and accommodation
- Devotional song player
- Photo gallery
- Push notifications
- Family/friend tracking sharing

## Tech Stack

### Admin Panel (Current)
- **Frontend**: Next.js 15, TypeScript, TailwindCSS, Material UI
- **Backend**: Next.js API Routes
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT-based auth
- **Styling**: Material UI + TailwindCSS

### Planned Stack for Complete Platform
- **Mobile App**: React Native (Expo), TypeScript
- **Real-time Tracking**: Firebase Realtime Database
- **File Storage**: Cloudinary
- **Maps**: Google Maps API
- **Notifications**: Firebase Cloud Messaging (FCM)

## Getting Started

### Prerequisites
- Node.js 18+ 
- MongoDB (local or MongoDB Atlas)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd palani
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Copy `.env.local` and update with your values:
   ```env
   # Database
   MONGODB_URI=mongodb://localhost:27017/palani-pathayathirai

   # Authentication
   NEXTAUTH_SECRET=your-secret-key-here
   NEXTAUTH_URL=http://localhost:3000
   JWT_SECRET=your-jwt-secret-here

   # Firebase (for real-time tracking)
   FIREBASE_PROJECT_ID=your-firebase-project-id
   FIREBASE_CLIENT_EMAIL=your-firebase-client-email
   FIREBASE_PRIVATE_KEY=your-firebase-private-key

   # Cloudinary (for file storage)
   CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
   CLOUDINARY_API_KEY=your-cloudinary-api-key
   CLOUDINARY_API_SECRET=your-cloudinary-api-secret

   # Google Maps API
   GOOGLE_MAPS_API_KEY=your-google-maps-api-key
   ```

4. **Seed Sample Data**
   After starting the app, visit: `http://localhost:3000/api/seed` (POST request)
   
   Or use curl:
   ```bash
   curl -X POST http://localhost:3000/api/seed
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

6. **Access Admin Panel**
   - URL: `http://localhost:3000/admin/login`
   - Email: `admin@palani.com`
   - Password: `admin123`

## Project Structure

```
src/
├── app/
│   ├── admin/                 # Admin panel pages
│   │   ├── dashboard/         # Dashboard page
│   │   ├── temples/           # Temple management
│   │   ├── users/             # User management
│   │   └── login/             # Admin login
│   ├── api/                   # API routes
│   │   ├── auth/              # Authentication endpoints
│   │   ├── admin/             # Admin API endpoints
│   │   └── seed/              # Sample data seeding
│   ├── globals.css            # Global styles
│   └── layout.tsx             # Root layout
├── components/
│   ├── admin/                 # Admin-specific components
│   └── ThemeRegistry.tsx      # Material UI theme provider
├── lib/
│   ├── mongodb.ts             # Database connection
│   ├── auth.ts                # Authentication utilities
│   └── middleware.ts          # API middleware
└── models/                    # MongoDB models
    ├── User.ts
    ├── Temple.ts
    ├── Annadhanam.ts
    ├── Madangal.ts
    ├── Song.ts
    ├── Gallery.ts
    └── Announcement.ts
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Admin/User login
- `POST /api/auth/register` - User registration

### Admin APIs (Require admin token)
- `GET /api/admin/users` - Get all users
- `GET /api/admin/temples` - Get all temples
- `POST /api/admin/temples` - Create temple
- `PUT /api/admin/temples/[id]` - Update temple
- `DELETE /api/admin/temples/[id]` - Delete temple

### Utility
- `POST /api/seed` - Seed sample data

## Database Models

### User Model
- Basic info (name, email, phone)
- Admin status
- Tracking status and location
- Journey progress (distance, visited temples)
- Pathayathirai status

### Temple Model
- Temple details and location
- Timings and contact info
- Facilities and special features
- Visit count tracking

### Annadhanam Model
- Food service location and timings
- Capacity and availability
- Organizer contact details

### Madangal Model
- Accommodation details
- Capacity and booking system
- Facilities and pricing

## Development

### Adding New Features
1. Create API routes in `src/app/api/`
2. Add database models in `src/models/`
3. Create admin pages in `src/app/admin/`
4. Add components in `src/components/`

### Running Tests
```bash
npm run test
```

### Building for Production
```bash
npm run build
npm start
```

## Deployment

### Vercel (Recommended)
1. Connect GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Docker
```bash
docker build -t palani-admin .
docker run -p 3000:3000 palani-admin
```

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## Future Enhancements

### Phase 1 (Current) - Admin Panel ✅
- [x] User management
- [x] Temple management  
- [x] Dashboard with analytics
- [x] Authentication system

### Phase 2 - Mobile App
- [ ] React Native app development
- [ ] Real-time location tracking
- [ ] Map integration with Google Maps
- [ ] User registration/login
- [ ] Offline capability

### Phase 3 - Advanced Features
- [ ] Live tracking sharing
- [ ] Push notifications
- [ ] Audio streaming
- [ ] Photo sharing and approval
- [ ] Advanced analytics
- [ ] Multi-language support

### Phase 4 - Optimization
- [ ] Performance optimization
- [ ] Caching implementation
- [ ] Load balancing
- [ ] Advanced security features

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email admin@palani.com or create an issue in the GitHub repository.

## Acknowledgments

- Material UI team for the excellent component library
- Next.js team for the amazing framework
- MongoDB team for the robust database solution
- All contributors and devotees who inspire this project

---

**🛕 Om Muruga! May this platform serve all devotees on their spiritual journey to Palani! 🛕**

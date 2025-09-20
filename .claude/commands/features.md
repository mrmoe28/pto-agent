# Permit Office Search Application - Features Documentation

## 🎯 Core Purpose
A comprehensive web application that helps property owners, contractors, and homeowners instantly find their local permit office information by simply entering an address. The application eliminates hours of frustrating searches through government websites and phone calls.

## 🌟 Key Features

### 1. **Intelligent Address-Based Search**
- **Geocoding Service**: Dual-provider system with automatic fallback
  - Primary: LocationIQ (OpenStreetMap-based, cost-effective)
  - Fallback: Google Maps API (when LocationIQ fails)
- **Smart Location Parsing**: Automatically extracts city, county, and state from addresses
- **Distance Calculation**: Shows exact distance to each permit office using Haversine formula

### 2. **Comprehensive Permit Office Database**
- **Coverage**: Initially focused on Georgia with nationwide expansion capability
- **Office Types Supported**:
  - Building departments
  - Planning departments
  - Zoning offices
  - Combined permit offices
  - Special district offices
- **Jurisdiction Levels**:
  - City offices
  - County offices
  - State offices
  - Special district offices

### 3. **Rich Office Information Display**
- **Contact Details**:
  - Physical address
  - Phone numbers (clickable for mobile)
  - Email addresses
  - Official websites
- **Operating Hours**: Daily schedule for each office
- **Services Offered**:
  - Building permits
  - Electrical permits
  - Plumbing permits
  - Mechanical permits
  - Zoning permits
  - Planning review
  - Inspections
- **Online Services Indicators**:
  - Online application availability
  - Online payment options
  - Permit tracking systems
  - Direct portal links

### 4. **User Experience Features**
- **Instant Results**: Sub-second response times for searches
- **User Authentication**: Secure Clerk-based authentication system
  - Optional user accounts for enhanced features
  - Social sign-in support (Google, etc.)
  - User dashboard and profile management
- **Mobile-Responsive Design**: Works seamlessly on all devices
- **Visual Permit Type Badges**: Color-coded indicators for available permit types
- **Distance-Based Sorting**: Nearest offices shown first
- **Error Handling**: Graceful fallbacks and user-friendly error messages

### 5. **User Account Features**
- **User Dashboard**: Personalized control panel for registered users
  - Welcome message with user name
  - Quick action buttons for common tasks
  - Recent activity tracking
  - Profile management access
- **User Profile Management**: Comprehensive profile customization
  - Personal information (name, contact details, address)
  - Location preferences (city, state, zip code)
  - User preferences (notifications, theme, email updates)
  - Bio and additional details
- **Favorites System**: Save frequently accessed permit offices
  - One-click favoriting of permit offices
  - Organized favorites list with quick access
  - Remove/manage saved offices
- **Authentication Security**: Clerk-powered secure authentication
  - Multi-factor authentication support
  - Session management
  - Password reset and account recovery
  - Social login integration

### 6. **Data Management System**
- **Supabase Integration**:
  - Real-time database updates
  - Structured PostgreSQL storage
  - Automatic data synchronization
- **Fallback System**: Static Georgia data available when database is offline
- **Data Seeding API**: One-click database population with verified office data
- **Data Verification Tracking**:
  - Last verified timestamps
  - Data source tracking (crawled/API/manual)
  - Crawl frequency settings

### 7. **Technical Capabilities**
- **Web Scraping Ready**: Cheerio and Playwright integration for data collection
- **Rate Limiting**: Upstash Redis integration for API protection
- **Robots.txt Compliance**: Respects website crawling policies
- **SEO Optimized**: Next.js SSR for better search engine visibility

## 📊 API Endpoints

### **`GET /api/permit-offices`**
Search for permit offices with multiple filter options:
- **Query Parameters**:
  - `lat` & `lng`: GPS coordinates for distance-based search
  - `city`: Filter by city name
  - `county`: Filter by county name
  - `state`: Filter by state (defaults to GA)
- **Returns**: Up to 10 offices with calculated distances

### **`POST /api/permit-offices`**
Seed database with Georgia permit office data:
- **Body**: `{ "action": "seed_georgia_data" }`
- **Purpose**: Initialize or update database with verified office data

### **`POST /api/geocode`**
Convert addresses to coordinates with smart fallback:
- **Body**: `{ "address": "string" }`
- **Returns**: Latitude, longitude, formatted address, city, county, state

### **`GET /api/user/profile`**
Retrieve user profile information for authenticated users:
- **Authentication**: Requires valid Clerk session
- **Returns**: User profile data including personal info and preferences

### **`PUT /api/user/profile`**
Update user profile information:
- **Authentication**: Requires valid Clerk session
- **Body**: Profile data (firstName, lastName, bio, phone, address, preferences)
- **Returns**: Updated profile information

### **`GET /api/user/favorites`**
Retrieve user's favorite permit offices:
- **Authentication**: Requires valid Clerk session
- **Returns**: List of favorited permit offices with full details

### **`POST /api/user/favorites`**
Add or remove permit offices from user favorites:
- **Authentication**: Requires valid Clerk session
- **Body**: `{ "action": "add|remove", "officeId": "string" }`
- **Returns**: Updated favorites list

## 🎨 User Interface Components

### **Hero Section**
- Prominent search bar with real-time validation
- Live search results display
- Distance indicators for each result
- Service availability badges

### **Features Section**
- Six key value propositions:
  - Time savings
  - Accuracy guarantee
  - Local expertise
  - Complete contact details
  - All permit types coverage
  - Free service

### **How It Works**
- Three-step visual process guide:
  1. Enter your address
  2. Get instant results
  3. Contact & apply
- Interactive step indicators
- Call-to-action for immediate use

### **User Dashboard**
- Personalized welcome screen with user information
- Quick action buttons for common tasks:
  - Search permit offices
  - View favorites
  - Edit profile
- Recent activity display
- Profile card with user avatar and basic info

### **User Profile Page**
- Comprehensive profile editing form:
  - Personal information fields
  - Contact details management
  - Address and location preferences
  - User preference toggles (notifications, theme, email updates)
- Form validation and error handling
- Save/update functionality with success feedback

### **Authentication Components**
- Sign-in page with Clerk integration:
  - Social login options (Google, etc.)
  - Email/password authentication
  - Password reset functionality
- Sign-in/Sign-out buttons in navigation
- User button with profile dropdown
- Protected route handling

### **Contact & Support**
- Multiple support channels:
  - Email support
  - Phone support
  - FAQ/Help center
- Professional footer with legal links

## 🚀 Planned Enhancements

### Near-term
- Nationwide office database expansion
- User reviews and ratings
- Office photo integration
- Wait time estimates
- Document requirement checklists

### Long-term
- Mobile app development
- Permit application tracking
- Document upload capabilities
- Appointment scheduling
- Multi-language support
- API for third-party integrations

## 💡 Use Cases

1. **Homeowners**: Finding permit offices for home renovations
2. **Contractors**: Quickly locating offices across multiple jurisdictions
3. **Real Estate Professionals**: Checking permit requirements for properties
4. **Architects/Engineers**: Identifying submission requirements
5. **Property Managers**: Managing permits for multiple properties
6. **Solar/HVAC Installers**: Finding specialized permit departments

## 🤖 Development Agents

### **scraper-code-auditor**
- **Purpose**: Deep code quality audit for the python-scraper codebase
- **Model**: Opus (advanced reasoning for complex code analysis)
- **Capabilities**:
  - Static code analysis for reliability and error handling
  - Runtime considerations review (resource limits, memory management)
  - Compliance checking (robots.txt, respectful delays)
  - Test coverage gap analysis
  - Best practices research from context7 knowledge source
  - Risk prioritization (Critical/High/Medium/Low)
- **Usage**: `/agent scraper-code-auditor` followed by audit request
- **Focus Areas**:
  - Enhanced scraper reliability
  - Error handling and retry logic
  - Session management and cleanup
  - Logging and observability
  - Data validation and integrity

## 🛡️ Data Privacy & Security
- **User Consent**: All user data collection with explicit consent
- **Clerk Authentication**: Enterprise-grade security with Clerk
  - Encrypted user sessions
  - Secure password handling
  - Multi-factor authentication support
  - GDPR and CCPA compliant
- **API Security**: Protected endpoints with rate limiting
- **Environment Protection**: Secure API key management
- **HTTPS-Only**: All communications encrypted
- **Data Minimization**: Only collect necessary user information
- **User Control**: Users can delete accounts and data at any time

## 📈 Success Metrics
- Search response time < 1 second
- Database uptime > 99.9%
- Fallback activation < 0.1% of requests
- Mobile responsiveness on all devices
- **User Authentication**:
  - Sign-in success rate > 99%
  - Account creation completion > 95%
  - Session security with zero breaches
- **User Engagement**:
  - Dashboard load time < 2 seconds
  - Profile update success rate > 98%
  - User retention rate tracking
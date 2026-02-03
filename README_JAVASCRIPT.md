# VCG TRANSPORT - TruckUserExpo

## 🚚 User/Shipper Mobile App (React Native + Expo)

**JavaScript ONLY - No TypeScript**  
**Frontend ONLY - No Backend Logic**

---

## ✅ Project Structure

```
TruckUserExpo/
├── App.js                          # Main entry point (JavaScript)
├── package.json                    # Dependencies (NO TypeScript)
│
├── src/
│   ├── screens/                    # All UI screens
│   │   ├── LoginScreen.js
│   │   ├── RegisterScreen.js
│   │   ├── HomeScreen.js
│   │   ├── BookingScreen.js
│   │   ├── TrackingScreen.js
│   │   ├── InvoiceScreen.js
│   │   └── RatingScreen.js
│   │
│   ├── services/                   # API service layer
│   │   ├── api.service.js         # Axios instance (SINGLE SOURCE)
│   │   ├── auth.service.js        # Authentication
│   │   ├── booking.service.js     # Booking operations
│   │   ├── trip.service.js        # Trip tracking
│   │   ├── invoice.service.js     # Invoice management
│   │   └── rating.service.js      # Rating system
│   │
│   ├── navigation/
│   │   └── AppNavigator.js        # Navigation setup
│   │
│   └── utils/
│       └── helpers.js             # Utility functions
```

---

## 🔵 Backend Connection

**Base API URL:**  
```javascript
http://192.168.1.10:5000/api
```

**Backend:** `TruckAPI-mainBackend` (Node.js + Express)

⚠️ **IMPORTANT:** All APIs are called from services, NOT directly in screens.

---

## 📡 API Service Pattern

### api.service.js (SINGLE SOURCE)
```javascript
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const api = axios.create({
  baseURL: "http://192.168.1.10:5000/api",
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("authToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

### All other services import this:
```javascript
import api from "./api.service";
```

---

## 🔐 Authentication Flow

1. **Login** → `authService.login()`
2. Token saved to AsyncStorage automatically
3. Navigate to HomeScreen
4. All API calls use token via interceptor

---

## 📱 Screen → API Mapping

| Screen | Service Method | API Endpoint |
|--------|---------------|-------------|
| LoginScreen | `authService.login()` | `POST /auth/login` |
| RegisterScreen | `authService.register()` | `POST /auth/register` |
| HomeScreen | `bookingService.getMyBookings()` | `GET /bookings/my` |
| BookingScreen | `bookingService.createBooking()` | `POST /bookings` |
| TrackingScreen | `tripService.trackTrip()` | `GET /trips/:id/track` |
| InvoiceScreen | `invoiceService.getMyInvoices()` | `GET /invoices/my` |
| RatingScreen | `ratingService.createRating()` | `POST /ratings` |

---

## 🚀 Installation & Setup

### 1. Install Dependencies
```bash
cd TruckUserExpo
npm install
```

### 2. Update API Base URL (if needed)
Edit `src/services/api.service.js`:
```javascript
baseURL: "http://YOUR_IP:5000/api"
```

### 3. Start Backend First
```bash
cd TruckAPI-mainBackend
npm start
```

### 4. Start Expo App
```bash
cd TruckUserExpo
npm start
```

---

## ⚠️ IMPORTANT RULES

❌ **NO TypeScript** - Only `.js` and `.jsx` files  
❌ **NO Backend Code** - This is frontend only  
❌ **NO Redux/Toolkit** - Removed from dependencies  
❌ **NO Multiple axios instances** - Use `api.service.js` only  

✅ **JavaScript ONLY**  
✅ **AsyncStorage for tokens**  
✅ **React Navigation**  
✅ **Service layer pattern**  

---

## 📦 Dependencies

- React Native with Expo
- React Navigation (Stack Navigator)
- Axios (API calls)
- AsyncStorage (Token storage)

**NO TypeScript dependencies**

---

## 🔄 Development Workflow

1. ✅ Backend must be running
2. ✅ Test APIs in Postman first
3. ✅ Connect screens to services
4. ✅ Never create backend logic here

---

## 👤 User Role

This app is **ONLY for USER role**:
- Users/Shippers can create bookings
- Track shipments
- View invoices
- Rate completed trips

❌ No driver features  
❌ No admin features

---

## 🛠️ Configuration Notes

- Removed all TypeScript files (`.ts`, `.tsx`)
- Removed `tsconfig.json`, `expo-env.d.ts`
- Removed Redux store and related code
- Cleaned up unnecessary folders (`store/`, `types/`, `driver/`, `pages/`)
- Simplified to pure JavaScript implementation

---

## 📞 Support

For issues or questions, refer to the backend API documentation in `TruckAPI-mainBackend`.

**Remember:** This is a frontend app connecting to a single backend. Never duplicate backend logic here.

# Device Management API Documentation

## Overview
The Device Management API allows mobile applications to register device installations and track app usage analytics. This helps administrators monitor mobile app installations across different platforms and sources.

## Base URL
```
https://your-domain.com/api/devices
```

## Authentication
- Device registration endpoint is public (no authentication required)
- Admin endpoints require Bearer token authentication

## Endpoints

### 1. Register Device Installation
**POST** `/api/devices`

Register a new device installation or update an existing device session.

#### Request Body
```json
{
  "userId": "user_object_id",
  "deviceModel": "iPhone 14 Pro",
  "deviceId": "unique_device_identifier",
  "installationSource": "appstore", // "playstore", "appstore", "sideload", "unknown"
  "appVersion": "1.0.0",
  "osVersion": "16.4",
  "platform": "ios", // "android" or "ios"
  "deviceInfo": {
    "brand": "Apple",
    "manufacturer": "Apple Inc.",
    "screenResolution": "1179x2556",
    "batteryLevel": 85,
    "isRooted": false,
    "isJailbroken": false
  },
  "location": {
    "country": "India",
    "state": "Tamil Nadu",
    "city": "Chennai",
    "coordinates": {
      "latitude": 13.0827,
      "longitude": 80.2707
    }
  }
}
```

#### Required Fields
- `userId`: User's database ID
- `deviceModel`: Device model name
- `deviceId`: Unique device identifier
- `appVersion`: Current app version
- `osVersion`: Operating system version
- `platform`: "android" or "ios"

#### Response
```json
{
  "success": true,
  "message": "Device registered successfully",
  "data": {
    "deviceId": "unique_device_identifier",
    "isNewInstallation": true,
    "sessionCount": 1,
    "firstInstall": "2025-09-19T10:30:00.000Z",
    "installationSource": "appstore"
  }
}
```

### 2. Update Device Status
**PUT** `/api/devices?deviceId={deviceId}&action={action}`

Update device status (mark as uninstalled or reactivate).

#### Query Parameters
- `deviceId`: Unique device identifier
- `action`: "uninstall" or "reactivate"

#### Response
```json
{
  "success": true,
  "message": "Device uninstalled successfully",
  "data": {
    "deviceId": "unique_device_identifier",
    "isActive": false,
    "lastActive": "2025-09-19T10:30:00.000Z",
    "uninstallDate": "2025-09-19T10:35:00.000Z"
  }
}
```

## Admin Endpoints

### 3. Get Devices List
**GET** `/api/admin/devices`

Fetch devices with filtering and pagination (requires admin authentication).

#### Query Parameters
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `platform`: Filter by platform ("android", "ios")
- `installationSource`: Filter by source ("playstore", "appstore", "sideload", "unknown")
- `isActive`: Filter by status ("true", "false")
- `search`: Search in username, mobile, device model, IP address
- `sortBy`: Sort field ("createdAt", "lastActiveDate", "totalSessions", "username")
- `sortOrder`: Sort direction ("asc", "desc")

#### Headers
```
Authorization: Bearer YOUR_ADMIN_TOKEN
Content-Type: application/json
```

#### Response
```json
{
  "success": true,
  "data": {
    "devices": [...],
    "pagination": {
      "currentPage": 1,
      "totalPages": 10,
      "totalCount": 200,
      "hasNextPage": true,
      "hasPrevPage": false
    },
    "analytics": {
      "totalDevices": 200,
      "activeDevices": 180,
      "inactiveDevices": 20,
      "androidDevices": 120,
      "iosDevices": 80,
      "playstoreInstalls": 115,
      "appstoreInstalls": 75,
      "totalSessions": 15420,
      "averageSessions": 77.1,
      "recentInstalls": 25
    }
  }
}
```

## Integration Examples

### React Native Example
```javascript
import DeviceInfo from 'react-native-device-info';
import { Platform } from 'react-native';

const registerDevice = async (userId) => {
  try {
    const deviceInfo = {
      userId: userId,
      deviceModel: await DeviceInfo.getModel(),
      deviceId: await DeviceInfo.getUniqueId(),
      installationSource: Platform.OS === 'android' ? 'playstore' : 'appstore',
      appVersion: await DeviceInfo.getVersion(),
      osVersion: await DeviceInfo.getSystemVersion(),
      platform: Platform.OS,
      deviceInfo: {
        brand: await DeviceInfo.getBrand(),
        manufacturer: await DeviceInfo.getManufacturer(),
        batteryLevel: await DeviceInfo.getBatteryLevel() * 100,
        isRooted: await DeviceInfo.isEmulator(), // Use appropriate method
      }
    };

    const response = await fetch('https://your-domain.com/api/devices', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(deviceInfo),
    });

    const result = await response.json();
    console.log('Device registration:', result);
  } catch (error) {
    console.error('Device registration failed:', error);
  }
};
```

### Flutter Example
```dart
import 'package:device_info_plus/device_info_plus.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'dart:io';

Future<void> registerDevice(String userId) async {
  try {
    final deviceInfo = DeviceInfoPlugin();
    final packageInfo = await PackageInfo.fromPlatform();
    
    Map<String, dynamic> data = {
      'userId': userId,
      'appVersion': packageInfo.version,
      'platform': Platform.isAndroid ? 'android' : 'ios',
      'installationSource': Platform.isAndroid ? 'playstore' : 'appstore',
    };
    
    if (Platform.isAndroid) {
      final androidInfo = await deviceInfo.androidInfo;
      data.addAll({
        'deviceModel': androidInfo.model,
        'deviceId': androidInfo.id,
        'osVersion': androidInfo.version.release,
        'deviceInfo': {
          'brand': androidInfo.brand,
          'manufacturer': androidInfo.manufacturer,
          'isRooted': !androidInfo.isPhysicalDevice,
        }
      });
    } else if (Platform.isIOS) {
      final iosInfo = await deviceInfo.iosInfo;
      data.addAll({
        'deviceModel': iosInfo.model,
        'deviceId': iosInfo.identifierForVendor,
        'osVersion': iosInfo.systemVersion,
        'deviceInfo': {
          'brand': 'Apple',
          'manufacturer': 'Apple Inc.',
          'isJailbroken': !iosInfo.isPhysicalDevice,
        }
      });
    }
    
    final response = await http.post(
      Uri.parse('https://your-domain.com/api/devices'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode(data),
    );
    
    final result = jsonDecode(response.body);
    print('Device registration: $result');
  } catch (error) {
    print('Device registration failed: $error');
  }
}
```

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "Missing required device information",
  "required": ["userId", "deviceModel", "deviceId", "appVersion", "osVersion", "platform"]
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "User not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Failed to register device",
  "details": "Internal server error"
}
```

## Best Practices

1. **Call on App Launch**: Register device on every app launch to track sessions
2. **Handle Offline**: Queue registration requests when offline and send when online
3. **Unique Device ID**: Use platform-specific unique identifiers
4. **Privacy Compliance**: Only collect necessary device information
5. **Error Handling**: Implement robust error handling for network failures
6. **Rate Limiting**: Avoid excessive API calls by caching recent registrations

## Rate Limits
- Device registration: 100 requests per minute per IP
- Status updates: 50 requests per minute per IP

## Support
For API support and integration help, contact the development team.
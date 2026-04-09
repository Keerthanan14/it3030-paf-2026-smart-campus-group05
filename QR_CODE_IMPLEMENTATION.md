# QR Code Implementation for Smart Campus Booking System

## Overview

The Smart Campus Booking System now includes automatic QR code generation for bookings. When a booking is created, a unique QR code is generated and stored in the file system. When the booking is approved, students receive a confirmation email with the booking details and access to the QR code.

## Architecture

### Backend Components

#### 1. **QRCodeService** (`QRCodeService.java`)
- **Purpose**: Generates QR codes and stores them on the file system
- **Key Methods**:
  - `generateAndStoreQRCode(UUID bookingId)`: Generates a QR code for a booking and saves it to disk
  - `deleteQRCode(UUID bookingId)`: Removes QR code file when booking is cancelled
- **Configuration**:
  - QR codes are stored in: `{app.file.upload-dir}/qr-codes/`
  - Default upload directory: `uploads/`
  - Default location: `uploads/qr-codes/`
- **QR Code Content**: Contains `booking:{bookingId}` data

#### 2. **QRCodeController** (`QRCodeController.java`)
- **Purpose**: Serves QR code images via REST API
- **Endpoint**: `GET /api/v1/qr-codes/{fileName}`
- **Security**: Validates file names to prevent directory traversal attacks
- **Response**: Returns PNG image with `image/png` content type
- **File Name Format**: `{bookingId}.png` (e.g., `550e8400-e29b-41d4-a716-446655440000.png`)

#### 3. **Booking Entity Updates**
- **New Field**: `qrCodeUrl` (TEXT column)
- **Purpose**: Stores the relative URL path to access the QR code
- **Value Format**: `/api/v1/qr-codes/{bookingId}.png`

#### 4. **BookingResponse DTO Updates**
- **New Field**: `qrCodeUrl: String`
- **Purpose**: Includes QR code URL in API responses
- **Client Usage**: Frontend uses this to display/download QR codes

#### 5. **EmailService Enhancement**
- **New Method**: `sendBookingConfirmation()`
- **Purpose**: Sends booking approval email with QR code download link
- **Content Includes**:
  - Booking resource name and date/time
  - Booking ID
  - QR code download link
- **Email Format**: Plain text (SimpleMailMessage)
- **Requirement**: `app.mail.enabled=true` in application.properties

#### 6. **BookingServiceImpl Updates**
- **In createBooking()**:
  1. Saves booking to database (auto-generates UUID)
  2. Calls `QRCodeService.generateAndStoreQRCode(bookingId)` to generate QR
  3. Stores QR URL in booking record
  4. Returns updated booking response
  
- **In approveBooking()**:
  1. Approves booking and updates database
  2. Calls `emailService.sendBookingConfirmation()` to send email
  3. Email includes QR code download link
  4. Graceful error handling: email failures don't block booking approval

### Frontend Components

#### 1. **BookingItem Type Updates** (`types/booking.ts`)
- **New Field**: `qrCodeUrl: string | null`
- **Purpose**: Stores QR code image URL from backend API

#### 2. **BookingDetailPanel Component Updates**
- **New QR Display Section**:
  - Shows when booking is created (PENDING status onwards)
  - Displays QR code image (300×300px)
  - Shows "Download QR Code" button
  - Responsive design with centered layout
- **QR Code Display**:
  - Image source: `selectedBooking.qrCodeUrl`
  - Alt text: "Booking QR Code"
  - Size: 192×192px display (h-48 w-48)
- **Download Capability**:
  - Downloads as `booking-{bookingId}.png`
  - Direct download link from server

## Configuration

### Backend Configuration (`application.properties`)

```properties
# File upload directory (where QR codes are stored)
app.file.upload-dir=uploads

# Base URL for QR code API access (used in emails)
app.base-url=http://localhost:8080

# Email configuration (required for booking confirmations)
app.mail.enabled=true
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=your-email@gmail.com
spring.mail.password=your-app-password
app.mail.from=noreply@smartcampus.local
```

### Environment Variables

```bash
# Optional: Override defaults with environment variables
FILE_UPLOAD_DIR=/path/to/uploads
BASE_URL=https://your-production-domain.com
MAIL_ENABLED=true
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
```

## Data Flow

### 1. Booking Creation Flow
```
User submits booking request
        ↓
Backend: createBooking() validates request
        ↓
Save booking to database (UUID auto-generated)
        ↓
QRCodeService generates QR code
        ↓
Save QR code file to: uploads/qr-codes/{bookingId}.png
        ↓
Update booking record with qrCodeUrl: /api/v1/qr-codes/{bookingId}.png
        ↓
Save updated booking
        ↓
Return BookingResponse (includes qrCodeUrl)
        ↓
Frontend displays booking with QR URL
```

### 2. Booking Approval Flow
```
Admin clicks "Approve" on pending booking
        ↓
Backend: approveBooking() validates approval
        ↓
Update booking status to APPROVED
        ↓
Send notification to student (existing flow)
        ↓
EmailService.sendBookingConfirmation():
  - Fetch booking details
  - Construct email with QR download link
  - Send to student email
        ↓
Return updated booking response
        ↓
Frontend shows success message
```

### 3. QR Code Access Flow
```
Student receives email with QR download link
        ↓
Frontend displays QR code in booking detail modal
        ↓
Student clicks "Download QR Code"
        ↓
Browser requests: GET /api/v1/qr-codes/{bookingId}.png
        ↓
QRCodeController validates fileName
        ↓
Reads file from: uploads/qr-codes/{bookingId}.png
        ↓
Returns PNG image (image/png content-type)
        ↓
Browser downloads as: booking-{bookingId}.png
        ↓
Student can print or display on phone for resource check-in
```

## Database Schema

### Bookings Table Addition
```sql
ALTER TABLE bookings ADD COLUMN qr_code_url TEXT;

-- Example data:
-- qr_code_url: /api/v1/qr-codes/550e8400-e29b-41d4-a716-446655440000.png
```

## File System Structure

```
project-root/
├── backend/
│   └── uploads/
│       └── qr-codes/
│           ├── 550e8400-e29b-41d4-a716-446655440000.png
│           ├── 660e8400-e29b-41d4-a716-446655440001.png
│           └── ... (one PNG file per booking)
└── ...
```

## API Endpoints

### Get Booking with QR Code
```
GET /api/v1/bookings/{bookingId}

Response:
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "userId": "...",
  "resourceName": "Study Area A",
  "bookingDate": "2025-05-15",
  "startTime": "10:00",
  "endTime": "12:00",
  "status": "APPROVED",
  "qrCodeUrl": "/api/v1/qr-codes/550e8400-e29b-41d4-a716-446655440000.png",
  ...
}
```

### Download QR Code
```
GET /api/v1/qr-codes/{bookingId}.png

Response: PNG image file
Content-Type: image/png
```

## Email Template

When booking is approved, student receives:

```
Subject: Smart Campus - Booking Confirmed

Hi [Student Name],

Your booking has been confirmed!

Resource: [Resource Name]
Date: [Month Day, Year]
Time: [Start Time] - [End Time]
Booking ID: [Booking UUID]

Your QR Code:
Download: http://localhost:8080/api/v1/qr-codes/[bookingId].png

Please present this QR code when using the resource.

Smart Campus Operations Hub
```

## Error Handling

### QR Code Generation Failures
- If QR generation fails during booking creation, a `BookingBadRequestException` is thrown
- Booking creation is rolled back
- User sees error message

### Email Send Failures
- If email fails during booking approval, the booking is still approved
- Error is logged to console
- Approval succeeds (non-blocking error)
- User can still access QR code from booking detail view

### File Access Failures
- Invalid file names are rejected with 400 BAD_REQUEST
- Missing files return 404 NOT_FOUND
- I/O errors return 500 INTERNAL_SERVER_ERROR

## Security Considerations

1. **File Path Validation**:
   - QRCodeController validates file names to prevent directory traversal
   - Only allows alphanumeric characters, hyphens, and extensions

2. **File Storage**:
   - QR codes stored in dedicated directory outside web root
   - Access controlled through API endpoint with validation

3. **Email Delivery**:
   - Uses secure SMTP (TLS) when configured
   - Email addresses validated before sending

4. **QR Code Content**:
   - Encodes booking UUID (not sensitive personal data)
   - Can be safely shared/displayed

## Maintenance

### Cleanup of Old QR Code Files
```java
// When booking is cancelled:
qrCodeService.deleteQRCode(booking.getId());
```

### Disk Space Management
- Monitor `uploads/qr-codes/` directory size
- PNG files are ~2-5 KB each
- Consider implementing periodic cleanup of cancelled bookings

### Backup Considerations
- Include `uploads/` directory in backup strategy
- QR codes can be regenerated from booking IDs if needed

## Testing

### Manual Testing Steps

1. **Create a Booking**
   - POST to `/api/v1/bookings`
   - Verify QR file exists at `uploads/qr-codes/{bookingId}.png`
   - Verify response includes qrCodeUrl

2. **View Booking Details**
   - Frontend shows QR code in booking detail modal
   - Image loads correctly

3. **Download QR Code**
   - Click "Download QR Code" button
   - Browser downloads PNG file
   - File is valid and contains QR code

4. **Approve Booking**
   - Admin approves booking
   - Check email inbox (if mail.enabled=true)
   - Email contains QR download link

5. **Serve QR Code**
   - GET `/api/v1/qr-codes/{bookingId}.png`
   - Verify PNG image is returned
   - Try invalid fileName - should get 400 error

## Dependencies

### Backend Libraries
```xml
<!-- QR Code Generation -->
<dependency>
    <groupId>com.google.zxing</groupId>
    <artifactId>core</artifactId>
    <version>3.5.3</version>
</dependency>
<dependency>
    <groupId>com.google.zxing</groupId>
    <artifactId>javase</artifactId>
    <version>3.5.3</version>
</dependency>
```

### Frontend Libraries
- lucide-react: Icon library (QrCode, Download icons)
- React: UI rendering

## Future Enhancements

1. **Email with QR Attachment**:
   - Modify EmailService to use MimeMessage
   - Send QR code as email attachment instead of download link

2. **QR Code Variants**:
   - Multiple QR formats (different sizes)
   - QR code regeneration endpoint

3. **Analytics**:
   - Track QR code downloads
   - Monitor resource check-ins via QR scans

4. **Mobile App Integration**:
   - Mobile app can scan QR codes for check-in
   - Verify booking validity at resource location

5. **Check-in System**:
   - Verify QR code when student arrives at resource
   - Automatic status update on check-in

## Troubleshooting

### QR Code Not Showing in Detail Modal
- Verify `qrCodeUrl` is included in BookingResponse
- Check browser console for image loading errors
- Verify QRCodeController endpoint is working

### Email Not Sending
- Check `app.mail.enabled=true` in properties
- Verify SMTP credentials are correct
- Check console logs for email errors
- Booking approval still succeeds (email is non-blocking)

### File Not Found Errors
- Verify `app.file.upload-dir` directory exists and is writable
- Check directory permissions
- Verify QR file exists in file system: `ls uploads/qr-codes/`

### Invalid File Name Errors
- File names must be valid UUIDs
- Check for special characters in booking ID
- URL encode file names if needed

## Related Documentation

- [Booking Management System](./BOOKING_MANAGEMENT_FLOW.md)
- [Email Service Configuration](./email-configuration.md)
- [File Upload Configuration](./file-upload-configuration.md)

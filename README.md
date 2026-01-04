# Excel Academy - Student Management System

A comprehensive student management system with separate admin and student portals, built with Next.js 16, React, and TypeScript.

## 🚀 Features

### 1. **Separate Admin & Student Pages**
- **Admin Dashboard**: Full control over student management and result generation
- **Student Dashboard**: Personal portal to view results and download report cards

### 2. **Authentication System**
- **Login Page**: Unified login for both admin and students
- **Student Registration**: New students can create accounts with auto-generated unique IDs
- **Admin Approval**: All new student registrations require admin approval

### 3. **Result Template Generator**
The admin can generate comprehensive student results with:
- ✅ **Student ID**: Auto-generated unique identifier
- ✅ **Full Name**: Student's complete name
- ✅ **Grade & Section**: Class information
- ✅ **Subject Marks**: All 8 subjects with marks out of 100
  - Mathematics
  - English
  - Physics
  - Chemistry
  - Biology
  - History
  - Geography
  - Computer Science
- ✅ **Automatic Grade Calculation**: A+, A, B+, B, C, D, F based on marks
- ✅ **Total Marks**: Sum of all subject marks
- ✅ **Average**: Percentage calculation
- ✅ **Conduct**: Excellent, Good, Fair, or Poor
- ✅ **Promotion Status**: Promoted or Detained

### 4. **Student Account Creation Flow**
1. Student fills registration form with:
   - Full Name
   - Grade
   - Section
   - Password (minimum 6 characters)
2. System generates unique Student ID (format: ST-YYYY-XXXX)
3. ID is displayed **ONLY ONCE** with copy-to-clipboard functionality
4. Account status is set to "Pending"
5. Student must wait for admin approval before login

### 5. **Admin Approval System**
- View all pending student registrations
- See registration details (name, ID, grade, section, date)
- Approve or reject applications
- Real-time updates on pending approval count

### 6. **PDF Report Generation**
- Students can download professional PDF report cards
- Includes all subjects, grades, and promotion status
- Professional formatting with school branding

## 🔐 Authentication & Security

### Default Credentials
**Admin Account:**
- Email: `admin@excel.edu`
- Password: `admin123`

### Student Login
Students use their generated Student ID and chosen password:
- Student ID format: `ST-2024-XXXX`
- Password: Set during registration

## 📱 Pages Overview

### `/login` - Authentication Page
- Toggle between Login and Register modes
- Student registration with unique ID generation
- Email/Student ID login support
- Visual feedback for approval status

### `/admin` - Admin Dashboard
Three main sections:
1. **Pending Approvals**: Review and approve/reject new students
2. **Generate Results**: Create results using the template generator
3. **All Students**: View and manage active students

Features:
- Real-time statistics (total students, pending approvals, published results)
- Template download for bulk operations
- Subject-wise mark entry with automatic grade calculation
- Conduct and promotion status selection

### `/student` - Student Dashboard
- Personal information display
- Academic results with subject breakdown
- Visual grade indicators (color-coded)
- Summary statistics (total, average, conduct)
- Promotion status badge
- PDF download functionality

### `/` - Home Page
Public landing page with school information

### `/announcements` - Announcements
School-wide announcements and updates

## 🛠️ Technology Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: Radix UI primitives
- **PDF Generation**: jsPDF
- **State Management**: React Context API
- **Storage**: LocalStorage (demo mode)

## 🚦 Getting Started

### Launch the System (Recommended)
The easiest way to start the system is by running the unified control script:
```batch
START_SYSTEM.bat
```
*This single command handles everything: dependency installation, port cleanup, cache clearing, and launching the server.*
Visit [http://localhost:3000](http://localhost:3000)

### Build for Production
```bash
npm run build
npm start
```

## 📋 How to Use

### For Administrators

1. **Login** with admin credentials
2. **Approve Students**: 
   - Go to "Pending Approvals" tab
   - Review student details
   - Click "Approve" or "Reject"
3. **Generate Results**:
   - Go to "Generate Results" tab
   - Select a student from dropdown
   - Enter marks for all 8 subjects (0-100)
   - Grades are auto-calculated
   - Set conduct (Excellent/Good/Fair/Poor)
   - Set status (Promoted/Detained)
   - Click "Generate & Save Result"
4. **View Students**: See all active students in a table

### For Students

1. **Register**:
   - Click "Register" on login page
   - Fill in full name, grade, section, password
   - **IMPORTANT**: Copy and save your Student ID (shown only once!)
   - Wait for admin approval
2. **Login**:
   - Use your Student ID and password
   - System will inform if still pending approval
3. **View Results**:
   - Once logged in, see your dashboard
   - View all subject marks and grades
   - Check total, average, and conduct
   - See promotion status
   - Download PDF report card

## 🎯 Key Features Explained

### Unique Student ID Generation
- Format: `ST-YYYY-XXXX`
- YYYY = Current year
- XXXX = Random 4-digit number
- Guaranteed to be unique
- Shown only once at registration

### Automatic Grade Calculation
- 90-100: A+
- 80-89: A
- 70-79: B+
- 60-69: B
- 50-59: C
- 40-49: D
- Below 40: F

### Result Template Structure
```
Student Information:
- ID
- Full Name
- Grade & Section

Academic Performance:
- All 8 subjects with marks (out of 100)
- Auto-calculated grades
- Total marks
- Average percentage
- Conduct rating
- Promotion/Detention status
```

## 💾 Data Storage

Currently using **LocalStorage** for demo purposes with three storage keys:
- `excel_academy_users`: All user accounts
- `excel_academy_current_user`: Current session
- `excel_academy_results`: Student results

**Note**: In production, replace with a proper database (PostgreSQL, MongoDB, etc.)

## 🔄 Workflow

```
New Student Registration
    ↓
Unique ID Generated
    ↓
Admin Receives Approval Request
    ↓
Admin Approves/Rejects
    ↓
[If Approved] Student Can Login
    ↓
Admin Generates Results
    ↓
Student Views Results & Downloads PDF
```

## 🎨 UI/UX Highlights

- Clean, modern interface
- Dark mode support (via Tailwind)
- Responsive design (mobile, tablet, desktop)
- Color-coded grade indicators
- Real-time form validation
- Toast notifications
- Loading states
- Empty states

## 📦 Component Structure

```
src/
├── app/
│   ├── admin/         # Admin dashboard
│   ├── student/       # Student portal
│   ├── login/         # Authentication
│   ├── announcements/ # Public announcements
│   └── ...
├── components/
│   ├── ui/           # Reusable UI components
│   └── Navbar.tsx    # Navigation with auth
├── contexts/
│   └── AuthContext.tsx # Authentication state
└── lib/
    └── utils.ts      # Utility functions
```

## 🚀 Future Enhancements

- Database integration (Supabase, PostgreSQL)
- Email notifications for approvals
- Bulk result upload via CSV/Excel
- Grade history and trends
- Parent portal
- Attendance tracking
- Fee management
- Teacher portal
- Mobile app version

## 📝 License

This is a demo application for educational purposes.

---

**Built with Beimnetyalmzewd@gmail.com for Excel Academy**

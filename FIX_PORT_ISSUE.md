# How to Fix Port 3000 Already in Use Error

## Quick Fix Methods

### Method 1: Use the Port Cleaner Script (Recommended)
```powershell
powershell -ExecutionPolicy Bypass -File clear-port-3000.ps1
```

This script will:
- Find all processes using port 3000
- Kill Node.js processes
- Verify the port is free
- Provide clear status messages

### Method 2: Use START_SYSTEM.bat (Automatic)
The `START_SYSTEM.bat` script now has improved port management:
- Automatically detects processes using port 3000
- Attempts to kill them automatically
- Provides clear error messages if manual intervention is needed

Simply run:
```batch
START_SYSTEM.bat
```

### Method 3: Manual Fix via Task Manager
1. Press `Ctrl + Shift + Esc` to open Task Manager
2. Go to the "Details" tab
3. Look for `node.exe` processes
4. Right-click and select "End Task"
5. Try starting the server again

### Method 4: Manual Fix via Command Line
```batch
REM Kill all Node.js processes
taskkill /F /IM node.exe

REM Or kill a specific process by PID
taskkill /F /PID <PID_NUMBER>
```

To find the PID:
```batch
netstat -ano | findstr :3000
```

### Method 5: Use a Different Port (Temporary)
If you can't free port 3000, you can temporarily use a different port:

1. Edit `package.json`:
```json
"dev": "next dev -H 0.0.0.0 -p 3001"
```

2. Or set environment variable:
```batch
set PORT=3001
npm run dev
```

## Why This Happens

- Previous server instance didn't close properly
- Multiple server instances running
- Process crashed but port wasn't released
- Browser or other application using the port

## Prevention

- Always stop the server properly (Ctrl+C)
- Use `START_SYSTEM.bat` which handles port management automatically
- Close all terminal windows before starting a new server instance

## Still Having Issues?

1. Restart your computer (releases all ports)
2. Check if another application is using port 3000
3. Run the port cleaner script as Administrator
4. Check Windows Firewall settings


# Namma Tirupur 
Namma Tirupur is a Smart Civic Complaint, Communication & Community Platform that enables citizens to report local issues, receive real-time alerts, and interact with authorities transparently.

## Features

### For Citizens (Users)
- Register and login
- Post problems/complaints with categories
- View status of submitted problems
- Receive admin replies and notifications
- Update profile

### For Admin
- View all registered users
- View all problems/complaints
- Reply to problems
- Assign problems to departments
- Update problem status (Pending, In Progress, Resolved, Rejected)

## Prerequisites

1. **Java JDK 17 or higher**
2. **MySQL Server 8.0 or higher**
3. **MySQL Connector/J** (JDBC Driver)

## Database Setup

1. Install and start MySQL Server
2. The application will automatically create:
   - Database: `namma_tirupur`
   - Tables: `users`, `problems`, `admin_replies`, `problem_assignments`
   - Default admin account

## MySQL Connector Setup

Download MySQL Connector/J from:
https://dev.mysql.com/downloads/connector/j/

Place the `mysql-connector-j-x.x.x.jar` file in the `lib` folder.

## How to Run

### Using Command Line

```bash
# Navigate to project directory
cd NammaTirupur

# Create lib folder and add MySQL connector JAR
mkdir lib
# Copy mysql-connector-j-x.x.x.jar to lib folder

# Compile
javac -cp "lib/*" -d bin src/**/*.java src/*.java

# Run
java -cp "bin;lib/*" Namma
```

## Admin Credentials

- **Email:** naatirupur@gmail.com
- **Password:** 123

## Project Structure

```
NammaTirupur/
├── src/
│   ├── Namma.java              # Main entry point
│   ├── config/
│   │   └── DatabaseConfig.java # MySQL database configuration
│   ├── models/
│   │   ├── User.java           # User model
│   │   ├── Problem.java        # Problem/Complaint model
│   │   └── AdminReply.java     # Admin reply model
│   ├── services/
│   │   ├── AuthenticationService.java  # Auth logic
│   │   └── DatabaseService.java        # Database operations
│   ├── ui/
│   │   └── AuthUI.java         # Console UI
│   ├── utils/
│   │   └── Validator.java      # Input validation
│   ├── exceptions/
│   │   ├── AuthenticationException.java
│   │   └── RegistrationException.java
│   └── enums/
│       └── Role.java
├── lib/
│   └── mysql-connector-j-x.x.x.jar  # MySQL JDBC driver
└── README.md
```

## Database Tables

### users
- user_id (PK), name, email (unique), password, role, area, contact, registered_date

### problems
- problem_id (PK), user_id (FK), title, description, category, location, status, priority, created_date, updated_date

### admin_replies
- reply_id (PK), problem_id (FK), admin_id (FK), reply_message, reply_date, is_read

### problem_assignments
- assignment_id (PK), problem_id (FK), assigned_by (FK), assigned_to, department, assignment_date, notes

## Status Icons
- ⏳ PENDING - Waiting for review
- 🔄 IN_PROGRESS - Being worked on  
- ✅ RESOLVED - Issue fixed
- ❌ REJECTED - Not valid/duplicate


# Project & Task Tracker

A Trello-lite task management system built with Node.js, Express, MongoDB, and React. This is a university final project demonstrating advanced MongoDB operations including embedded documents, referenced relationships, aggregation pipelines, and compound indexes.
This project was developed as a final assignment for the "Advanced Databases (NoSQL)" course and focuses on practical application of MongoDB design principles and advanced querying techniques.


---

## Architecture Overview

### Backend Stack
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JWT ( Web Tokens)
- **Password Hashing:** bcryptjs

### Frontend Stack
- **Framework:** React (Vite)
- **Routing:** React Router
- **HTTP Client:** Axios

### Project Structure
```
project-task-tracker/
├── server/                 # Backend API
│   ├── models/            # Mongoose schemas
│   ├── routes/            # API endpoints
│   ├── middleware/        # Auth middleware
│   ├── index.js           # Server entry point
│   └── package.
└── client/                # Frontend
    └── ...
```

---

## Database Schema

### Collections & Relationships

#### 1. **Users Collection**
```
{
  _id: ObjectId,
  username: String (unique),
  email: String (unique),
  password: String (hashed),
  createdAt: Date,
  updatedAt: Date
}
```

#### 2. **Projects Collection**
```
{
  _id: ObjectId,
  name: String,
  description: String,
  owner: ObjectId,  // REFERENCED → User._id
  createdAt: Date,
  updatedAt: Date
}
```

#### 3. **Tasks Collection**
```
{
  _id: ObjectId,
  title: String,
  description: String,
  projectId: ObjectId,    // REFERENCED → Project._id
  assigneeId: ObjectId,   // REFERENCED → User._id
  status: String,         // enum: 'todo', 'inprogress', 'done'
  priority: String,       // enum: 'low', 'medium', 'high'
  dueDate: Date,
  updatesCount: Number,   // Incremented on each update
  comments: [             // EMBEDDED subdocuments
    {
      _id: ObjectId,
      text: String,
      author: ObjectId,   // REFERENCED → User._id
      createdAt: Date
    }
  ],
  createdAt: Date,
  updatedAt: Date
}
```

### Embedded vs Referenced Documents

**Referenced Relationships (Foreign Keys):**
- `Project.owner` → `User._id`
- `Task.projectId` → `Project._id`
- `Task.assigneeId` → `User._id`
- `Task.comments[].author` → `User._id`

**Why Referenced?** These entities exist independently and may be queried separately. For example, we might want to find all projects by a user, or all tasks assigned to a user

**Embedded Documents:**
- `Task.comments[]` - Comments are embedded within tasks

**Why Embedded?** Comments don't exist independently of tasks. They are always accessed in the context of a task, making embedding more efficient (single query instead of joins)

### Indexes & Optimization

**Compound Index on Tasks:**
```
taskSchema.index({ projectId: 1, status: 1 });
```

**Why This Index Helps:**
This compound index dramatically improves performance for the most common query pattern: "Get all tasks for project X with status Y" (e.g., "show all 'inprogress' tasks for this project")

Without this index, MongoDB would need to:
1. Scan all tasks to find those matching the projectId
2. Filter the results by status

With the index, MongoDB can directly locate the exact subset of documents, reducing query time from O(n) to O(log n).

---

## API Endpoints

### Authentication

#### Register User
```
POST /api/auth/register
Content-Type: application/

{
  "username": "ali",
  "email": "ali@example.com",
  "password": "password123"
}
```

**Response:**
```
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "65f1234567890abcdef12345",
      "username": "ali",
      "email": "ali@example.com"
    }
  }
}
```

#### Login
```
POST /api/auth/login
Content-Type: application/

{
  "email": "ali@example.com",
  "password": "password123"
}
```

**Response:** Same as register

---

### Projects

**Authentication Header Required:**
```
Authorization: Bearer <your_jwt_token>
```

#### Get All Projects
```
GET /api/projects
Authorization: Bearer <token>
```

**Response:**
```
{
  "success": true,
  "data": [
    {
      "_id": "65f1234567890abcdef12345",
      "name": "Website Redesign",
      "description": "Redesign company website",
      "owner": {
        "_id": "65f1234567890abcdef12340",
        "username": "ali",
        "email": "ali@example.com"
      },
      "createdAt": "2026-01-15T10:30:00.000Z",
      "updatedAt": "2026-01-15T10:30:00.000Z"
    }
  ]
}
```

#### Create Project
```
POST /api/projects
Authorization: Bearer <token>
Content-Type: application/

{
  "name": "Mobile App Development",
  "description": "Build iOS and Android apps"
}
```

#### Update Project
```
PUT /api/projects/:id
Authorization: Bearer <token>
Content-Type: application/

{
  "name": "Updated Project Name",
  "description": "Updated description"
}
```

#### Delete Project
```
DELETE /api/projects/:id
Authorization: Bearer <token>
```



#### Get Tasks for Project
```
GET /api/projects/:id/tasks
Authorization: Bearer <token>
```

**Response:**
```
{
  "success": true,
  "data": [
    {
      "_id": "65f1234567890abcdef12346",
      "title": "Design homepage mockup",
      "description": "Create Figma designs",
      "projectId": "65f1234567890abcdef12345",
      "assigneeId": {
        "_id": "65f1234567890abcdef12340",
        "username": "ali",
        "email": "ali@example.com"
      },
      "status": "inprogress",
      "priority": "high",
      "dueDate": "2026-02-01T00:00:00.000Z",
      "updatesCount": 3,
      "comments": [
        {
          "_id": "65f1234567890abcdef12347",
          "text": "Started working on this",
          "author": {
            "_id": "65f1234567890abcdef12340",
            "username": "ali"
          },
          "createdAt": "2026-01-16T09:00:00.000Z"
        }
      ],
      "createdAt": "2026-01-15T11:00:00.000Z",
      "updatedAt": "2026-01-16T14:30:00.000Z"
    }
  ]
}
```

#### Get Project Summary (Aggregation Pipeline)
```
GET /api/projects/:id/summary
Authorization: Bearer <token>
```

**Response:**
```
{
  "success": true,
  "data": {
    "totalTasks": 15,
    "tasksByStatus": {
      "todo": 5,
      "inprogress": 7,
      "done": 3
    },
    "overdueTasks": 2,
    "topAssignees": [
      {
        "_id": "65f1234567890abcdef12340",
        "taskCount": 8,
        "username": "ali",
        "email": "ali@example.com"
      },
      {
        "_id": "65f1234567890abcdef12341",
        "taskCount": 5,
        "username": "alina",
        "email": "alina@example.com"
      }
    ]
  }
}
```

---


#### Create Task
```
POST /api/tasks
Authorization: Bearer <token>
Content-Type: application/

{
  "title": "Implement user authentication",
  "description": "Add JWT-based auth",
  "projectId": "65f1234567890abcdef12345",
  "assigneeId": "65f1234567890abcdef12340",
  "status": "todo",
  "priority": "high",
  "dueDate": "2026-02-10T00:00:00.000Z"
}
```

#### Update Task (Using $set and $inc)
```
PATCH /api/tasks/:id
Authorization: Bearer <token>
Content-Type: application/

{
  "status": "inprogress",
  "priority": "high"
}
```

**MongoDB Operation Used:**
```
{
  $set: { status: "inprogress", priority: "high" },
  $inc: { updatesCount: 1 }  // Automatically increments by 1
}
```

#### Add Comment (Using $push)
```
POST /api/tasks/:id/comments
Authorization: Bearer <token>
Content-Type: application/

{
  "text": "This is looking good, keep it up"
}
```

**MongoDB Operation Used:**
```
{
  $push: { 
    comments: { 
      text: "This is looking good, keep it up!",
      author: req.user.id,
      createdAt: new Date()
    }
  }
}
```

#### Delete Comment (Using $pull)
```
DELETE /api/tasks/:id/comments/:commentId
Authorization: Bearer <token>
```

**MongoDB Operation Used:**
```
{
  $pull: { 
    comments: { _id: commentId } 
  }
}
```

---

## Aggregation Pipeline Explanation

The `/api/projects/:id/summary` endpoint uses MongoDB's aggregation framework to compute project statistics efficiently

### Pipeline Stages:

1. **$match:** Filter tasks belonging to the specified project
   ```
   { $match: { projectId: project._id } }
   ```

2. **$facet:** Run multiple aggregation pipelines in parallel
   - **totalTasks:** Count all tasks
   - **tasksByStatus:** Group tasks by status and count each group
   - **overdueTasks:** Count tasks that are overdue (dueDate < now AND status != 'done')
   - **topAssignees:** Find users with most tasks using $lookup

3. **$lookup (in topAssignees):** Join with Users collection
   ```
   {
     $lookup: {
       from: 'users',
       localField: '_id',        // assigneeId from grouped tasks
       foreignField: '_id',       // User._id
       as: 'userInfo'
     }
   }
   ```

4. **$unwind, $project, $sort, $limit:** Format and rank assignees

**Why Aggregation?** This single query replaces what would otherwise require multiple queries and client-side processing, significantly improving performance

---

## API Examples

This section provides clean, screenshot-ready examples for documentation and reports

### 1. Login Response

**Request:**
```
POST /api/auth/login
Content-Type: application/

{
  "email": "ali@example.com",
  "password": "password123"
}
```

**Response:**
```
{
  "success": true,
  "data": {
    "token": "<JWT_TOKEN>",
    "user": {
      "id": "65f1234567890abcdef12345",
      "username": "ali",
      "email": "ali@example.com"
    }
  }
}
```

### 2. Create Project

**Request:**
```
POST /api/projects
Authorization: Bearer <TOKEN>
Content-Type: application/

{
  "name": "Website Redesign",
  "description": "Complete redesign of company website"
}
```

**Response:**
```
{
  "success": true,
  "data": {
    "_id": "65f1234567890abcdef12345",
    "name": "Website Redesign",
    "description": "Complete redesign of company website",
    "owner": "65f1234567890abcdef12340",
    "createdAt": "2026-01-15T10:30:00.000Z",
    "updatedAt": "2026-01-15T10:30:00.000Z"
  }
}
```

### 3. Create Task (with Priority Enum)

**Request:**
```
POST /api/tasks
Authorization: Bearer <TOKEN>
Content-Type: application/

{
  "title": "Design homepage mockup",
  "description": "Create Figma designs for the new homepage",
  "projectId": "65f1234567890abcdef12345",
  "status": "todo",
  "priority": "high",
  "dueDate": "2026-03-01"
}
```

**Response:**
```
{
  "success": true,
  "data": {
    "_id": "65f1234567890abcdef12346",
    "title": "Design homepage mockup",
    "description": "Create Figma designs for the new homepage",
    "projectId": {
      "_id": "65f1234567890abcdef12345",
      "name": "Website Redesign"
    },
    "assigneeId": null,
    "status": "todo",
    "priority": "high",
    "dueDate": "2026-03-01T00:00:00.000Z",
    "updatesCount": 0,
    "comments": [],
    "createdAt": "2026-01-15T11:00:00.000Z",
    "updatedAt": "2026-01-15T11:00:00.000Z"
  }
}
```

**Note:** Priority values are enum strings: `"low"`, `"medium"`, or `"high"`

### 4. Project Summary (Aggregation Pipeline)

**Request:**
```
GET /api/projects/65f1234567890abcdef12345/summary
Authorization: Bearer <TOKEN>
```

**Response:**
```
{
  "success": true,
  "data": {
    "totalTasks": 15,
    "tasksByStatus": {
      "todo": 5,
      "inprogress": 7,
      "done": 3
    },
    "overdueTasks": 2,
    "topAssignees": [
      {
        "_id": "65f1234567890abcdef12340",
        "taskCount": 8,
        "username": "ali",
        "email": "ali@example.com"
      },
      {
        "_id": "65f1234567890abcdef12341",
        "taskCount": 5,
        "username": "alina",
        "email": "alina@example.com"
      }
    ]
  }
}
```

**What this demonstrates:**
- MongoDB aggregation pipeline with `$match`, `$facet`, `$group`
- `$lookup` operator to join Users collection for assignee details
- Complex analytics computed in a single database query

---

## How to Run Locally

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas account)
- npm or yarn

### Backend Setup

1. **Navigate to server directory:**
   ```bash
   cd server
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create `.env` file:**
   ```bash
   cp .env.example .env
   ```

4. **Edit `.env` file with your configuration:**
   ```env
   MONGO_URI=mongodb://localhost:27017/project_task_tracker
   # OR for MongoDB Atlas:
   # MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/project_task_tracker
   
   JWT_SECRET=your_super_secret_key_change_this_in_production
   PORT=5000
   ```

5. **Start the server:**
   ```bash
   # Development mode (with auto-reload)
   npm run dev
   
   # Production mode
   npm start
   ```

6. **Verify server is running:**
   - You should see: `MongoDB Connected: <host>`
   - You should see: `Server running on port 5000`
   - Visit: http://localhost:5000 (should show "API is running...")

### Frontend Setup

1. **Navigate to client directory:**
   ```bash
   cd client
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Open browser:**
   - Visit: http://localhost:5173

**Available Pages:**
- `/login` - Login/Register page
- `/projects` - Projects list (protected)
- `/projects/:id` - Project details with tasks (protected)
- `/tasks/:id` - Task details with comments (protected)

---

## Manual Checklist for Student Defense

Use this checklist to prepare for your project defense:

### Pre-Defense Setup

- [ ] **Install MongoDB**
  - Local: Download from mongodb.com
  - Cloud: Create free cluster at mongodb.com/atlas

- [ ] **Create Database**
  - Database name: `project_task_tracker`
  - Note connection string

- [ ] **Configure Environment**
  - Create `.env` file in `/server`
  - Set `MONGO_URI` with your connection string
  - Set `JWT_SECRET` to a random string (e.g., "mySecretKey123")
  - Set `PORT=5000`

- [ ] **Install Dependencies**
  ```bash
  cd server
  npm install
  ```

- [ ] **Start Backend**
  ```bash
  npm run dev
  ```
  - Verify "MongoDB Connected" message
  - Verify "Server running on port 5000" message

### Testing Flow (Use Postman, Thunder Client, or curl)

- [ ] **Test Registration**
  - POST http://localhost:5000/api/auth/register
  - Body: `{ "username": "testuser", "email": "test@test.com", "password": "test123" }`
  - Save the returned token

- [ ] **Test Login**
  - POST http://localhost:5000/api/auth/login
  - Body: `{ "email": "test@test.com", "password": "test123" }`
  - Verify token is returned

- [ ] **Test Create Project**
  - POST http://localhost:5000/api/projects
  - Header: `Authorization: Bearer <your_token>`
  - Body: `{ "name": "Test Project", "description": "My first project" }`
  - Save the project ID

- [ ] **Test Get Projects**
  - GET http://localhost:5000/api/projects
  - Header: `Authorization: Bearer <your_token>`
  - Verify your project appears

- [ ] **Test Create Task**
  - POST http://localhost:5000/api/tasks
  - Header: `Authorization: Bearer <your_token>`
  - Body:
    ```
    {
      "title": "Test Task",
      "description": "Testing task creation",
      "projectId": "<your_project_id>",
      "status": "todo",
      "priority": "high",
      "dueDate": "2026-12-31"
    }
    ```
  - Save the task ID

- [ ] **Test Update Task (Demonstrates $set and $inc)**
  - PATCH http://localhost:5000/api/tasks/<task_id>
  - Header: `Authorization: Bearer <your_token>`
  - Body: `{ "status": "inprogress" }`
  - Verify `updatesCount` increased by 1

- [ ] **Test Add Comment (Demonstrates $push)**
  - POST http://localhost:5000/api/tasks/<task_id>/comments
  - Header: `Authorization: Bearer <your_token>`
  - Body: `{ "text": "This is a test comment" }`
  - Verify comment appears in task

- [ ] **Test Delete Comment (Demonstrates $pull)**
  - DELETE http://localhost:5000/api/tasks/<task_id>/comments/<comment_id>
  - Header: `Authorization: Bearer <your_token>`
  - Verify comment is removed

- [ ] **Test Aggregation Pipeline**
  - GET http://localhost:5000/api/projects/<project_id>/summary
  - Header: `Authorization: Bearer <your_token>`
  - Verify response shows:
    - Total tasks count
    - Tasks grouped by status
    - Overdue tasks count
    - Top assignees (with $lookup)

- [ ] **Verify Database Indexes**
  - Connect to MongoDB:
    ```bash
    mongosh
    use project_task_tracker
    db.tasks.getIndexes()
    ```
  - Verify compound index exists: `{ projectId: 1, status: 1 }`

### Defense Talking Points

- [ ] **Explain Embedded vs Referenced**
  - Comments are embedded in tasks (efficiency, always accessed together)
  - Projects/Users are referenced (independent entities, queried separately)

- [ ] **Explain Advanced MongoDB Operations**
  - `$set`: Update specific fields
  - `$inc`: Increment numeric values (updatesCount)
  - `$push`: Add to embedded array (comments)
  - `$pull`: Remove from embedded array (delete comment)

- [ ] **Explain Aggregation Pipeline**
  - Walk through each stage of the summary endpoint
  - Explain `$lookup` for joining Users collection
  - Discuss performance benefits vs multiple queries

- [ ] **Explain Compound Index**
  - Why `{ projectId: 1, status: 1 }` improves query performance
  - Show example query that benefits from this index
  - Discuss trade-offs (write performance vs read performance)

- [ ] **Explain JWT Authentication**
  - How tokens are generated on login/register
  - How middleware verifies tokens
  - Why JWT is stateless and scalable

---

## Advanced MongoDB Features Demonstrated

### 1. Embedded Documents
- **Location:** `Task.comments[]`
- **Benefit:** Single query to get task with all comments

### 2. Referenced Documents
- **Locations:** `Project.owner`, `Task.projectId`, `Task.assigneeId`
- **Benefit:** Normalization, independent querying, data integrity

### 3. Advanced Update Operators
- **$set:** Update specific fields without affecting others
- **$inc:** Atomic increment operation (thread-safe)
- **$push:** Add to array (embedded comments)
- **$pull:** Remove from array by condition

### 4. Aggregation Pipeline
- **$match:** Filter documents
- **$facet:** Parallel aggregation pipelines
- **$group:** Group by field and compute aggregates
- **$lookup:** Join collections (SQL-like JOIN)
- **$unwind:** Deconstruct arrays
- **$project:** Shape output documents
- **$sort, $limit:** Order and limit results

### 5. Compound Indexes
- **Index:** `{ projectId: 1, status: 1 }`
- **Benefit:** Optimizes common query patterns
- **Use Case:** "Get all 'inprogress' tasks for project X"

---

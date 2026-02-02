require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Project = require('./models/Project');
const Task = require('./models/Task');

// Sample seed data script for testing
const seedData = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected for seeding...');

        // Clear existing data (optional - comment out if you want to keep existing data)
        await User.deleteMany({});
        await Project.deleteMany({});
        await Task.deleteMany({});
        console.log('Cleared existing data');

        // Create sample users
        const user1 = await User.create({
            username: 'ali',
            email: 'ali@example.com',
            password: 'password123'
        });

        const user2 = await User.create({
            username: 'ali',
            email: 'ali@example.com',
            password: 'password123'
        });

        console.log('Created sample users');

        // Create sample projects
        const project1 = await Project.create({
            name: 'Website Redesign',
            description: 'Complete redesign of company website',
            owner: user1._id
        });

        const project2 = await Project.create({
            name: 'Mobile App Development',
            description: 'Build iOS and Android applications',
            owner: user1._id
        });

        console.log('Created sample projects');

        // Create sample tasks
        const task1 = await Task.create({
            title: 'Design homepage mockup',
            description: 'Create Figma designs for the new homepage',
            projectId: project1._id,
            assigneeId: user1._id,
            status: 'inprogress',
            priority: 'high',
            dueDate: new Date('2026-03-01'),
            comments: [
                {
                    text: 'Started working on this task',
                    author: user1._id,
                    createdAt: new Date()
                }
            ]
        });

        const task2 = await Task.create({
            title: 'Implement authentication',
            description: 'Add JWT-based authentication system',
            projectId: project1._id,
            assigneeId: user2._id,
            status: 'todo',
            priority: 'high',
            dueDate: new Date('2026-02-15')
        });

        const task3 = await Task.create({
            title: 'Setup database schema',
            description: 'Design and implement MongoDB schema',
            projectId: project1._id,
            assigneeId: user1._id,
            status: 'done',
            priority: 'medium',
            dueDate: new Date('2026-01-20')
        });

        const task4 = await Task.create({
            title: 'Create wireframes',
            description: 'Design wireframes for all app screens',
            projectId: project2._id,
            assigneeId: user2._id,
            status: 'inprogress',
            priority: 'medium',
            dueDate: new Date('2026-02-28')
        });

        // Create an overdue task
        const task5 = await Task.create({
            title: 'Write documentation',
            description: 'Complete API documentation',
            projectId: project1._id,
            assigneeId: user1._id,
            status: 'todo',
            priority: 'low',
            dueDate: new Date('2026-01-01') // Past date - will be overdue
        });

        console.log('Created sample tasks');

        // Add some comments to tasks
        await Task.findByIdAndUpdate(task1._id, {
            $push: {
                comments: {
                    text: 'Looking great! Keep up the good work.',
                    author: user2._id,
                    createdAt: new Date()
                }
            }
        });

        console.log('Added sample comments');

        console.log('\n Seed data created successfully!');
        console.log('\nSample credentials:');
        console.log('User 1: ali@example.com / password123');
        console.log('User 2: alina@example.com / password123');
        console.log(`\nProject 1 ID: ${project1._id}`);
        console.log(`Project 2 ID: ${project2._id}`);

        process.exit(0);
    } catch (error) {
        console.error('Error seeding data:', error);
        process.exit(1);
    }
};

seedData();

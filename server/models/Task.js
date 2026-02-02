const mongoose = require('mongoose');

// Embedded subdocument schema for comments
const commentSchema = new mongoose.Schema({
    text: {
        type: String,
        required: [true, 'Comment text is required'],
        trim: true
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const taskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Task title is required'],
        trim: true
    },
    description: {
        type: String,
        trim: true,
        default: ''
    },
    // Referenced relationships
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: [true, 'Project ID is required']
    },
    assigneeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    status: {
        type: String,
        enum: ['todo', 'inprogress', 'done'],
        default: 'todo'
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
    },
    dueDate: {
        type: Date,
        default: null
    },
    updatesCount: {
        type: Number,
        default: 0
    },
    // Embedded comments array
    comments: [commentSchema]
}, {
    timestamps: true
});

// Compound index on projectId and status
// Optimization: This index significantly improves query performance when filtering tasks
// by project AND status (e.g., "show all 'inprogress' tasks for project X"), which is
// a very common operation in task management systems. Without this index, MongoDB would
// need to scan all tasks for a project and then filter by status.
taskSchema.index({ projectId: 1, status: 1 });

module.exports = mongoose.model('Task', taskSchema);

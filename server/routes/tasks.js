const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Task = require('../models/Task');
const Project = require('../models/Project');

// All routes are protected
router.use(auth);

// @route   POST /api/tasks
// @desc    Create a new task
// @access  Private
router.post('/', async (req, res) => {
    try {
        const { title, description, projectId, assigneeId, status, priority, dueDate } = req.body;

        if (!title || !projectId) {
            return res.status(400).json({
                success: false,
                message: 'Title and projectId are required'
            });
        }

        // Verify project exists
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        const task = await Task.create({
            title,
            description,
            projectId,
            assigneeId,
            status,
            priority,
            dueDate
        });

        const populatedTask = await Task.findById(task._id)
            .populate('assigneeId', 'username email')
            .populate('projectId', 'name');

        res.status(201).json({
            success: true,
            data: populatedTask
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// @route   PATCH /api/tasks/:id
// @desc    Update a task using $set and $inc
// @access  Private
router.patch('/:id', async (req, res) => {
    try {
        const { title, description, status, priority, assigneeId, dueDate } = req.body;

        const updateFields = {};

        // Build $set object for fields to update
        if (title !== undefined) updateFields.title = title;
        if (description !== undefined) updateFields.description = description;
        if (status !== undefined) updateFields.status = status;
        if (priority !== undefined) updateFields.priority = priority;
        if (assigneeId !== undefined) updateFields.assigneeId = assigneeId;
        if (dueDate !== undefined) updateFields.dueDate = dueDate;

        // Use $set for field updates and $inc to increment updatesCount
        const task = await Task.findByIdAndUpdate(
            req.params.id,
            {
                $set: updateFields,
                $inc: { updatesCount: 1 }  // Increment updatesCount by 1
            },
            { new: true, runValidators: true }
        )
            .populate('assigneeId', 'username email')
            .populate('projectId', 'name');

        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            });
        }

        res.json({
            success: true,
            data: task
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// @route   POST /api/tasks/:id/comments
// @desc    Add a comment to a task using $push
// @access  Private
router.post('/:id/comments', async (req, res) => {
    try {
        const { text } = req.body;

        if (!text) {
            return res.status(400).json({
                success: false,
                message: 'Comment text is required'
            });
        }

        const comment = {
            text,
            author: req.user.id,
            createdAt: new Date()
        };

        // Use $push to add comment to embedded comments array
        const task = await Task.findByIdAndUpdate(
            req.params.id,
            {
                $push: { comments: comment }
            },
            { new: true }
        )
            .populate('assigneeId', 'username email')
            .populate('comments.author', 'username email');

        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            });
        }

        res.status(201).json({
            success: true,
            data: task
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// @route   DELETE /api/tasks/:id/comments/:commentId
// @desc    Delete a comment from a task using $pull
// @access  Private
router.delete('/:id/comments/:commentId', async (req, res) => {
    try {
        // Use $pull to remove comment from embedded comments array
        const task = await Task.findByIdAndUpdate(
            req.params.id,
            {
                $pull: {
                    comments: { _id: req.params.commentId }
                }
            },
            { new: true }
        )
            .populate('assigneeId', 'username email')
            .populate('comments.author', 'username email');

        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            });
        }

        res.json({
            success: true,
            data: task,
            message: 'Comment deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;

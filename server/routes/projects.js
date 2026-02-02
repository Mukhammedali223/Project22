const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Project = require('../models/Project');
const Task = require('../models/Task');

// All routes are protected
router.use(auth);

// @route   GET /api/projects
// @desc    Get all projects for logged-in user
// @access  Private
router.get('/', async (req, res) => {
    try {
        const projects = await Project.find({ owner: req.user.id })
            .populate('owner', 'username email')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: projects
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// @route   POST /api/projects
// @desc    Create a new project
// @access  Private
router.post('/', async (req, res) => {
    try {
        const { name, description } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'Project name is required'
            });
        }

        const project = await Project.create({
            name,
            description,
            owner: req.user.id
        });

        res.status(201).json({
            success: true,
            data: project
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// @route   PUT /api/projects/:id
// @desc    Update a project (only owner can edit)
// @access  Private
router.put('/:id', async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        // Check ownership
        if (project.owner.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this project'
            });
        }

        const { name, description } = req.body;

        if (name) project.name = name;
        if (description !== undefined) project.description = description;

        await project.save();

        res.json({
            success: true,
            data: project
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// @route   DELETE /api/projects/:id
// @desc    Delete a project (only owner can delete)
// @access  Private
router.delete('/:id', async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        // Check ownership
        if (project.owner.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this project'
            });
        }

        await project.deleteOne();

        // Also delete all tasks associated with this project
        await Task.deleteMany({ projectId: req.params.id });

        res.json({
            success: true,
            message: 'Project and associated tasks deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// @route   GET /api/projects/:id/tasks
// @desc    Get all tasks for a specific project
// @access  Private
router.get('/:id/tasks', async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        const tasks = await Task.find({ projectId: req.params.id })
            .populate('assigneeId', 'username email')
            .populate('comments.author', 'username')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: tasks
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// @route   GET /api/projects/:id/summary
// @desc    Get project summary with aggregation pipeline
// @access  Private
router.get('/:id/summary', async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        // Aggregation pipeline
        const summary = await Task.aggregate([
            // Stage 1: Match tasks for this project
            {
                $match: {
                    projectId: project._id
                }
            },
            // Stage 2: Create facets for different metrics
            {
                $facet: {
                    // Total tasks count
                    totalTasks: [
                        { $count: 'count' }
                    ],
                    // Tasks grouped by status
                    tasksByStatus: [
                        {
                            $group: {
                                _id: '$status',
                                count: { $sum: 1 }
                            }
                        }
                    ],
                    // Overdue tasks (dueDate < now AND status != done)
                    overdueTasks: [
                        {
                            $match: {
                                dueDate: { $lt: new Date() },
                                status: { $ne: 'done' }
                            }
                        },
                        { $count: 'count' }
                    ],
                    // Top assignees with task counts
                    topAssignees: [
                        {
                            $match: {
                                assigneeId: { $ne: null }
                            }
                        },
                        {
                            $group: {
                                _id: '$assigneeId',
                                taskCount: { $sum: 1 }
                            }
                        },
                        {
                            $lookup: {
                                from: 'users',
                                localField: '_id',
                                foreignField: '_id',
                                as: 'userInfo'
                            }
                        },
                        {
                            $unwind: '$userInfo'
                        },
                        {
                            $project: {
                                _id: 1,
                                taskCount: 1,
                                username: '$userInfo.username',
                                email: '$userInfo.email'
                            }
                        },
                        {
                            $sort: { taskCount: -1 }
                        },
                        {
                            $limit: 5
                        }
                    ]
                }
            }
        ]);

        // Format the response
        const result = {
            totalTasks: summary[0].totalTasks[0]?.count || 0,
            tasksByStatus: {
                todo: 0,
                inprogress: 0,
                done: 0
            },
            overdueTasks: summary[0].overdueTasks[0]?.count || 0,
            topAssignees: summary[0].topAssignees || []
        };

        // Populate tasksByStatus
        summary[0].tasksByStatus.forEach(item => {
            result.tasksByStatus[item._id] = item.count;
        });

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;

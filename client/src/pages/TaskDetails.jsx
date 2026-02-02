import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../AuthContext';
import './TaskDetails.css';

const TaskDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const projectId = location.state?.projectId;

    const [task, setTask] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [editData, setEditData] = useState({
        title: '',
        description: '',
        status: '',
        priority: '',
        dueDate: ''
    });

    useEffect(() => {
        fetchTask();
    }, [id]);

    const fetchTask = async () => {
        try {
            const response = await api.get(`/projects/${projectId}/tasks`);
            const foundTask = response.data.data.find(t => t._id === id);
            if (foundTask) {
                setTask(foundTask);
                setEditData({
                    title: foundTask.title,
                    description: foundTask.description || '',
                    status: foundTask.status,
                    priority: foundTask.priority,
                    dueDate: foundTask.dueDate ? foundTask.dueDate.split('T')[0] : ''
                });
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch task');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            await api.patch(`/tasks/${id}`, editData);
            setSuccess('Task updated successfully!');
            setIsEditing(false);
            fetchTask();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update task');
        }
    };

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!commentText.trim()) return;

        setError('');
        setSuccess('');

        try {
            await api.post(`/tasks/${id}/comments`, { text: commentText });
            setCommentText('');
            setSuccess('Comment added!');
            fetchTask();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to add comment');
        }
    };

    const handleDeleteComment = async (commentId) => {
        if (!window.confirm('Delete this comment?')) return;

        setError('');
        setSuccess('');

        try {
            await api.delete(`/tasks/${id}/comments/${commentId}`);
            setSuccess('Comment deleted!');
            fetchTask();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to delete comment');
        }
    };

    if (loading) return <div className="loading">Loading...</div>;
    if (!task) return <div className="error-message">Task not found</div>;

    return (
        <div className="page-container">
            <header className="page-header">
                <h1>Task Details</h1>
                <button
                    onClick={() => navigate(`/projects/${projectId}`)}
                    className="back-btn"
                >
                    ← Back to Tasks
                </button>
            </header>

            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <div className="task-details-container">
                <div className="task-info">
                    {!isEditing ? (
                        <>
                            <div className="task-header">
                                <h2>{task.title}</h2>
                                <button onClick={() => setIsEditing(true)} className="edit-btn">
                                    Edit Task
                                </button>
                            </div>
                            <p className="task-description">{task.description || 'No description'}</p>
                            <div className="task-meta">
                                <div className="meta-item">
                                    <strong>Status:</strong>
                                    <span className={`status-badge ${task.status}`}>
                                        {task.status === 'todo' ? 'To Do' :
                                            task.status === 'inprogress' ? 'In Progress' : 'Done'}
                                    </span>
                                </div>
                                <div className="meta-item">
                                    <strong>Priority:</strong>
                                    <span className={`priority-badge ${task.priority}`}>
                                        {task.priority}
                                    </span>
                                </div>
                                <div className="meta-item">
                                    <strong>Due Date:</strong>
                                    <span>
                                        {task.dueDate
                                            ? new Date(task.dueDate).toLocaleDateString()
                                            : 'No due date'}
                                    </span>
                                </div>
                                <div className="meta-item">
                                    <strong>Updates:</strong>
                                    <span>{task.updatesCount || 0}</span>
                                </div>
                            </div>
                        </>
                    ) : (
                        <form onSubmit={handleUpdate} className="edit-form">
                            <div className="form-group">
                                <label>Title</label>
                                <input
                                    type="text"
                                    value={editData.title}
                                    onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea
                                    value={editData.description}
                                    onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                                    rows="4"
                                />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Status</label>
                                    <select
                                        value={editData.status}
                                        onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                                    >
                                        <option value="todo">To Do</option>
                                        <option value="inprogress">In Progress</option>
                                        <option value="done">Done</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Priority</label>
                                    <select
                                        value={editData.priority}
                                        onChange={(e) => setEditData({ ...editData, priority: e.target.value })}
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Due Date</label>
                                    <input
                                        type="date"
                                        value={editData.dueDate}
                                        onChange={(e) => setEditData({ ...editData, dueDate: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="form-actions">
                                <button type="submit" className="submit-btn">Save Changes</button>
                                <button
                                    type="button"
                                    onClick={() => setIsEditing(false)}
                                    className="cancel-btn"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    )}
                </div>

                <div className="comments-section">
                    <h3>Comments ({task.comments?.length || 0})</h3>

                    <form onSubmit={handleAddComment} className="comment-form">
                        <textarea
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            placeholder="Add a comment..."
                            rows="3"
                            required
                        />
                        <button type="submit" className="submit-btn">Add Comment</button>
                    </form>

                    <div className="comments-list">
                        {task.comments && task.comments.length > 0 ? (
                            task.comments.map((comment) => (
                                <div key={comment._id} className="comment">
                                    <div className="comment-header">
                                        <strong>{comment.author?.username || 'Unknown'}</strong>
                                        <small>{new Date(comment.createdAt).toLocaleString()}</small>
                                    </div>
                                    <p>{comment.text}</p>
                                    {comment.author?._id === user?.id && (
                                        <button
                                            onClick={() => handleDeleteComment(comment._id)}
                                            className="delete-comment-btn"
                                        >
                                            Delete
                                        </button>
                                    )}
                                </div>
                            ))
                        ) : (
                            <p className="empty-state">No comments yet</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TaskDetails;

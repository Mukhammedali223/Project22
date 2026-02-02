import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api';
import './ProjectsList.css';

const ProjectDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [filter, setFilter] = useState('all');
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        status: 'todo',
        priority: 'medium',
        dueDate: ''
    });

    useEffect(() => {
        fetchTasks();
    }, [id]);

    const fetchTasks = async () => {
        try {
            const response = await api.get(`/projects/${id}/tasks`);
            setTasks(response.data.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch tasks');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            await api.post('/tasks', {
                ...formData,
                projectId: id
            });
            setFormData({
                title: '',
                description: '',
                status: 'todo',
                priority: 'medium',
                dueDate: ''
            });
            setShowForm(false);
            fetchTasks();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create task');
        }
    };

    const filteredTasks = filter === 'all'
        ? tasks
        : tasks.filter(task => task.status === filter);

    if (loading) return <div className="loading">Loading...</div>;

    return (
        <div className="page-container">
            <header className="page-header">
                <h1>Project Tasks</h1>
                <Link to="/projects" className="back-btn">← Back to Projects</Link>
            </header>

            {error && <div className="error-message">{error}</div>}

            <div className="content">
                <div className="actions-bar">
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="create-btn"
                    >
                        {showForm ? 'Cancel' : '+ Create Task'}
                    </button>

                    <div className="filter-group">
                        <label>Filter by status:</label>
                        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
                            <option value="all">All</option>
                            <option value="todo">To Do</option>
                            <option value="inprogress">In Progress</option>
                            <option value="done">Done</option>
                        </select>
                    </div>
                </div>

                {showForm && (
                    <form onSubmit={handleSubmit} className="create-form">
                        <div className="form-group">
                            <label>Task Title *</label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Description</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows="3"
                            />
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Status</label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                >
                                    <option value="todo">To Do</option>
                                    <option value="inprogress">In Progress</option>
                                    <option value="done">Done</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Priority</label>
                                <select
                                    value={formData.priority}
                                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
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
                                    value={formData.dueDate}
                                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                />
                            </div>
                        </div>
                        <button type="submit" className="submit-btn">Create Task</button>
                    </form>
                )}

                <div className="tasks-table">
                    {filteredTasks.length === 0 ? (
                        <p className="empty-state">No tasks found. Create your first task!</p>
                    ) : (
                        <table>
                            <thead>
                                <tr>
                                    <th>Title</th>
                                    <th>Status</th>
                                    <th>Priority</th>
                                    <th>Due Date</th>
                                    <th>Comments</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTasks.map((task) => (
                                    <tr
                                        key={task._id}
                                        onClick={() => navigate(`/tasks/${task._id}`, { state: { projectId: id } })}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <td>{task.title}</td>
                                        <td>
                                            <span className={`status-badge ${task.status}`}>
                                                {task.status === 'todo' ? 'To Do' :
                                                    task.status === 'inprogress' ? 'In Progress' : 'Done'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`priority-badge ${task.priority}`}>
                                                {task.priority}
                                            </span>
                                        </td>
                                        <td>
                                            {task.dueDate
                                                ? new Date(task.dueDate).toLocaleDateString()
                                                : 'No due date'}
                                        </td>
                                        <td>{task.comments?.length || 0}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProjectDetails;

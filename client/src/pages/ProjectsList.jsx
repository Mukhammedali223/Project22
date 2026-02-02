import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import api from '../api';
import './ProjectsList.css';

const ProjectsList = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: ''
    });

    const { logout, user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            const response = await api.get('/projects');
            setProjects(response.data.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch projects');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            await api.post('/projects', formData);
            setFormData({ name: '', description: '' });
            setShowForm(false);
            fetchProjects();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create project');
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (loading) return <div className="loading">Loading...</div>;

    return (
        <div className="page-container">
            <header className="page-header">
                <h1>My Projects</h1>
                <div className="header-actions">
                    <span>Welcome, {user?.username}</span>
                    <button onClick={handleLogout} className="logout-btn">Logout</button>
                </div>
            </header>

            {error && <div className="error-message">{error}</div>}

            <div className="content">
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="create-btn"
                >
                    {showForm ? 'Cancel' : '+ Create Project'}
                </button>

                {showForm && (
                    <form onSubmit={handleSubmit} className="create-form">
                        <div className="form-group">
                            <label>Project Name</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                        <button type="submit" className="submit-btn">Create Project</button>
                    </form>
                )}

                <div className="projects-list">
                    {projects.length === 0 ? (
                        <p className="empty-state">No projects yet. Create your first project!</p>
                    ) : (
                        projects.map((project) => (
                            <Link
                                key={project._id}
                                to={`/projects/${project._id}`}
                                className="project-card"
                            >
                                <h3>{project.name}</h3>
                                <p>{project.description || 'No description'}</p>
                                <small>Created: {new Date(project.createdAt).toLocaleDateString()}</small>
                            </Link>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProjectsList;

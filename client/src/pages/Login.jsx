import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/auth/login`, {
                email,
                password
            });

            login(res.data.user, res.data.token);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.page}>
        <div style={styles.card}>
        <h1 style={styles.title}>Welcome back</h1>
        <p style={styles.subtitle}>Log in to continue chatting</p>

        <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.field}>
        <label style={styles.label}>Email</label>
        <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={styles.input}
        required
        />
        </div>
        <div style={styles.field}>
        <label style={styles.label}>Password</label>
        <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={styles.input}
        required
        />
        </div>

        {error && <p style={styles.error}>{error}</p>}

        <button type="submit" disabled={loading} style={styles.submitBtn}>
        {loading ? 'Logging in...' : 'Log In'}
        </button>
        </form>

        <p style={styles.footer}>
        No account? <Link to="/register" style={styles.link}>Register</Link>
        </p>
        </div>
        </div>
    );
}

const styles = {
    page: {
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-primary)'
    },
    card: {
        width: '360px',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        padding: '2rem'
    },
    title: {
        margin: '0 0 0.25rem',
        fontSize: '1.5rem',
        fontWeight: 600
    },
    subtitle: {
        margin: '0 0 1.5rem',
        color: 'var(--text-secondary)',
        fontSize: '0.9rem'
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
    },
    field: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.4rem'
    },
    label: {
        fontSize: '0.8rem',
        color: 'var(--text-secondary)'
    },
    input: {
        background: 'var(--bg-tertiary)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-sm)',
        padding: '0.6rem 0.75rem',
        color: 'var(--text-primary)',
        fontSize: '0.9rem',
        outline: 'none'
    },
    error: {
        color: 'var(--danger)',
        fontSize: '0.85rem',
        margin: 0
    },
    submitBtn: {
        background: 'var(--accent)',
        color: 'white',
        border: 'none',
        borderRadius: 'var(--radius-sm)',
        padding: '0.7rem',
        fontWeight: 600,
        fontSize: '0.9rem',
        marginTop: '0.25rem'
    },
    footer: {
        marginTop: '1.5rem',
        textAlign: 'center',
        fontSize: '0.85rem',
        color: 'var(--text-secondary)'
    },
    link: {
        color: 'var(--accent)',
        textDecoration: 'none'
    }
};

export default Login;

import { useState, useEffect } from 'react';
import api from '../api';

function Sidebar({ selectedRoomId, onSelectRoom }) {
    const [rooms, setRooms] = useState([]);
    const [newRoomName, setNewRoomName] = useState('');
    const [joinRoomId, setJoinRoomId] = useState('');
    const [loading, setLoading] = useState(true);

    const loadRooms = async () => {
        try {
            const res = await api.get('/rooms/my');
            setRooms(res.data.rooms);
        } catch (err) {
            console.error('Failed to load rooms:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadRooms();
    }, []);

    const handleCreateRoom = async (e) => {
        e.preventDefault();
        if (!newRoomName.trim()) return;

        try {
            await api.post('/rooms', { name: newRoomName });
            setNewRoomName('');
            loadRooms();
        } catch (err) {
            console.error('Failed to create room:', err);
        }
    };

    const handleJoinRoom = async (e) => {
        e.preventDefault();
        if (!joinRoomId.trim()) return;

        try {
            await api.post(`/rooms/${joinRoomId.trim()}/join`);
            setJoinRoomId('');
            loadRooms();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to join room — check the ID');
        }
    };

    return (
        <div style={styles.sidebar}>
        <div style={styles.header}>
        <h2 style={styles.heading}>Rooms</h2>
        </div>

        <div style={styles.roomList}>
        {loading ? (
            <p style={styles.loadingText}>Loading...</p>
        ) : (
            rooms.map((room) => {
                const isSelected = room.id === selectedRoomId;
                return (
                    <div
                    key={room.id}
                    style={{
                        ...styles.roomItem,
                        ...(isSelected ? styles.roomItemActive : {})
                    }}
                    >
                    <div onClick={() => onSelectRoom(room.id)} style={styles.roomNameClick}>
                    <span style={styles.roomHash}>#</span>
                    {room.name}
                    </div>
                    <button
                    onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(room.id);
                        alert(`Room ID copied! Share it with friends:\n${room.id}`);
                    }}
                    style={styles.copyBtn}
                    title="Copy room ID to invite others"
                    >
                    ⧉
                    </button>
                    </div>
                );
            })
        )}
        </div>

        <form onSubmit={handleCreateRoom} style={styles.createForm}>
        <input
        type="text"
        placeholder="New room name"
        value={newRoomName}
        onChange={(e) => setNewRoomName(e.target.value)}
        style={styles.createInput}
        />
        <button type="submit" style={styles.createBtn}>+</button>
        </form>

        <form onSubmit={handleJoinRoom} style={styles.createForm}>
        <input
        type="text"
        placeholder="Paste room ID to join"
        value={joinRoomId}
        onChange={(e) => setJoinRoomId(e.target.value)}
        style={styles.createInput}
        />
        <button type="submit" style={styles.createBtn}>↵</button>
        </form>
        </div>
    );
}

const styles = {
    sidebar: {
        width: '260px',
        minWidth: '260px',
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%'
    },
    header: {
        padding: '1.25rem 1.25rem 1rem'
    },
    heading: {
        margin: 0,
        fontSize: '1.1rem',
        fontWeight: 600
    },
    roomList: {
        flex: 1,
        overflowY: 'auto',
        padding: '0 0.5rem'
    },
    loadingText: {
        color: 'var(--text-muted)',
        fontSize: '0.85rem',
        padding: '0 0.75rem'
    },
    roomItem: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.55rem 0.75rem',
        borderRadius: 'var(--radius-sm)',
        fontSize: '0.9rem',
        color: 'var(--text-secondary)',
        marginBottom: '2px'
    },
    roomItemActive: {
        background: 'var(--accent-muted)',
        color: 'var(--text-primary)'
    },
    roomHash: {
        color: 'var(--text-muted)',
        fontWeight: 600
    },
    roomNameClick: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        flex: 1,
        cursor: 'pointer'
    },
    copyBtn: {
        background: 'transparent',
        border: 'none',
        color: 'var(--text-muted)',
        fontSize: '0.9rem',
        padding: '0.2rem 0.4rem'
    },
    createForm: {
        display: 'flex',
        gap: '0.5rem',
        padding: '1rem',
        borderTop: '1px solid var(--border-color)'
    },
    createInput: {
        flex: 1,
        background: 'var(--bg-tertiary)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-sm)',
        padding: '0.5rem 0.65rem',
        color: 'var(--text-primary)',
        fontSize: '0.85rem',
        outline: 'none'
    },
    createBtn: {
        background: 'var(--accent)',
        color: 'white',
        border: 'none',
        borderRadius: 'var(--radius-sm)',
        width: '34px',
        fontSize: '1.1rem',
        fontWeight: 600
    }
};

export default Sidebar;

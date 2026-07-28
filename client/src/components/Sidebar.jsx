import { useState, useEffect } from 'react';
import api from '../api';

function Sidebar({ selectedRoomId, onSelectRoom }) {
    const [rooms, setRooms] = useState([]);
    const [newRoomName, setNewRoomName] = useState('');
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
                    onClick={() => onSelectRoom(room.id)}
                    style={{
                        ...styles.roomItem,
                        ...(isSelected ? styles.roomItemActive : {})
                    }}
                    >
                    <span style={styles.roomHash}>#</span>
                    {room.name}
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
        gap: '0.5rem',
        padding: '0.55rem 0.75rem',
        borderRadius: 'var(--radius-sm)',
        cursor: 'pointer',
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

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
            loadRooms(); // refresh the list to include the new room
        } catch (err) {
            console.error('Failed to create room:', err);
        }
    };

    if (loading) return <div>Loading rooms...</div>;

    return (
        <div style={{ width: '250px', borderRight: '1px solid #333', padding: '1rem' }}>
        <h3>My Rooms</h3>
        <ul style={{ listStyle: 'none', padding: 0 }}>
        {rooms.map((room) => (
            <li
            key={room.id}
            onClick={() => onSelectRoom(room.id)}
            style={{
                padding: '0.5rem',
                cursor: 'pointer',
                background: room.id === selectedRoomId ? '#333' : 'transparent',
                borderRadius: '4px'
            }}
            >
            {room.name}
            </li>
        ))}
        </ul>

        <form onSubmit={handleCreateRoom} style={{ marginTop: '1rem' }}>
        <input
        type="text"
        placeholder="New room name"
        value={newRoomName}
        onChange={(e) => setNewRoomName(e.target.value)}
        />
        <button type="submit">Create</button>
        </form>
        </div>
    );
}

export default Sidebar;

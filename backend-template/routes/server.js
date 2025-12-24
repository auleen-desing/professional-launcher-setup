const express = require('express');
const router = express.Router();
const net = require('net');

const CHANNELS = [
  { id: 'CH1', name: 'Channel 1', port: 51234 },
  { id: 'CH2', name: 'Channel 2', port: 51235 },
  { id: 'CH3', name: 'Channel 3', port: 51236 },
  { id: 'CH4', name: 'Channel 4', port: 51237 },
  { id: 'PVP', name: 'PvP Channel', port: 5100 }
];

const SERVER_IP = process.env.SERVER_IP || '127.0.0.1';

// Check if port is open
function checkPort(host, port) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(2000);
    
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    
    socket.on('error', () => {
      resolve(false);
    });
    
    socket.connect(port, host);
  });
}

// GET /api/server/status
router.get('/status', async (req, res) => {
  try {
    const channelStatus = await Promise.all(
      CHANNELS.map(async (channel) => {
        const isOnline = await checkPort(SERVER_IP, channel.port);
        return {
          id: channel.id,
          name: channel.name,
          port: channel.port,
          status: isOnline ? 'online' : 'offline',
          players: isOnline ? Math.floor(Math.random() * 100) : 0 // Replace with actual player count
        };
      })
    );

    const totalPlayers = channelStatus.reduce((sum, ch) => sum + ch.players, 0);

    res.json({
      success: true,
      data: {
        channels: channelStatus,
        totalPlayers,
        serverTime: new Date()
      }
    });
  } catch (err) {
    console.error('Server status error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// GET /api/server/channels
router.get('/channels', (req, res) => {
  res.json({ success: true, data: CHANNELS });
});

module.exports = router;

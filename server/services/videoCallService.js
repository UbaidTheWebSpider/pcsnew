const crypto = require('crypto');

class VideoCallService {
    /**
     * Generate a unique room ID for video call
     * @param {string} appointmentId - Appointment ID
     * @returns {string} - Unique room ID
     */
    generateRoomId(appointmentId) {
        // Create a unique, URL-safe room ID
        const hash = crypto.createHash('md5').update(appointmentId).digest('hex');
        return `room-${hash.substring(0, 12)}`;
    }

    /**
     * Create a video call room using Jitsi Meet (free, no API key required)
     * @param {Object} appointmentDetails - Appointment details
     * @returns {Object} - Room URL and details
     */
    createVideoRoom(appointmentDetails) {
        const { appointmentId, patientName, doctorName } = appointmentDetails;

        // Generate unique room ID
        const roomId = this.generateRoomId(appointmentId);

        // Use Jitsi Meet (free, open-source video conferencing)
        const roomUrl = `https://meet.jit.si/${roomId}`;

        // Room configuration
        const roomConfig = {
            roomUrl,
            roomId,
            roomName: `Consultation: ${patientName} with Dr. ${doctorName}`,
            subject: `Medical Consultation`,
            // Jitsi allows custom configuration via URL parameters
            configOverwrite: {
                startWithAudioMuted: false,
                startWithVideoMuted: false,
                prejoinPageEnabled: true,
            }
        };

        console.log('✅ Video room created:', roomUrl);
        return roomConfig;
    }

    /**
     * Get embed URL for iframe
     * @param {string} roomUrl - Room URL
     * @param {string} userName - User's display name
     * @returns {string} - Embed URL with configuration
     */
    getEmbedUrl(roomUrl, userName) {
        // Add user configuration to URL
        const url = new URL(roomUrl);
        url.hash = `config.prejoinPageEnabled=false&userInfo.displayName=${encodeURIComponent(userName)}`;
        return url.toString();
    }
}

module.exports = new VideoCallService();

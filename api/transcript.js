const { YoutubeTranscript } = require('youtube-transcript');

module.exports = async (req, res) => {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { videoId } = req.query;
  if (!videoId) {
    return res.status(400).json({ error: 'Missing videoId parameter.' });
  }

  try {
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);
    res.status(200).json({ videoId, transcript });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve transcript for this video. Captions might be disabled or unavailable.' });
  }
};

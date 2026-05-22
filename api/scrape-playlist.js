const https = require('https');

// Extractor function for playlist ID
function extractPlaylistId(urlOrId) {
  if (!urlOrId) return null;
  const match = urlOrId.match(/[&?]list=([a-zA-Z0-9_-]+)/);
  if (match) return match[1];
  if (/^[a-zA-Z0-9_-]{18,34}$/.test(urlOrId)) {
    return urlOrId;
  }
  return null;
}

module.exports = async (req, res) => {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { url } = req.query;
  const playlistId = extractPlaylistId(url);
  
  if (!playlistId) {
    return res.status(400).json({ error: 'Invalid YouTube playlist URL or Playlist ID.' });
  }

  const ytUrl = `https://www.youtube.com/playlist?list=${playlistId}`;
  
  const requestOptions = {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
      'Cache-Control': 'no-cache'
    }
  };

  return new Promise((resolve) => {
    https.get(ytUrl, requestOptions, (ytRes) => {
      if (ytRes.statusCode !== 200) {
        res.status(ytRes.statusCode).json({ error: `YouTube returned status code ${ytRes.statusCode}` });
        return resolve();
      }

      let htmlData = '';
      ytRes.on('data', (chunk) => { htmlData += chunk; });
      ytRes.on('end', () => {
        try {
          const match = htmlData.match(/ytInitialData\s*=\s*({.+?});/);
          if (!match) {
            res.status(500).json({ error: 'Could not extract playlist data. The playlist might be private or geo-restricted.' });
            return resolve();
          }

          const json = JSON.parse(match[1]);

          // Check for playlist error alert
          if (json.alerts && json.alerts.length > 0) {
            const alert = json.alerts[0].alertRenderer;
            if (alert && alert.type === 'ERROR') {
              const errorMsg = alert.text?.runs?.[0]?.text || 'Playlist error';
              res.status(400).json({ error: `YouTube Alert: ${errorMsg}` });
              return resolve();
            }
          }

          const videos = [];
          let playlistTitle = 'Untitled Course';
          let playlistDescription = '';
          let playlistCreator = 'Unknown Instructor';

          function parseObject(obj) {
            if (!obj || typeof obj !== 'object') return;

            if (obj.playlistVideoRenderer) {
              const renderer = obj.playlistVideoRenderer;
              if (renderer.videoId) {
                videos.push({
                  id: renderer.videoId,
                  title: renderer.title?.runs?.[0]?.text || renderer.title?.accessibility?.accessibilityData?.label || 'Untitled Video',
                  duration: renderer.lengthText?.simpleText || '00:00',
                  thumbnail: renderer.thumbnail?.thumbnails?.[0]?.url || `https://img.youtube.com/vi/${renderer.videoId}/hqdefault.jpg`
                });
              }
              return;
            }

            if (obj.playlistHeaderRenderer) {
              playlistTitle = obj.playlistHeaderRenderer.title?.simpleText || 
                              obj.playlistHeaderRenderer.title?.runs?.[0]?.text || playlistTitle;
              playlistDescription = obj.playlistHeaderRenderer.descriptionText?.simpleText || 
                                    obj.playlistHeaderRenderer.descriptionText?.runs?.[0]?.text || playlistDescription;
            }

            if (obj.playlistSidebarPrimaryInfoRenderer) {
              const titleObj = obj.playlistSidebarPrimaryInfoRenderer.title;
              playlistTitle = titleObj?.simpleText || titleObj?.runs?.[0]?.text || playlistTitle;
              const descObj = obj.playlistSidebarPrimaryInfoRenderer.descriptionText;
              playlistDescription = descObj?.simpleText || descObj?.runs?.[0]?.text || playlistDescription;
            }

            if (obj.playlistSidebarSecondaryInfoRenderer) {
              const videoOwner = obj.playlistSidebarSecondaryInfoRenderer.videoOwner;
              const nameObj = videoOwner?.videoOwnerRenderer?.title;
              playlistCreator = nameObj?.runs?.[0]?.text || nameObj?.simpleText || playlistCreator;
            }

            for (const key in obj) {
              if (Object.prototype.hasOwnProperty.call(obj, key)) {
                parseObject(obj[key]);
              }
            }
          }

          parseObject(json);

          if (videos.length === 0) {
            res.status(404).json({ error: 'No videos found in this playlist. Ensure it is a public playlist containing videos.' });
            return resolve();
          }

          res.status(200).json({
            id: playlistId,
            title: playlistTitle,
            description: playlistDescription,
            creator: playlistCreator,
            videosCount: videos.length,
            videos: videos
          });
          resolve();

        } catch (err) {
          res.status(500).json({ error: 'Failed to parse playlist data structure.' });
          resolve();
        }
      });
    }).on('error', (err) => {
      res.status(500).json({ error: 'Failed to connect to YouTube server.' });
      resolve();
    });
  });
};

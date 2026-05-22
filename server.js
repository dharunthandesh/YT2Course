const express = require('express');
const https = require('https');
const path = require('path');
const { exec } = require('child_process');
const { YoutubeTranscript } = require('youtube-transcript');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Enable CORS for frontend running on other ports (like VS Code Live Server)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Extractor function for playlist ID
function extractPlaylistId(urlOrId) {
  if (!urlOrId) return null;
  const match = urlOrId.match(/[&?]list=([a-zA-Z0-9_-]+)/);
  if (match) return match[1];
  // Check if it's just the ID
  if (/^[a-zA-Z0-9_-]{18,34}$/.test(urlOrId)) {
    return urlOrId;
  }
  return null;
}

// Scrape YouTube playlist page endpoint
app.get('/api/scrape-playlist', (req, res) => {
  const { url } = req.query;
  const playlistId = extractPlaylistId(url);
  
  if (!playlistId) {
    return res.status(400).json({ error: 'Invalid YouTube playlist URL or Playlist ID.' });
  }

  const ytUrl = `https://www.youtube.com/playlist?list=${playlistId}`;
  
  console.log(`[Scraper] Fetching playlist: ${playlistId} (${ytUrl})`);

  const requestOptions = {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
      'Cache-Control': 'no-cache'
    }
  };

  https.get(ytUrl, requestOptions, (ytRes) => {
    if (ytRes.statusCode !== 200) {
      console.error(`[Scraper] YouTube returned status code ${ytRes.statusCode}`);
      return res.status(ytRes.statusCode).json({ error: `YouTube returned status code ${ytRes.statusCode}` });
    }

    let htmlData = '';
    ytRes.on('data', (chunk) => { htmlData += chunk; });
    ytRes.on('end', () => {
      try {
        const match = htmlData.match(/ytInitialData\s*=\s*({.+?});/);
        if (!match) {
          console.warn('[Scraper] ytInitialData not found in page HTML.');
          return res.status(500).json({ error: 'Could not extract playlist data. The playlist might be private or geo-restricted.' });
        }

        const json = JSON.parse(match[1]);

        // Check for playlist error alert
        if (json.alerts && json.alerts.length > 0) {
          const alert = json.alerts[0].alertRenderer;
          if (alert && alert.type === 'ERROR') {
            const errorMsg = alert.text?.runs?.[0]?.text || 'Playlist error';
            console.warn(`[Scraper] YouTube alert: ${errorMsg}`);
            return res.status(400).json({ error: `YouTube Alert: ${errorMsg}` });
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
            // Only add if it has a videoId
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

          // Sidebar Metadata Extractors
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
          console.warn('[Scraper] Parsed 0 videos from playlist page.');
          return res.status(404).json({ error: 'No videos found in this playlist. Ensure it is a public playlist containing videos.' });
        }

        console.log(`[Scraper] Successfully parsed playlist: "${playlistTitle}" with ${videos.length} videos`);
        
        res.json({
          id: playlistId,
          title: playlistTitle,
          description: playlistDescription,
          creator: playlistCreator,
          videosCount: videos.length,
          videos: videos
        });

      } catch (err) {
        console.error('[Scraper] JSON Parsing error:', err);
        res.status(500).json({ error: 'Failed to parse playlist data structure.' });
      }
    });
  }).on('error', (err) => {
    console.error('[Scraper] HTTP request error:', err);
    res.status(500).json({ error: 'Failed to connect to YouTube server.' });
  });
});

// Get video transcript endpoint
app.get('/api/transcript', async (req, res) => {
  const { videoId } = req.query;
  if (!videoId) {
    return res.status(400).json({ error: 'Missing videoId parameter.' });
  }

  console.log(`[Transcript] Fetching transcript for video: ${videoId}`);
  try {
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);
    res.json({ videoId, transcript });
  } catch (err) {
    console.error(`[Transcript] Failed to fetch transcript for ${videoId}:`, err.message);
    res.status(500).json({ error: 'Failed to retrieve transcript for this video. Captions might be disabled or unavailable.' });
  }
});

// Serve frontend routing fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  const localUrl = `http://localhost:${PORT}`;
  console.log(`==================================================`);
  console.log(`  YT2Course Server is running at ${localUrl}`);
  console.log(`  Converting playlists into courses...`);
  console.log(`==================================================`);

  // Open browser window automatically
  const startCommand = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
  exec(`${startCommand} ${localUrl}`, (err) => {
    if (err) {
      console.log(`[Server] Please navigate to ${localUrl} in your browser.`);
    } else {
      console.log(`[Server] Automatically opened ${localUrl} in your browser.`);
    }
  });
});

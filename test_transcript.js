const https = require('https');

const videoId = 'W6NZfCO5SIk';
const url = `https://www.youtube.com/watch?v=${videoId}`;

https.get(url, {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5'
  }
}, (res) => {
  let html = '';
  res.on('data', (chunk) => { html += chunk; });
  res.on('end', () => {
    const match = html.match(/ytInitialPlayerResponse\s*=\s*({.+?});/);
    if (!match) return console.log("No match");
    
    try {
      const playerResponse = JSON.parse(match[1]);
      const captions = playerResponse.captions?.playerCaptionsTracklistRenderer?.captionTracks;
      if (!captions) return console.log("No captions in playerResponse");
      
      const enTrack = captions.find(c => c.languageCode === 'en') || captions[0];
      
      console.log("Track URL:", enTrack.baseUrl);
      
      const urlObj = new URL(enTrack.baseUrl);
      
      const options = {
        hostname: urlObj.hostname,
        path: urlObj.pathname + urlObj.search,
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': `https://www.youtube.com/watch?v=${videoId}`,
          'Accept': '*/*',
          'Accept-Language': 'en-US,en;q=0.9'
        }
      };

      const req = https.request(options, (capRes) => {
        console.log("Status Code:", capRes.statusCode);
        console.log("Response headers:", capRes.headers);
        
        let capXml = '';
        capRes.on('data', (chunk) => { capXml += chunk; });
        capRes.on('end', () => {
          console.log("capXml Length:", capXml.length);
          if (capXml.length > 0) {
            console.log("capXml Preview:", capXml.substring(0, 300));
          }
        });
      });
      
      req.on('error', (err) => {
        console.error("Request error:", err);
      });
      
      req.end();
      
    } catch (e) {
      console.error(e);
    }
  });
});

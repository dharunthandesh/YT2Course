const { YoutubeTranscript } = require('youtube-transcript');

const videoId = 'W6NZfCO5SIk';

console.log("Fetching transcript using youtube-transcript for:", videoId);

YoutubeTranscript.fetchTranscript(videoId)
  .then(transcript => {
    console.log("Success! Fetched entries:", transcript.length);
    console.log("First entry:", transcript[0]);
    console.log("Full text preview (first 500 chars):", transcript.map(t => t.text).join(' ').substring(0, 500));
  })
  .catch(err => {
    console.error("Failed to fetch transcript using library:", err);
  });

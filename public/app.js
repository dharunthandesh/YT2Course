// YT2Course - Core Application JS

// 1. STATE & DATABASE MANAGEMENT
const DEFAULT_SETTINGS = {
  userName: 'High-Achieving Student',
  theme: 'dark-theme'
};

// Curated Demo Courses (100% working YouTube Video IDs)
const DEMO_COURSES = [
  {
    id: 'demo-javascript',
    title: 'JavaScript Fundamentals Masterclass',
    description: 'Learn the core concepts of JavaScript including variables, data types, functions, arrays, objects, and DOM manipulation. This course is designed to build a strong foundation for web development.',
    creator: 'Programming with Mosh & Traversy',
    videosCount: 5,
    videos: [
      { id: 'W6NZfCO5SIk', title: 'JavaScript Tutorial for Beginners: Getting Started', duration: '48:16', thumbnail: 'https://img.youtube.com/vi/W6NZfCO5SIk/hqdefault.jpg' },
      { id: 'hdI2bqOjy3c', title: 'JavaScript Crash Course for Beginners', duration: '1:40:07', thumbnail: 'https://img.youtube.com/vi/hdI2bqOjy3c/hqdefault.jpg' },
      { id: '3PHXvLPz8U8', title: 'JavaScript Functions and Scope Explained', duration: '15:20', thumbnail: 'https://img.youtube.com/vi/3PHXvLPz8U8/hqdefault.jpg' },
      { id: '9M4XKi25I2M', title: 'JavaScript Arrays and ES6 Array Methods', duration: '20:45', thumbnail: 'https://img.youtube.com/vi/9M4XKi25I2M/hqdefault.jpg' },
      { id: 'iWOYAxlng4w', title: 'DOM Manipulation Crash Course for Web Developers', duration: '33:12', thumbnail: 'https://img.youtube.com/vi/iWOYAxlng4w/hqdefault.jpg' }
    ]
  },
  {
    id: 'demo-uiux',
    title: 'UI/UX Design Essentials & Principles',
    description: 'Dive deep into user interface and user experience design. Learn the differences between UI and UX, visual hierarchy, typography rules, color theory, and how to start designing in Figma.',
    creator: 'Design Course & Flux Academy',
    videosCount: 5,
    videos: [
      { id: '5CxXhyhT67Y', title: 'What is UI vs UX Design? A Beginner Guide', duration: '12:05', thumbnail: 'https://img.youtube.com/vi/5CxXhyhT67Y/hqdefault.jpg' },
      { id: 'zHAa-m16t2Y', title: 'Visual Hierarchy & Alignment in Interface Design', duration: '11:42', thumbnail: 'https://img.youtube.com/vi/zHAa-m16t2Y/hqdefault.jpg' },
      { id: '7vP7Q5F_Q78', title: 'Typography Rules for Elegant & Readable Interfaces', duration: '15:10', thumbnail: 'https://img.youtube.com/vi/7vP7Q5F_Q78/hqdefault.jpg' },
      { id: '_2LLXnUdUIc', title: 'Color Theory: Creating Harmonies and Palettes', duration: '16:10', thumbnail: 'https://img.youtube.com/vi/_2LLXnUdUIc/hqdefault.jpg' },
      { id: 'dXQ78tPK1tY', title: 'Figma Tutorial: Designing Your First Landing Page', duration: '42:50', thumbnail: 'https://img.youtube.com/vi/dXQ78tPK1tY/hqdefault.jpg' }
    ]
  },
  {
    id: 'demo-neural',
    title: 'Deep Learning & Neural Networks Crash Course',
    description: 'An visually rich introduction to deep learning. Master how neural networks work, the mathematics of gradient descent, backpropagation, and explore TensorFlow and PyTorch paradigms.',
    creator: '3Blue1Brown & AI Labs',
    videosCount: 5,
    videos: [
      { id: 'aircAruvnKk', title: 'But what is a neural network? | Chapter 1', duration: '20:13', thumbnail: 'https://img.youtube.com/vi/aircAruvnKk/hqdefault.jpg' },
      { id: 'IHZwWFHWa-w', title: 'Gradient descent, how neural networks learn | Chapter 2', duration: '21:01', thumbnail: 'https://img.youtube.com/vi/IHZwWFHWa-w/hqdefault.jpg' },
      { id: 'Ilg3gGewQ5U', title: 'What is backpropagation and what is it actually doing? | Chapter 3', duration: '13:54', thumbnail: 'https://img.youtube.com/vi/Ilg3gGewQ5U/hqdefault.jpg' },
      { id: 'tIeHLnjs5U8', title: 'Backpropagation Calculus & Chain Rule | Chapter 4', duration: '10:26', thumbnail: 'https://img.youtube.com/vi/tIeHLnjs5U8/hqdefault.jpg' },
      { id: 'd32_O6E0S0Q', title: 'TensorFlow vs PyTorch: Deep Learning Frameworks', duration: '18:40', thumbnail: 'https://img.youtube.com/vi/d32_O6E0S0Q/hqdefault.jpg' }
    ]
  }
];

// Firebase Configuration - REPLACE WITH YOUR OWN CREDENTIALS FROM FIREBASE CONSOLE
const firebaseConfig = {
  apiKey: "AIzaSyBLMA33AwOvES4gG1RsFqmBtvqmRfNzk2o",
  authDomain: "yt2course-7f8c9.firebaseapp.com",
  projectId: "yt2course-7f8c9",
  storageBucket: "yt2course-7f8c9.firebasestorage.app",
  messagingSenderId: "524189012332",
  appId: "1:524189012332:web:fc1303eab1964fd5032349",
  measurementId: "G-CB8KREENLK"
};

let dbSyncActive = false;
const BACKEND_URL = window.location.port === '3000' ? '' : 'http://localhost:3000';

class Database {
  static get(key, defaultVal) {
    const val = localStorage.getItem(`yt2c_${key}`);
    return val ? JSON.parse(val) : defaultVal;
  }
  static set(key, value) {
    localStorage.setItem(`yt2c_${key}`, JSON.stringify(value));
    if (dbSyncActive && firebase.auth().currentUser) {
      syncDataToCloud();
    }
  }
  static clear() {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('yt2c_')) {
        localStorage.removeItem(key);
      }
    });
  }
}

// Global App State
const state = {
  courses: Database.get('courses', []),
  progress: Database.get('progress', {}), // { [courseId]: { completedVideos: [], lastVideoId: '', notes: {}, bookmarks: {} } }
  settings: Database.get('settings', DEFAULT_SETTINGS),
  currentCourseId: null,
  currentVideoId: null,
  apiKey: Database.get('api_key', null),
  geminiApiKey: Database.get('gemini_api_key', null)
};

// Initialize Firebase
function initFirebase() {
  if (typeof firebase === 'undefined') {
    console.log('[Firebase] SDK not loaded or blocked.');
    return;
  }
  
  if (!firebaseConfig.apiKey || firebaseConfig.apiKey === "YOUR_API_KEY") {
    console.log('[Firebase] Using local storage mode. Add credentials to firebaseConfig in public/app.js to sync to Firestore.');
    return;
  }
  
  try {
    firebase.initializeApp(firebaseConfig);
    console.log('[Firebase] Initialized.');
    dbSyncActive = true;
    setupAuthListeners();
  } catch (err) {
    console.error('[Firebase Init Error]', err);
  }
}

async function syncDataToCloud() {
  if (!dbSyncActive) return;
  const user = firebase.auth().currentUser;
  if (!user) return;
  
  try {
    await firebase.firestore().collection('users').doc(user.uid).set({
      courses: state.courses,
      progress: state.progress,
      settings: state.settings,
      apiKey: state.apiKey,
      geminiApiKey: state.geminiApiKey,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    console.log('[Firebase] Data synced successfully.');
  } catch (err) {
    console.error('[Firebase Sync Error]', err);
  }
}

function setupAuthListeners() {
  const auth = firebase.auth();
  const db = firebase.firestore();
  
  auth.onAuthStateChanged(async (user) => {
    const statusLabel = document.getElementById('auth-status-label');
    const loggedOutState = document.getElementById('auth-logged-out-state');
    const loggedInState = document.getElementById('auth-logged-in-state');
    const userEmailEl = document.getElementById('auth-user-email');
    const userAvatarEl = document.getElementById('auth-user-avatar');
    
    if (user) {
      console.log('[Firebase] Signed in:', user.email);
      if (statusLabel) statusLabel.textContent = 'Account';
      
      if (loggedOutState) loggedOutState.style.display = 'none';
      if (loggedInState) loggedInState.style.display = 'block';
      if (userEmailEl) userEmailEl.textContent = user.email;
      if (userAvatarEl) {
        userAvatarEl.textContent = (user.email || 'U').charAt(0).toUpperCase();
      }
      
      try {
        const userDoc = await db.collection('users').doc(user.uid).get();
        if (userDoc.exists) {
          const cloudData = userDoc.data();
          console.log('[Firebase] Synced state from Cloud.');
          
          if (cloudData.courses) {
            state.courses = cloudData.courses;
            localStorage.setItem('yt2c_courses', JSON.stringify(state.courses));
          }
          if (cloudData.progress) {
            state.progress = cloudData.progress;
            localStorage.setItem('yt2c_progress', JSON.stringify(state.progress));
          }
          if (cloudData.settings) {
            state.settings = cloudData.settings;
            localStorage.setItem('yt2c_settings', JSON.stringify(state.settings));
          }
          if (cloudData.apiKey) {
            state.apiKey = cloudData.apiKey;
            localStorage.setItem('yt2c_api_key', JSON.stringify(state.apiKey));
          }
          if (cloudData.geminiApiKey) {
            state.geminiApiKey = cloudData.geminiApiKey;
            localStorage.setItem('yt2c_gemini_api_key', JSON.stringify(state.geminiApiKey));
          }
          
          initTheme();
          loadDashboardData();
        } else {
          console.log('[Firebase] Uploading local state to Cloud.');
          await syncDataToCloud();
        }
      } catch (err) {
        console.error('[Firebase Sync Get Error]', err);
      }
    } else {
      console.log('[Firebase] Signed out.');
      if (statusLabel) statusLabel.textContent = 'Sign In';
      
      if (loggedOutState) loggedOutState.style.display = 'block';
      if (loggedInState) loggedInState.style.display = 'none';
    }
    if (typeof lucide !== 'undefined') lucide.createIcons();
  });
}

// 2. INITIALIZATION & ROUTING
let ytPlayer = null;
let ytApiReady = typeof YT !== 'undefined' && typeof YT.Player !== 'undefined';

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initUIElements();
  loadDashboardData();
  renderRecommendedCourses();
  setupEventListeners();
  initFirebase();
  
  // If YouTube API loaded before DOMContentLoaded
  if (typeof YT !== 'undefined' && typeof YT.Player !== 'undefined') {
    ytApiReady = true;
    if (state.currentVideoId) {
      initYoutubePlayer(state.currentVideoId);
    }
  }
  
  // Re-run lucide icons to parse markup
  lucide.createIcons();
});

// YouTube API Callback
window.onYouTubeIframeAPIReady = () => {
  ytApiReady = true;
  console.log('[App] YouTube Iframe API ready callback.');
  // If we already have a video active, load the player
  if (state.currentVideoId) {
    initYoutubePlayer(state.currentVideoId);
  }
};

function initTheme() {
  document.body.className = state.settings.theme;
  const usernameInput = document.getElementById('settings-username');
  if (usernameInput) usernameInput.value = state.settings.userName;
  
  const geminiInput = document.getElementById('settings-gemini-key');
  if (geminiInput) geminiInput.value = state.geminiApiKey || '';
  
  updateApiKeyUI();
}

function initUIElements() {
  // Update student name fields
  document.getElementById('cert-recipient-name').textContent = state.settings.userName;
}

function updateApiKeyUI() {
  const statusEl = document.getElementById('api-key-status-text');
  const keyInput = document.getElementById('api-key-input');
  
  if (statusEl) {
    if (state.apiKey) {
      statusEl.textContent = 'API Key Loaded & Active';
      statusEl.className = 'api-key-status active';
      if (keyInput) keyInput.value = '••••••••••••••••••••••••';
    } else {
      statusEl.textContent = 'No active API Key (using scraper backend)';
      statusEl.className = 'api-key-status';
      if (keyInput) keyInput.value = '';
    }
  }
}

// 3. ROUTING VIEWS
function switchView(viewName) {
  document.querySelectorAll('.view-section').forEach(view => {
    view.classList.remove('active');
  });
  
  const targetView = document.getElementById(`view-${viewName}`);
  if (targetView) {
    targetView.classList.add('active');
  }
  
  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 4. RENDERING DASHBOARD
function loadDashboardData() {
  const container = document.getElementById('my-courses-container');
  const countBadge = document.getElementById('my-course-count');
  
  countBadge.textContent = `${state.courses.length} ${state.courses.length === 1 ? 'Course' : 'Courses'}`;
  
  if (state.courses.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon"><i data-lucide="graduation-cap"></i></div>
        <h4>No courses imported yet</h4>
        <p>Paste a YouTube playlist link above or click on one of our recommended courses below to experience the platform!</p>
      </div>
    `;
    lucide.createIcons();
    return;
  }
  
  container.innerHTML = '';
  
  state.courses.forEach(course => {
    const progress = getCourseProgress(course.id);
    const percent = Math.round(progress.percent);
    
    // Use first video thumbnail if none
    const thumbnail = course.videos[0]?.thumbnail || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500';
    
    const card = document.createElement('div');
    card.className = 'course-card glass-panel';
    card.innerHTML = `
      <div class="course-card-thumb">
        <img src="${thumbnail}" alt="${course.title}">
        <span class="badge-video-count">
          <i data-lucide="play"></i>
          <span>${course.videos.length} lessons</span>
        </span>
      </div>
      <div class="course-card-content">
        <span class="course-card-instructor">Instructor: ${course.creator}</span>
        <h4 class="course-card-title">${course.title}</h4>
        <div class="course-card-progress">
          <div class="card-progress-meta">
            <span class="card-progress-ratio">${progress.completed}/${progress.total} Completed</span>
            <span class="card-progress-percent">${percent}%</span>
          </div>
          <div class="card-progress-bar-track">
            <div class="card-progress-bar-fill" style="width: ${percent}%"></div>
          </div>
        </div>
      </div>
    `;
    
    card.addEventListener('click', () => launchCourse(course.id));
    container.appendChild(card);
  });
  
  lucide.createIcons();
}

function renderRecommendedCourses() {
  const container = document.getElementById('recommended-courses-container');
  container.innerHTML = '';
  
  DEMO_COURSES.forEach(course => {
    const card = document.createElement('div');
    card.className = 'course-card recommended-card';
    card.innerHTML = `
      <div class="course-card-thumb">
        <img src="${course.videos[0].thumbnail}" alt="${course.title}">
        <span class="badge-video-count">
          <i data-lucide="play"></i>
          <span>${course.videos.length} lessons</span>
        </span>
      </div>
      <div class="course-card-content">
        <span class="course-card-instructor">Instructor: ${course.creator}</span>
        <h4 class="course-card-title">${course.title}</h4>
        <div class="course-card-progress" style="margin-top: 15px;">
          <button class="btn-primary" style="width: 100%; justify-content: center; padding: 8px 16px; font-size: 13px;">
            <i data-lucide="graduation-cap"></i> Load Course Demo
          </button>
        </div>
      </div>
    `;
    
    card.addEventListener('click', () => {
      // Overwrite or Add demo course to active database to force update to 100% working video IDs
      const idx = state.courses.findIndex(c => c.id === course.id);
      if (idx !== -1) {
        state.courses[idx] = course;
      } else {
        state.courses.push(course);
      }
      Database.set('courses', state.courses);
      loadDashboardData();
      launchCourse(course.id);
    });
    
    container.appendChild(card);
  });
  
  lucide.createIcons();
}

// 5. IMPORT LOGIC
async function importPlaylistFromUrl(urlOrId) {
  if (!urlOrId.trim()) return alert('Please enter a YouTube Playlist URL or Playlist ID.');
  
  const loadingOverlay = document.getElementById('import-loading');
  const loadingStatusText = document.getElementById('loading-status-text');
  
  loadingOverlay.classList.add('active');
  loadingStatusText.textContent = 'Extracting playlist ID...';
  
  // 1. Check if we have an API Key. If so, fetch via YouTube Data API client-side
  if (state.apiKey) {
    loadingStatusText.textContent = 'Connecting to YouTube API...';
    try {
      const playlistId = extractPlaylistId(urlOrId);
      if (!playlistId) throw new Error('Invalid YouTube Playlist URL or ID.');
      
      const courseData = await fetchPlaylistFromGoogleAPI(playlistId, state.apiKey);
      saveImportedCourse(courseData);
      loadingOverlay.classList.remove('active');
      launchCourse(courseData.id);
      return;
    } catch (err) {
      console.error('[API Fetch Error]', err);
      alert(`API Key Fetch Failed: ${err.message}. Retrying via background scraper server...`);
    }
  }
  
  // 2. Scraper Server Route (express backend endpoint)
  loadingStatusText.textContent = 'Querying local scraper server (no API key required)...';
  try {
    const response = await fetch(`${BACKEND_URL}/api/scrape-playlist?url=${encodeURIComponent(urlOrId)}`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Server returned an error.');
    }
    
    saveImportedCourse(data);
    loadingOverlay.classList.remove('active');
    launchCourse(data.id);
  } catch (err) {
    console.error('[Scraper Fetch Error]', err);
    loadingOverlay.classList.remove('active');
    alert(`Import failed: ${err.message}\n\nTIP: Please verify the URL or use the "Console Scraper" tab to import your playlist directly!`);
  }
}

function importPlaylistFromJson(jsonText) {
  if (!jsonText.trim()) return alert('Please paste scraped JSON content.');
  
  try {
    const data = JSON.parse(jsonText);
    if (!data.title || !data.videos || !Array.isArray(data.videos) || data.videos.length === 0) {
      throw new Error('Data must contain a "title" and a non-empty "videos" array.');
    }
    
    // Format if data doesn't match expected fields
    const formattedCourse = {
      id: data.id || 'custom-' + Date.now(),
      title: data.title,
      description: data.description || 'Custom course imported via Scraper.',
      creator: data.creator || 'Custom Instructor',
      videosCount: data.videos.length,
      videos: data.videos.map(v => ({
        id: v.id,
        title: v.title || 'Untitled Lecture',
        duration: v.duration || '00:00',
        thumbnail: v.thumbnail || `https://img.youtube.com/vi/${v.id}/hqdefault.jpg`
      }))
    };
    
    saveImportedCourse(formattedCourse);
    launchCourse(formattedCourse.id);
  } catch (err) {
    alert(`Invalid JSON format: ${err.message}`);
  }
}

function saveImportedCourse(courseData) {
  // If course already exists, replace it
  const index = state.courses.findIndex(c => c.id === courseData.id);
  if (index !== -1) {
    state.courses[index] = courseData;
  } else {
    state.courses.push(courseData);
  }
  
  // Set default progress state
  if (!state.progress[courseData.id]) {
    state.progress[courseData.id] = {
      completedVideos: [],
      lastVideoId: courseData.videos[0]?.id || '',
      notes: {},
      bookmarks: {}
    };
  }
  
  Database.set('courses', state.courses);
  Database.set('progress', state.progress);
  loadDashboardData();
}

function extractPlaylistId(urlOrId) {
  const match = urlOrId.match(/[&?]list=([a-zA-Z0-9_-]+)/);
  if (match) return match[1];
  if (/^[a-zA-Z0-9_-]{18,34}$/.test(urlOrId)) return urlOrId;
  return null;
}

// 6. CLIENT-SIDE GOOGLE API FETCHER
async function fetchPlaylistFromGoogleAPI(playlistId, apiKey) {
  // Fetch playlist metadata
  const metaUrl = `https://www.googleapis.com/youtube/v3/playlists?part=snippet&id=${playlistId}&key=${apiKey}`;
  const metaRes = await fetch(metaUrl);
  const metaData = await metaRes.json();
  
  if (metaData.error) throw new Error(metaData.error.message);
  if (!metaData.items || metaData.items.length === 0) throw new Error('Playlist not found.');
  
  const snippet = metaData.items[0].snippet;
  const title = snippet.title;
  const description = snippet.description;
  const creator = snippet.channelTitle;
  
  // Fetch videos
  const videos = [];
  let nextPageToken = '';
  
  do {
    const listUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&maxResults=50&playlistId=${playlistId}&pageToken=${nextPageToken}&key=${apiKey}`;
    const listRes = await fetch(listUrl);
    const listData = await listRes.json();
    
    if (listData.error) throw new Error(listData.error.message);
    
    listData.items.forEach(item => {
      const vidId = item.contentDetails.videoId;
      const vidTitle = item.snippet.title;
      // Note: playlistItems duration requires a separate call per video. We will use YouTube Player to dynamically load duration or set to mock.
      videos.push({
        id: vidId,
        title: vidTitle,
        duration: '00:00', // YouTube Data API v3 requires video endpoint for duration. We default to '00:00'
        thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || `https://img.youtube.com/vi/${vidId}/hqdefault.jpg`
      });
    });
    
    nextPageToken = listData.nextPageToken || '';
  } while (nextPageToken);
  
  return {
    id: playlistId,
    title,
    description,
    creator,
    videosCount: videos.length,
    videos
  };
}

// 7. COURSE PLAYER LOGIC
function launchCourse(courseId) {
  const course = state.courses.find(c => c.id === courseId);
  if (!course) return;
  
  state.currentCourseId = courseId;
  switchView('player');
  
  // Initialize progress model for this course if missing
  if (!state.progress[courseId]) {
    state.progress[courseId] = {
      completedVideos: [],
      lastVideoId: course.videos[0]?.id || '',
      notes: {},
      bookmarks: {}
    };
    Database.set('progress', state.progress);
  }
  
  const courseProgress = state.progress[courseId];
  
  // Choose last viewed video or first video
  let videoToPlay = courseProgress.lastVideoId;
  if (!videoToPlay || !course.videos.some(v => v.id === videoToPlay)) {
    videoToPlay = course.videos[0]?.id;
  }
  
  // Render Sidebar playlist structure
  renderSidebarPlaylist(course);
  
  // Render About course tab
  document.getElementById('about-course-title').textContent = course.title;
  document.getElementById('about-course-creator').textContent = course.creator;
  document.getElementById('about-course-desc').textContent = course.description || 'No description available.';
  
  // Load target video
  if (videoToPlay) {
    selectLesson(videoToPlay);
  }
}

function renderSidebarPlaylist(course) {
  document.getElementById('sidebar-course-title').textContent = course.title;
  document.getElementById('sidebar-course-creator').textContent = course.creator;
  
  const container = document.getElementById('sidebar-lessons-container');
  container.innerHTML = '';
  
  const progress = getCourseProgress(course.id);
  const percent = Math.round(progress.percent);
  
  // Update progress bar UI
  document.getElementById('sidebar-progress-percent').textContent = `${percent}% Completed`;
  document.getElementById('sidebar-progress-ratio').textContent = `${progress.completed}/${progress.total} Lessons`;
  document.getElementById('sidebar-progress-bar').style.width = `${percent}%`;
  
  // Claim certificate button toggle
  const claimBtn = document.getElementById('btn-claim-certificate');
  if (percent === 100) {
    claimBtn.classList.remove('disabled');
    claimBtn.removeAttribute('disabled');
  } else {
    claimBtn.classList.add('disabled');
    claimBtn.setAttribute('disabled', 'true');
  }
  
  // Sectioning logic: group into folders of 5 lectures for clean look
  const groupSize = 5;
  const sectionsCount = Math.ceil(course.videos.length / groupSize);
  
  for (let s = 0; s < sectionsCount; s++) {
    const startIdx = s * groupSize;
    const endIdx = Math.min(startIdx + groupSize, course.videos.length);
    
    const sectionGroup = document.createElement('div');
    sectionGroup.className = 'section-group';
    sectionGroup.innerHTML = `
      <div class="section-title">Section ${s + 1}: Lessons ${startIdx + 1} - ${endIdx}</div>
      <div class="section-lessons-container"></div>
    `;
    
    const lessonsListContainer = sectionGroup.querySelector('.section-lessons-container');
    
    for (let i = startIdx; i < endIdx; i++) {
      const video = course.videos[i];
      const isCompleted = state.progress[course.id].completedVideos.includes(video.id);
      const isActive = state.currentVideoId === video.id;
      
      const lessonItem = document.createElement('div');
      lessonItem.className = `sidebar-lesson-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`;
      lessonItem.innerHTML = `
        <div class="lesson-checkbox">
          <i data-lucide="check"></i>
        </div>
        <div class="lesson-title-label">${i + 1}. ${video.title}</div>
        <div class="lesson-duration-badge">${video.duration}</div>
      `;
      
      // Click label to play
      lessonItem.querySelector('.lesson-title-label').addEventListener('click', () => selectLesson(video.id));
      lessonItem.querySelector('.lesson-duration-badge').addEventListener('click', () => selectLesson(video.id));
      
      // Click checkbox to complete/uncomplete
      lessonItem.querySelector('.lesson-checkbox').addEventListener('click', (e) => {
        e.stopPropagation();
        toggleVideoCompleted(video.id);
      });
      
      lessonsListContainer.appendChild(lessonItem);
    }
    
    container.appendChild(sectionGroup);
  }
  
  lucide.createIcons();
}

function selectLesson(videoId) {
  state.currentVideoId = videoId;
  
  // Save as last viewed
  if (state.currentCourseId) {
    state.progress[state.currentCourseId].lastVideoId = videoId;
    Database.set('progress', state.progress);
  }
  
  // Load Video
  if (ytApiReady || (typeof YT !== 'undefined' && typeof YT.Player !== 'undefined')) {
    initYoutubePlayer(videoId);
  }
  
  // Update Lesson Title & UI
  const course = state.courses.find(c => c.id === state.currentCourseId);
  if (course) {
    const videoIndex = course.videos.findIndex(v => v.id === videoId);
    document.getElementById('player-lesson-number').textContent = `Lesson ${videoIndex + 1}`;
    document.getElementById('player-video-title').textContent = course.videos[videoIndex].title;
    
    // Toggle completed state button in title bar
    const isCompleted = state.progress[course.id].completedVideos.includes(videoId);
    const completeBtn = document.getElementById('btn-toggle-complete');
    if (isCompleted) {
      completeBtn.classList.add('completed');
      completeBtn.querySelector('span').textContent = 'Completed';
    } else {
      completeBtn.classList.remove('completed');
      completeBtn.querySelector('span').textContent = 'Mark Complete';
    }
    
    // Highlight sidebar active state
    renderSidebarPlaylist(course);
  }
  
  // Load notes & bookmarks
  loadLessonNotes(videoId);
  loadLessonBookmarks(videoId);

  // Reset AI Notes display
  const aiDisplay = document.getElementById('ai-notes-display');
  if (aiDisplay) {
    aiDisplay.innerHTML = `
      <div class="ai-notes-placeholder">
        <i data-lucide="file-text"></i>
        <p>Click "Generate AI Summary" to fetch the live YouTube transcript and generate a structured video summary.</p>
      </div>
    `;
    lucide.createIcons();
  }
}

function initYoutubePlayer(videoId) {
  const container = document.getElementById('yt-player-placeholder');
  
  if (!ytPlayer) {
    ytPlayer = new YT.Player('yt-player-placeholder', {
      height: '100%',
      width: '100%',
      videoId: videoId,
      playerVars: {
        'autoplay': 1,
        'rel': 0,
        'modestbranding': 1
      },
      events: {
        'onStateChange': onPlayerStateChange
      }
    });
  } else {
    // If player exists, load video
    ytPlayer.loadVideoById(videoId);
  }
}

function onPlayerStateChange(event) {
  // If video ends, mark completed and auto-advance
  if (event.data === YT.PlayerState.ENDED) {
    console.log('[Player] Video ended. Marking complete.');
    if (state.currentVideoId && state.currentCourseId) {
      // Mark as complete if not already
      const completed = state.progress[state.currentCourseId].completedVideos;
      if (!completed.includes(state.currentVideoId)) {
        toggleVideoCompleted(state.currentVideoId);
      }
      
      // Auto advance
      setTimeout(advanceToNextLesson, 1500);
    }
  }
}

function advanceToNextLesson() {
  const course = state.courses.find(c => c.id === state.currentCourseId);
  if (!course) return;
  
  const currentIdx = course.videos.findIndex(v => v.id === state.currentVideoId);
  if (currentIdx !== -1 && currentIdx < course.videos.length - 1) {
    selectLesson(course.videos[currentIdx + 1].id);
  }
}

function toggleVideoCompleted(videoId) {
  const courseId = state.currentCourseId;
  if (!courseId) return;
  
  const courseProgress = state.progress[courseId];
  const idx = courseProgress.completedVideos.indexOf(videoId);
  
  if (idx !== -1) {
    // Remove completion
    courseProgress.completedVideos.splice(idx, 1);
  } else {
    // Add completion
    courseProgress.completedVideos.push(videoId);
  }
  
  Database.set('progress', state.progress);
  
  // Update UI
  const course = state.courses.find(c => c.id === courseId);
  if (course) {
    renderSidebarPlaylist(course);
    loadDashboardData();
    
    // Update marker button if it is currently playing
    if (videoId === state.currentVideoId) {
      const isCompleted = courseProgress.completedVideos.includes(videoId);
      const completeBtn = document.getElementById('btn-toggle-complete');
      if (isCompleted) {
        completeBtn.classList.add('completed');
        completeBtn.querySelector('span').textContent = 'Completed';
      } else {
        completeBtn.classList.remove('completed');
        completeBtn.querySelector('span').textContent = 'Mark Complete';
      }
    }
    
    // Check if course is 100% finished, if so show congrats
    const updatedProgress = getCourseProgress(courseId);
    if (updatedProgress.percent === 100) {
      showCertificateClaimModal();
    }
  }
}

function getCourseProgress(courseId) {
  const course = state.courses.find(c => c.id === courseId);
  const prog = state.progress[courseId];
  
  if (!course || !prog) return { completed: 0, total: 0, percent: 0 };
  
  const total = course.videos.length;
  const completed = prog.completedVideos.filter(vidId => 
    course.videos.some(v => v.id === vidId)
  ).length;
  
  const percent = total > 0 ? (completed / total) * 100 : 0;
  return { completed, total, percent };
}

// 8. NOTES & BOOKMARKS LOGIC
function loadLessonNotes(videoId) {
  const notesTextarea = document.getElementById('lesson-notes-textarea');
  const courseId = state.currentCourseId;
  
  if (!courseId || !state.progress[courseId]) {
    notesTextarea.value = '';
    return;
  }
  
  const notes = state.progress[courseId].notes || {};
  notesTextarea.value = notes[videoId] || '';
}

function saveLessonNotes(videoId, text) {
  const courseId = state.currentCourseId;
  if (!courseId) return;
  
  if (!state.progress[courseId].notes) {
    state.progress[courseId].notes = {};
  }
  
  state.progress[courseId].notes[videoId] = text;
  Database.set('progress', state.progress);
}

// Bookmarks logic
function loadLessonBookmarks(videoId) {
  const container = document.getElementById('bookmarks-container');
  const courseId = state.currentCourseId;
  
  if (!courseId || !state.progress[courseId]) {
    container.innerHTML = '<p class="empty-list-msg">No bookmarks added yet.</p>';
    return;
  }
  
  const allBookmarks = state.progress[courseId].bookmarks || {};
  const bookmarks = allBookmarks[videoId] || [];
  
  if (bookmarks.length === 0) {
    container.innerHTML = '<p class="empty-list-msg">No bookmarks added for this lesson yet. Pause the video and add a bookmark at a specific timestamp!</p>';
    return;
  }
  
  container.innerHTML = '';
  
  // Sort bookmarks by time
  const sorted = [...bookmarks].sort((a, b) => a.time - b.time);
  
  sorted.forEach((bm, i) => {
    const item = document.createElement('div');
    item.className = 'bookmark-item';
    item.innerHTML = `
      <div class="bookmark-meta">
        <span class="bookmark-time"><i data-lucide="clock" style="width: 12px; height: 12px;"></i> ${formatTime(bm.time)}</span>
        <span class="bookmark-label">${bm.label}</span>
      </div>
      <div class="bookmark-actions">
        <button class="btn-delete-bookmark" title="Delete Bookmark"><i data-lucide="trash-2"></i></button>
      </div>
    `;
    
    // Jump to bookmark time on click
    item.querySelector('.bookmark-meta').addEventListener('click', () => {
      if (ytPlayer && typeof ytPlayer.seekTo === 'function') {
        ytPlayer.seekTo(bm.time, true);
        ytPlayer.playVideo();
      }
    });
    
    // Delete bookmark
    item.querySelector('.btn-delete-bookmark').addEventListener('click', (e) => {
      e.stopPropagation();
      deleteBookmark(videoId, bm.time);
    });
    
    container.appendChild(item);
  });
  
  lucide.createIcons();
}

function addBookmark(videoId, time, label) {
  const courseId = state.currentCourseId;
  if (!courseId) return;
  
  if (!state.progress[courseId].bookmarks) {
    state.progress[courseId].bookmarks = {};
  }
  
  const allBookmarks = state.progress[courseId].bookmarks;
  if (!allBookmarks[videoId]) {
    allBookmarks[videoId] = [];
  }
  
  // Check if bookmark at exact time already exists
  if (allBookmarks[videoId].some(bm => Math.floor(bm.time) === Math.floor(time))) {
    return alert('A bookmark already exists near this timestamp.');
  }
  
  allBookmarks[videoId].push({
    time: Math.floor(time),
    label: label.trim() || `Bookmark at ${formatTime(time)}`
  });
  
  Database.set('progress', state.progress);
  loadLessonBookmarks(videoId);
}

function deleteBookmark(videoId, time) {
  const courseId = state.currentCourseId;
  if (!courseId) return;
  
  const bookmarks = state.progress[courseId].bookmarks?.[videoId] || [];
  const idx = bookmarks.findIndex(bm => bm.time === time);
  
  if (idx !== -1) {
    bookmarks.splice(idx, 1);
    Database.set('progress', state.progress);
    loadLessonBookmarks(videoId);
  }
}

// Helper formatting seconds -> mm:ss
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

// 9. AI NOTES ENGINE
async function generateAiNotes() {
  const videoId = state.currentVideoId;
  if (!videoId) return alert('No active video playing.');

  const display = document.getElementById('ai-notes-display');
  const generateBtn = document.getElementById('btn-generate-ai-notes');

  // Set loading state
  generateBtn.setAttribute('disabled', 'true');
  generateBtn.innerHTML = '<i data-lucide="loader" class="spin"></i> <span>Analyzing video...</span>';
  lucide.createIcons();

  display.innerHTML = `
    <div class="ai-notes-placeholder">
      <div class="spinner" style="width: 32px; height: 32px; border-width: 3px;"></div>
      <p>Retrieving video transcript from YouTube...</p>
    </div>
  `;

  try {
    // Fetch transcript from our server
    const response = await fetch(`${BACKEND_URL}/api/transcript?videoId=${encodeURIComponent(videoId)}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch transcript.');
    }

    const rawTranscript = data.transcript;
    if (!rawTranscript || rawTranscript.length === 0) {
      throw new Error('No caption track returned for this video.');
    }

    // Format transcript text
    const fullText = rawTranscript.map(t => t.text).join(' ');
    display.innerHTML = `
      <div class="ai-notes-placeholder">
        <div class="spinner" style="width: 32px; height: 32px; border-width: 3px;"></div>
        <p>Transcript retrieved (${fullText.length} characters). Compiling summary...</p>
      </div>
    `;

    // Now summarize transcript
    let summaryHtml = '';

    if (state.geminiApiKey) {
      // Call live Gemini 2.5 Flash API!
      summaryHtml = await summarizeWithGemini(fullText, state.geminiApiKey);
    } else {
      // High-fidelity local rule-based text summary fallback
      summaryHtml = compileLocalSummary(rawTranscript);
    }

    display.innerHTML = summaryHtml;
    lucide.createIcons();

  } catch (err) {
    console.error('[AI Notes Error]', err);
    display.innerHTML = `
      <div class="ai-notes-placeholder" style="color: var(--color-danger);">
        <i data-lucide="alert-circle" style="color: var(--color-danger);"></i>
        <p><strong>Failed to generate AI Notes:</strong><br>${err.message}</p>
        <p style="font-size: 12px; margin-top: 10px;">TIP: Check if the video has subtitles/captions enabled on YouTube. You can also paste your own Gemini API Key in Settings to bypass rate limits.</p>
      </div>
    `;
    lucide.createIcons();
  } finally {
    generateBtn.removeAttribute('disabled');
    generateBtn.innerHTML = '<i data-lucide="zap"></i> <span>Generate AI Summary</span>';
    lucide.createIcons();
  }
}

async function summarizeWithGemini(transcriptText, apiKey) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  const prompt = `You are an expert study assistant. Summarize the following video transcript into a clean, comprehensive study guide. Format the output with clear headings, styled bullet points, bold key terms, and code blocks if code is shown in the transcript. Focus on accuracy and key conceptual takeaways. Do not include conversational intro/outro. Here is the transcript:\n\n${transcriptText}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    })
  });

  const resJson = await response.json();
  if (resJson.error) {
    throw new Error(resJson.error.message || 'Gemini API call failed.');
  }

  const responseText = resJson.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!responseText) {
    throw new Error('Empty response received from Gemini.');
  }

  // Parse basic Markdown headers, lists, and bold to HTML
  return parseMarkdownToHtml(responseText);
}

function compileLocalSummary(transcriptArray) {
  // Filter transcript text lines
  const lines = transcriptArray.map(t => t.text.trim().replace(/[\r\n]+/g, ' '));
  const fullText = lines.join(' ');
  
  // Detect keywords for summary
  const keywords = ['const', 'let', 'function', 'class', 'define', 'important', 'remember', 'concept', 'structure', 'variable', 'method', 'scoping', 'state', 'component', 'props', 'design', 'theory'];
  const highlights = [];
  
  // Segment transcript into sentences
  const sentences = fullText.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 15);
  
  // Score sentences
  const scored = sentences.map(s => {
    let score = 0;
    const lower = s.toLowerCase();
    keywords.forEach(kw => {
      if (lower.includes(kw)) score += 2;
    });
    // Prefer sentences starting with transitional terms
    if (/^(first|second|then|so|remember|for example|now|the next)/i.test(s)) score += 1;
    // Ignore overly brief or long
    if (s.length > 200) score -= 1;
    return { text: s, score };
  });

  // Sort and take top 5 high-scoring sentences
  const topSentences = scored
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map(item => item.text);

  // Fallback if no high scoring sentences
  if (topSentences.length === 0) {
    topSentences.push(...sentences.slice(0, Math.min(sentences.length, 5)));
  }

  // Format into beautiful HTML
  let html = `<div class="ai-summary-content">`;
  html += `<h3>📋 Auto-Generated Study Summary</h3>`;
  html += `<p><em>This summary is compiled by parsing key sentences and keywords from the video captions. For a deep, contextual analysis, please enter your free Gemini API Key in the settings.</em></p>`;
  
  html += `<p><strong>Core Discussion & Context:</strong></p>`;
  html += `<p>${sentences.slice(0, 3).join('. ') + '.'}</p>`;
  
  html += `<p><strong>Key Concepts & Takeaways:</strong></p><ul>`;
  topSentences.forEach(s => {
    // Bold common keywords
    let text = s;
    keywords.forEach(kw => {
      const regex = new RegExp(`\\b(${kw})\\b`, 'gi');
      text = text.replace(regex, '<strong>$1</strong>');
    });
    html += `<li>${text}.</li>`;
  });
  html += `</ul>`;
  
  // Add a summary of duration
  const totalSeconds = transcriptArray.reduce((acc, t) => acc + (t.duration || 0) / 1000, 0);
  const mins = Math.round(totalSeconds / 60);
  html += `<p style="font-size: 13px; color: var(--text-muted); margin-top: 20px;"><i data-lucide="clock" style="width: 12px; height: 12px; display: inline; vertical-align: middle;"></i> Analyzed ${mins > 0 ? mins : 'several'} minutes of content.</p>`;
  html += `</div>`;
  
  return html;
}

function parseMarkdownToHtml(mdText) {
  let html = mdText
    .replace(/### (.*)/g, '<h4>$1</h4>')
    .replace(/## (.*)/g, '<h3>$1</h3>')
    .replace(/# (.*)/g, '<h2>$1</h2>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code class="inline-code">$1</code>')
    .replace(/^\s*[-*+]\s+(.*)/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/gs, '<ul>$1<\/ul>')
    // Clean nested tags
    .replace(/<\/ul>\s*<ul>/g, '')
    .replace(/\n\n/g, '<p></p>')
    .replace(/\n/g, '<br>');
    
  return `<div class="ai-summary-content">${html}</div>`;
}


// 10. CERTIFICATE LOGIC
function showCertificateClaimModal() {
  const modal = document.getElementById('modal-certificate-claim');
  const input = document.getElementById('cert-claim-name');
  input.value = state.settings.userName;
  modal.classList.add('active');
  
  // Trigger Confetti!
  triggerConfettiExplosion();
}

function triggerConfettiExplosion() {
  const duration = 3 * 1000;
  const end = Date.now() + duration;

  (function frame() {
    confetti({
      particleCount: 5,
      angle: 60,
      spread: 55,
      origin: { x: 0 }
    });
    confetti({
      particleCount: 5,
      angle: 120,
      spread: 55,
      origin: { x: 1 }
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  }());
}

function generateCertificate() {
  const course = state.courses.find(c => c.id === state.currentCourseId);
  if (!course) return;
  
  const recipientName = document.getElementById('cert-claim-name').value.trim() || state.settings.userName;
  
  // Save name change
  state.settings.userName = recipientName;
  Database.set('settings', state.settings);
  initTheme();
  
  // Set certificate data
  document.getElementById('cert-recipient-name').textContent = recipientName;
  document.getElementById('cert-course-title').textContent = course.title;
  document.getElementById('cert-course-creator').textContent = course.creator;
  
  // Format Date
  const dateOptions = { year: 'numeric', month: 'long', day: 'numeric' };
  const completionDate = new Date().toLocaleDateString('en-US', dateOptions);
  document.getElementById('cert-completion-date').textContent = completionDate;
  
  // Unique UUID
  const uuid = 'YT2C-' + Math.random().toString(36).substring(2, 6).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
  document.getElementById('cert-uuid').textContent = uuid;
  
  // Activate print overlay
  document.getElementById('modal-certificate-claim').classList.remove('active');
  
  document.body.classList.add('print-certificate-mode');
  document.getElementById('certificate-print-container').classList.add('active');
}

// 11. DATABASE BACKUPS
function exportDatabase() {
  const dbData = {
    courses: state.courses,
    progress: state.progress,
    settings: state.settings,
    apiKey: state.apiKey,
    geminiApiKey: state.geminiApiKey
  };
  
  const jsonStr = JSON.stringify(dbData, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `yt2course_backup_${new Date().toISOString().slice(0,10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function importDatabase(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (data.courses && data.progress && data.settings) {
        state.courses = data.courses;
        state.progress = data.progress;
        state.settings = data.settings;
        if (data.apiKey) state.apiKey = data.apiKey;
        if (data.geminiApiKey) state.geminiApiKey = data.geminiApiKey;
        
        Database.set('courses', state.courses);
        Database.set('progress', state.progress);
        Database.set('settings', state.settings);
        if (state.apiKey) Database.set('api_key', state.apiKey);
        if (state.geminiApiKey) Database.set('gemini_api_key', state.geminiApiKey);
        
        initTheme();
        loadDashboardData();
        alert('Database imported successfully!');
        document.getElementById('modal-settings').classList.remove('active');
      } else {
        throw new Error('Missing core keys in JSON.');
      }
    } catch (err) {
      alert(`Failed to import database file: ${err.message}`);
    }
  };
  reader.readAsText(file);
}

function resetDatabase() {
  if (confirm('Are you absolutely sure you want to delete all courses, notes, bookmarks, and settings? This action CANNOT be undone.')) {
    Database.clear();
    state.courses = [];
    state.progress = {};
    state.settings = DEFAULT_SETTINGS;
    state.apiKey = null;
    state.geminiApiKey = null;
    localStorage.removeItem('yt2c_api_key');
    localStorage.removeItem('yt2c_gemini_api_key');
    
    initTheme();
    loadDashboardData();
    
    alert('Database successfully reset.');
    document.getElementById('modal-settings').classList.remove('active');
    switchView('dashboard');
  }
}

// 12. EVENT LISTENERS
function setupEventListeners() {
  // Navigation / Logo
  document.getElementById('btn-logo').addEventListener('click', () => switchView('dashboard'));
  document.getElementById('btn-nav-dashboard').addEventListener('click', () => switchView('dashboard'));
  
  // Theme Toggle
  document.getElementById('btn-theme-toggle').addEventListener('click', () => {
    const isDark = document.body.classList.contains('dark-theme');
    state.settings.theme = isDark ? 'light-theme' : 'dark-theme';
    Database.set('settings', state.settings);
    initTheme();
  });
  
  // Modals Open/Close
  const settingsModal = document.getElementById('modal-settings');
  if (settingsModal) {
    document.getElementById('btn-settings').addEventListener('click', () => settingsModal.classList.add('active'));
  }
  
  document.querySelectorAll('.btn-close-modal').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.modal-overlay').forEach(modal => modal.classList.remove('active'));
    });
  });
  
  // Close modals on clicking overlay background
  document.querySelectorAll('.modal-overlay').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('active');
    });
  });
  
  // Import Operations
  const importUrlBtn = document.getElementById('btn-import-url');
  if (importUrlBtn) {
    importUrlBtn.addEventListener('click', () => {
      const url = document.getElementById('playlist-url-input').value;
      importPlaylistFromUrl(url);
    });
  }
  
  // Video player control buttons
  document.getElementById('btn-prev-lesson').addEventListener('click', () => {
    const course = state.courses.find(c => c.id === state.currentCourseId);
    if (!course) return;
    const currentIdx = course.videos.findIndex(v => v.id === state.currentVideoId);
    if (currentIdx > 0) {
      selectLesson(course.videos[currentIdx - 1].id);
    }
  });
  
  document.getElementById('btn-next-lesson').addEventListener('click', advanceToNextLesson);
  
  document.getElementById('btn-toggle-complete').addEventListener('click', () => {
    if (state.currentVideoId) {
      toggleVideoCompleted(state.currentVideoId);
    }
  });
  
  // Tabs Navigation
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const activeBtn = e.target.closest('.tab-btn');
      const tabName = activeBtn.getAttribute('data-tab');
      
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
      
      activeBtn.classList.add('active');
      document.getElementById(`pane-${tabName}`).classList.add('active');
    });
  });
  
  // Notes auto-save debouncing
  let notesDebounceTimer;
  document.getElementById('lesson-notes-textarea').addEventListener('input', (e) => {
    if (!state.currentVideoId) return;
    clearTimeout(notesDebounceTimer);
    notesDebounceTimer = setTimeout(() => {
      saveLessonNotes(state.currentVideoId, e.target.value);
    }, 500);
  });
  
  document.getElementById('btn-export-notes').addEventListener('click', () => {
    const notes = state.progress[state.currentCourseId]?.notes || {};
    const course = state.courses.find(c => c.id === state.currentCourseId);
    if (!course) return;
    
    let content = `# Notes for course: ${course.title}\n\n`;
    course.videos.forEach(v => {
      if (notes[v.id]) {
        content += `## Lesson: ${v.title}\n\n${notes[v.id]}\n\n---\n\n`;
      }
    });
    
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${course.title.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_study_notes.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
  
  // Bookmarks
  document.getElementById('btn-capture-timestamp').addEventListener('click', () => {
    if (ytPlayer && typeof ytPlayer.getCurrentTime === 'function') {
      const currentSeconds = ytPlayer.getCurrentTime();
      document.getElementById('current-timestamp-label').textContent = formatTime(currentSeconds);
      document.getElementById('btn-capture-timestamp').dataset.time = currentSeconds;
    }
  });
  
  document.getElementById('btn-add-bookmark').addEventListener('click', () => {
    if (!state.currentVideoId) return;
    const timeBtn = document.getElementById('btn-capture-timestamp');
    const time = parseFloat(timeBtn.dataset.time || (ytPlayer ? ytPlayer.getCurrentTime() : 0));
    const labelInput = document.getElementById('bookmark-label-input');
    
    addBookmark(state.currentVideoId, time, labelInput.value);
    labelInput.value = '';
    
    // Reset timestamp capture UI
    timeBtn.dataset.time = '';
    document.getElementById('current-timestamp-label').textContent = '0:00';
  });
  
  // Claim certificate button
  document.getElementById('btn-claim-certificate').addEventListener('click', showCertificateClaimModal);
  document.getElementById('btn-generate-cert').addEventListener('click', generateCertificate);
  
  document.getElementById('btn-close-cert').addEventListener('click', () => {
    document.body.classList.remove('print-certificate-mode');
    document.getElementById('certificate-print-container').classList.remove('active');
  });
  
  // AI Notes Generation
  const generateNotesBtn = document.getElementById('btn-generate-ai-notes');
  if (generateNotesBtn) {
    generateNotesBtn.addEventListener('click', generateAiNotes);
  }
  
  // Settings DB operations & Gemini Key Saving
  document.getElementById('settings-username').addEventListener('input', (e) => {
    state.settings.userName = e.target.value.trim() || DEFAULT_SETTINGS.userName;
    Database.set('settings', state.settings);
    initTheme();
  });
  
  const geminiKeyInput = document.getElementById('settings-gemini-key');
  if (geminiKeyInput) {
    geminiKeyInput.addEventListener('input', (e) => {
      state.geminiApiKey = e.target.value.trim() || null;
      Database.set('gemini_api_key', state.geminiApiKey);
    });
  }
  
  document.getElementById('btn-export-db').addEventListener('click', exportDatabase);
  
  const dbInput = document.getElementById('db-file-input');
  document.getElementById('btn-import-db-trigger').addEventListener('click', () => dbInput.click());
  dbInput.addEventListener('change', importDatabase);
  
  document.getElementById('btn-reset-db').addEventListener('click', resetDatabase);

  // --- FIREBASE ACCOUNT LISTENERS ---
  const authTrigger = document.getElementById('btn-auth-trigger');
  if (authTrigger) {
    authTrigger.addEventListener('click', () => {
      document.getElementById('modal-auth').classList.add('active');
    });
  }

  const loginBtn = document.getElementById('btn-auth-login');
  if (loginBtn) {
    loginBtn.addEventListener('click', async () => {
      const email = document.getElementById('auth-email-input').value.trim();
      const password = document.getElementById('auth-password-input').value;
      const errorEl = document.getElementById('auth-error-message');
      if (!email || !password) return;
      if (!dbSyncActive) return alert('Firebase is not configured yet. Add credentials to firebaseConfig in public/app.js to sync to Firestore.');
      
      try {
        if (errorEl) errorEl.style.display = 'none';
        loginBtn.disabled = true;
        loginBtn.textContent = 'Logging in...';
        await firebase.auth().signInWithEmailAndPassword(email, password);
        document.getElementById('modal-auth').classList.remove('active');
      } catch (err) {
        if (errorEl) {
          errorEl.textContent = err.message;
          errorEl.style.display = 'block';
        }
      } finally {
        loginBtn.disabled = false;
        loginBtn.textContent = 'Log In';
      }
    });
  }

  const signupBtn = document.getElementById('btn-auth-signup');
  if (signupBtn) {
    signupBtn.addEventListener('click', async () => {
      const email = document.getElementById('auth-email-input').value.trim();
      const password = document.getElementById('auth-password-input').value;
      const errorEl = document.getElementById('auth-error-message');
      if (!email || !password) return;
      if (!dbSyncActive) return alert('Firebase is not configured yet. Add credentials to firebaseConfig in public/app.js to sync to Firestore.');
      
      try {
        if (errorEl) errorEl.style.display = 'none';
        signupBtn.disabled = true;
        signupBtn.textContent = 'Signing up...';
        await firebase.auth().createUserWithEmailAndPassword(email, password);
        document.getElementById('modal-auth').classList.remove('active');
        alert('Account created successfully!');
      } catch (err) {
        if (errorEl) {
          errorEl.textContent = err.message;
          errorEl.style.display = 'block';
        }
      } finally {
        signupBtn.disabled = false;
        signupBtn.textContent = 'Sign Up';
      }
    });
  }

  const googleBtn = document.getElementById('btn-auth-google');
  if (googleBtn) {
    googleBtn.addEventListener('click', async () => {
      if (!dbSyncActive) return alert('Firebase is not configured yet. Add credentials to firebaseConfig in public/app.js to sync to Firestore.');
      const provider = new firebase.auth.GoogleAuthProvider();
      try {
        await firebase.auth().signInWithPopup(provider);
        document.getElementById('modal-auth').classList.remove('active');
      } catch (err) {
        alert(err.message);
      }
    });
  }

  const logoutBtn = document.getElementById('btn-auth-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try {
        await firebase.auth().signOut();
        localStorage.removeItem('yt2c_courses');
        localStorage.removeItem('yt2c_progress');
        state.courses = [];
        state.progress = {};
        loadDashboardData();
        document.getElementById('modal-auth').classList.remove('active');
        alert('Logged out successfully.');
      } catch (err) {
        alert(err.message);
      }
    });
  }
}

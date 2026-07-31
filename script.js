//database
const API_BASE_URL = 'https://0d377418-50ba-40c0-809a-531ca79bbc52-00-1di3vpscmkvo6.picard.replit.dev/';

// --- DATA STORE (INITIAL MOCK DATA) ---
let users = JSON.parse(localStorage.getItem('em_users')) || [
    { id: 1, fname: "John", lname: "Grace", email: "john@test.com", username: "praise_john", password: "123", followers: [2], following: [2] },
    { id: 2, fname: "Mary", lname: "Faith", email: "mary@test.com", username: "mary_blessed", password: "123", followers: [1], following: [1] },
    { id: 3, fname: "Pastor", lname: "David", email: "david@test.com", username: "pastor_david", password: "123", followers: [], following: [] }
];

let posts = JSON.parse(localStorage.getItem('em_posts')) || [
    {
        id: 101,
        userId: 2,
        content: "<h2>Morning Devotional</h2><p><i>The Lord is my shepherd; I shall not want. Psalm 23:1</i>. Have a wonderful and blessed day family!</p>",
        image: "",
        audio: "",
        timestamp: Date.now() - 3600000,
        likes: [1],
        reports: []
    },
    {
        id: 102,
        userId: 3,
        content: "<h1>Sunday Revival Service</h1><p>Join us this coming Sunday as we experience the move of God!</p>",
        image: "",
        audio: "",
        timestamp: Date.now() - 7200000,
        likes: [],
        reports: []
    }
];

let programs = JSON.parse(localStorage.getItem('em_programs')) || [];
let currentUser = JSON.parse(localStorage.getItem('em_current_user')) || null;

function saveData() {
    localStorage.setItem('em_users', JSON.stringify(users));
    localStorage.setItem('em_posts', JSON.stringify(posts));
    localStorage.setItem('em_programs', JSON.stringify(programs));
    localStorage.setItem('em_current_user', JSON.stringify(currentUser));
}

// --- AUTH SYSTEM ---
function toggleAuth(view) {
    document.getElementById('login-card').classList.add('hidden');
    document.getElementById('signup-card').classList.add('hidden');
    document.getElementById('reset-card').classList.add('hidden');

    if (view === 'login') document.getElementById('login-card').classList.remove('hidden');
    if (view === 'signup') document.getElementById('signup-card').classList.remove('hidden');
    if (view === 'reset') document.getElementById('reset-card').classList.remove('hidden');
}

async function handleSignup(e) {
  e.preventDefault();

  const fname = document.getElementById('signup-fname').value;
  const lname = document.getElementById('signup-lname').value;
  const email = document.getElementById('signup-email').value;
  const username = document.getElementById('signup-username').value;
  const password = document.getElementById('signup-password').value;

  try {
    const res = await fetch(`${API_BASE_URL}/api/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fname, lname, email, username, password })
    });

    const data = await res.json();

    if (res.ok && data.success) {
      currentUser = data.user;
      saveData();
      initApp();
    } else {
      alert(data.error || 'Signup failed');
    }
  } catch (err) {
    console.error('Signup error:', err);
    alert('Could not connect to the server.');
  }
}


async function handleLogin(e) {
  e.preventDefault();

  const identifier = document.getElementById('login-id').value; // email or username
  const password = document.getElementById('login-password').value;

  try {
    const res = await fetch(`${API_BASE_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password })
    });

    const data = await res.json();

    if (res.ok && data.success) {
      currentUser = data.user;
      saveData();
      initApp();
    } else {
      alert(data.error || 'Invalid login details.');
    }
  } catch (err) {
    console.error('Login error:', err);
    alert('Could not connect to the server.');
  }
}


function handleReset(e) {
    e.preventDefault();
    const email = document.getElementById('reset-email').value;
    const user = users.find(u => u.email === email);
    if (user) {
        alert(`Verification link sent to ${email}. Check your inbox!`);
        toggleAuth('login');
    } else {
        alert("Email address not found.");
    }
}

function logout() {
    currentUser = null;
    localStorage.removeItem('em_current_user');
    document.getElementById('app-section').classList.add('hidden');
    document.getElementById('main-header').classList.add('hidden');
    document.getElementById('auth-section').classList.remove('hidden');
    toggleAuth('login');
}

// --- CORE APP LOGIC ---
function initApp() {
    if (!currentUser) return;
    document.getElementById('auth-section').classList.add('hidden');
    document.getElementById('main-header').classList.remove('hidden');
    document.getElementById('app-section').classList.remove('hidden');

    renderFeed();
    renderSuggestedUsers();
    renderPrograms();
    updateProfileUI();
}

// --- NAVIGATION ---
function switchTab(tabId, event) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));
    
    document.getElementById(tabId).classList.remove('hidden');
    if (event && event.target) {
        event.target.classList.add('active');
    }

    if(tabId === 'profile-tab') renderMyPosts();
    if(tabId === 'followers-tab') renderFollowersList();
}

// --- POST FORMATTING TOOLBAR ---
function formatDoc(cmd, value = null) {
    document.execCommand(cmd, false, value);
}

function toggleEditMode() {
    const editor = document.getElementById('post-editor');
    if (editor.isContentEditable) {
        editor.contentEditable = "false";
        editor.style.background = "#edf2f7";
    } else {
        editor.contentEditable = "true";
        editor.style.background = "#ffffff";
    }
}

// --- CREATING POSTS ---
function createPost() {
    const editor = document.getElementById('post-editor');
    const content = editor.innerHTML.trim();
    const imgInput = document.getElementById('post-image-input');
    const audioInput = document.getElementById('post-audio-input');

    if (!content) {
        alert("Please add some text to your post.");
        return;
    }

    const newPost = {
        id: Date.now(),
        userId: currentUser.id,
        content: content,
        image: "",
        audio: "",
        timestamp: Date.now(),
        likes: [],
        reports: []
    };

    const processFiles = () => {
        posts.unshift(newPost);
        saveData();
        editor.innerHTML = "";
        imgInput.value = "";
        audioInput.value = "";
        renderFeed();
    };

    // Handle Image File Read
    if (imgInput.files && imgInput.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            newPost.image = e.target.result;
            if (audioInput.files && audioInput.files[0]) {
                const aReader = new FileReader();
                aReader.onload = function(ae) {
                    newPost.audio = ae.target.result;
                    processFiles();
                };
                aReader.readAsDataURL(audioInput.files[0]);
            } else {
                processFiles();
            }
        };
        reader.readAsDataURL(imgInput.files[0]);
    } else if (audioInput.files && audioInput.files[0]) {
        const aReader = new FileReader();
        aReader.onload = function(ae) {
            newPost.audio = ae.target.result;
            processFiles();
        };
        aReader.readAsDataURL(audioInput.files[0]);
    } else {
        processFiles();
    }
}

// --- ALGORITHMS & FEED RENDER ---
function renderFeed() {
    const container = document.getElementById('posts-stream');
    const filter = document.getElementById('feed-filter').value;
    let displayPosts = [...posts];

    // Filter out reported posts for clean viewing
    displayPosts = displayPosts.filter(p => !p.reports.includes(currentUser.id));

    // ALGORITHM IMPLEMENTATION
    if (filter === 'smart') {
        // Bring to feed posts of people following most, and less of non-following
        displayPosts.sort((a, b) => {
            const isAFollowing = currentUser.following.includes(a.userId) ? 1 : 0;
            const isBFollowing = currentUser.following.includes(b.userId) ? 1 : 0;
            if (isAFollowing !== isBFollowing) {
                return isBFollowing - isAFollowing; // Following first
            }
            return b.timestamp - a.timestamp; // Then by recency
        });
    } else if (filter === 'recent') {
        displayPosts.sort((a, b) => b.timestamp - a.timestamp);
    } else if (filter === 'following') {
        displayPosts = displayPosts.filter(p => currentUser.following.includes(p.userId));
        displayPosts.sort((a, b) => b.timestamp - a.timestamp);
    } else if (filter === 'non-following') {
        displayPosts = displayPosts.filter(p => !currentUser.following.includes(p.userId) && p.userId !== currentUser.id);
        displayPosts.sort((a, b) => b.timestamp - a.timestamp);
    } else if (filter === 'suggested') {
        // Posts user might be interested in (most liked by community, non-followed)
        displayPosts = displayPosts.filter(p => !currentUser.following.includes(p.userId) && p.userId !== currentUser.id);
        displayPosts.sort((a, b) => b.likes.length - a.likes.length);
    }

    container.innerHTML = displayPosts.length ? "" : "<p>No posts to display.</p>";
    displayPosts.forEach(post => {
        container.appendChild(createPostCardUI(post));
    });
}

function createPostCardUI(post) {
    const author = users.find(u => u.id === post.userId) || { fname: "Unknown", lname: "User" };
    const isFollowing = currentUser.following.includes(post.userId);
    const isOwnPost = post.userId === currentUser.id;
    const isLiked = post.likes.includes(currentUser.id);

    const card = document.createElement('div');
    card.className = "card";
    card.innerHTML = `
        <div class="post-header">
            <div class="author-info">
                <div class="avatar">${author.fname.charAt(0)}</div>
                <div>
                    <strong>${author.fname} ${author.lname}</strong> 
                    <span style="font-size: 0.8rem; color: #718096;">@${author.username}</span>
                </div>
            </div>
            <div>
                ${!isOwnPost ? `
                    <button class="btn btn-outline" style="padding: 4px 10px; font-size: 0.8rem;" onclick="toggleFollow(${author.id})">
                        ${isFollowing ? 'Following' : '+ Follow'}
                    </button>
                ` : ''}
            </div>
        </div>
        
        <div class="post-content" id="post-content-${post.id}">
            ${post.content}
        </div>

        ${post.image ? `<img src="${post.image}" class="post-image">` : ''}
        ${post.audio ? `<audio controls src="${post.audio}" class="post-audio"></audio>` : ''}

        <div class="post-actions">
            <div>
                <button class="btn ${isLiked ? '' : 'btn-outline'}" onclick="toggleLike(${post.id})">
                    ❤️ ${post.likes.length} Like${post.likes.length === 1 ? '' : 's'}
                </button>
            </div>
            <div>
                ${isOwnPost ? `
                    <button class="btn btn-outline" onclick="enableInlineEdit(${post.id})">✏️ Edit</button>
                    <button class="btn btn-danger" onclick="deletePost(${post.id})">Delete</button>
                ` : `
                    <button class="btn btn-outline" style="color: #e53e3e; border-color: #e53e3e;" onclick="reportPost(${post.id})" title="Report inappropriate or non-Christian content">
                        🚩 Report
                    </button>
                `}
            </div>
        </div>
    `;
    return card;
}

// --- FOLLOW / UNFOLLOW ALGORITHM & LOGIC ---
function toggleFollow(targetUserId) {
    const targetUser = users.find(u => u.id === targetUserId);
    if (!targetUser) return;

    const isFollowing = currentUser.following.includes(targetUserId);

    if (isFollowing) {
        // Prompt before unfollowing
        const confirmUnfollow = confirm(`Are you sure you want to unfollow ${targetUser.fname} ${targetUser.lname}?`);
        if (confirmUnfollow) {
            // Remove from currentUser following
            currentUser.following = currentUser.following.filter(id => id !== targetUserId);
            // Reduce targeted user's followers count
            targetUser.followers = targetUser.followers.filter(id => id !== currentUser.id);
        }
    } else {
        // Follow
        currentUser.following.push(targetUserId);
        targetUser.followers.push(currentUser.id);
    }

    saveData();
    renderFeed();
    renderSuggestedUsers();
    updateProfileUI();
}

// --- LIKE & REPORT ---
function toggleLike(postId) {
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    const index = post.likes.indexOf(currentUser.id);
    if (index > -1) {
        post.likes.splice(index, 1);
    } else {
        post.likes.push(currentUser.id);
    }

    saveData();
    renderFeed();
}

function reportPost(postId) {
    const post = posts.find(p => p.id === postId);
    if (post) {
        if(confirm("Report this content for being inappropriate or unrelated to Christianity?")) {
            post.reports.push(currentUser.id);
            saveData();
            alert("Thank you. The post has been reported and hidden from your feed.");
            renderFeed();
        }
    }
}

// --- POST EDITING AND DELETION ---
function enableInlineEdit(postId) {
    const contentDiv = document.getElementById(`post-content-${postId}`);
    contentDiv.contentEditable = "true";
    contentDiv.style.border = "1px dashed var(--primary)";
    contentDiv.style.padding = "10px";
    contentDiv.focus();

    const post = posts.find(p => p.id === postId);
    
    // Add a temporary save button
    const saveBtn = document.createElement('button');
    saveBtn.className = "btn";
    saveBtn.innerText = "Save Changes";
    saveBtn.style.marginTop = "10px";
    saveBtn.onclick = () => {
        post.content = contentDiv.innerHTML;
        saveData();
        renderFeed();
    };
    contentDiv.after(saveBtn);
}

function deletePost(postId) {
    if (confirm("Are you sure you want to delete this post?")) {
        posts = posts.filter(p => p.id !== postId);
        saveData();
        renderFeed();
        renderMyPosts();
    }
}

// --- PROGRAM ANNOUNCEMENT PAGE ---
function handleProgramPost(e) {
    e.preventDefault();
    const title = document.getElementById('prog-title').value;
    const date = document.getElementById('prog-date').value;
    const desc = document.getElementById('prog-desc').value;
    const flyerInput = document.getElementById('prog-flyer');

    const reader = new FileReader();
    reader.onload = function(evt) {
        const newProgram = {
            id: Date.now(),
            userId: currentUser.id,
            title, date, desc,
            flyer: evt.target.result
        };
        programs.unshift(newProgram);
        saveData();
        renderPrograms();
        alert("Program published!");
        e.target.reset();
    };
    reader.readAsDataURL(flyerInput.files[0]);
}

function renderPrograms() {
    const container = document.getElementById('programs-stream');
    container.innerHTML = programs.length ? "" : "<p>No upcoming programs found.</p>";

    programs.forEach(prog => {
        const author = users.find(u => u.id === prog.userId) || { fname: "Church", lname: "Member" };
        const el = document.createElement('div');
        el.className = "card program-card";
        el.innerHTML = `
            <h3>${prog.title}</h3>
            <p style="color: var(--primary); font-weight: bold;">📅 ${prog.date}</p>
            <p>Organized by: ${author.fname} ${author.lname}</p>
            <br>
            <p>${prog.desc}</p>
            <img src="${prog.flyer}" class="post-image">
        `;
        container.appendChild(el);
    });
}

// --- SUGGESTIONS ALGORITHM ---
function renderSuggestedUsers() {
    const container = document.getElementById('suggested-users-list');
    // Suggest users not currently followed and not self
    const suggested = users.filter(u => u.id !== currentUser.id && !currentUser.following.includes(u.id));

    container.innerHTML = suggested.length ? "" : "<p style='font-size:0.9rem;'>No new suggestions.</p>";

    suggested.forEach(u => {
        const el = document.createElement('div');
        el.className = "suggestion-item";
        el.innerHTML = `
            <div>
                <strong style="font-size:0.9rem;">${u.fname} ${u.lname}</strong><br>
                <span style="font-size:0.75rem; color:#718096;">@${u.username}</span>
            </div>
            <button class="btn btn-outline" style="padding: 2px 8px; font-size: 0.8rem;" onclick="toggleFollow(${u.id})">+ Follow</button>
        `;
        container.appendChild(el);
    });
}

// --- PROFILE & FOLLOWERS UI ---
function updateProfileUI() {
    // Re-sync current user record with users array
    currentUser = users.find(u => u.id === currentUser.id) || currentUser;

    document.getElementById('profile-name').innerText = `${currentUser.fname} ${currentUser.lname}`;
    document.getElementById('profile-username').innerText = `@${currentUser.username}`;
    document.getElementById('profile-avatar').innerText = currentUser.fname.charAt(0);
    document.getElementById('profile-followers-count').innerText = currentUser.followers.length;
    document.getElementById('profile-following-count').innerText = currentUser.following.length;

    document.getElementById('sett-fname').value = currentUser.fname;
    document.getElementById('sett-lname').value = currentUser.lname;
}

function renderMyPosts() {
    const container = document.getElementById('my-posts-stream');
    const myPosts = posts.filter(p => p.userId === currentUser.id);
    container.innerHTML = myPosts.length ? "" : "<p>You haven't posted anything yet.</p>";

    myPosts.forEach(post => {
        container.appendChild(createPostCardUI(post));
    });
}

function renderFollowersList() {
    const fersContainer = document.getElementById('followers-list-container');
    const fingContainer = document.getElementById('following-list-container');

    const followersUsers = users.filter(u => currentUser.followers.includes(u.id));
    const followingUsers = users.filter(u => currentUser.following.includes(u.id));

    fersContainer.innerHTML = followersUsers.length ? "" : "<p>No followers yet.</p>";
    followersUsers.forEach(u => {
        fersContainer.innerHTML += `<p>👤 <strong>${u.fname} ${u.lname}</strong> (@${u.username})</p>`;
    });

    fingContainer.innerHTML = followingUsers.length ? "" : "<p>Not following anyone yet.</p>";
    followingUsers.forEach(u => {
        fingContainer.innerHTML += `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 5px;">
                <span>👤 <strong>${u.fname} ${u.lname}</strong> (@${u.username})</span>
                <button class="btn btn-outline" style="padding:2px 6px; font-size:0.75rem;" onclick="toggleFollow(${u.id})">Unfollow</button>
            </div>
        `;
    });
}

function handleSettingsUpdate(e) {
    e.preventDefault();
    currentUser.fname = document.getElementById('sett-fname').value;
    currentUser.lname = document.getElementById('sett-lname').value;
    
    const index = users.findIndex(u => u.id === currentUser.id);
    if (index !== -1) users[index] = currentUser;

    saveData();
    updateProfileUI();
    alert("Profile updated successfully!");
}

// Check active session on load
if (currentUser) {
    initApp();
}

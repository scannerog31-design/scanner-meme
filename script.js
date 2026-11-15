const grid = document.getElementById('contentGrid');
const tags = document.querySelectorAll('.tag-btn');
const tkOverlay = document.getElementById('tiktokOverlay');
const tkFeed = document.getElementById('tkFeed');
const commentDrawer = document.getElementById('commentDrawer');
const commentList = document.getElementById('commentList');
const drawerCount = document.getElementById('drawerCount');

let activeSlideIndex = 0;
let mediaComments = {};

tags.forEach(t => {
    t.onclick = () => {
        tags.forEach(b => b.classList.remove('active'));
        t.classList.add('active');
        const type = t.dataset.type;

        document.querySelectorAll('.grid-card').forEach(c => {
            c.style.display = (type === 'all' || c.dataset.cat === type) ? 'flex' : 'none';
        });
    };
});
document.getElementById('findInput').onkeyup = e => {
    const q = e.target.value.toLowerCase();
    document.querySelectorAll('.grid-card').forEach(c => {
        c.style.display = c.dataset.name.includes(q) ? 'flex' : 'none';
    });
};

function triggerShare(title) {
    if (navigator.share) {
        navigator.share({ title: title, url: window.location.href }).catch(() => {});
    } else {
        navigator.clipboard.writeText(window.location.href);
        const toast = document.getElementById('toastMsg');
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2500);
    }
}

grid.onclick = e => {
    const card = e.target.closest('.grid-card');
    if (!card) return;

    const like = e.target.closest('.like-counter');
    if (like) {
        const v = like.querySelector('.val');
        const liked = like.classList.toggle('liked');
        v.textContent = parseInt(v.textContent) + (liked ? 1 : -1);
        return;
    }

    const share = e.target.closest('.share-trigger');
    if (share) {
        triggerShare(card.querySelector('h3').textContent);
        return;
    }

    if (e.target.closest('.open-feed')) {
        const cards = Array.from(document.querySelectorAll('.grid-card')).filter(c => c.style.display !== 'none');
        const clickedIndex = cards.indexOf(card);
        openTikTokFeed(cards, clickedIndex);
    }
};

function openTikTokFeed(cards, startIndex) {
    tkFeed.innerHTML = '';

    cards.forEach((card, idx) => {
        const type = card.dataset.cat;
        const title = card.querySelector('h3').textContent;
        const desc = card.querySelector('p').textContent;
        const likes = card.querySelector('.val').textContent;
        const isLiked = card.querySelector('.like-counter').classList.contains('liked');
        const src = type === 'meme' ? card.querySelector('img').getAttribute('src') : card.querySelector('video').getAttribute('src');

        if (!mediaComments[idx]) {
            mediaComments[idx] = [
                { user: 'Juma_TZ', text: 'Hii kali sana mzee 😂🔥' },
                { user: 'Amina_Official', text: 'Nimecheka mpaka machozi!' }
            ];
        }

        const slide = document.createElement('div');
        slide.className = 'tk-slide';
        slide.dataset.idx = idx;

        const mediaHtml = type === 'meme'
            ? `<img src="${src}" alt="${title}">`
            : `<video src="${src}" loop playsinline onclick="this.paused ? this.play() : this.pause()"></video>`;

        slide.innerHTML = `
            <div class="tk-media-wrap">
                ${mediaHtml}
                <div class="tk-bottom-info">
                    <h3>${title}</h3>
                    <p>${desc}</p>
                </div>
                <div class="tk-side-actions">
                    <button class="tk-btn tk-like ${isLiked ? 'liked' : ''}">
                        <i class="fa-solid fa-heart"></i>
                        <span>${likes}</span>
                    </button>
                    <button class="tk-btn tk-comment">
                        <i class="fa-solid fa-comment-dots"></i>
                        <span class="tk-c-count">${mediaComments[idx].length}</span>
                    </button>
                    <button class="tk-btn tk-share">
                        <i class="fa-solid fa-share"></i>
                        <span>Share</span>
                    </button>
                </div>
            </div>
        `;

        slide.querySelector('.tk-like').onclick = function () {
            const liked = this.classList.toggle('liked');
            const span = this.querySelector('span');
            const newCount = parseInt(span.textContent) + (liked ? 1 : -1);
            span.textContent = newCount;

            const gridLike = card.querySelector('.like-counter');
            gridLike.classList.toggle('liked', liked);
            gridLike.querySelector('.val').textContent = newCount;
        };

        slide.querySelector('.tk-comment').onclick = () => {
            activeSlideIndex = idx;
            renderComments(idx);
            commentDrawer.classList.add('open');
        };
        slide.querySelector('.tk-share').onclick = () => triggerShare(title);

        tkFeed.appendChild(slide);
    });

    tkOverlay.style.display = 'block';
    const targetSlide = tkFeed.children[startIndex];
    if (targetSlide) {
        targetSlide.scrollIntoView({ behavior: 'instant' });
        handleSlidePlayback();
    }
}
function handleSlidePlayback() {
    const slides = document.querySelectorAll('.tk-slide');
    slides.forEach(slide => {
        const rect = slide.getBoundingClientRect();
        const vid = slide.querySelector('video');
        if (vid) {
            if (rect.top >= -50 && rect.top <= 50) {
                vid.muted = false;
                vid.play().catch(() => {});
            } else {
                vid.pause();
                vid.currentTime = 0;
            }
        }
    });
}

tkFeed.addEventListener('scroll', () => {
    clearTimeout(tkFeed.scrollTimer);
    tkFeed.scrollTimer = setTimeout(handleSlidePlayback, 100);
});




document.getElementById('closeTikTok').onclick = () => {
    tkOverlay.style.display = 'none';
    commentDrawer.classList.remove('open');
    tkFeed.querySelectorAll('video').forEach(v => v.pause());
}

function renderComments(idx) {
    const list = mediaComments[idx] || [];
    drawerCount.textContent = list.length;
    commentList.innerHTML = list.map(c => `
        <div class="comment-bubble">
            <strong>@${c.user}</strong>
            <p>${c.text}</p>
        </div>
    `).join('');
}

document.getElementById('closeDrawer').onclick = () => commentDrawer.classList.remove('open');

document.getElementById('commentForm').onsubmit = e => {
    e.preventDefault();
    const input = document.getElementById('commentInput');
    const text = input.value.trim();
    if (!text) return;

    mediaComments[activeSlideIndex].push({ user: 'Charles_OG', text: text });
    renderComments(activeSlideIndex);

    const activeSlide = tkFeed.querySelector(`.tk-slide[data-idx="${activeSlideIndex}"]`);
    if (activeSlide) {
        activeSlide.querySelector('.tk-c-count').textContent = mediaComments[activeSlideIndex].length;
    }

    const gridCard = document.querySelectorAll('.grid-card')[activeSlideIndex];
    if (gridCard) {
        gridCard.querySelector('.c-val').textContent = mediaComments[activeSlideIndex].length;
    }

    input.value = '';
};
let activeAudio = null;
let activeBtn = null;

function toggleAudio(src, element) {
    const icon = element.querySelector('.btn-play i');

    if (activeAudio && activeBtn === element) {
        if (!activeAudio.paused) {
            activeAudio.pause();
            element.classList.remove('playing');
            icon.className = 'fa-solid fa-play';
        } else {
            activeAudio.play();
            element.classList.add('playing');
            icon.className = 'fa-solid fa-pause';
        }
        return;
    }

    if (activeAudio) {
        activeAudio.pause();
        activeAudio.currentTime = 0;
        if (activeBtn) {
            activeBtn.classList.remove('playing');
            activeBtn.querySelector('.btn-play i').className = 'fa-solid fa-play';
        }
    }

    activeAudio = new Audio(src);
    activeBtn = element;
    activeAudio.play();
    element.classList.add('playing');
    icon.className = 'fa-solid fa-pause';

    activeAudio.onended = () => {
        element.classList.remove('playing');
        icon.className = 'fa-solid fa-play';
        activeAudio = null;
        activeBtn = null;
    };
}

const upModal = document.getElementById('uploadModal');
const mType = document.getElementById('mediaType');
const mDesc = document.getElementById('mediaDesc');
const dLabel = document.getElementById('descLabel');

mType.onchange = () => {
    const hide = mType.value === 'audio';
    mDesc.style.display = hide ? 'none' : 'block';
    dLabel.style.display = hide ? 'none' : 'block';
};

document.getElementById('openUploadModal').onclick = () => upModal.style.display = 'flex';
document.getElementById('closeUploadModal').onclick = () => upModal.style.display = 'none';

document.getElementById('addMediaForm').onsubmit = e => {
    e.preventDefault();
    const type = mType.value;
    const title = document.getElementById('mediaTitle').value;
    const desc = mDesc.value;
    const file = document.getElementById('mediaFile').files[0];
    if (!file) return;

    const url = URL.createObjectURL(file);

    if (type === 'audio') {
        const s = document.createElement('div');
        s.className = 'sound-item';
        s.onclick = function () { toggleAudio(url, this); };
        s.innerHTML = `<div><h4>${title}</h4><span>MP3 Clip</span></div><div class="btn-play"><i class="fa-solid fa-play"></i></div>`;
        document.getElementById('soundBoardGrid').prepend(s);
    } else {
        const isImg = type === 'meme';
        const card = document.createElement('div');
        card.className = 'grid-card';
        card.dataset.cat = type;
        card.dataset.name = title.toLowerCase();

        const mediaTag = isImg
            ? `<img src="${url}" alt="${title}">`
            : `<video src="${url}" muted loop onmouseover="this.play()" onmouseout="this.pause()"></video>`;

        card.innerHTML = `
            <div class="media-box open-feed">
                <span class="type-tag">${isImg ? 'Meme' : 'Video'}</span>
                ${mediaTag}
            </div>
            <div class="card-info">
                <h3>${title}</h3>
                <p>${desc}</p>
                <div class="card-actions">
                    <div class="action-group">
                        <span class="like-counter"><i class="fa-solid fa-heart"></i> <span class="val">1</span></span>
                        <span class="comment-trigger open-feed"><i class="fa-solid fa-comment"></i> <span class="c-val">2</span></span>
                        <span class="share-trigger"><i class="fa-solid fa-share"></i></span>
                    </div>
                    <button class="view-btn open-feed"><i class="fa-solid ${isImg ? 'fa-expand' : 'fa-play'}"></i></button>
                </div>
            </div>
        `;
        grid.prepend(card);
    }

    e.target.reset();
    mDesc.style.display = dLabel.style.display = 'block';
    upModal.style.display = 'none';
};

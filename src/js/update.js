// --- Auto Update Checker ---
// Minimal, no external deps. Uses GitHub API + Android built-in download handling.

const GITHUB_OWNER = 'coderdy-git';
const GITHUB_REPO = 'coderdy-attendance-app';

const CURRENT_VERSION = __APP_VERSION__;

let _updateModal = null;
let _updateData = null;

function compareSemver(a, b) {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const na = pa[i] || 0;
    const nb = pb[i] || 0;
    if (na > nb) return 1;
    if (na < nb) return -1;
  }
  return 0;
}

export async function checkForUpdate() {
  // Skip update check in dev mode
  if (import.meta.env.DEV) return null;
  try {
    const res = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`,
      { headers: { Accept: 'application/vnd.github.v3+json' } }
    );
    if (!res.ok) return null;

    const release = await res.json();
    const latestVer = release.tag_name.replace(/^v/i, '');
    if (compareSemver(latestVer, CURRENT_VERSION) <= 0) return null;

    const apkAsset = release.assets
      ? release.assets.find(a => a.name.endsWith('.apk'))
      : null;

    _updateData = {
      version: latestVer,
      url: apkAsset ? apkAsset.browser_download_url : null,
      releaseUrl: release.html_url,
      notes: release.body || '',
    };
    return _updateData;
  } catch (e) {
    console.log('[Update] check failed:', e);
    return null;
  }
}

export function showUpdatePrompt(data) {
  if (_updateModal) return;

  const modal = document.createElement('div');
  modal.id = 'update-modal-overlay';
  modal.innerHTML = `
    <div class="update-modal-box">
      <div class="update-modal-icon">⬇️</div>
      <h4>Update Tersedia</h4>
      <p class="update-modal-sub">CODERDY v${data.version} siap diinstall</p>
      <div class="update-modal-body">
        <div class="update-modal-row">
          <span class="update-label">Versi baru</span>
          <span class="update-value">${data.version}</span>
        </div>
        <div class="update-modal-row">
          <span class="update-label">Versi kamu</span>
          <span class="update-value current">${CURRENT_VERSION}</span>
        </div>
      </div>
      <div class="update-actions">
        <button id="update-skip-btn" class="update-btn update-btn-skip">Nanti</button>
        <button id="update-download-btn" class="update-btn update-btn-primary">
          <span class="update-dl-icon">⬇</span> Download & Install
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  _updateModal = modal;

  document.getElementById('update-skip-btn').onclick = closeUpdatePrompt;
  document.getElementById('update-download-btn').onclick = () => {
    if (data.url) {
      // Trigger APK download via hidden link — Android handles the install prompt
      const a = document.createElement('a');
      a.href = data.url;
      a.download = 'coderdy-app.apk';
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      window.open(data.releaseUrl, '_system');
    }
    closeUpdatePrompt();
  };
}

export function closeUpdatePrompt() {
  _updateModal?.remove();
  _updateModal = null;
}

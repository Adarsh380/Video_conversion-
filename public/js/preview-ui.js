// Minimal vanilla JS for preview UI and conversion

function showVideoModal(src, poster) {
  let modal = document.getElementById('video-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'video-modal';
    modal.style = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:9999;';
    modal.innerHTML = `
      <div style="background:#fff;padding:1.5rem;border-radius:12px;max-width:90vw;max-height:90vh;position:relative;">
        <button id="close-modal" style="position:absolute;top:8px;right:8px;font-size:1.5rem;">&times;</button>
        <video id="modal-video" controls style="max-width:80vw;max-height:70vh;" poster="${poster || ''}">
          <source src="${src}" type="video/mp4">
          Your browser does not support the video tag.
        </video>
        <div id="fallback-link" style="margin-top:1rem;display:none;">
          <a href="${src}" download>Download Video</a>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    document.getElementById('close-modal').onclick = () => modal.remove();
    const video = document.getElementById('modal-video');
    video.onerror = () => {
      document.getElementById('fallback-link').style.display = 'block';
    };
  }
}

window.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.preview-scene-btn').forEach(btn => {
    btn.onclick = () => {
      const sceneId = btn.dataset.sceneId;
      showVideoModal(`/preview/scene/${sceneId}`);
    };
  });
  const previewFinalBtn = document.getElementById('preview-final-btn');
  if (previewFinalBtn) {
    previewFinalBtn.onclick = () => showVideoModal('/preview/final', '/final_thumbnail.jpg');
  }

  // Convert button logic (send output format to backend)
  const convertButton = document.getElementById('convert-button');
  if (convertButton) {
    convertButton.onclick = async function() {
      const outputFormat = document.getElementById('output-format').value;
      // Collect other form data as needed
      const documentType = document.getElementById('document-type').value;
      const fileInput = document.getElementById('document-file');
      const file = fileInput && fileInput.files && fileInput.files[0];

      const formData = new FormData();
      formData.append('outputFormat', outputFormat);
      formData.append('documentType', documentType);
      if (file) formData.append('file', file);

      try {
        const response = await fetch('/api/convert', {
          method: 'POST',
          body: formData
        });
        if (response.ok) {
          alert('Conversion started! You will be notified when it is ready.');
        } else {
          alert('Error starting conversion.');
        }
      } catch (e) {
        alert('Network error starting conversion.');
      }
    };
  }
});
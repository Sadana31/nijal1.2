document.addEventListener('DOMContentLoaded', () => {
  fetch('/sidebar.html')
    .then(res => res.text())
    .then(html => {
      const placeholder = document.getElementById('sidebar-placeholder');
      if (placeholder) {
        placeholder.innerHTML = html;

        // Manually inject the Bootstrap Icons stylesheet
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css';
        document.head.appendChild(link);
      }
    })
    .catch(err => console.error('Sidebar load failed:', err));
});

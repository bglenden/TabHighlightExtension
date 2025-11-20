/**
 * Popup script for Active Tab Highlighter
 * Provides UI for reloading all tabs
 */

document.getElementById('reloadBtn')?.addEventListener('click', async () => {
  const button = document.getElementById('reloadBtn') as HTMLButtonElement;
  const status = document.getElementById('status') as HTMLDivElement;
  
  button.disabled = true;
  button.textContent = 'Reloading...';
  
  try {
    const tabs = await chrome.tabs.query({});
    let reloadedCount = 0;
    
    for (const tab of tabs) {
      if (tab.id && tab.url && 
          !tab.url.startsWith('chrome://') && 
          !tab.url.startsWith('chrome-extension://')) {
        await chrome.tabs.reload(tab.id);
        reloadedCount++;
      }
    }
    
    status.textContent = `✓ Reloaded ${reloadedCount} tabs`;
    status.classList.add('show');
    
    setTimeout(() => {
      button.disabled = false;
      button.textContent = 'Reload All Tabs';
      status.classList.remove('show');
    }, 2000);
    
  } catch (error) {
    status.textContent = `Error: ${error}`;
    status.style.background = '#ffebee';
    status.style.color = '#c62828';
    status.classList.add('show');
    
    button.disabled = false;
    button.textContent = 'Reload All Tabs';
  }
});

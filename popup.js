// DOM元素
const elements = {
  tabList: document.getElementById('tabList'),
  restoreAllBtn: document.getElementById('restoreAllBtn'),
  tabCount: document.getElementById('tabCount'),
};

// 常量
const CONFIG = {
  MAX_TABS: 25,
  MESSAGES: {
    EMPTY: '<div class="empty-message">没有找到最近关闭的标签页</div>',
    RESTORED: '<div class="empty-message">所有标签页已恢复</div>',
  },
};

/**
 * 初始化应用
 */
function init() {
  loadRecentlyClosedTabs();
  elements.restoreAllBtn.addEventListener('click', restoreAllTabs);
}

/**
 * 加载并渲染最近关闭的标签页
 */
function loadRecentlyClosedTabs() {
  chrome.sessions.getRecentlyClosed(
    { maxResults: CONFIG.MAX_TABS },
    (sessions) => {
      const tabs = sessions
        .filter((s) => s.tab)
        .map((s) => ({
          id: s.tab.sessionId,
          title: s.tab.title || '无标题',
          url: s.tab.url,
          closedTime: s.lastModified * 1000,
        }));

      updateTabCount(tabs.length);
      renderTabList(tabs);
    }
  );
}

/**
 * 更新标签计数
 */
function updateTabCount(count) {
  if (elements.tabCount) {
    elements.tabCount.textContent = `${count} 个标签页`;
  }
}

/**
 * 渲染标签页列表
 */
function renderTabList(tabs) {
  if (tabs.length === 0) {
    elements.tabList.innerHTML = CONFIG.MESSAGES.EMPTY;
    return;
  }

  const fragment = document.createDocumentFragment();
  tabs.forEach((tab) => fragment.appendChild(createTabElement(tab)));
  elements.tabList.innerHTML = '';
  elements.tabList.appendChild(fragment);
}

/**
 * 创建标签页元素
 */
function createTabElement(tab) {
  const div = document.createElement('div');
  div.className = 'tab-item';
  div.dataset.sessionId = tab.id;
  div.innerHTML = `
    <img class="favicon" src="${getFaviconURL(tab.url)}" alt="">
    <div class="tab-info">
      <h3 class="tab-title">${escapeHTML(tab.title)}</h3>
      <p class="tab-url">${escapeHTML(tab.url)}</p>
    </div>
    <div class="closed-time">${formatTime(tab.closedTime)}</div>
  `;

  div.addEventListener('click', () => restoreTab(tab.id, div));
  return div;
}

/**
 * 恢复单个标签页
 */
function restoreTab(sessionId, element) {
  // 添加加载状态
  element.style.opacity = '0.5';
  element.style.pointerEvents = 'none';

  chrome.sessions.restore(sessionId, (restored) => {
    if (chrome.runtime.lastError) {
      console.error('恢复失败:', chrome.runtime.lastError);
      // 恢复状态
      element.style.opacity = '1';
      element.style.pointerEvents = 'auto';
      return;
    }

    loadRecentlyClosedTabs();
  });
}

/**
 * 恢复所有标签页
 */
function restoreAllTabs() {
  chrome.sessions.getRecentlyClosed(
    { maxResults: CONFIG.MAX_TABS },
    (sessions) => {
      const tabs = sessions.filter((s) => s.tab);
      if (tabs.length === 0) return;

      elements.restoreAllBtn.disabled = true;

      Promise.all(
        tabs.map(
          (s) =>
            new Promise((resolve) =>
              chrome.sessions.restore(s.tab.sessionId, resolve)
            )
        )
      ).then(() => {
        elements.tabList.innerHTML = CONFIG.MESSAGES.RESTORED;
        elements.restoreAllBtn.disabled = false;
      });
    }
  );
}

/**
 * 转义HTML
 */
function escapeHTML(str) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return str.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * 获取网站图标URL
 */
function getFaviconURL(url) {
  const faviconUrl = new URL(chrome.runtime.getURL('/_favicon/'));
  faviconUrl.searchParams.set('pageUrl', url);
  faviconUrl.searchParams.set('size', '16');
  return faviconUrl.toString();
}

/**
 * 格式化时间
 */
function formatTime(timestamp) {
  const diff = Date.now() - timestamp;
  const units = [
    [86400000, (d) => `${d}天前`],
    [3600000, (h) => `${h}小时前`],
    [60000, (m) => `${m}分钟前`],
  ];

  for (const [unit, format] of units) {
    const value = Math.floor(diff / unit);
    if (value > 0) return format(value);
  }

  return '刚刚';
}

// 启动应用
document.addEventListener('DOMContentLoaded', init);

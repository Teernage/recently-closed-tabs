(() => {
  if (window.top !== window) return; // 只在顶层窗口注入
  const BUTTON_ID = '__rct_toggle_button__';
  if (document.getElementById(BUTTON_ID)) return;

  const btn = document.createElement('img');
  btn.id = BUTTON_ID;
  btn.src = chrome.runtime.getURL('icons/icon48.png');
  btn.alt = '最近关闭的标签页';
  btn.title = '打开最近关闭的标签页';

  // 拖拽相关变量
  let isDragging = false;
  let startX, startY;
  let currentX = window.innerWidth - 88; // 默认右侧
  let currentY = window.innerHeight - 88; // 默认底部

  Object.assign(btn.style, {
    position: 'fixed',
    left: currentX + 'px',
    top: currentY + 'px',
    width: '48px',
    height: '48px',
    borderRadius: '8px',
    boxShadow: '0 6px 20px rgba(0,0,0,0.25)',
    background: '#fff',
    padding: '6px',
    zIndex: '2147483647',
    cursor: 'grab',
    userSelect: 'none',
    transition: 'box-shadow 0.2s',
  });

  // 鼠标按下事件
  btn.addEventListener('mousedown', (e) => {
    e.preventDefault();
    e.stopPropagation();

    isDragging = false;
    startX = e.clientX;
    startY = e.clientY;

    // 更改光标样式
    btn.style.cursor = 'grabbing';
    btn.style.boxShadow = '0 8px 25px rgba(0,0,0,0.35)';

    // 添加移动和释放事件监听器到document
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', stopDrag);
  });

  // 拖拽函数
  function drag(e) {
    e.preventDefault();

    // 计算移动距离
    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;

    // 如果移动距离超过阈值，则认为是拖拽
    if (!isDragging && (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5)) {
      isDragging = true;
    }

    if (isDragging) {
      // 计算新位置
      currentX = e.clientX - 24; // 24是图标宽度的一半
      currentY = e.clientY - 24; // 24是图标高度的一半

      // 边界检查
      currentX = Math.max(0, Math.min(currentX, window.innerWidth - 48));
      currentY = Math.max(0, Math.min(currentY, window.innerHeight - 48));

      // 更新位置
      btn.style.left = currentX + 'px';
      btn.style.top = currentY + 'px';
    }
  }

  // 停止拖拽函数
  function stopDrag(e) {
    e.preventDefault();

    // 恢复光标样式
    btn.style.cursor = 'grab';
    btn.style.boxShadow = '0 6px 20px rgba(0,0,0,0.25)';

    // 清理事件监听器
    document.removeEventListener('mousemove', drag);
    document.removeEventListener('mouseup', stopDrag);
  }

  // 点击事件
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();

    // 只有在非拖拽状态下才触发点击事件
    if (!isDragging) {
      chrome.runtime.sendMessage({ type: 'OPEN_POPUP' });
    }
  });

  // 图标加载失败处理
  btn.addEventListener('error', () => {
    console.warn('Failed to load extension icon, using fallback');
    btn.style.backgroundColor = '#4285f4';
    btn.style.content = '';
    btn.style.display = 'flex';
    btn.style.alignItems = 'center';
    btn.style.justifyContent = 'center';
    btn.textContent = 'T';
    btn.style.color = 'white';
    btn.style.fontWeight = 'bold';
    btn.style.fontSize = '24px';
  });

  document.body.appendChild(btn);
})();

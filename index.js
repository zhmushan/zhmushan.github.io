/**
 * @fileoverview 主逻辑模块 - 侧边导航和 iframe 内容加载
 * @description 处理导航数据加载、渲染和内容切换
 */

import { NAV_DATA_URL } from './shared.js';

/* ============================================
   类型定义
   ============================================ */

/**
 * 导航项数据结构
 * @typedef {Object} NavItem
 * @property {string} title - 导航项显示文本
 * @property {string} uri - 内容资源地址
 */

/**
 * 导航数据 Map
 * @typedef {Record<string, NavItem>} NavData
 */

/**
 * 应用状态
 * @typedef {Object} AppState
 * @property {NavData} navData - 导航数据 Map
 * @property {string|null} activeId - 当前激活的导航 ID
 * @property {string} currentHtml - 当前页面 HTML
 * @property {string} currentTitle - 当前页面标题
 */

/* ============================================
   全局状态
   ============================================ */

/** @type {AppState} */
const state = {
  navData: {},
  activeId: null,
  currentHtml: '',
  currentTitle: ''
};

/* ============================================
   DOM 元素引用
   ============================================ */

/**
 * 获取导航容器元素
 * @returns {HTMLElement}
 */
function getNavContainer() {
  const el = document.getElementById('nav-container');
  if (!el) throw new Error('导航容器元素不存在');
  return el;
}

/**
 * 获取主内容容器元素
 * @returns {HTMLElement}
 */
function getMainContent() {
  const el = document.getElementById('main-content');
  if (!el) throw new Error('主内容容器元素不存在');
  return el;
}

/* ============================================
   导航数据加载
   ============================================ */

/**
 * 从 JSON 文件加载导航数据
 * @returns {Promise<NavData>}
 */
async function loadNavData() {
  const isDev = location.hostname === 'localhost' || location.hostname === '127.0.0.1';

  // 开发环境：尝试加载本地资源
  if (isDev) {
    try {
      const response = await fetch('./nav_data.json');
      if (response.ok) {
        const data = await response.json();
        console.log('使用本地 nav_data.json');
        return data;
      }
    } catch (error) {
      console.warn('本地 nav_data.json 加载失败，尝试远程资源');
    }
  }

  // 生产环境或本地失败：使用远程资源
  try {
    const response = await fetch(NAV_DATA_URL);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const data = await response.json();
    console.log('使用远程 nav_data.json');
    return data;
  } catch (error) {
    console.error('加载导航数据失败:', error);
    return {};
  }
}

/* ============================================
   URL 参数处理
   ============================================ */

/**
 * 获取 URL 中的 id 参数
 * @returns {string|null}
 */
function getIdFromUrl() {
  const params = new URLSearchParams(location.search);
  return params.get('id');
}

/**
 * 更新 URL 中的 id 参数
 * @param {string} id - 导航 ID
 */
function updateUrlId(id) {
  const url = new URL(location.href);
  url.searchParams.set('id', id);
  history.pushState({ id }, '', url.toString());
}

/* ============================================
   导航渲染
   ============================================ */

/**
 * 创建导航项元素
 * @param {string} id - 导航 ID
 * @param {NavItem} item - 导航项数据
 * @returns {HTMLElement}
 */
function createNavItemElement(id, item) {
  const navItem = document.createElement('a');
  navItem.className = 'nav-item';
  navItem.href = `?id=${id}`;
  navItem.setAttribute('role', 'menuitem');
  navItem.setAttribute('tabindex', '0');
  navItem.setAttribute('data-id', id);

  // 图标占位符
  const icon = document.createElement('span');
  icon.className = 'nav-item__icon';
  icon.textContent = '📄';

  // 文本
  const text = document.createElement('span');
  text.className = 'nav-item__text';
  text.textContent = item.title;

  navItem.appendChild(icon);
  navItem.appendChild(text);

  return navItem;
}

/**
 * 渲染导航列表
 * @param {NavData} navData - 导航数据 Map
 */
function renderNav(navData) {
  const container = getNavContainer();
  container.innerHTML = '';

  Object.entries(navData).forEach(([id, item]) => {
    const navItem = createNavItemElement(id, item);
    navItem.addEventListener('click', (e) => {
      e.preventDefault();
      handleNavClick(id);
    });
    navItem.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleNavClick(id);
      }
    });
    container.appendChild(navItem);
  });
}

/**
 * 更新导航项激活状态
 * @param {string} activeId - 激活的 ID
 */
function updateNavActiveState(activeId) {
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach((item) => {
    const id = item.getAttribute('data-id');
    if (id === activeId) {
      item.classList.add('nav-item--active');
      item.setAttribute('aria-current', 'page');
    } else {
      item.classList.remove('nav-item--active');
      item.removeAttribute('aria-current');
    }
  });
}

/* ============================================
   iframe 内容加载
   ============================================ */

/**
 * 解析 URI
 * @param {string} uri - 资源 URI
 * @returns {string}
 */
function resolveUri(uri) {
  if (uri.startsWith('http://') || uri.startsWith('https://')) {
    return uri;
  }
  return new URL(uri, window.location.href).href;
}

/**
 * 根据 ID 加载内容
 * @param {string} id - 导航 ID
 */
async function loadContentById(id) {
  const item = state.navData[id];
  if (!item) {
    console.error('找不到导航项:', id);
    return;
  }

  const mainContent = getMainContent();
  const url = resolveUri(item.uri);

  // 创建或获取 iframe
  let iframe = mainContent.querySelector('iframe');
  if (!iframe) {
    iframe = document.createElement('iframe');
    iframe.className = 'content-frame';
    mainContent.appendChild(iframe);
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const html = await response.text();
    iframe.srcdoc = html;

    // 保存当前内容用于下载
    state.currentHtml = html;
    state.currentTitle = `${id}.html`;

  } catch (error) {
    console.error('加载内容失败:', error);
    iframe.srcdoc = `<body style="font-family: sans-serif; padding: 2rem; color: #666;">
      <p>⚠️ 加载失败: ${error instanceof Error ? error.message : '未知错误'}</p>
    </body>`;
    state.currentHtml = '';
    state.currentTitle = '';
  }

  // 更新状态和 URL
  state.activeId = id;
  updateNavActiveState(id);
  updateUrlId(id);
}

/* ============================================
   事件处理
   ============================================ */

/**
 * 处理导航点击事件
 * @param {string} id - 目标 ID
 */
function handleNavClick(id) {
  if (id === state.activeId) {
    return;
  }
  loadContentById(id);
}

/* ============================================
   初始化
   ============================================ */

/**
 * 初始化应用
 */
async function init() {
  try {
    // 加载导航数据
    const navData = await loadNavData();
    state.navData = navData;

    // 渲染导航
    renderNav(navData);

    // 获取导航 ID 列表
    const ids = Object.keys(navData);
    if (ids.length === 0) return;

    // 从 URL 获取 id，或使用第一个
    const urlId = getIdFromUrl();
    const initialId = (urlId && navData[urlId]) ? urlId : ids[0];

    // 加载初始内容
    loadContentById(initialId);

    // 绑定下载按钮事件
    const downloadBtn = document.getElementById('download-btn');
    if (downloadBtn) {
      downloadBtn.addEventListener('click', handleDownload);
    }

    // 绑定移动端菜单事件
    setupMobileMenu();

    // 监听浏览器前进/后退
    window.addEventListener('popstate', (e) => {
      const id = e.state?.id || getIdFromUrl();
      if (id && state.navData[id]) {
        loadContentById(id);
      }
    });

    console.log('应用初始化完成');
  } catch (error) {
    console.error('应用初始化失败:', error);
  }
}

/**
 * 设置移动端菜单
 */
function setupMobileMenu() {
  const menuBtn = document.getElementById('menu-btn');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');

  if (!menuBtn || !sidebar || !overlay) return;

  menuBtn.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    overlay.classList.toggle('active');
  });

  overlay.addEventListener('click', () => {
    sidebar.classList.remove('open');
    overlay.classList.remove('active');
  });

  const navContainer = document.getElementById('nav-container');
  if (navContainer) {
    navContainer.addEventListener('click', () => {
      sidebar.classList.remove('open');
      overlay.classList.remove('active');
    });
  }
}

/**
 * 处理下载按钮点击
 */
async function handleDownload() {
  if (!state.currentHtml) {
    alert('没有可下载的内容');
    return;
  }

  const blob = new Blob([state.currentHtml], { type: 'text/html' });
  const fileName = state.currentTitle || 'page.html';

  try {
    if ('showSaveFilePicker' in window) {
      const handle = await window.showSaveFilePicker({
        suggestedName: fileName,
        types: [{
          description: 'HTML 文件',
          accept: { 'text/html': ['.html'] }
        }]
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
    } else {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(url);
    }
  } catch (error) {
    if (error.name !== 'AbortError') {
      console.error('下载失败:', error);
    }
  }
}

// 启动应用
init();

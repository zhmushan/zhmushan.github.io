#!/usr/bin/env node

/**
 * @fileoverview 项目启动脚本
 * @description 同步远程资源并启动本地开发服务器
 * 
 * 功能：
 * 1. 资源同步：从远程同步 nav_data.json 和 pages 目录内容
 * 2. 本地调试：启动文件服务器，优先使用本地资源
 * 
 * 使用方法：
 *   node dev.mjs              # 同步资源并启动服务器
 *   node dev.mjs --sync-only  # 仅同步资源
 *   node dev.mjs --serve-only # 仅启动服务器（使用已有资源）
 */

import { existsSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join, basename } from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import { NAV_DATA_URL } from './shared.js';

/**
 * 本地文件路径
 */
const PATHS = {
  navData: join(__dirname, 'nav_data.json'),
  pages: join(__dirname, 'pages')
};

/* ============================================
   工具函数
   ============================================ */

/**
 * 控制台彩色输出
 * @param {string} message - 消息
 * @param {'info' | 'success' | 'warn' | 'error'} type - 类型
 */
function log(message, type = 'info') {
  const colors = {
    info: '\x1b[36m',    // cyan
    success: '\x1b[32m', // green
    warn: '\x1b[33m',    // yellow
    error: '\x1b[31m'    // red
  };
  const reset = '\x1b[0m';
  const prefix = {
    info: 'ℹ',
    success: '✔',
    warn: '⚠',
    error: '✖'
  };
  console.log(`${colors[type]}${prefix[type]} ${message}${reset}`);
}

/**
 * 从 URL 获取文本内容
 * @param {string} url - 目标 URL
 * @returns {Promise<string>}
 */
async function fetchText(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  return response.text();
}

/* ============================================
   资源同步
   ============================================ */

/**
 * @typedef {Object} NavItem
 * @property {string} title - 导航项标题
 * @property {string} uri - 资源 URI
 */

/**
 * 同步远程资源到本地
 * @returns {Promise<void>}
 */
async function syncResources() {
  log('开始同步远程资源...');

  // 1. 同步 nav_data.json
  log('同步 nav_data.json...');
  const navDataText = await fetchText(NAV_DATA_URL);
  writeFileSync(PATHS.navData, navDataText, 'utf-8');
  log('nav_data.json 同步完成', 'success');

  /** @type {Record<string, NavItem>} */
  const navData = JSON.parse(navDataText);

  // 2. 清空并重建 pages 目录
  if (existsSync(PATHS.pages)) {
    rmSync(PATHS.pages, { recursive: true });
  }
  mkdirSync(PATHS.pages, { recursive: true });

  // 3. 同步每个页面内容
  log(`同步 ${Object.keys(navData).length} 个页面...`);

  for (const [key, item] of Object.entries(navData)) {
    const filename = `${key}.html`;
    const filePath = join(PATHS.pages, filename);

    try {
      const content = await fetchText(item.uri);
      writeFileSync(filePath, content, 'utf-8');
      log(`  ${filename}`, 'success');
    } catch (error) {
      log(`  ${filename} - 同步失败: ${error instanceof Error ? error.message : '未知错误'}`, 'error');
    }
  }

  log('资源同步完成！', 'success');
}

/* ============================================
   服务器启动
   ============================================ */

/**
 * 启动文件服务器
 * @returns {Promise<void>}
 */
function startServer() {
  return new Promise((resolve, reject) => {
    log('启动本地服务器...');

    // 使用 Deno file_server（如果可用）
    const server = spawn('file_server', ['.'], {
      cwd: __dirname,
      stdio: 'inherit',
      shell: true
    });

    server.on('error', (error) => {
      log(`服务器启动失败: ${error.message}`, 'error');
      log('请确保已安装 Deno 并可使用 file_server 命令', 'warn');
      reject(error);
    });

    server.on('close', (code) => {
      if (code !== 0 && code !== null) {
        log(`服务器退出，代码: ${code}`, 'warn');
      }
      resolve();
    });

    // 处理 Ctrl+C
    process.on('SIGINT', () => {
      log('正在关闭服务器...', 'info');
      server.kill('SIGINT');
    });
  });
}

/* ============================================
   主入口
   ============================================ */

/**
 * 主函数
 */
async function main() {
  const args = process.argv.slice(2);
  const syncOnly = args.includes('--sync');
  const serveOnly = args.includes('--serve');

  console.log('\n🚀 项目启动脚本\n');

  try {
    if (!serveOnly) {
      await syncResources();
      console.log();
    }

    if (!syncOnly) {
      await startServer();
    }
  } catch (error) {
    log(`执行失败: ${error instanceof Error ? error.message : '未知错误'}`, 'error');
    process.exit(1);
  }
}

main();

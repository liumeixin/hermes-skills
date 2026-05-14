/**
 * HTML 截图图片生成器
 * 
 * 用法：
 *   const { generateHTML } = require('./generate.js');
 *   
 *   const html = generateHTML({
 *     style: 'warm',      // 'warm' | 'dark' | 'grid'
 *     title: '文章标题',
 *     content: {
 *       steps: ['第一步', '第二步', '第三步'],        // warm 风格
 *       stats: [{ value: '85%', label: '效率提升' }], // dark 风格
 *       conclusion: '这是结论文字',                    // dark 风格
 *       leftItems: ['优势1', '优势2'],               // grid 风格
 *       rightItems: ['劣势1', '劣势2'],              // grid 风格
 *     },
 *     brand: '娇姐话AI圈',   // 底部品牌，可选
 *     outputPath: '/tmp/img-output/card.html'
 *   });
 */

const fs = require('fs');
const path = require('path');

const TEMPLATES_DIR = __dirname + '/templates';
const DEFAULT_OUTPUT = '/tmp/img-output/card.html';

/**
 * 读取模板文件
 */
function loadTemplate(style) {
  const templatePath = path.join(TEMPLATES_DIR, `${style}.html`);
  if (!fs.existsSync(templatePath)) {
    throw new Error(`模板不存在: ${style}，可用模板：warm, dark, grid`);
  }
  return fs.readFileSync(templatePath, 'utf8');
}

/**
 * 生成米色暖系 HTML（步骤列表）
 */
function buildWarmHTML(template, content) {
  let html = template;
  
  // 标题
  html = html.replace('{{TITLE}}', escapeHTML(content.title || '标题'));
  
  // 步骤列表
  const steps = content.steps || [];
  const stepsHTML = steps.map((step, i) => `
    <li class="step-item">
      <span class="step-num">${i + 1}</span>
      <span class="step-text">${escapeHTML(step)}</span>
    </li>
  `).join('');
  html = html.replace('{{STEPS}}', stepsHTML);
  
  // 品牌
  html = html.replace('{{BRAND}}', escapeHTML(content.brand || '娇姐话AI圈'));
  
  return html;
}

/**
 * 生成深色极简 HTML（数据卡片）
 */
function buildDarkHTML(template, content) {
  let html = template;
  
  // 标题（支持高亮关键词 {{keyword:xxx}}）
  let title = escapeHTML(content.title || '标题');
  title = title.replace(/\{\{keyword:(.+?)\}\}/g, '<span>$1</span>');
  html = html.replace('{{TITLE}}', title);
  
  // 数据网格
  const stats = content.stats || [];
  if (stats.length > 0) {
    const statsHTML = `<div class="stat-grid">
      ${stats.map(stat => `
        <div class="stat-item">
          <div class="stat-value">${escapeHTML(stat.value)}</div>
          <div class="stat-label">${escapeHTML(stat.label || '')}</div>
        </div>
      `).join('')}
    </div>`;
    html = html.replace('{{STATS}}', statsHTML);
  } else {
    html = html.replace('{{STATS}}', '');
  }
  
  // 结论
  const conclusion = content.conclusion || '';
  if (conclusion) {
    html = html.replace('{{CONCLUSION}}', `<div class="conclusion">${escapeHTML(conclusion)}</div>`);
  } else {
    html = html.replace('{{CONCLUSION}}', '');
  }
  
  // 品牌
  html = html.replace('{{BRAND}}', escapeHTML(content.brand || '娇姐话AI圈'));
  
  return html;
}

/**
 * 生成双列对比 HTML
 */
function buildGridHTML(template, content) {
  let html = template;
  
  // 标题（支持红色高亮 {{red:xxx}}）
  let title = escapeHTML(content.title || '对比');
  title = title.replace(/\{\{red:(.+?)\}\}/g, '<span>$1</span>');
  html = html.replace('{{TITLE}}', title);
  
  // 左列（优势）
  const leftItems = content.leftItems || [];
  const leftHTML = leftItems.map(item => `<li class="item">${escapeHTML(item)}</li>`).join('');
  html = html.replace('{{LEFT_ITEMS}}', leftHTML);
  
  // 右列（劣势）
  const rightItems = content.rightItems || [];
  const rightHTML = rightItems.map(item => `<li class="item">${escapeHTML(item)}</li>`).join('');
  html = html.replace('{{RIGHT_ITEMS}}', rightHTML);
  
  // 品牌
  html = html.replace('{{BRAND}}', escapeHTML(content.brand || '娇姐话AI圈'));
  
  return html;
}

/**
 * HTML 特殊字符转义
 */
function escapeHTML(str) {
  if (!str) return '';
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return String(str).replace(/[&<>"']/g, m => map[m]);
}

/**
 * 确保目录存在
 */
function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * 主函数：生成 HTML 图片文件
 * 
 * @param {Object} options - 配置项
 * @param {string} options.style - 模板风格：'warm' | 'dark' | 'grid'
 * @param {string} options.title - 标题
 * @param {Object} options.content - 内容数据
 * @param {string} options.brand - 底部品牌文字
 * @param {string} options.outputPath - 输出文件路径
 * @returns {string} 生成的 HTML 文件路径
 */
function generateHTML(options) {
  const {
    style = 'warm',
    title = '',
    content = {},
    brand,
    outputPath = DEFAULT_OUTPUT
  } = options;
  
  // 加载模板
  const template = loadTemplate(style);
  
  // 根据风格生成 HTML
  let html;
  switch (style) {
    case 'warm':
      html = buildWarmHTML(template, { ...content, title, brand });
      break;
    case 'dark':
      html = buildDarkHTML(template, { ...content, title, brand });
      break;
    case 'grid':
      html = buildGridHTML(template, { ...content, title, brand });
      break;
    default:
      throw new Error(`未知风格: ${style}`);
  }
  
  // 确保输出目录存在
  ensureDir(outputPath);
  
  // 写入文件
  fs.writeFileSync(outputPath, html, 'utf8');
  
  return outputPath;
}

/**
 * 生成带自定义尺寸的 HTML（用于封面图等特殊尺寸）
 * 
 * @param {Object} options
 * @param {number} options.width - 宽度（像素）
 * @param {number} options.height - 高度（像素）
 * @param {string} options.backgroundColor - 背景色
 * @param {string} options.title - 主标题
 * @param {string} options.subtitle - 副标题
 * @param {string} options.outputPath - 输出路径
 */
function generateCover(options) {
  const {
    width = 900,
    height = 383,
    backgroundColor = '#1a1a2e',
    title = '标题',
    subtitle = '',
    brand = '娇姐话AI圈',
    outputPath = DEFAULT_OUTPUT
  } = options;
  
  const html = `<!DOCTYPE html>
<html lang="zh">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=${width}">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: ${width}px;
      height: ${height}px;
      background: ${backgroundColor};
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      font-family: 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
    }
    .title {
      font-size: ${Math.floor(width * 0.06)}px;
      font-weight: 800;
      color: #ffffff;
      text-align: center;
      margin-bottom: ${subtitle ? '20px' : '0'};
    }
    .title span {
      color: #4ade80;
    }
    .subtitle {
      font-size: ${Math.floor(width * 0.028)}px;
      color: #888;
      text-align: center;
      margin-bottom: 30px;
    }
    .brand {
      position: absolute;
      bottom: 20px;
      font-size: 14px;
      color: #555;
    }
  </style>
</head>
<body>
  <h1 class="title">${escapeHTML(title).replace(/\{\{keyword:(.+?)\}\}/g, '<span>$1</span>')}</h1>
  ${subtitle ? `<p class="subtitle">${escapeHTML(subtitle)}</p>` : ''}
  <div class="brand">${escapeHTML(brand)}</div>
</body>
</html>`;
  
  ensureDir(outputPath);
  fs.writeFileSync(outputPath, html, 'utf8');
  return outputPath;
}

/**
 * html-to-image 风格选项（用于可选的 base64 生成）
 * 如果需要 Node 端直接生成图片数据，可配合 html-to-image 使用
 */
const DEFAULT_OPTIONS = {
  quality: 1.0,
  pixelRatio: 2,        // 输出 2x 分辨率，更清晰
  backgroundColor: '#ffffff',
  filter: null,         // (node) => boolean，过滤不需要的元素
  style: {},            // 额外的 CSS 样式
};

/**
 * 验证生成参数
 */
function validateOptions(options) {
  const { style, content } = options;
  
  if (!['warm', 'dark', 'grid'].includes(style)) {
    throw new Error(`style 必须是 warm, dark, grid 之一，当前值: ${style}`);
  }
  
  if (style === 'warm' && (!content.steps || content.steps.length === 0)) {
    throw new Error('warm 风格需要提供 steps 数组');
  }
  
  if (style === 'grid' && (!content.leftItems && !content.rightItems)) {
    throw new Error('grid 风格需要提供 leftItems 或 rightItems');
  }
  
  return true;
}

module.exports = {
  generateHTML,
  generateCover,
  loadTemplate,
  escapeHTML,
  DEFAULT_OPTIONS,
};

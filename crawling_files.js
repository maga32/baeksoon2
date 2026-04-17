const fs = require('fs').promises;
const path = require('path');

const PROBLEM_DIR = './problem';
const FILES_DIR = './files';

// 중복 다운로드 방지 캐시
const processedUrls = new Map(); // originalUrl → newUrl

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function downloadFile(originalUrl) {
  if (processedUrls.has(originalUrl)) {
    return processedUrls.get(originalUrl);
  }

  try {
    console.log(`Downloading: ${originalUrl}`);

    const response = await fetch(originalUrl);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const urlObj = new URL(originalUrl);
    let pathname = urlObj.pathname;
    if (pathname.endsWith('/')) {
      pathname = pathname.slice(0, -1);
    }

    const localRelative = pathname.startsWith('/') ? pathname.slice(1) : pathname;
    const localFullPath = path.join(FILES_DIR, localRelative);

    await ensureDir(path.dirname(localFullPath));
    await fs.writeFile(localFullPath, buffer);

    const newUrl = originalUrl
      .replace('https://upload.acmicpc.net', 'https://baeksoon3.pages.dev')
      .replace(/\/$/, '');

    processedUrls.set(originalUrl, newUrl);
    console.log(`Saved: ${localFullPath} → ${newUrl}`);
    return newUrl;

  } catch (error) {
    console.error(`Download failed: ${originalUrl} - ${error.message}`);
    return null;
  }
}

async function processHtmlFile(htmlPath) {
  try {
    let htmlContent = await fs.readFile(htmlPath, 'utf8');
    let modified = false;

    // https://upload.acmicpc.net으로 시작하는 모든 src= 또는 href= 추출
    const urlRegex = /(src|href)=["']?(https:\/\/upload\.acmicpc\.net[^"'\s>]+)/gi;
    const matches = [...htmlContent.matchAll(urlRegex)];

    // URL을 중복 없이 수집
    const uniqueUrls = [...new Set(matches.map(m => m[2]))];

    // 1. 모든 파일 먼저 다운로드 및 newUrl 생성
    for (const originalUrl of uniqueUrls) {
      await downloadFile(originalUrl);   // 캐시가 있으면 바로 반환
    }

    // 2. HTML 내용에서 실제 교체 수행 (안전한 방식)
    for (const match of matches) {
      const attr = match[1];           // src 또는 href
      const originalUrl = match[2];
      const newUrl = processedUrls.get(originalUrl);

      if (newUrl) {
        // 정규식 이스케이프 처리 후 정확히 교체
        const escapedOriginal = originalUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const searchRegex = new RegExp(`${attr}=["']?${escapedOriginal}["']?`, 'g');
        
        htmlContent = htmlContent.replace(searchRegex, `${attr}="${newUrl}"`);
        modified = true;
      }
    }

    if (modified) {
      await fs.writeFile(htmlPath, htmlContent, 'utf8');
      console.log(`✅ Updated: ${htmlPath}`);
    } else {
      console.log(`No change: ${htmlPath}`);
    }

  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error(`Error processing ${htmlPath}:`, error.message);
    }
  }
}

async function main() {
  await ensureDir(FILES_DIR);

  try {
    const entries = await fs.readdir(PROBLEM_DIR, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const htmlPath = path.join(PROBLEM_DIR, entry.name, 'index.html');
        await processHtmlFile(htmlPath);
      }
    }

    console.log('\n🎉 모든 문제 처리 완료되었습니다.');
  } catch (error) {
    console.error('메인 실행 오류:', error.message);
  }
}

main();
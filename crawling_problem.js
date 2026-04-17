const https = require('https');
const fs = require('fs');
const path = require('path');

const START = 1000;
const END = 35505;
const DELAY = 200;                    // 0.2초 (차단 방지, 필요시 1500~2000으로 조정)
const OUTPUT_DIR = 'problem';         // 최종 폴더 이름

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36';

// 출력 디렉토리 생성
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function fetchProblem(problemId) {
    return new Promise((resolve) => {
        const problemDir = path.join(OUTPUT_DIR, problemId.toString());
        const filePath = path.join(problemDir, 'index.html');

        // 이미 존재하면 스킵
        if (fs.existsSync(filePath)) {
            console.log(`[SKIP] ${problemId} (이미 존재)`);
            return resolve();
        }

        // 문제별 폴더 생성
        if (!fs.existsSync(problemDir)) {
            fs.mkdirSync(problemDir, { recursive: true });
        }

        console.log(`[FETCH] ${problemId} ...`);

        const options = {
            hostname: 'www.acmicpc.net',
            path: `/problem/${problemId}`,
            method: 'GET',
            headers: {
                'User-Agent': USER_AGENT,
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
                'Connection': 'keep-alive'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                if (res.statusCode !== 200) {
                    console.error(`[ERROR] ${problemId} - HTTP ${res.statusCode}`);
                    return resolve();
                }

                // URL 대체
                const replaced = data.replace(
                    /https:\/\/ddo7jzca0m2vt\.cloudfront\.net/g,
                    'https://baeksoon.pages.dev'
                );

                // index.html로 저장
                fs.writeFile(filePath, replaced, 'utf8', (err) => {
                    if (err) {
                        console.error(`[ERROR] ${problemId} 저장 실패:`, err.message);
                    } else {
                        console.log(`[SAVE] ${problemId}/index.html 완료`);
                    }
                    resolve();
                });
            });
        });

        req.on('error', (err) => {
            console.error(`[ERROR] ${problemId} 요청 실패:`, err.message);
            resolve();
        });

        req.end();
    });
}

async function startCrawling() {
    console.log(`Baekjoon 문제 크롤링 시작: ${START} ~ ${END}`);
    console.log(`저장 형식: ${OUTPUT_DIR}/{문제번호}/index.html\n`);

    for (let i = START; i <= END; i++) {
        await fetchProblem(i);
        await new Promise(resolve => setTimeout(resolve, DELAY));
    }

    console.log('\n크롤링이 모두 완료되었습니다.');
    console.log(`총 ${END - START + 1}개 문제 처리 완료.`);
    console.log(`업로드 후 확인 URL 예시: https://baeksoon.pages.dev/problem/1000`);
}

startCrawling().catch(err => {
    console.error('예기치 않은 오류:', err);
});
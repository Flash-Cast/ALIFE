const canvas = document.getElementById('gridCanvas');
const ctx = canvas.getContext('2d');

// 設定
const cellSize = 20; // セルの大きさ(px)
const cols = 40;     // 横のセル数
const rows = 30;     // 縦のセル数
let grid = [];       // 現在の世代
let isRunning = false;
let intervalId = null;

// キャンバスサイズ設定
canvas.width = cols * cellSize;
canvas.height = rows * cellSize;

// 初期化：空のグリッドを作成
function initGrid() {
    grid = new Array(cols).fill(null).map(() => new Array(rows).fill(0));
    drawGrid();
}

// 描画処理
function drawGrid() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let x = 0; x < cols; x++) {
        for (let y = 0; y < rows; y++) {
            // 生きているセルは黒、死んでいるセルは白
            ctx.fillStyle = grid[x][y] ? '#000' : '#fff';
            ctx.fillRect(x * cellSize, y * cellSize, cellSize - 1, cellSize - 1); // -1は枠線用
        }
    }
}

// 世代更新（ライフゲームのルール）
function update() {
    let nextGrid = grid.map(arr => [...arr]); // グリッドをコピー

    for (let x = 0; x < cols; x++) {
        for (let y = 0; y < rows; y++) {
            let neighbors = 0;
            // 周囲8マスの生存数をカウント
            for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                    if (i === 0 && j === 0) continue;
                    const nx = x + i;
                    const ny = y + j;
                    // ループ処理（トーラス構造）
                    // 左端(-1)に行ったら右端(cols-1)へ、右端(cols)に行ったら左端(0)へ
                    let colIndex = (x + i + cols) % cols;
                    let rowIndex = (y + j + rows) % rows;

                    neighbors += grid[colIndex][rowIndex];
                }
            }

            // ルール適用
            // 1. 生きていて、周囲が2か3なら生存 (維持)
            // 2. 死んでいて、周囲がちょうど3なら誕生 (誕生)
            // 3. それ以外は死滅 (過疎・過密)
            if (grid[x][y] === 1) {
                if (neighbors < 2 || neighbors > 3) nextGrid[x][y] = 0;
            } else {
                if (neighbors === 3) nextGrid[x][y] = 1;
            }
        }
    }
    grid = nextGrid;
    drawGrid();
}

// ループ処理
function gameLoop() {
    update();
}

// クリックでセルを反転させる機能
canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / cellSize);
    const y = Math.floor((e.clientY - rect.top) / cellSize);

    // 範囲内かチェック
    if (x >= 0 && x < cols && y >= 0 && y < rows) {
        grid[x][y] = grid[x][y] ? 0 : 1;
        drawGrid();
    }
});

// ボタン操作
document.getElementById('startBtn').addEventListener('click', () => {
    if (!isRunning) {
        isRunning = true;
        intervalId = setInterval(gameLoop, 100); // 100msごとに更新
    }
});

document.getElementById('stopBtn').addEventListener('click', () => {
    isRunning = false;
    clearInterval(intervalId);
});

document.getElementById('randomBtn').addEventListener('click', () => {
    for (let x = 0; x < cols; x++) {
        for (let y = 0; y < rows; y++) {
            grid[x][y] = Math.random() > 0.5 ? 1 : 0; // 生存確率
        }
    }
    drawGrid();
});

document.getElementById('clearBtn').addEventListener('click', () => {
    initGrid();
});

// 開始
initGrid();
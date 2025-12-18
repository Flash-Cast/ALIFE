const canvas = document.getElementById('gridCanvas');
const ctx = canvas.getContext('2d');

// 設定
const cellSize = 10; // セルを少し小さくして広く見せる
const cols = 80;     // 横のセル数を増やす
const rows = 60;     // 縦のセル数を増やす
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
            if (grid[x][y]) {
                ctx.fillStyle = '#000';
                ctx.fillRect(x * cellSize, y * cellSize, cellSize - 1, cellSize - 1);
            }
        }
    }
}

// 世代更新（ループする世界のルール）
function update() {
    let nextGrid = grid.map(arr => [...arr]);

    for (let x = 0; x < cols; x++) {
        for (let y = 0; y < rows; y++) {
            let neighbors = 0;

            // 周囲8マスの生存数をカウント（ループ処理対応）
            for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                    if (i === 0 && j === 0) continue;

                    // 端っこに来たら反対側を見る計算
                    const nx = (x + i + cols) % cols;
                    const ny = (y + j + rows) % rows;

                    neighbors += grid[nx][ny];
                }
            }

            // ライフゲームのルール
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

function gameLoop() {
    update();
}

// クリック操作
canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / cellSize);
    const y = Math.floor((e.clientY - rect.top) / cellSize);
    if (x >= 0 && x < cols && y >= 0 && y < rows) {
        grid[x][y] = grid[x][y] ? 0 : 1;
        drawGrid();
    }
});

// ボタン操作
document.getElementById('startBtn').addEventListener('click', () => {
    if (!isRunning) {
        isRunning = true;
        intervalId = setInterval(gameLoop, 50); // 少し高速化
    }
});

document.getElementById('stopBtn').addEventListener('click', () => {
    isRunning = false;
    clearInterval(intervalId);
});

document.getElementById('randomBtn').addEventListener('click', () => {
    for (let x = 0; x < cols; x++) {
        for (let y = 0; y < rows; y++) {
            grid[x][y] = Math.random() > 0.85 ? 1 : 0; // 密度調整
        }
    }
    drawGrid();
});

document.getElementById('clearBtn').addEventListener('click', initGrid);

function addGliderGun() {

    // オフセット（配置位置）
    const ox = 5;
    const oy = 5;

    const gun = [
        [0, 4], [0, 5], [1, 4], [1, 5],
        [10, 4], [10, 5], [10, 6],
        [11, 3], [11, 7],
        [12, 2], [12, 8],
        [13, 2], [13, 8],
        [14, 5],
        [15, 3], [15, 7],
        [16, 4], [16, 5], [16, 6],
        [17, 5],
        [20, 2], [20, 3], [20, 4],
        [21, 2], [21, 3], [21, 4],
        [22, 1], [22, 5],
        [24, 0], [24, 1], [24, 5], [24, 6],
        [34, 2], [34, 3], [35, 2], [35, 3]
    ];

    gun.forEach(([dx, dy]) => {
        if (ox + dx < cols && oy + dy < rows) {
            grid[ox + dx][oy + dy] = 1;
        }
    });
    drawGrid();
}

document.getElementById('gliderGunBtn').addEventListener('click', addGliderGun);

// 開始
initGrid();
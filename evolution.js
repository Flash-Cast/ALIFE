const canvas = document.getElementById('evoCanvas');
const ctx = canvas.getContext('2d');
const genDisplay = document.getElementById('genCount');
const stepDisplay = document.getElementById('stepCount');

// 設定
const width = 800;
const height = 600;
canvas.width = width;
canvas.height = height;

const populationSize = 50;  // ロケットの数
const lifespan = 400;       // 1世代の長さ（フレーム数）
let count = 0;              // 現在のフレーム
let generation = 1;         // 世代数

// ターゲット（目標地点）
const target = { x: width / 2, y: 50, r: 20 };
// 障害物
const obstacle = { x: width / 2 - 100, y: 300, w: 200, h: 20 };

// ベクトル計算用の簡易クラス
class Vector {
    constructor(x, y) { this.x = x; this.y = y; }
    add(v) { this.x += v.x; this.y += v.y; }
    mult(n) { this.x *= n; this.y *= n; }
    static random2D() {
        const angle = Math.random() * Math.PI * 2;
        return new Vector(Math.cos(angle), Math.sin(angle));
    }
}

// 遺伝子クラス：ロケットの動き方の設計図
class DNA {
    constructor(genes) {
        if (genes) {
            this.genes = genes;
        } else {
            // 新規作成時はランダムなベクトルを生成
            this.genes = [];
            for (let i = 0; i < lifespan; i++) {
                this.genes[i] = Vector.random2D();
                this.genes[i].mult(0.2); // 最大力を制限
            }
        }
    }

    // 交叉（交配）：パートナーの遺伝子と混ぜる
    crossover(partner) {
        let newGenes = [];
        let mid = Math.floor(Math.random() * this.genes.length);
        for (let i = 0; i < this.genes.length; i++) {
            if (i > mid) newGenes[i] = this.genes[i];
            else newGenes[i] = partner.genes[i];
        }
        return new DNA(newGenes);
    }

    // 突然変異：たまに遺伝子をランダムに書き換える
    mutation() {
        for (let i = 0; i < this.genes.length; i++) {
            if (Math.random() < 0.01) { // 1%の確率
                this.genes[i] = Vector.random2D();
                this.genes[i].mult(0.2);
            }
        }
    }
}

// ロケットクラス
class Rocket {
    constructor(dna) {
        this.pos = new Vector(width / 2, height - 20);
        this.vel = new Vector(0, 0);
        this.acc = new Vector(0, 0);
        this.dna = dna || new DNA();
        this.fitness = 0;
        this.completed = false;
        this.crashed = false;
    }

    applyForce(force) {
        this.acc.add(force);
    }

    update() {
        // 目標に到達したら止まる
        const d = Math.hypot(this.pos.x - target.x, this.pos.y - target.y);
        if (d < target.r) {
            this.completed = true;
            this.pos.x = target.x; // 見た目のために位置を固定
            this.pos.y = target.y;
        }

        // 障害物に当たったら止まる
        if (this.pos.x > obstacle.x && this.pos.x < obstacle.x + obstacle.w &&
            this.pos.y > obstacle.y && this.pos.y < obstacle.y + obstacle.h) {
            this.crashed = true;
        }
        // 壁に当たったら止まる
        if (this.pos.x < 0 || this.pos.x > width || this.pos.y < 0 || this.pos.y > height) {
            this.crashed = true;
        }

        if (!this.completed && !this.crashed) {
            this.applyForce(this.dna.genes[count]);
            this.vel.add(this.acc);
            this.pos.add(this.vel);
            this.acc.mult(0); // 加速度リセット
        }
    }

    show() {
        ctx.save();
        ctx.translate(this.pos.x, this.pos.y);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        if (this.completed) ctx.fillStyle = 'green';
        if (this.crashed) ctx.fillStyle = 'red';

        ctx.fillRect(-2, -2, 5, 5); // 小さな四角として描画
        ctx.restore();
    }

    // 評価関数：目標に近いほど高得点
    calcFitness() {
        const d = Math.hypot(this.pos.x - target.x, this.pos.y - target.y);
        // 距離が近いほどフィットネスを高くする（1/d）
        this.fitness = 1 / (d + 1);
        if (this.completed) this.fitness *= 10; // ゴールしたらボーナス
        if (this.crashed) this.fitness /= 10;   // クラッシュしたらペナルティ
    }
}

// 集団クラス
class Population {
    constructor() {
        this.rockets = [];
        this.matingPool = [];
        for (let i = 0; i < populationSize; i++) {
            this.rockets[i] = new Rocket();
        }
    }

    run() {
        for (let i = 0; i < populationSize; i++) {
            this.rockets[i].update();
            this.rockets[i].show();
        }
    }

    evaluate() {
        let maxFit = 0;
        // 各ロケットの評価を計算
        for (let i = 0; i < populationSize; i++) {
            this.rockets[i].calcFitness();
            if (this.rockets[i].fitness > maxFit) {
                maxFit = this.rockets[i].fitness;
            }
        }

        // 評価に基づいて交配プールを作成（成績が良いほどプールに多く入る）
        this.matingPool = [];
        for (let i = 0; i < populationSize; i++) {
            // 最大値を基準に0〜1に正規化
            const n = this.rockets[i].fitness / maxFit;
            const nTimes = Math.floor(n * 100);
            for (let j = 0; j < nTimes; j++) {
                this.matingPool.push(this.rockets[i]);
            }
        }
    }

    selection() {
        let newRockets = [];
        for (let i = 0; i < populationSize; i++) {
            // プールから親を2つランダムに選ぶ
            const parentA = this.matingPool[Math.floor(Math.random() * this.matingPool.length)].dna;
            const parentB = this.matingPool[Math.floor(Math.random() * this.matingPool.length)].dna;

            // 子供を作る（交叉）
            const childDNA = parentA.crossover(parentB);
            // 突然変異させる
            childDNA.mutation();

            newRockets[i] = new Rocket(childDNA);
        }
        this.rockets = newRockets;
    }
}

// メイン処理
let population = new Population();

function draw() {
    ctx.clearRect(0, 0, width, height);

    // ターゲット描画
    ctx.beginPath();
    ctx.arc(target.x, target.y, target.r, 0, Math.PI * 2);
    ctx.fillStyle = 'blue';
    ctx.fill();

    // 障害物描画
    ctx.fillStyle = 'gray';
    ctx.fillRect(obstacle.x, obstacle.y, obstacle.w, obstacle.h);

    // 集団の更新と描画
    population.run();

    // カウンター表示
    count++;
    stepDisplay.textContent = count;
    genDisplay.textContent = generation;

    if (count === lifespan) {
        // 世代交代
        population.evaluate();
        population.selection();
        generation++;
        count = 0;
    }

    requestAnimationFrame(draw);
}

draw();
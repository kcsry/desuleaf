import * as Phaser from "phaser";
import desukun1 from "./img/desukun1.png";
import desukun2 from "./img/desukun2.png";
import grass from "./img/grass1.png";
import puff from "./img/puff.png";
import leaf1 from "./img/leaf.png";
import leaf2 from "./img/leaf2.png";
import leaf3 from "./img/leaf3.png";
import leaf4 from "./img/leaf4.png";
import desumask from "./desumask";
import gothicImg from "./img/gothic_0.png";
import gothicCfg from "./img/gothic.xml?url";

const WIDTH = 600;
const HEIGHT = 400;
const MAX_BLOW_DIST = 50;
const MAX_BLOW_DIST_SQR = MAX_BLOW_DIST * MAX_BLOW_DIST;
const FORCE_MUL = 50;
const VEL_MUL = 0.5;

function choice<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function rand(a: number, b: number): number {
  return Math.random() * (b - a) + a;
}

class GameScene extends Phaser.Scene {
  private desukun: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody = null as any;
  private particles: Phaser.GameObjects.Particles.ParticleEmitterManager = null as any;
  private leaves: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody[] = [];
  private emitter: Phaser.GameObjects.Particles.ParticleEmitter = null as any;
  private scoreText: Phaser.GameObjects.BitmapText = null as any;
  constructor() {
    super({ key: "GameScene" });
  }

  preload(): void {
    this.load.image("desukun1", desukun1);
    this.load.image("desukun2", desukun2);
    this.load.image("grass", grass);
    this.load.image("puff", puff);
    this.load.image("leaf1", leaf1);
    this.load.image("leaf2", leaf2);
    this.load.image("leaf3", leaf3);
    this.load.image("leaf4", leaf4);
    this.load.bitmapFont("gothic", gothicImg, gothicCfg);
  }

  create(): void {
    this.add.tileSprite(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, "grass");

    const scale = 260;
    const leafSpriteNames = ["leaf1", "leaf2", "leaf3", "leaf4"];
    for (let i = 0; i < 700; i++) {
      const [fx, fy] = choice(desumask);
      const x = 160 + fx * scale + Math.random() * 3;
      const y = 15 + fy * scale + Math.random() * 3;
      const spr = this.physics.add.sprite(x, y, choice(leafSpriteNames));
      spr.flipX = Math.random() < 0.5;
      spr.flipY = Math.random() < 0.5;
      spr.body.setDrag(150, 150);
      spr.body.setAngularDrag(500);
      // spr.body.setFriction(0.3, 0.3);
      this.leaves.push(spr);
    }

    this.desukun = this.physics.add.sprite(55, 55, "desukun1");
    this.desukun.setCollideWorldBounds(true);

    this.particles = this.add.particles("puff");

    this.emitter = this.particles.createEmitter({
      speed: 60,
      scale: { start: 0.3, end: 0 },
      alpha: { start: 0.3, end: 0 },
      blendMode: "ADD",
      on: false,
      frequency: 70,
    });

    this.emitter.startFollow(this.desukun);

    this.scoreText = this.add.bitmapText(5, 5, "gothic", "hello");
    this.scoreText.blendMode = "ADD";
  }

  update(): void {
    const desukun = this.desukun;
    // TODO: touch too, not just mouse?
    const ptr = this.input.mousePointer;
    let blows = 0;
    desukun.setTexture(
      desukun.body.velocity.length() > 5
        ? ["desukun1", "desukun2"][Math.floor(this.game.getTime() / 100) % 2]
        : "desukun1"
    );
    if (ptr.isDown && !desukun.body.hitTest(ptr.x, ptr.y)) {
      desukun.flipX = desukun.body.velocity.x > 0;
      this.emitter.followOffset.set(-60 * (desukun.flipX ? -1 : 1), 0);
      this.physics.moveToObject(desukun, ptr, 180);
      this.leaves.forEach((l) => {
        const rawDistanceSqr = Phaser.Math.Distance.BetweenPointsSquared(
          desukun,
          l
        );
        if (rawDistanceSqr > MAX_BLOW_DIST_SQR) return;
        const power = Math.sqrt(rawDistanceSqr) / MAX_BLOW_DIST;
        if (power < 0.5) return;
        const angle = Math.atan2(l.y - desukun.y, l.x - desukun.x);

        const x =
          Math.cos(angle) * FORCE_MUL * power +
          desukun.body.velocity.x * VEL_MUL;
        const y =
          Math.sin(angle) * FORCE_MUL * power +
          desukun.body.velocity.y * VEL_MUL;

        const blowForceMul = 0.11;
        l.body.velocity.add({
          x: x * rand(0.2, 0.5) * blowForceMul,
          y: y * rand(0.2, 0.5) * blowForceMul,
        });
        l.body.angularVelocity += 15 * Math.cos(angle);
        blows++;
      });
    } else {
      const vel = desukun.body.velocity.scale(0.9);
      desukun.setVelocity(vel.x, vel.y);
    }
    const rawScore =
      this.leaves.reduce((sc, l) => {
        if (l.x < 0 || l.x > WIDTH || l.y < 0 || l.y > HEIGHT) {
          return sc + 1;
        }
        return sc;
      }, 0) / this.leaves.length;
    const score = Math.round(rawScore * 100);
    this.scoreText.setText(`Score: ${score}%`);

    this.emitter.on = blows > 10;
  }
}

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  pixelArt: true,
  width: WIDTH,
  height: HEIGHT,
  scale: {
    mode: Phaser.Scale.FIT,
  },
  physics: {
    default: "arcade",
    arcade: {
      // debug: true,
    },
  },
  scene: [GameScene],
};

window.addEventListener("load", () => {
  const game = new Phaser.Game(config);
});

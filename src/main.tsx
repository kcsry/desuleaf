import * as Phaser from "phaser";
import desukun from "./img/desukun.png";
import grass from "./img/grass1.png";
import puff from "./img/puff.png";
import leaf1 from "./img/leaf.png";
import leaf2 from "./img/leaf2.png";
import leaf3 from "./img/leaf3.png";
import desumask from "./desumask";

const WIDTH = 400;
const HEIGHT = 300;
const MAX_BLOW_DIST = 100;

function choice<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

class GameScene extends Phaser.Scene {
  private desukun: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody = null as any;
  private particles: Phaser.GameObjects.Particles.ParticleEmitterManager = null as any;
  private leaves: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody[] = [];
  private emitter: Phaser.GameObjects.Particles.ParticleEmitter = null as any;
  constructor() {
    super({ key: "GameScene" });
  }

  preload(): void {
    this.load.image("desukun", desukun);
    this.load.image("grass", grass);
    this.load.image("puff", puff);
    this.load.image("leaf1", leaf1);
    this.load.image("leaf2", leaf2);
    this.load.image("leaf3", leaf3);
  }

  create(): void {
    this.add.tileSprite(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, "grass");

    const scale = 200;
    const leafSpriteNames = ["leaf1", "leaf2", "leaf3"];
    for (let i = 0; i < 700; i++) {
      const [fx, fy] = choice(desumask);
      const x = 90 + fx * scale;
      const y = 15 + fy * scale;
      const spr = this.physics.add.sprite(x, y, choice(leafSpriteNames));
      spr.flipX = Math.random() < 0.5;
      spr.flipY = Math.random() < 0.5;
      spr.body.setDrag(50, 50);
      // spr.body.setFriction(0.3, 0.3);
      this.leaves.push(spr);
    }

    this.desukun = this.physics.add.sprite(55, 55, "desukun");
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
  }

  update(): void {
    const desukun = this.desukun;
    // TODO: touch too, not just mouse?
    const ptr = this.input.mousePointer;
    let blows = false;
    if (ptr.isDown && !desukun.body.hitTest(ptr.x, ptr.y)) {
      this.physics.moveToObject(desukun, ptr, 140);
      this.leaves.forEach((l) => {
        const rawDistance = Phaser.Math.Distance.BetweenPoints(desukun, l);
        if (rawDistance > MAX_BLOW_DIST) return;
        const power = rawDistance / MAX_BLOW_DIST;
        const force = 50 * power;
        if (force < 0.1) return;
        const angle = Math.atan2(l.y - desukun.y, l.x - desukun.x);

        l.body.velocity.setToPolar(angle, force);
        l.body.setMaxVelocity(250, 250);
        blows = true;
      });
    } else {
      const vel = desukun.body.velocity.scale(0.9);
      desukun.setVelocity(vel.x, vel.y);
    }
    this.emitter.on = blows;
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

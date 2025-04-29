declare module "p5" {
  class P5 {
    setup: () => void;
    draw: () => void;
    createCanvas: (width: number, height: number) => any;
    remove: () => void;
    background: (color: number | string) => void;
    noFill: () => void;
    stroke: (color: string) => void;
    strokeWeight: (weight: number) => void;
    noLoop: () => void;
    beginShape: () => void;
    endShape: () => void;
    vertex: (x: number, y: number) => void;

    constructor(sketch: (p: P5) => void, node?: HTMLElement | null);
  }

  export default P5;
}

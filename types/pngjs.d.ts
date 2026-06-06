declare module "pngjs" {
  export class PNG {
    width: number;
    height: number;
    data: Buffer;
    constructor(opts?: { width?: number; height?: number });
    bitblt(
      dst: PNG,
      sx: number,
      sy: number,
      w: number,
      h: number,
      dx: number,
      dy: number,
    ): PNG;
    static sync: {
      read(buffer: Buffer): PNG;
      write(png: PNG): Buffer;
    };
  }
}

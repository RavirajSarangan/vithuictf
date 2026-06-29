declare module "opentype.js" {
  export interface Font {
    getPath(text: string, x: number, y: number, fontSize: number): {
      toPathData(decimalPlaces?: number): string;
    };
  }

  export function load(url: string): Promise<Font>;
  export function loadSync(url: string): Font;
}

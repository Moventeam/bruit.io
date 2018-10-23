import html2canvas from 'html2canvas';
import { ScreenInfo } from '../models/screen-info.model';

export class ScreenTool {
  static getInfo(): ScreenInfo {
    return {
      height: window.screen.height,
      width: window.screen.width,
      pixelRatio: window.devicePixelRatio
    };
  }

  static getScreenshot(): Promise<string> {
    const div = document.body;
    const options = {
      background: 'white',
      height: div.clientHeight,
      width: div.clientWidth,
      logging: false
    };
    return html2canvas(div, options).then(canvas => canvas.toDataURL());
  }
}

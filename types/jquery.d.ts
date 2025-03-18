import * as jQuery from 'jquery';

declare module 'jquery' {
  interface JQuery<TElement = HTMLElement> {
    textfill(options?: {
      maxFontPixels?: number;
      minFontPixels?: number;
      innerTag?: string;
      widthOnly?: boolean;
      success?: (element: HTMLElement) => void;
      fail?: (element: HTMLElement) => void;
      complete?: (element: HTMLElement) => void;
      explicitWidth?: number | null;
      explicitHeight?: number | null;
      changeLineHeight?: boolean;
      truncateOnFail?: boolean;
      allowOverflow?: boolean;
      debug?: boolean;
    }): JQuery<TElement>;
  }
} 
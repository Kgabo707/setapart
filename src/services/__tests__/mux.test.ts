import { muxAnimatedPreviewUrl, muxStreamUrl, muxThumbnailUrl } from '../mux';

const PLAYBACK_ID = 'qxb01i6T202018GFS02vp9RIe01icTcDCjVzQpmaB00CUisJ4';

describe('mux delivery urls', () => {
  it('builds an HLS manifest url', () => {
    expect(muxStreamUrl(PLAYBACK_ID)).toBe(`https://stream.mux.com/${PLAYBACK_ID}.m3u8`);
  });

  it('builds a thumbnail url with defaults', () => {
    const url = new URL(muxThumbnailUrl(PLAYBACK_ID));

    expect(url.origin + url.pathname).toBe(
      `https://image.mux.com/${PLAYBACK_ID}/thumbnail.jpg`,
    );
    expect(url.searchParams.get('width')).toBe('640');
    expect(url.searchParams.get('time')).toBe('2');
    expect(url.searchParams.get('fit_mode')).toBe('smartcrop');
    expect(url.searchParams.has('height')).toBe(false);
  });

  it('includes height only when it is requested', () => {
    const url = new URL(muxThumbnailUrl(PLAYBACK_ID, { width: 1280, height: 720, time: 9 }));

    expect(url.searchParams.get('width')).toBe('1280');
    expect(url.searchParams.get('height')).toBe('720');
    expect(url.searchParams.get('time')).toBe('9');
  });

  it('builds an animated preview url', () => {
    expect(muxAnimatedPreviewUrl(PLAYBACK_ID, 480)).toBe(
      `https://image.mux.com/${PLAYBACK_ID}/animated.gif?width=480`,
    );
  });
});

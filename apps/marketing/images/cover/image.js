import { defineImage } from '#lib/image.js';

// The cinematic slide wall: the site's OG image and the GitHub README banner.
// Upload the readme render to GitHub, then point the README `<img>` at it.
export default defineImage({
  title: 'Cover',
  outputs: [
    { name: 'og', width: 1200, height: 630, publish: 'apps/web/app/opengraph-image.png' },
    { name: 'readme', width: 1280, height: 640 },
  ],
});

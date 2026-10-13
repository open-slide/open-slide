export async function loadGoogleFont(family: string, weight: number, italic = false) {
  const ital = italic ? 'ital,' : '';
  const axis = italic ? `${ital}wght@1,${weight}` : `wght@${weight}`;
  const css = await fetch(
    `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, '+')}:${axis}&display=swap`,
    { headers: { 'User-Agent': 'Mozilla/5.0 (Open-Slide OG)' } },
  ).then((r) => r.text());
  const url = css.match(/src:\s*url\((https:[^)]+)\)\s*format/)?.[1];
  if (!url) throw new Error(`Could not resolve font: ${family} ${weight}`);
  return fetch(url).then((r) => r.arrayBuffer());
}

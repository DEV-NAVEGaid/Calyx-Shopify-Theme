const article = document.querySelector('.main-blog-post');
const content = article?.querySelector('.article-content .rte');
const toc = article?.querySelector('[data-article-toc]');
const tocList = toc?.querySelector('.article-toc__list');

if (content && toc && tocList) {
  const headings = [...content.querySelectorAll('h2')];

  headings.forEach((heading, index) => {
    if (!heading.id) heading.id = `story-${index + 1}`;

    const item = document.createElement('li');
    const link = document.createElement('a');
    item.className = 'article-toc__item';
    link.href = `#${heading.id}`;
    link.textContent = heading.textContent;
    item.append(link);
    tocList.append(item);
  });

  toc.hidden = headings.length === 0;
}

const copyLink = article?.querySelector('[data-copy-link]');

copyLink?.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(window.location.href);
    copyLink.textContent = copyLink.dataset.copiedLabel;
  } catch {
    // Clipboard access can be blocked; keep the label unchanged.
  }
});

/**
 * FAQ page: lists a topic link per group, filters the answer rows by the
 * search field in the header, and marks the topic of the group in view.
 */

const search = document.querySelector('[data-faq-search]');
const groups = Array.from(document.querySelectorAll('.faq-questions .faq-group'));
const empty = document.querySelector('[data-faq-empty]');
const topicList = document.querySelector('[data-faq-topics]');
const topicTemplate = document.querySelector('[data-faq-topic-template]');

if (topicList && topicTemplate) {
  groups.forEach((group) => {
    const heading = group.querySelector('.faq-group__heading');
    if (!group.id || !heading) return;

    const item = topicTemplate.content.firstElementChild.cloneNode(true);
    const link = item.querySelector('a');
    link.href = '#' + group.id;
    link.querySelector('span').textContent = heading.textContent.trim();
    topicList.append(item);
  });
}

const topics = Array.from(document.querySelectorAll('[data-faq-topic]'));

if (search) {
  search.addEventListener('input', () => {
    const query = search.value.trim().toLowerCase();
    let shown = 0;

    groups.forEach((group) => {
      let groupShown = 0;
      group.querySelectorAll('.accordion-row').forEach((row) => {
        const match = !query || row.textContent.toLowerCase().includes(query);
        row.hidden = !match;
        if (match) {
          groupShown += 1;
          shown += 1;
          if (query) row.open = true;
        }
      });
      group.hidden = groupShown === 0;
    });

    if (empty) empty.hidden = shown > 0;
  });
}

if (groups.length > 0 && topics.length > 0) {
  const byId = new Map(topics.map((link) => [link.getAttribute('href').slice(1), link]));

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        topics.forEach((link) => link.removeAttribute('aria-current'));
        byId.get(entry.target.id)?.setAttribute('aria-current', 'true');
      });
    },
    { rootMargin: '-20% 0px -70% 0px' }
  );

  groups.forEach((group) => observer.observe(group));
}

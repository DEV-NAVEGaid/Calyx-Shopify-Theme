/**
 * FAQ page: lists a topic link per group, filters the groups (heading,
 * answer rows, and text blocks) by the search field in the header, and marks
 * the topic of the group in view.
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

const includes = (element, query) => element.textContent.toLowerCase().includes(query);

if (search) {
  search.addEventListener('input', () => {
    const query = search.value.trim().toLowerCase();
    let shown = 0;

    // A group stays when its heading, one of its rows, or one of its text
    // blocks (outside the rows) matches; a heading match keeps all of it.
    groups.forEach((group) => {
      const heading = group.querySelector('.faq-group__heading');
      const headingMatch = !query || (heading !== null && includes(heading, query));
      let groupShown = false;

      group.querySelectorAll('.accordion-row').forEach((row) => {
        const ownMatch = Boolean(query) && includes(row, query);
        const match = headingMatch || ownMatch;
        row.hidden = !match;
        if (ownMatch) row.open = true;
        if (match) groupShown = true;
      });

      group.querySelectorAll('.text-block').forEach((text) => {
        if (text.closest('.accordion-row')) return;
        const match = headingMatch || includes(text, query);
        text.hidden = !match;
        if (match) groupShown = true;
      });

      // An accordion whose rows are all filtered out would leave an empty frame.
      group.querySelectorAll('.accordion').forEach((accordion) => {
        const rows = accordion.querySelectorAll('.accordion-row');
        accordion.hidden = rows.length > 0 && Array.from(rows).every((row) => row.hidden);
      });

      // An empty search shows every group, even one without searchable content.
      if (!query) groupShown = true;
      group.hidden = !groupShown;
      if (groupShown) shown += 1;
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

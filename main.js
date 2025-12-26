const feeds = [
  { name: "FRAndroid", url: "https://www.frandroid.com/feed" },
  { name: "Numerama", url: "https://www.numerama.com/feed/" },
  { name: "Journal du Geek", url: "https://www.journaldugeek.com/feed/" },
  { name: "Les Numériques", url: "https://www.lesnumeriques.com/rss.xml" }
];

const container = document.getElementById("news");
const notif = document.getElementById("notif");
const btn = document.getElementById("refresh");

const STORAGE_KEY = "lastSeenFR";
const TIMEOUT = 3500;

btn.addEventListener("click", loadNews);

function timeoutPromise(ms) {
  return new Promise((_, reject) =>
    setTimeout(() => reject(new Error("timeout")), ms)
  );
}

async function tryFetch(url) {
  const proxies = [
    u => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
    u => `https://thingproxy.freeboard.io/fetch/${u}`,
    u => u // direct (si autorisé)
  ];

  for (const proxy of proxies) {
    try {
      const res = await Promise.race([
        fetch(proxy(url)),
        timeoutPromise(TIMEOUT)
      ]);

      if (!res.ok) continue;

      const text = await res.text();
      if (text && text.length > 100) return text;
    } catch (_) {}
  }

  throw new Error("all_failed");
}

async function loadNews() {
  container.innerHTML = "⏳ Chargement…";
  notif.style.display = "none";

  const lastSeenRaw = localStorage.getItem(STORAGE_KEY);
  const lastSeen = lastSeenRaw ? new Date(lastSeenRaw) : null;

  let newestDate = lastSeen;
  let hasNew = false;
  let html = "";

  const tasks = feeds.map(feed =>
    loadFeed(feed, lastSeen)
      .then(result => {
        if (!result) return;
        if (result.hasNew) hasNew = true;
        if (result.newestDate && (!newestDate || result.newestDate > newestDate)) {
          newestDate = result.newestDate;
        }
        html += result.html;
      })
      .catch(() => {})
  );

  await Promise.all(tasks);

  if (hasNew) notif.style.display = "block";
  if (newestDate) localStorage.setItem(STORAGE_KEY, newestDate.toISOString());

  container.innerHTML = html || "Aucune source dispo pour le moment.";
}

async function loadFeed(feed, lastSeen) {
  const text = await tryFetch(feed.url);

  const parser = new DOMParser();
  const xml = parser.parseFromString(text, "text/xml");
  const items = xml.querySelectorAll("item");

  let feedHtml = "";
  let feedNewestDate = null;
  let hasNew = false;

  items.forEach((item, index) => {
    if (index >= 2) return;

    const title = item.querySelector("title")?.textContent;
    const pubDateText = item.querySelector("pubDate")?.textContent;
    if (!title || !pubDateText) return;

    const pubDate = new Date(pubDateText);

    if (lastSeen && pubDate > lastSeen) hasNew = true;
    if (!feedNewestDate || pubDate > feedNewestDate) {
      feedNewestDate = pubDate;
    }

    feedHtml += `
      <div class="item">
        <div>${title}</div>
        <div class="source">${feed.name}</div>
      </div>`;
  });

  return {
    html: feedHtml,
    newestDate: feedNewestDate,
    hasNew
  };
}

loadNews();

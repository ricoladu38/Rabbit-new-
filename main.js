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
const TIMEOUT = 3000; // 3 secondes max par source

btn.addEventListener("click", loadNews);

function fetchWithTimeout(url, timeout) {
  return Promise.race([
    fetch(url).then(res => res.text()),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), timeout)
    )
  ]);
}

async function loadNews() {
  container.innerHTML = "⏳ Chargement des actus…";
  notif.style.display = "none";

  const lastSeenRaw = localStorage.getItem(STORAGE_KEY);
  const lastSeen = lastSeenRaw ? new Date(lastSeenRaw) : null;

  let newestDate = lastSeen;
  let hasNew = false;
  let html = "";

  const tasks = feeds.map(feed => loadFeed(feed, lastSeen)
    .then(result => {
      if (!result) return;

      if (result.hasNew) hasNew = true;
      if (result.newestDate && (!newestDate || result.newestDate > newestDate)) {
        newestDate = result.newestDate;
      }

      html += result.html;
    })
    .catch(() => {
      html += `
        <div class="item">
          <div>Source indisponible</div>
          <div class="source">${feed.name}</div>
        </div>`;
    })
  );

  await Promise.all(tasks);

  if (hasNew) notif.style.display = "block";
  if (newestDate) localStorage.setItem(STORAGE_KEY, newestDate.toISOString());

  container.innerHTML = html || "Aucune actu disponible.";
}

async function loadFeed(feed, lastSeen) {
  const api = `https://api.allorigins.win/raw?url=${encodeURIComponent(feed.url)}&t=${Date.now()}`;
  const text = await fetchWithTimeout(api, TIMEOUT);

  const parser = new DOMParser();
  const xml = parser.parseFromString(text, "text/xml");
  const items = xml.querySelectorAll("item");

  let feedHtml = "";
  let feedNewestDate = null;
  let hasNew = false;

  items.forEach((item, index) => {
    if (index >= 2) return; // 🔥 LIMITATION POUR PERF

    const title = item.querySelector("title")?.textContent || "Sans titre";
    const pubDateText = item.querySelector("pubDate")?.textContent;
    const pubDate = pubDateText ? new Date(pubDateText) : null;

    if (pubDate && lastSeen && pubDate > lastSeen) hasNew = true;
    if (pubDate && (!feedNewestDate || pubDate > feedNewestDate)) {
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

const feeds = [
  { name: "FRAndroid", url: "https://www.frandroid.com/feed" },
  { name: "Journal du Geek", url: "https://www.journaldugeek.com/feed/" },
  { name: "Numerama", url: "https://www.numerama.com/feed/" },
  { name: "Gamekult", url: "https://www.gamekult.com/feed" },
  { name: "Les Numériques", url: "https://www.lesnumeriques.com/rss.xml" }
];

const container = document.getElementById("news");
const notif = document.getElementById("notif");
const btn = document.getElementById("refresh");

const STORAGE_KEY = "lastSeenFR";

btn.addEventListener("click", loadNews);

async function loadNews() {
  container.innerHTML = "Chargement…";
  notif.style.display = "none";

  const lastSeenRaw = localStorage.getItem(STORAGE_KEY);
  const lastSeen = lastSeenRaw ? new Date(lastSeenRaw) : null;

  let newestDate = lastSeen;
  let hasNew = false;
  let html = "";

  for (const feed of feeds) {
    try {
      const api = `https://api.allorigins.win/raw?url=${encodeURIComponent(feed.url)}&t=${Date.now()}`;
      const res = await fetch(api);
      const text = await res.text();

      const parser = new DOMParser();
      const xml = parser.parseFromString(text, "text/xml");
      const items = xml.querySelectorAll("item");

      items.forEach((item, index) => {
        if (index >= 3) return;

        const title = item.querySelector("title")?.textContent || "Sans titre";
        const pubDateText = item.querySelector("pubDate")?.textContent;
        const pubDate = pubDateText ? new Date(pubDateText) : null;

        if (pubDate && lastSeen && pubDate > lastSeen) {
          hasNew = true;
        }

        if (pubDate && (!newestDate || pubDate > newestDate)) {
          newestDate = pubDate;
        }

        html += `
          <div class="item">
            <div>${title}</div>
            <div class="source">${feed.name}</div>
          </div>
        `;
      });

    } catch (err) {
      html += `<div class="item">Erreur sur ${feed.name}</div>`;
    }
  }

  if (hasNew) {
    notif.style.display = "block";
  }

  if (newestDate) {
    localStorage.setItem(STORAGE_KEY, newestDate.toISOString());
  }

  container.innerHTML = html || "Aucune actu disponible.";
}

loadNews();

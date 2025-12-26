const feeds = [
  { name: "UploadVR", url: "https://uploadvr.com/feed/" },
  { name: "Road to VR", url: "https://www.roadtovr.com/feed/" },
  { name: "XR Today", url: "https://www.xrtoday.com/feed/" },
  { name: "IGN Gaming", url: "https://feeds.ign.com/ign/games-all" },
  { name: "GameSpot", url: "https://www.gamespot.com/feeds/news/" }
];

const container = document.getElementById("news");
const notif = document.getElementById("notif");
const btn = document.getElementById("refresh");

const STORAGE_KEY = "lastSeenDate";

btn.addEventListener("click", loadNews);

async function loadNews() {
  container.innerHTML = "Chargement…";
  notif.style.display = "none";

  const lastSeen = localStorage.getItem(STORAGE_KEY);
  let newestDate = lastSeen ? new Date(lastSeen) : null;
  let hasNew = false;
  let html = "";

  for (const feed of feeds) {
    try {
      const api = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed.url)}`;
      const res = await fetch(api);
      const data = await res.json();

      data.items.slice(0, 3).forEach(item => {
        const pubDate = new Date(item.pubDate);

        if (lastSeen && pubDate > new Date(lastSeen)) {
          hasNew = true;
        }

        if (!newestDate || pubDate > newestDate) {
          newestDate = pubDate;
        }

        html += `
          <div class="item">
            <div>${item.title}</div>
            <div class="source">${feed.name}</div>
          </div>
        `;
      });
    } catch (e) {
      html += `<div class="item">Erreur source ${feed.name}</div>`;
    }
  }

  if (hasNew) {
    notif.style.display = "block";
  }

  if (newestDate) {
    localStorage.setItem(STORAGE_KEY, newestDate.toISOString());
  }

  container.innerHTML = html || "Aucune actu dispo.";
}

loadNews();

const newsList = document.getElementById("news-list");
const STORAGE_KEY = "cachedNewsFR";
const API_SOURCES = [
  "https://api.allorigins.win/raw?url=https://watchgeneration.fr/réalité-virtuelle",
  "https://api.allorigins.win/raw?url=https://www.zdnet.fr/actualites/jai-vu-lavenir-des-lunettes-connectees-android-xr-et-google-ma-bluffe-486241.htm",
  "https://api.allorigins.win/raw?url=https://www.clubic.com/actualite-579829-une-nouvelle-ere-se-prepare-pour-les-lunettes-connectees-de-meta-et-ca-promet.html"
];

async function fetchNews() {
  let allNews = [];

  for (let url of API_SOURCES) {
    try {
      const raw = await fetch(url);
      const text = await raw.text();
      // parse HTML -> simple regex ou DOM parser
      const items = parseNewsFromHTML(text);
      allNews.push(...items);
    } catch (e) {
      console.error("Fetch failed:", url);
    }
  }

  return allNews;
}

function parseNewsFromHTML(htmlStr) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlStr, "text/html");

  const articles = Array.from(doc.querySelectorAll("h2, h3, .post-title, .article h1"));
  return articles.map(a => ({
    title: a.innerText.trim(),
    link: a.closest("a")?.href || "#",
    date: new Date().toISOString()
  }));
}

function displayNews(news) {
  newsList.innerHTML = "";
  news.forEach(item => {
    const el = document.createElement("div");
    el.className = "news-block";
    el.innerHTML = `
      <a href="${item.link}" target="_blank">
        <h3>${item.title}</h3>
      </a>
    `;
    newsList.appendChild(el);
  });
}

async function main() {
  const freshNews = await fetchNews();
  const oldNews = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");

  if (JSON.stringify(freshNews) !== JSON.stringify(oldNews)) {
    // new content arrived
    localStorage.setItem(STORAGE_KEY, JSON.stringify(freshNews));
    displayNews(freshNews);
    notifyUser("🔔 Nouvelles actus VR disponibles !");
  } else {
    displayNews(oldNews);
  }
}

function notifyUser(message) {
  if ("Notification" in window) {
    Notification.requestPermission().then(perm => {
      if (perm === "granted") new Notification(message);
    });
  }
}

main();
setInterval(main, 1000 * 60 * 10); // refresh every 10 min


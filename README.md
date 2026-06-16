# BigQuery Release Notes Hub

An aesthetic and highly functional Python Flask web application that aggregates, parses, and displays Google Cloud BigQuery release notes from the official XML feed. The app offers real-time client-side search, category-based filtering, light/dark modes, and Twitter/X integration for sharing single or multiple updates.

---

## 🚀 Features

- **Live Data Fetching**: Directly pulls live updates from the official Google Cloud BigQuery Atom feed.
- **Granular Splitting**: Parses combined daily entries into individual, self-contained cards categorized by update type.
- **Category Badge Classification**: Color-coded badges for **Features** 🟢, **Breaking Changes** 🔴, **Issues** 🟡, **Changes** 🔵, and **Announcements** 🟣.
- **Interactive Sharing**:
  - **Quick Tweet**: Composes a tweet with the update details, formatted to fit within Twitter's 280-character limit.
  - **Bulk Twitter Sharing**: A checkbox interface and a floating selection drawer that compiles multiple selected updates into a single summary tweet.
- **Responsive & Modern Design**: A glassmorphism dashboard built with modern fonts (Outfit and Plus Jakarta Sans), smooth micro-animations, and full mobile responsiveness.
- **Persistent Themes**: Choice of Dark Mode (default) or Light Mode, saved automatically via browser local storage.

---

## 🛠️ Tech Stack

- **Backend**: Python 3, Flask, XML ElementTree (standard library), Regex
- **Frontend**: HTML5 (Semantic), Vanilla JavaScript (ES6), Vanilla CSS3 (Custom properties/variables)
- **Icons**: FontAwesome 6

---

## 📦 Directory Structure

```
├── app.py                  # Flask backend server & XML parser
├── templates/
│   └── index.html          # Frontend HTML layout
├── static/
│   ├── css/
│   │   └── style.css       # Core styling & Light/Dark variables
│   └── js/
│       └── main.js         # Frontend controller, state manager, & API caller
├── news.txt                # Cached raw news files
├── summary.txt             # Cached news summary files
├── .gitignore              # Ignored files list
└── README.md               # Project documentation
```

---

## ⚙️ Installation & Setup

### Prerequisites
- Python 3.8 or higher installed on your machine.

### Steps
1. **Clone or download** this repository to your local machine.
2. Open your terminal in the project directory.
3. Install **Flask**:
   ```bash
   pip install Flask
   ```
4. Start the server:
   ```bash
   python app.py
   ```
5. Open your web browser and navigate to:
   ```
   http://127.0.0.1:5000
   ```

---

## 🔄 How the Data Flows

1. **Request**: The client (`main.js`) hits `GET /api/release-notes`.
2. **Fetch**: The server (`app.py`) retrieves the live XML feed from Google Cloud.
3. **Parse & Split**: The server parses the feed and breaks the daily HTML payloads into individual cards using regular expression boundaries (splitting on `<h3>` tags).
4. **Respond**: The server returns a structured JSON list of update objects to the client.
5. **Render**: The client-side renders the list into dynamic cards, ready to search, filter, select, and tweet.

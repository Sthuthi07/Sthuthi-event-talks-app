import re
import urllib.request
import xml.etree.ElementTree as ET
from flask import Flask, jsonify, render_template

app = Flask(__name__)

FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"


def fetch_and_parse_feed():
    try:
        # Fetch the XML feed
        req = urllib.request.Request(
            FEED_URL,
            headers={
                "User-Agent": (
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
                )
            },
        )
        with urllib.request.urlopen(req) as response:
            xml_data = response.read()

        # Parse the XML
        root = ET.fromstring(xml_data)

        # Namespace for Atom feed
        ns = {"atom": "http://www.w3.org/2005/Atom"}

        entries = []
        # Find all <entry> tags
        for entry in root.findall("atom:entry", ns):
            date_title = entry.find("atom:title", ns).text.strip()
            updated = entry.find("atom:updated", ns).text.strip()
            alternate_link_elem = entry.find("atom:link[@rel='alternate']", ns)
            link = (
                alternate_link_elem.attrib.get("href")
                if alternate_link_elem is not None
                else ""
            )

            content_elem = entry.find("atom:content", ns)
            if content_elem is None or content_elem.text is None:
                continue

            content_html = content_elem.text.strip()

            # Split the content HTML into individual release note items by <h3> tag
            # e.g., <h3>Feature</h3>\n<p>...</p>
            pattern = re.compile(r"<h3>(.*?)</h3>(.*?)(?=<h3>|$)", re.DOTALL)
            matches = pattern.findall(content_html)

            # If no matches are found, store the content as a single entry
            if not matches:
                entries.append(
                    {
                        "id": entry.find("atom:id", ns).text,
                        "date": date_title,
                        "updated": updated,
                        "link": link,
                        "type": "General",
                        "description": content_html,
                    }
                )
            else:
                for idx, (note_type, note_desc) in enumerate(matches):
                    # Clean up spaces
                    note_type = note_type.strip()
                    note_desc = note_desc.strip()

                    # Generate a unique ID for each split item
                    entry_id = (
                        f"{entry.find('atom:id', ns).text.strip()}_item_{idx}"
                    )

                    entries.append(
                        {
                            "id": entry_id,
                            "date": date_title,
                            "updated": updated,
                            "link": link,
                            "type": note_type,
                            "description": note_desc,
                        }
                    )

        return entries, None
    except Exception as e:
        return [], str(e)


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/release-notes")
def release_notes():
    notes, error = fetch_and_parse_feed()
    if error:
        return jsonify({"success": False, "error": error}), 500
    return jsonify({"success": True, "notes": notes})


if __name__ == "__main__":
    app.run(debug=True, port=5000)

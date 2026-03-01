# Chinese & English Matching Game

A kid-friendly matching game that connects Chinese words to their English meanings. Click two cards to find matching pairs!

## How to play

1. Choose a word set (Animals, Colors, or Numbers).
2. Click a card to flip it and see the word.
3. Click another card. If it matches the first (Chinese–English pair), both stay face-up. If not, they flip back.
4. Match all pairs to win. Use **Play again** to shuffle and try again.

## Run locally

Open `index.html` in your browser. For the word sets to load, use a local server so that `words.json` can be fetched (some browsers block file:// requests for JSON).

**Option A — Python:**
```bash
# Python 3
python -m http.server 8000
```
Then go to http://localhost:8000

**Option B — Node (npx):**
```bash
npx serve .
```

## Deploy on GitHub Pages

1. Push this folder to a GitHub repository.
2. In the repo: **Settings → Pages**.
3. Under **Source**, choose **Deploy from a branch**.
4. Branch: **main** (or your default), folder: **/ (root)**.
5. Save. Your game will be at `https://<username>.github.io/<repo>/`.

## Add or edit word sets

Edit `words.json`. Each set has an `id`, `name`, and `pairs` array of `[chinese, english]`:

```json
{
  "sets": [
    {
      "id": "animals",
      "name": "Animals",
      "pairs": [["狗", "dog"], ["猫", "cat"]]
    }
  ]
}
```

Add new objects to `sets` to create more themes (e.g. family, food, body).

"""
ET-AI Backend - Live RSS ingestion helpers.

Fetches current energy/geopolitical headlines from public RSS feeds and
returns normalized headline records. Individual feed failures are isolated so
the polling endpoint remains usable during partial source outages.
"""

import logging
from dataclasses import dataclass
from typing import Iterable

import feedparser

logger = logging.getLogger(__name__)

ENERGY_KEYWORDS = {
    "oil",
    "energy",
    "petroleum",
    "gas",
    "lng",
    "opec",
    "brent",
    "crude",
    "hormuz",
    "red sea",
    "suez",
    "refinery",
    "refining",
    "tanker",
    "shipping",
    "sanction",
    "supply",
}


@dataclass(frozen=True)
class FeedSource:
    name: str
    url: str
    keyword_filter: bool = False


FEEDS = (
    FeedSource("OilPrice.com", "https://oilprice.com/rss/main"),
    FeedSource("Rigzone", "https://www.rigzone.com/news/rss/rigzone_latest.aspx"),
    FeedSource("MarketWatch", "http://feeds.marketwatch.com/marketwatch/topstories", True),
)


def _matches_energy_keywords(text: str) -> bool:
    normalized = text.lower()
    return any(keyword in normalized for keyword in ENERGY_KEYWORDS)


def fetch_live_headlines(limit_per_feed: int = 8) -> list[dict]:
    """
    Fetch current RSS headlines.

    Returns records with headline, source, link, and published metadata. The
    function performs no state mutation and does not de-duplicate against app
    state; route handlers decide which headlines should be processed.
    """
    headlines: list[dict] = []

    for feed in FEEDS:
        try:
            parsed = feedparser.parse(feed.url)
            if getattr(parsed, "bozo", False):
                logger.warning("RSS parse warning for %s: %s", feed.name, parsed.get("bozo_exception"))

            for entry in parsed.entries[:limit_per_feed]:
                title = (entry.get("title") or "").strip()
                if not title:
                    continue

                summary = (entry.get("summary") or "").strip()
                searchable_text = f"{title} {summary}"
                if feed.keyword_filter and not _matches_energy_keywords(searchable_text):
                    continue

                headlines.append(
                    {
                        "headline": title,
                        "source": feed.name,
                        "link": entry.get("link", ""),
                        "published": entry.get("published", entry.get("updated", "")),
                    }
                )
        except Exception as exc:
            logger.warning("Failed to fetch RSS feed %s: %s", feed.name, exc)

    return _dedupe_headline_records(headlines)


def _dedupe_headline_records(records: Iterable[dict]) -> list[dict]:
    seen: set[str] = set()
    unique: list[dict] = []

    for record in records:
        key = " ".join(record["headline"].lower().split())
        if key in seen:
            continue
        seen.add(key)
        unique.append(record)

    return unique

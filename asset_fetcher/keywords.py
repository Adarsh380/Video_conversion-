from __future__ import annotations

import re
from collections import Counter
from typing import List, Set

try:
    import spacy
    from spacy.lang.en.stop_words import STOP_WORDS as SPACY_STOP_WORDS
except ImportError:  # pragma: no cover
    spacy = None
    SPACY_STOP_WORDS = set()

ENTITY_LABELS = {
    'PERSON',
    'NORP',
    'ORG',
    'GPE',
    'LOC',
    'PRODUCT',
    'EVENT',
    'WORK_OF_ART',
    'LAW',
    'LANGUAGE',
}


class KeywordExtractor:
    """Extract search keywords from scene text using NLP heuristics."""

    def __init__(self) -> None:
        self._nlp = None
        if spacy is not None:
            try:
                self._nlp = spacy.load('en_core_web_sm', disable=['textcat'])
            except Exception:
                self._nlp = None
        self._stopwords: Set[str] = set(SPACY_STOP_WORDS) if SPACY_STOP_WORDS else {
            'the', 'and', 'with', 'for', 'from', 'that', 'this', 'their', 'there',
            'about', 'which', 'when', 'were', 'have', 'has', 'been', 'into',
            'more', 'over', 'your', 'also', 'such', 'many', 'each', 'other',
        }

    def extract_keywords(self, text: str, max_keywords: int = 8) -> List[str]:
        text = text.strip()
        if not text:
            return []

        candidates: List[str] = []
        if self._nlp is not None:
            doc = self._nlp(text)
            candidates.extend(self._extract_spacy_entities(doc))
            candidates.extend(self._extract_spacy_noun_chunks(doc))
            candidates.extend(self._extract_spacy_nouns(doc))
        else:
            candidates.extend(self._extract_fallback(text))

        unique_keywords: List[str] = []
        for keyword in candidates:
            normalized = re.sub(r'\s+', ' ', keyword.strip())
            normalized_lower = normalized.lower()
            if len(normalized_lower) < 3:
                continue
            if normalized_lower in self._stopwords:
                continue
            if normalized_lower in unique_keywords:
                continue
            unique_keywords.append(normalized_lower)
            if len(unique_keywords) >= max_keywords:
                break

        if len(unique_keywords) < 3:
            unique_keywords = self._ensure_minimum_keywords(text, unique_keywords, max_keywords)

        return unique_keywords

    def _extract_spacy_entities(self, doc):
        return [ent.text for ent in doc.ents if ent.label_ in ENTITY_LABELS]

    def _extract_spacy_noun_chunks(self, doc):
        return [chunk.text for chunk in doc.noun_chunks if len(chunk.text.split()) <= 4]

    def _extract_spacy_nouns(self, doc):
        return [token.lemma_ for token in doc if token.pos_ in {'NOUN', 'PROPN'} and token.is_alpha and not token.is_stop]

    def _extract_fallback(self, text: str):
        tokens = re.findall(r"\b[A-Za-z][A-Za-z']{2,}\b", text)
        phrases = []
        for i in range(len(tokens)):
            if i + 1 < len(tokens):
                phrase = f'{tokens[i]} {tokens[i + 1]}'
                phrases.append(phrase)
        phrases.extend(tokens)
        return phrases

    def _ensure_minimum_keywords(self, text: str, keywords: List[str], max_keywords: int) -> List[str]:
        words = re.findall(r"\b[A-Za-z][A-Za-z']{2,}\b", text.lower())
        scored = Counter(word for word in words if word not in self._stopwords)
        for word, _ in scored.most_common(max_keywords * 2):
            if word not in keywords:
                keywords.append(word)
            if len(keywords) >= max_keywords:
                break
        return keywords

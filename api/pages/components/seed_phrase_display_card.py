from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional
from pie import Card


@dataclass
class SeedPhraseDisplayCard(Card):
    name: str = "SeedPhraseDisplayCard"

    title: str = "Ur Seecret Words"
    warning: str = "write these down or cry later. we dont store them. nobody does."
    words: List[str] = field(default_factory=list)
    network: str = "ton"
    confirm_label: str = "i wrote it down (probly)"
    back_label: str = "← go bak"

    pathname: Optional[str] = None
    deps_names: List[str] = field(default_factory=list)
    kwargs: Dict[str, Any] = field(default_factory=dict)

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional
from pie import Card


@dataclass
class SeedInputCard(Card):
    name: str = "SeedInputCard"

    title: str = "Entr Ur Words"
    subtitle: str = "12 words, in order, dont mess it up"
    word_count: int = 12
    network: str = "ton"
    confirm_label: str = "improt it (fingers crosed)"
    back_label: str = "← go bak"
    error_message: str = ""

    pathname: Optional[str] = None
    deps_names: List[str] = field(default_factory=list)
    kwargs: Dict[str, Any] = field(default_factory=dict)

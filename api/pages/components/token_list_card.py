from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional
from pie import Card


@dataclass
class TokenListCard(Card):
    name: str = "TokenListCard"

    title: str = "Ur Shitcoins"
    subtitle: str = "probably all going to zero"
    network: str = "ton"
    network_label: str = "TON"
    address: str = ""
    empty_label: str = "no shitcoins found. clean wallet."
    send_label: str = "snd →"
    back_label: str = "← go bak"

    pathname: Optional[str] = None
    deps_names: List[str] = field(default_factory=list)
    kwargs: Dict[str, Any] = field(default_factory=dict)

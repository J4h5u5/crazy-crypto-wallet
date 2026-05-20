from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional
from pie import Card


@dataclass
class UnlockCard(Card):
    name: str = "UnlockCard"

    title: str = "Welcom Bak"
    subtitle: str = "enter ur PIN to unclock. or dont. see if we care."
    network: str = "ton"
    network_label: str = "TON"
    unlock_label: str = "unclok"
    forgot_label: str = "forgot pin (rip ur funds)"
    error_message: str = ""
    address_hint: str = ""

    pathname: Optional[str] = None
    deps_names: List[str] = field(default_factory=list)
    kwargs: Dict[str, Any] = field(default_factory=dict)

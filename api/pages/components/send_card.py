from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional
from pie import Card


@dataclass
class SendCard(Card):
    name: str = "SendCard"

    title: str = "Snd Coins"
    subtitle: str = "double check the adress. no takesies backsies."
    network: str = "ton"
    network_label: str = "TON"
    currency: str = "TON"
    address: str = ""
    balance: str = "0"
    to_label: str = "to adress"
    amount_label: str = "amownt"
    send_label: str = "sign & snd →"
    max_label: str = "max"
    back_label: str = "← go bak"

    pathname: Optional[str] = None
    deps_names: List[str] = field(default_factory=list)
    kwargs: Dict[str, Any] = field(default_factory=dict)

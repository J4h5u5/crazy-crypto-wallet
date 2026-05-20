from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional
from pie import Card


@dataclass
class NetworkSelectorCard(Card):
    name: str = "NetworkSelectorCard"

    title: str = "Chose Ur Netwrk"
    subtitle: str = "pick one, dont blame us"
    networks: List[Dict[str, str]] = field(default_factory=lambda: [
        {"id": "ton", "label": "TON", "emoji": "💎", "desc": "The Open Netwrk"},
        {"id": "eth", "label": "Ethereum", "emoji": "⟠", "desc": "Slow & Expnsive™"},
        {"id": "sol", "label": "Solana", "emoji": "◎", "desc": "Fast Until It Isnt"},
    ])
    selected_network: str = "ton"
    flow: str = "create"

    pathname: Optional[str] = None
    deps_names: List[str] = field(default_factory=list)
    kwargs: Dict[str, Any] = field(default_factory=dict)

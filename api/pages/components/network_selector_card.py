from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional
from pie import Card


@dataclass
class NetworkSelectorCard(Card):
    name: str = "NetworkSelectorCard"

    title: str = "Chose Ur Netwrk"
    subtitle: str = "pick one, dont blame us"
    networks: List[Dict[str, str]] = field(default_factory=lambda: [
        {"id": "btc", "label": "Bitcoin",   "emoji": "₿",  "desc": "Orijinal. Still Here."},
        {"id": "eth", "label": "Ethereum",  "emoji": "⟠",  "desc": "Slow & Expnsive™"},
        {"id": "bsc", "label": "BNB Chain", "emoji": "🟡", "desc": "Eth But Cheaper"},
        {"id": "sol", "label": "Solana",    "emoji": "◎",  "desc": "Fast Until It Isnt"},
        {"id": "ton", "label": "TON",       "emoji": "💎", "desc": "The Open Netwrk"},
    ])
    selected_network: str = "btc"
    flow: str = "create"

    pathname: Optional[str] = None
    deps_names: List[str] = field(default_factory=list)
    kwargs: Dict[str, Any] = field(default_factory=dict)

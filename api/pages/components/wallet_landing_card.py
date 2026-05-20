from dataclasses import dataclass, field
from typing import Any, Optional, List, Dict
from pie import Card


@dataclass
class WalletLandingCard(Card):
    name: str = "WalletLandingCard"

    title: str = "CRAZY WALLET"
    tagline: str = "Your keys. Our bugs. Nobody's fault."
    create_label: str = "Creat New Walllet"
    import_label: str = "Improt Existing"
    disclaimer: str = "Not our fault if you lose it. Actually, definitely not."
    security_badge: str = "🔒 Military Grade™ (probably)"

    pathname: Optional[str] = None
    deps_names: List[str] = field(default_factory=list)
    kwargs: Dict[str, Any] = field(default_factory=dict)

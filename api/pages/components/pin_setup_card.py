from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional
from pie import Card


@dataclass
class PinSetupCard(Card):
    name: str = "PinSetupCard"

    title: str = "Set Ur PIN"
    subtitle: str = "this encripts ur seed. dont forget it. we cant help u."
    min_pin_length: int = 4
    max_pin_length: int = 10
    default_pin_length: int = 6
    network: str = "ton"
    flow: str = "create"
    confirm_label: str = "encript & save (gulp)"
    back_label: str = "← go bak"
    slider_label: str = "pin lenth"

    pathname: Optional[str] = None
    deps_names: List[str] = field(default_factory=list)
    kwargs: Dict[str, Any] = field(default_factory=dict)

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional
from pie import Card


@dataclass
class WalletAddressCard(Card):
    name: str = "WalletAddressCard"

    title: str = "Ur Adress"
    subtitle: str = "dont send wrong network tokens. we warned u."
    address: str = ""
    network: str = "ton"
    network_label: str = "TON"
    copy_label: str = "copi adress"
    copied_label: str = "copyed!"
    send_label: str = "send"
    receive_label: str = "receve"
    balance_label: str = "balanc"
    balance: str = "0"
    currency: str = "TON"

    pathname: Optional[str] = None
    deps_names: List[str] = field(default_factory=list)
    kwargs: Dict[str, Any] = field(default_factory=dict)

from pie import AsyncPage, UnionCard
from pages.components.pin_setup_card import PinSetupCard


class WalletPinPage(AsyncPage):
    def __init__(self):
        super().__init__(is_typed=False)
        self.fields = UnionCard([
            PinSetupCard(name="PinSetupCard"),
        ])

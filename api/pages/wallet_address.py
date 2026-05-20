from pie import AsyncPage, UnionCard
from pages.components.wallet_address_card import WalletAddressCard


class WalletAddressPage(AsyncPage):
    def __init__(self):
        super().__init__(is_typed=False)
        self.fields = UnionCard([
            WalletAddressCard(name="WalletAddressCard"),
        ])

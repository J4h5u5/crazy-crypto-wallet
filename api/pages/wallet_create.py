from pie import AsyncPage, UnionCard
from pages.components.network_selector_card import NetworkSelectorCard


class WalletCreatePage(AsyncPage):
    def __init__(self):
        super().__init__(is_typed=False)
        self.fields = UnionCard([
            NetworkSelectorCard(name="NetworkSelectorCard", flow="create"),
        ])

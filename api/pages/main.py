from pie import AsyncPage, UnionCard
from pages.components.wallet_landing_card import WalletLandingCard


class MainPage(AsyncPage):
    def __init__(self):
        super().__init__(is_typed=False)
        self.fields = UnionCard([
            WalletLandingCard(name="WalletLandingCard"),
        ])

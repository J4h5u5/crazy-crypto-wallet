from pie import AsyncPage, UnionCard
from pages.components.unlock_card import UnlockCard


class WalletUnlockPage(AsyncPage):
    def __init__(self):
        super().__init__(is_typed=False)
        self.fields = UnionCard([
            UnlockCard(name="UnlockCard"),
        ])

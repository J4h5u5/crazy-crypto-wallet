from pie import AsyncPage, UnionCard
from pages.components.token_list_card import TokenListCard


class WalletTokensPage(AsyncPage):
    def __init__(self):
        super().__init__(is_typed=False)
        self.fields = UnionCard([
            TokenListCard(name="TokenListCard"),
        ])

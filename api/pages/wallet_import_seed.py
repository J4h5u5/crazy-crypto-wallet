from pie import AsyncPage, UnionCard
from pages.components.seed_input_card import SeedInputCard


class WalletImportSeedPage(AsyncPage):
    def __init__(self):
        super().__init__(is_typed=False)
        self.fields = UnionCard([
            SeedInputCard(name="SeedInputCard"),
        ])

from pie import AsyncPage, UnionCard
from pages.components.seed_phrase_display_card import SeedPhraseDisplayCard


class WalletCreateSeedPage(AsyncPage):
    def __init__(self):
        super().__init__(is_typed=False)
        self.fields = UnionCard([
            SeedPhraseDisplayCard(name="SeedPhraseDisplayCard"),
        ])

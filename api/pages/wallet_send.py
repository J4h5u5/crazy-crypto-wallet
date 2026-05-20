from pie import AsyncPage, UnionCard
from pages.components.send_card import SendCard


class WalletSendPage(AsyncPage):
    def __init__(self):
        super().__init__(is_typed=False)
        self.fields = UnionCard([
            SendCard(name="SendCard"),
        ])

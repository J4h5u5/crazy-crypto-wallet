from fastapi import FastAPI
from pages.main import MainPage
from pages.wallet_create import WalletCreatePage
from pages.wallet_create_seed import WalletCreateSeedPage
from pages.wallet_import import WalletImportPage
from pages.wallet_import_seed import WalletImportSeedPage
from pages.wallet_pin import WalletPinPage
from pages.wallet_address import WalletAddressPage
from pages.wallet_unlock import WalletUnlockPage
from pages.wallet_send import WalletSendPage
from pages.wallet_tokens import WalletTokensPage
from pie import Web


web = Web(
    {
        "": MainPage(),
            "wallet/create": WalletCreatePage(),
        "wallet/create/seed": WalletCreateSeedPage(),
        "wallet/import": WalletImportPage(),
        "wallet/import/seed": WalletImportSeedPage(),
        "wallet/pin": WalletPinPage(),
        "wallet/address": WalletAddressPage(),
        "wallet/unlock": WalletUnlockPage(),
        "wallet/send": WalletSendPage(),
        "wallet/tokens": WalletTokensPage(),
},
    cookie_keys=[],
    use_socketio_support=False,
    use_centrifuge_support=False,
    enable_cors=True,
    disable_serving=True,
    serving_url="http://localhost:3000",
    cors_origins=["http://localhost:8008", "http://localhost:3000", "http://localhost:3001"],
)

app: FastAPI = web.get_app()

if web.use_centrifuge_support:
    cio = web.get_centrifuge(app)


if web.use_socketio_support:
    sio = web.get_socketio(app)

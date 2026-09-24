Fonts are not committed (57 MB). Re-fetch from the google/fonts repo:

    cd film/fonts && for f in ofl/kleeone/KleeOne-Regular.ttf ofl/kleeone/KleeOne-SemiBold.ttf ofl/shipporimincho/ShipporiMincho-Regular.ttf ofl/shipporimincho/ShipporiMincho-Bold.ttf ofl/yujisyuku/YujiSyuku-Regular.ttf ofl/zenkurenaido/ZenKurenaido-Regular.ttf; do curl -sSLO "https://raw.githubusercontent.com/google/fonts/main/$f"; done
